package com.energy.api.service;

import com.energy.api.dto.AppDto;
import com.energy.api.entity.EnergyData;
import com.energy.api.entity.User;
import com.energy.api.repository.EnergyDataRepository;
import com.energy.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
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
    private final AiEngineClient aiEngineClient;

    private static final int CHART_POINTS = 24;
    private static final double MONTHLY_TARGET_KWH = 400.0;
    private static final double CO2_FACTOR = 0.4477;

    public AppDto.DashboardResponse getDashboard(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            log.warn("사용자를 찾을 수 없음: userId={}", userId);
            return buildEmptyResponse();
        }

        LocalDate today = LocalDate.now();
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

        // ⭐ 하루 24시간(00~23시) 전체 차트 (프론트 24슬롯 축과 정합)
        List<Double> hourlyActual = buildHourlyActualFullDay(user, today);

        // ⭐ AI 예측선: 실제 LSTM(FastAPI) 호출. 통신 장애 시 근사치로 Fallback (결함 허용)
        List<Double> hourlyPredicted;
        try {
            hourlyPredicted = aiEngineClient.fetchLstmPrediction(userId);
        } catch (Exception e) {
            log.warn("[LSTM Fallback] 예측 API 실패, 근사치로 대체: {}", e.getMessage());
            hourlyPredicted = buildHourlyPredicted(hourlyActual);
        }

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

    /**
     * 하루 24시간(00~23시)의 시간별 평균 전력 데이터 (프론트 24슬롯 렌더링과 정합)
     */
    private List<Double> buildHourlyActualFullDay(User user, LocalDate today) {
        Map<Integer, Double> todayHourMap = queryHourlyMap(user, today);

        List<Double> result = new ArrayList<>();
        for (int hour = 0; hour < CHART_POINTS; hour++) {
            result.add(round(todayHourMap.getOrDefault(hour, 0.0), 2));
        }
        return result;
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
