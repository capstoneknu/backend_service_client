package com.energy.api.service;

import com.energy.api.dto.AiMissionResponse;
import com.energy.api.dto.AppDto;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class AiEngineClient {

    // A파트 FastAPI 서버 Base URL
    private static final String AI_ENGINE_BASE_URL = "http://localhost:8000/api/v1/missions/generate";
    // LSTM 24시간 전력 수요 예측 엔드포인트
    private static final String AI_PREDICT_URL = "http://localhost:8000/api/v1/predict";
    // InfluxDB 시계열 추이 조회 엔드포인트
    private static final String AI_TIMESERIES_URL = "http://localhost:8000/api/v1/timeseries";
    // FastAPI 예측은 분당 kWh 스케일 → 대시보드 kW 단위(kWh/분 × 60)로 환산
    private static final double KW_SCALE = 60.0;

    private final RestTemplate restTemplate = new RestTemplate();

    public AiMissionResponse fetchDynamicMissionFromAI(String userId, double currentPower, double gridStress) {
        try {
            log.info("[AI-Link] 동적 미션(ANFIS) 산출 요청... User: {}", userId);
            
            // A파트(FastAPI) 규약에 맞춘 Path Parameter URL 조합
            String targetUrl = AI_ENGINE_BASE_URL + "/" + userId;

            // A파트는 Body를 요구하지 않으므로 null 전송 (Provider-Driven Contract 준수)
            ResponseEntity<AiMissionResponse> response = restTemplate.postForEntity(
                    targetUrl,
                    null,
                    AiMissionResponse.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                log.info("[AI-Link] XAI 미션 수신 완료: 난이도 {}", response.getBody().getDifficulty());
                return response.getBody();
            } else {
                throw new RuntimeException("AI 엔진 응답 비정상 상태코드: " + response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("[AI-Link] AI 엔진 통신 붕괴 (Fallback 적용): {}", e.getMessage());
            return createFallbackMission(userId);
        }
    }

    /**
     * LSTM 기반 24시간 전력 수요 예측 조회 (홈 차트 "AI 예측" 회색 점선용).
     * FastAPI /api/v1/predict 호출 → 24개(0~23시) kW 배열 반환. 단위는 대시보드와 동일한 kW로 환산.
     * 실패 시 예외를 던져 호출측(EnergyService)이 Fallback 하도록 함.
     */
    public List<Double> fetchLstmPrediction(Long userId) {
        String url = AI_PREDICT_URL + "?user_id=" + userId + "&target_date=" + LocalDate.now();
        JsonNode body = restTemplate.getForObject(url, JsonNode.class);
        if (body == null || body.get("predictions") == null) {
            throw new RuntimeException("LSTM 예측 응답이 비어 있습니다.");
        }

        Double[] arr = new Double[24];
        for (JsonNode p : body.get("predictions")) {
            int hour = p.get("hour").asInt();
            if (hour >= 0 && hour < 24) {
                double kw = p.get("predicted_kw").asDouble() * KW_SCALE;
                arr[hour] = Math.round(kw * 100.0) / 100.0;
            }
        }

        List<Double> result = new ArrayList<>(24);
        for (int hour = 0; hour < 24; hour++) {
            result.add(arr[hour] != null ? arr[hour] : 0.0);
        }
        log.info("[AI-Link] LSTM 24시간 예측 수신 완료 (user={})", userId);
        return result;
    }

    /**
     * InfluxDB 시계열 추이 조회 (시계열 분석 화면용). FastAPI /api/v1/timeseries 프록시.
     * 실패 시 빈 리스트 반환 → 화면은 Empty State 표시.
     */
    public List<AppDto.TimeseriesPoint> fetchTimeseries(String deviceId, String window) {
        try {
            String url = AI_TIMESERIES_URL + "?device_id=" + deviceId + "&window=" + window;
            JsonNode body = restTemplate.getForObject(url, JsonNode.class);
            List<AppDto.TimeseriesPoint> series = new ArrayList<>();
            if (body != null && body.get("series") != null) {
                for (JsonNode p : body.get("series")) {
                    series.add(AppDto.TimeseriesPoint.builder()
                            .time(p.get("time").asText())
                            .value(Math.round(p.get("value").asDouble() * 100.0) / 100.0)
                            .build());
                }
            }
            log.info("[AI-Link] 시계열 추이 {}건 수신 (device={})", series.size(), deviceId);
            return series;
        } catch (Exception e) {
            log.warn("[AI-Link] 시계열 조회 실패: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    // AI 서버가 죽었을 때를 대비한 Fallback
    private AiMissionResponse createFallbackMission(String userId) {
        AiMissionResponse fallback = new AiMissionResponse();
        fallback.setUserId(userId);
        fallback.setDifficulty("Easy");
        fallback.setExpectedRewardPoints(50);
        fallback.setMissionTargetKwh(0.5);
        fallback.setCurtailmentRatioPercent(5.0);
        fallback.setExplainabilityLog("[XAI Fallback] AI 엔진 통신 지연으로 인한 기본 미션 배정");
        return fallback;
    }
}