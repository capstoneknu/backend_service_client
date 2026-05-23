package com.energy.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class ProfileDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProfileResponse {
        private String name;
        private String location;
        private String household;
        private Integer ecoLevel;
        private Integer ecoLevelProgress;
        private Integer pointsToNextLevel;
        private Stats stats;
        private MonthlyReport monthlyReport;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Stats {
        private Integer totalSaving;       // kWh
        private Double co2Reduction;       // kg
        private Integer treesPlanted;      // 그루
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyReport {
        private Integer target;             // 월 목표 kWh
        private Integer used;               // 이번 달 사용 kWh
        private Integer prevMonthSaving;    // 전월 대비 절감 %
        private Integer drParticipation;    // DR 참여 횟수
        private Integer drSuccess;          // DR 성공 횟수
    }
}
