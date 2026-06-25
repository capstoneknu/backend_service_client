package com.energy.api.service;

import com.energy.api.dto.AppDto;
import com.energy.api.entity.EnergyData;
import com.energy.api.entity.User;
import com.energy.api.repository.EnergyDataRepository;
import com.energy.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
// [기존] import java.time.LocalDateTime;
// [수정] 시스템이 어떤 클라우드 리전(미국, 유럽 등)에 배포되더라도한국 시간(KST)으로 동작하도록
import java.time.ZoneId;
import java.time.ZonedDateTime;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EnergyService {

    private final EnergyDataRepository energyDataRepository;
    private final UserRepository userRepository;

    // 외부 AI 예측 엔진 통신을 위한 RestTemplate 직접 바인딩
    private final RestTemplate restTemplate = new RestTemplate();

    private static final int CHART_POINTS = 24;
    private static final double MONTHLY_TARGET_KWH = 400.0;
    private static final double CO2_FACTOR = 0.4477;
    // 시스템 배포 환경(UTC)에 구애받지 않도록 KST 타임존 하드코딩 주입. 추후 지역 관련 로직 추가 시 수정
    private static final ZoneId KST_ZONE = ZoneId.of("Asia/Seoul");

    // AWS 배포 아키텍처 표준 규약에 따른 FastAPI AI 인프라 엔드포인트
    private static final String AI_PREDICT_BASE_URL = "http://localhost:8000/api/v1/predict/cbl";

    // [Fallback 데이터] 대한민국 표준 3인 가구 KST 기준 24시간 실증 전력 소비 패턴 곡선 (CBL 포물선)
    private static final double[] STANDARD_3PS_CBL = {
        1.52, 1.34, 1.21, 1.15, 1.28, 1.85,  // 00시 ~ 05시 (심야 유휴 기조)
        2.84, 3.45, 3.12, 2.45, 2.15, 1.98,  // 06시 ~ 11시 (오전 출근 피크)
        1.88, 1.95, 2.10, 2.65, 3.84, 4.68,  // 12시 ~ 17시 (오후 귀가 시동)
        4.92, 4.75, 4.21, 3.15, 2.24, 1.78   // 18시 ~ 23시 (저녁 프라임 피크)
    };

    public AppDto.DashboardResponse getDashboard(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            log.warn("사용자를 찾을 수 없음: userId={}", userId);
            return buildEmptyResponse();
        }

        // [기존] LocalDate today = LocalDate.now();
        // [수정] 시간 기준을 OS 기본값이 아닌 KST로 강제 격리
        LocalDate today = LocalDate.now(KST_ZONE);
        LocalDate yesterday = today.minusDays(1);
        LocalDate monthStart = today.withDayOfMonth(1);
        LocalDate monthEnd = today.withDayOfMonth(today.lengthOfMonth());

        double currentPower = energyDataRepository
                .findFirstByUserOrderByRecordedAtDesc(user)
                .map(EnergyData::getPowerKw)
                .orElse(0.0);

        Double todayKwh = energyDataRepository.sumKwhByUserAndDate(user, today);
        if (todayKwh == null) todayKwh = 0.0;

        Double yesterdayKwh = energyDataRepository.sumKwhByUserAndDate(user, yesterday);
        if (yesterdayKwh == null) yesterdayKwh = 0.0;

        Double monthlyUsed = energyDataRepository
                .sumKwhByUserAndDateRange(user, monthStart, monthEnd);
        if (monthlyUsed == null) monthlyUsed = 0.0;

        double savingPercent = calculateSavingPercent(todayKwh, yesterdayKwh);

        // [수정] 어제 데이터 참조 구조를 제거하고 오늘 기준 24슬롯 고정 생성
        List<Double> hourlyActual = buildHourlyActualDynamic(user, today);
        // ⭐ [수정] 유저 고유 컨텍스트 기반 AI 서빙 및 Fallback 예측 연동
        List<Double> hourlyPredicted = fetchAiCblPrediction(user.getId().toString(), hourlyActual);

        double monthlySaving = Math.max(0, MONTHLY_TARGET_KWH - monthlyUsed);
        double co2Reduction = monthlySaving * CO2_FACTOR;
        int totalPoints = user.getTotalPoints() != null ? user.getTotalPoints() : 0;

        return AppDto.DashboardResponse.builder()
                .currentPower(round(currentPower, 2))
                .todayAccumulated(round(todayKwh, 2))
                .monthlyTarget(MONTHLY_TARGET_KWH)
                .monthlyUsed(round(monthlyUsed, 2))
                .savingPercent(round(savingPercent, 1))
                .hourlyActual(hourlyActual)
                .hourlyPredicted(hourlyPredicted)
                .monthlySaving((int) Math.round(monthlySaving))
                .co2Reduction(round(co2Reduction, 2))
                .totalPoints(totalPoints)
                .build();
    }

    private double calculateSavingPercent(double today, double yesterday) {
        if (yesterday <= 0) return 0.0;
        double diff = yesterday - today;
        return (diff / yesterday) * 100.0;
    }

    /*
     * [수정] 24슬롯 시공간 정합성 확보 로직
     * 오늘 00시부터 23시까지 24개의 고정 슬롯을 반환하며,
     * 미래 시간은 0.0으로 패딩하여 프론트엔드 SVG 렌더링 결함을 차단함.
     */
    private List<Double> buildHourlyActualDynamic(User user, LocalDate today) {
        //[기존] int currentHour = LocalDateTime.now().getHour();
        //[수정] 기준의 현재 시간 도출
        int currentHour = ZonedDateTime.now(KST_ZONE).getHour();

        // 오늘 시간별 데이터
        Map<Integer, Double> todayHourMap = queryHourlyMap(user, today);
        
        List<Double> result = new ArrayList<>();
        for (int hour = 0; hour < CHART_POINTS; hour++) {
            if (hour > currentHour) {
                // 아직 도달하지 않은 미래의 시간은 차트 렌더링 오류 방지를 위해 0.0으로 고정
                result.add(0.0);
            } else {
                double value = todayHourMap.getOrDefault(hour, 0.0);
                result.add(round(value, 2));
            }
        }
        return result;
    }

    //[신규 아키텍처 뼈대] FastAPI AI 엔진 실시간 통신 및 3인 가구 표준 Fallback 파이프라인
    private List<Double> fetchAiCblPrediction(String userId, List<Double> hourlyActual) {
        try {
            log.info("[AI-Predict] FastAPI CBL 시계열 예측 뇌 타격 가동... User: {}", userId);
            String targetUrl = AI_PREDICT_BASE_URL + "/" + userId;

            // 정합성 확보를 위해 현재까지 쌓인 실제 로컬 트래픽 페이로드를 전달
            ResponseEntity<List> response = restTemplate.postForEntity(targetUrl, hourlyActual, List.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null && response.getBody().size() == CHART_POINTS) {
                log.info("[AI-Predict] FastAPI 인공지능 예측선(24슬롯) 수신 성공.");
                List<Double> parsedResult = new ArrayList<>();
                for (Object val : response.getBody()) {
                    parsedResult.add(round(((Number) val).doubleValue(), 2));
                }
                return parsedResult;
            } else {
                throw new RuntimeException("AI 엔진 응답 규약 불일치 혹은 상태코드 비정상: " + response.getStatusCode());
            }
        } catch (Exception e) {
            // 방어: 인프라 고립 혹은 시동 초기 데이터 부족(Cold Start) 감지시 표준 포물선 주입
            log.warn("[AI-Predict] AI 엔진 통신 결함 혹은 데이터 콜드스타트 감지 -> 3인 가구 표준 CBL Fallback 포물선 가동. 사유: {}", e.getMessage());
            return getStandardFallbackCurve();
        }
    }

    //표준 3인 가구 가제트 포물선 리스트 반환
    private List<Double> getStandardFallbackCurve() {
        List<Double> fallbackList = new ArrayList<>();
        for (double v : STANDARD_3PS_CBL) {
            fallbackList.add(v);
        }
        return fallbackList;
    }

    private Map<Integer, Double> queryHourlyMap(User user, LocalDate date) {
        List<Object[]> raw = energyDataRepository
                .findHourlyAverageByUserAndDate(user, date);
        Map<Integer, Double> map = new HashMap<>();
        for (Object[] row : raw) {
            int hour = ((Number) row[0]).intValue();
            double avg = ((Number) row[1]).doubleValue();
            map.put(hour, avg);
        }
        return map;
    }

    private List<Double> buildHourlyPredicted(List<Double> actual) {
        List<Double> predicted = new ArrayList<>();
        for (Double v : actual) {
            double variation = 0.85 + (Math.random() * 0.3);
            predicted.add(round(v * variation, 2));
        }
        return predicted;
    }

    private double round(double value, int decimals) {
        double factor = Math.pow(10, decimals);
        return Math.round(value * factor) / factor;
    }

    private AppDto.DashboardResponse buildEmptyResponse() {
        List<Double> zeros = new ArrayList<>();
        for (int i = 0; i < CHART_POINTS; i++) zeros.add(0.0);

        return AppDto.DashboardResponse.builder()
                .currentPower(0.0)
                .todayAccumulated(0.0)
                .monthlyTarget(MONTHLY_TARGET_KWH)
                .monthlyUsed(0.0)
                .savingPercent(0.0)
                .hourlyActual(zeros)
                .hourlyPredicted(zeros)
                .monthlySaving(0)
                .co2Reduction(0.0)
                .totalPoints(0)
                .build();
    }
}
