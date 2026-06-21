package com.energy.api.service;

import com.energy.api.dto.AppDto;
import com.energy.api.entity.User;
import com.energy.api.repository.DRParticipationRepository;
import com.energy.api.repository.EnergyDataRepository;
import com.energy.api.repository.PointHistoryRepository;
import com.energy.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProfileService {

    private final UserRepository userRepository;
    private final EnergyDataRepository energyDataRepository;
    private final DRParticipationRepository drParticipationRepository;
    private final PointHistoryRepository pointHistoryRepository;

    private static final double MONTHLY_TARGET_KWH = 400.0;
    private static final double CO2_FACTOR = 0.4477;
    private static final double TREE_ABSORB_KG = 22.0;
    private static final int POINTS_PER_LEVEL = 1000;

    public AppDto.ProfileResponse getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        LocalDate today = LocalDate.now();
        LocalDate thisMonthStart = today.withDayOfMonth(1);
        LocalDate thisMonthEnd = today.withDayOfMonth(today.lengthOfMonth());
        LocalDate lastMonthStart = thisMonthStart.minusMonths(1);
        LocalDate lastMonthEnd = lastMonthStart.withDayOfMonth(lastMonthStart.lengthOfMonth());

        // ====== 1. 월 사용량 ======
        double thisMonthUsed = 0.0;
        double lastMonthUsed = 0.0;
        try {
            Double v1 = energyDataRepository.sumKwhByUserAndDateRange(user, thisMonthStart, thisMonthEnd);
            if (v1 != null) thisMonthUsed = v1;
            Double v2 = energyDataRepository.sumKwhByUserAndDateRange(user, lastMonthStart, lastMonthEnd);
            if (v2 != null) lastMonthUsed = v2;
        } catch (Exception e) {
            log.warn("📊 [Profile] 월 사용량 조회 실패: {}", e.getMessage());
        }

        double thisMonthSaving = Math.max(0, MONTHLY_TARGET_KWH - thisMonthUsed);
        double lastMonthSaving = Math.max(0, MONTHLY_TARGET_KWH - lastMonthUsed);
        double totalSaving = thisMonthSaving + lastMonthSaving;
        double co2Reduction = totalSaving * CO2_FACTOR;
        int treesPlanted = (int) (co2Reduction / TREE_ABSORB_KG);

        int prevMonthSavingPercent = 0;
        if (lastMonthUsed > 0) {
            double pct = ((lastMonthUsed - thisMonthUsed) / lastMonthUsed) * 100.0;
            prevMonthSavingPercent = (int) Math.max(0, Math.round(pct));
        }

        // ====== 2. DR 참여 ======
        long drParticipation = 0;
        long drSuccess = 0;
        try {
            drParticipation = drParticipationRepository.countByUser(user);
            drSuccess = drParticipationRepository.countSuccessByUser(user);
        } catch (Exception e) {
            log.warn("📊 [Profile] DR 참여 조회 실패: {}", e.getMessage());
        }

        // ====== 3. 포인트 및 에코 레벨 ======
        int totalPoints = user.getTotalPoints() != null ? user.getTotalPoints() : 0;

        int ecoLevel = (totalPoints / POINTS_PER_LEVEL) + 1;
        int pointsInLevel = totalPoints % POINTS_PER_LEVEL;
        int ecoLevelProgress = pointsInLevel * 100 / POINTS_PER_LEVEL;
        int pointsToNextLevel = POINTS_PER_LEVEL - pointsInLevel;

        // ====== 4. 중첩 객체(Nested Object) 복구 ======
        AppDto.Stats stats = AppDto.Stats.builder()
                .totalSaving((double) Math.round(totalSaving))
                .co2Reduction(round(co2Reduction, 1))
                .treesPlanted(treesPlanted)
                .build();

        AppDto.MonthlyReport monthlyReport = AppDto.MonthlyReport.builder()
                .target(MONTHLY_TARGET_KWH)
                .used((double) Math.round(thisMonthUsed))
                .prevMonthSaving(prevMonthSavingPercent)
                .drParticipation((int) drParticipation)
                .drSuccess((int) drSuccess)
                .build();

        return AppDto.ProfileResponse.builder()
                .name(user.getName())
                .location(user.getLocation())
                .household(user.getHousehold())
                .ecoLevel(ecoLevel)
                .ecoLevelProgress(ecoLevelProgress)
                .pointsToNextLevel(pointsToNextLevel)
                .stats(stats)
                .monthlyReport(monthlyReport)
                .build();
    }

    private double round(double value, int decimals) {
        double factor = Math.pow(10, decimals);
        return Math.round(value * factor) / factor;
    }
}