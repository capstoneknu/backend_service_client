package com.energy.api.service;

import com.energy.api.dto.AppDto;
import com.energy.api.entity.EnergyData;
import com.energy.api.entity.User;
import com.energy.api.repository.EnergyDataRepository;
import com.energy.api.repository.UserRepository;
import com.energy.api.util.EcoMetricsCalculator;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EnergyService {

    private final EnergyDataRepository energyDataRepository;
    private final UserRepository userRepository;

    // ---- 대시보드 데이터 ----
    public AppDto.DashboardResponse getDashboard(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        // 1. 가장 최근 전력 데이터를 조회하여 현재 시간선 파악
        EnergyData latest = energyDataRepository.findTopByUserIdOrderByRecordedAtDesc(userId);
        LocalDate targetDate = (latest != null) ? latest.getRecordDate() : LocalDate.now();
        double currentPower = latest != null ? latest.getPowerKw() : 0.0;

        // 2. 동기화된 타겟 날짜 기준 시간대별 데이터 조회
        List<EnergyData> todayData = energyDataRepository
                .findByUserIdAndRecordDateOrderByRecordedAtAsc(userId, targetDate);

        // 3. 누적 사용량 조회
        Double accumulated = energyDataRepository.getTodayAccumulated(userId, targetDate);

        // 4. 15분 단위 평균값 다운샘플링 (HomeScreen.js의 96포인트 규격과 동기화)
        java.util.Map<Integer, Double> actualAverages = todayData.stream()
                .collect(Collectors.groupingBy(
                        e -> (e.getRecordedAt().getHour() * 4) + (e.getRecordedAt().getMinute() / 15),
                        Collectors.averagingDouble(EnergyData::getPowerKw)
                ));

        // DB에 존재하는 가장 마지막 시간(슬롯)까지만 배열을 생성 
        int maxSlot = todayData.stream()
                .mapToInt(e -> (e.getRecordedAt().getHour() * 4) + (e.getRecordedAt().getMinute() / 15))
                .max().orElse(-1);

        // 직전 전력량을 평탄하게 유지하여 프론트엔드의 SVG 렌더링 무결성 보장
        List<Double> hourlyActual = new ArrayList<>();
        double lastKnownValue = 0.0; 
        
        if (maxSlot >= 0) {
            for (int i = 0; i <= maxSlot; i++) {
                if (actualAverages.containsKey(i)) {
                    lastKnownValue = actualAverages.get(i);
                }
                hourlyActual.add(lastKnownValue);
            }
        }

        // 5. AI 예측 데이터 역버퍼링 (미래 시간대 포함, 1시간 단위 DB값을 15분 단위 96개 슬롯으로 복제 매핑)
        List<Double> hourlyPredicted = new ArrayList<>();
        for (int i = 0; i < 96; i++) {
            int targetHour = i / 4;
            double predKw = todayData.stream()
                    .filter(e -> e.getRecordedAt().getHour() == targetHour && e.getPredictedKw() != null)
                    .mapToDouble(EnergyData::getPredictedKw)
                    .max().orElse(0.0);
            hourlyPredicted.add(predKw);
        }

        // 6. 수학적 로직 기반 동적 계산
        int currentYear = targetDate.getYear();
        int currentMonth = targetDate.getMonthValue();

        double monthlyTarget = (user.getTargetKwh() != null && user.getTargetKwh() > 0) ? user.getTargetKwh() : 400.0;        
        double monthlyUsed = energyDataRepository.getMonthlyAccumulated(userId, currentYear, currentMonth);
        
        // 절감량 계산
        double monthlySaving = Math.max(0.0, monthlyTarget - monthlyUsed);
        
        // 절감률 계산
        double savingPercent = monthlyTarget > 0 ? Math.round((monthlySaving / monthlyTarget) * 1000.0) / 10.0 : 0.0;
        
        // 환경 지표 산출
        double co2Reduction = EcoMetricsCalculator.calculateCo2Reduction(BigDecimal.valueOf(monthlySaving)).doubleValue();

        return AppDto.DashboardResponse.builder()
                .currentPower(currentPower)
                .todayAccumulated(accumulated != null ? accumulated : 0.0)
                .monthlyTarget(monthlyTarget)
                .monthlyUsed(monthlyUsed)
                .savingPercent(savingPercent)
                .monthlySaving(monthlySaving)
                .co2Reduction(co2Reduction)
                .totalPoints(user.getTotalPoints())
                .hourlyActual(hourlyActual)
                .hourlyPredicted(hourlyPredicted)
                .build();
    }

    // ---- 특정 날짜 전력 데이터 ----
    public List<EnergyData> getDailyData(Long userId, LocalDate date) {
        return energyDataRepository
                .findByUserIdAndRecordDateOrderByRecordedAtAsc(userId, date);
    }
}