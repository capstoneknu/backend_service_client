package com.energy.api.service;

import com.energy.api.dto.AppDto;
import com.energy.api.entity.EnergyData;
import com.energy.api.entity.User;
import com.energy.api.repository.EnergyDataRepository;
import com.energy.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EnergyService {

    private final EnergyDataRepository energyDataRepository;
    private final UserRepository userRepository;

    // ---- 대시보드 데이터 ----
    public AppDto.DashboardResponse getDashboard(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        LocalDate today = LocalDate.now();

        // 오늘 시간대별 데이터
        List<EnergyData> todayData = energyDataRepository
                .findByUserIdAndRecordDateOrderByRecordedAtAsc(userId, today);

        // 최근 전력
        EnergyData latest = energyDataRepository.findTopByUserIdOrderByRecordedAtDesc(userId);
        double currentPower = latest != null ? latest.getPowerKw() : 0.0;

        // 누적 사용량
        Double accumulated = energyDataRepository.getTodayAccumulated(userId, today);

        // 시간대별 데이터
        List<Double> hourlyActual = todayData.stream()
                .map(EnergyData::getPowerKw)
                .collect(Collectors.toList());

        List<Double> hourlyPredicted = todayData.stream()
                .map(e -> e.getPredictedKw() != null ? e.getPredictedKw() : 0.0)
                .collect(Collectors.toList());

        // 데이터가 없으면 목업 데이터 반환
        if (hourlyActual.isEmpty()) {
            hourlyActual = List.of(0.8, 1.2, 2.0, 3.2, 4.2, 4.5, 4.0, 3.8, 3.5, 3.2, 3.0, 3.2, 3.5, 3.3, 3.5);
            hourlyPredicted = List.of(0.9, 1.3, 2.1, 3.0, 3.8, 4.2, 4.3, 4.0, 3.8, 3.6, 3.4, 3.5, 3.6, 3.5, 3.4);
            currentPower = 2.4;
            accumulated = 18.5;
        }

        // 월간 데이터 (간단 계산)
        double monthlyTarget = 400.0;
        double monthlyUsed = 285.0; // TODO: 실제 월간 합산 로직

        return AppDto.DashboardResponse.builder()
                .currentPower(currentPower)
                .todayAccumulated(accumulated != null ? accumulated : 0.0)
                .monthlyTarget(monthlyTarget)
                .monthlyUsed(monthlyUsed)
                .savingPercent(12.0)
                .monthlySaving(32)
                .co2Reduction(14.2)
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
