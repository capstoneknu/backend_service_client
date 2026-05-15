package com.energy.api.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

public class AppDto {

    // ======== 에너지 대시보드 응답 ========
    @Getter @Setter @Builder
    @NoArgsConstructor @AllArgsConstructor
    public static class DashboardResponse {
        private Double currentPower;
        private Double todayAccumulated;
        private Double monthlyTarget;
        private Double monthlyUsed;
        private Double savingPercent;

        // 수정 전: private Integer monthlySaving;
        private Double monthlySaving; // 수정 후: 전력 도메인 정밀도 확보 및 빌드 에러 방어

        private Double co2Reduction;
        private Integer totalPoints;
        private List<Double> hourlyActual;
        private List<Double> hourlyPredicted;
    }

    // ======== DR 이벤트 응답 ========
    @Getter @Setter @Builder
    @NoArgsConstructor @AllArgsConstructor
    public static class DREventResponse {
        private Long id;
        private String title;
        private String startTime;
        private String endTime;
        private String status;
        private Double targetKwh;
        private Double currentKwh;
        private Integer reward;
        private Integer participants;
        private Boolean isParticipating;
        private Boolean notificationSet;
    }

    // ======== DR 참여 이력 응답 ========
    @Getter @Setter @Builder
    @NoArgsConstructor @AllArgsConstructor
    public static class DRHistoryResponse {
        private Long id;
        private String date;
        private String title;
        private Boolean success;
        private Double kwh;
        private Integer points;
    }

    // ======== 미션 응답 ========
    @Getter @Setter @Builder
    @NoArgsConstructor @AllArgsConstructor
    public static class MissionResponse {
        private Long id;
        private String icon;
        private String title;
        private String description;
        private String category;
        private Integer points;
        private Integer progress;
        private Integer total;
        private String unit;
        private Boolean completed;
    }

    // ======== 미션 진행도 업데이트 요청 ========
    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    public static class MissionUpdateRequest {
        private Long missionId;
    }

    // ======== 포인트 내역 응답 ========
    @Getter @Setter @Builder
    @NoArgsConstructor @AllArgsConstructor
    public static class PointHistoryResponse {
        private Long id;
        private String type;
        private String title;
        private String date;
        private Integer points;
    }

    // ======== 포인트 사용 요청 ========
    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    public static class PointSpendRequest {
        private String title;
        private Integer points;
    }

    // ======== 포인트 요약 응답 ========
    @Getter @Setter @Builder
    @NoArgsConstructor @AllArgsConstructor
    public static class PointSummaryResponse {
        private Integer totalPoints;
        private Integer usedPoints;
        private Integer availablePoints;
        private List<PointHistoryResponse> history;
    }

    // ======== 마이페이지 프로필 응답 ========
    @Getter @Setter @Builder
    @NoArgsConstructor @AllArgsConstructor
    public static class ProfileResponse {
        private String name;
        private String location;
        private String household;
        private Integer ecoLevel;
        private Integer ecoLevelProgress;
        private Integer pointsToNextLevel;
        // 통계
        private Double totalSaving;
        private Double co2Reduction;
        private Integer treesPlanted;
        // 월간 리포트
        private Double monthlyTarget;
        private Double monthlyUsed;
        private Integer prevMonthSavingPercent;
        private Integer drParticipation;
        private Integer drSuccess;
    }

    // ======== 공통 API 응답 ========
    @Getter @Setter @Builder
    @NoArgsConstructor @AllArgsConstructor
    public static class ApiResponse<T> {
        private Boolean success;
        private String message;
        private T data;

        public static <T> ApiResponse<T> ok(T data) {
            return ApiResponse.<T>builder()
                    .success(true)
                    .message("success")
                    .data(data)
                    .build();
        }

        public static <T> ApiResponse<T> ok(String message, T data) {
            return ApiResponse.<T>builder()
                    .success(true)
                    .message(message)
                    .data(data)
                    .build();
        }

        public static <T> ApiResponse<T> error(String message) {
            return ApiResponse.<T>builder()
                    .success(false)
                    .message(message)
                    .data(null)
                    .build();
        }
    }
}
