package com.energy.api.service;

import com.energy.api.dto.AiMissionResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Component
@RequiredArgsConstructor
public class AiEngineClient {

    // A파트 FastAPI 서버 Base URL
    private static final String AI_ENGINE_BASE_URL = "http://localhost:8000/api/v1/missions/generate";
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