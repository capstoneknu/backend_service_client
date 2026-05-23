package com.energy.api.service;

import com.energy.api.dto.ProfileDto;
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

    public ProfileDto.ProfileResponse getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        LocalDate today = LocalDate.now();
        LocalDate thisMonthStart = today.withDayOfMonth(1);
        LocalDate thisMonthEnd = today.withDayOfMonth(today.lengthOfMonth());
        LocalDate lastMonthStart = thisMonthStart.minusMonths(1);
        LocalDate lastMonthEnd = lastMonthStart.withDayOfMonth(lastMonthStart.lengthOfMonth());

        // ====== 1. 월 사용량 (안전하게) ======
        double thisMonthUsed = 0.0;
        double lastMonthUsed = 0.0;
        try {
            Double v1 = energyDataRepository.sumKwhByUserAndDateRange(user, thisMonthStart, thisMonthEnd);
            if (v1 != null) thisMonthUsed = v1;
            Double v2 = energyDataRepository.sumKwhByUserAndDateRange(user, lastMonthStart, lastMonthEnd);
            if (v2 != null) lastMonthUsed = v2;
            log.info("📊 [Profile] 월 사용량: 이번달={}, 지난달={}", thisMonthUsed, lastMonthUsed);
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

        // ====== 2. DR 참여 (안전하게) ======
        long drParticipation = 0;
        long drSuccess = 0;
        try {
            drParticipation = drParticipationRepository.countByUser(user);
            drSuccess = drParticipationRepository.countSuccessByUser(user);
            log.info("📊 [Profile] DR 참여: {}/{}", drSuccess, drParticipation);
        } catch (Exception e) {
            log.warn("📊 [Profile] DR 참여 조회 실패: {}", e.getMessage());
        }

        // ====== 3. 포인트 (안전하게 - PointHistory 실패 시 user.getTotalPoints() fallback) ======
        int totalPoints = 0;
        try {
            Long sumPoints = pointHistoryRepository.sumNetPointsByUser(user);
            if (sumPoints != null && sumPoints > 0) {
                totalPoints = sumPoints.intValue();
                log.info("📊 [Profile] 포인트 (PointHistory): {}P", totalPoints);
            } else {
                // PointHistory 결과가 0이면 user.totalPoints fallback
                Integer userPoints = user.getTotalPoints();
                totalPoints = userPoints != null ? userPoints : 0;
                log.info("📊 [Profile] 포인트 (User.totalPoints): {}P", totalPoints);
            }
        } catch (Exception e) {
            log.warn("📊 [Profile] PointHistory 조회 실패, User.totalPoints 사용: {}", e.getMessage());
            Integer userPoints = user.getTotalPoints();
            totalPoints = userPoints != null ? userPoints : 0;
        }

        // 에코 레벨 계산
        int ecoLevel = (totalPoints / POINTS_PER_LEVEL) + 1;
        int pointsInLevel = totalPoints % POINTS_PER_LEVEL;
        int ecoLevelProgress = pointsInLevel * 100 / POINTS_PER_LEVEL;
        int pointsToNextLevel = POINTS_PER_LEVEL - pointsInLevel;

        log.info("📊 [Profile] 사용자={}, 레벨=Lv.{}, 포인트={}P",
                user.getName(), ecoLevel, totalPoints);

        // DTO 조립
        ProfileDto.Stats stats = ProfileDto.Stats.builder()
                .totalSaving((int) Math.round(totalSaving))
                .co2Reduction(round(co2Reduction, 1))
                .treesPlanted(treesPlanted)
                .build();

        ProfileDto.MonthlyReport monthlyReport = ProfileDto.MonthlyReport.builder()
                .target((int) MONTHLY_TARGET_KWH)
                .used((int) Math.round(thisMonthUsed))
                .prevMonthSaving(prevMonthSavingPercent)
                .drParticipation((int) drParticipation)
                .drSuccess((int) drSuccess)
                .build();

        return ProfileDto.ProfileResponse.builder()
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