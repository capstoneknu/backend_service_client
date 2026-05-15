package com.energy.api.service;

import com.energy.api.repository.EnergyDataRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiPredictionService {

    private final WebClient fastApiWebClient;
    private final EnergyDataRepository energyDataRepository;

    // FastAPI Pydantic 모델과 1:1로 매핑되는 내부 DTO 선언 (Type Safety 보장)
    @Data
    public static class PredictionResponseDto {
        private int user_id;
        private String target_date;
        private List<HourlyPredictionDto> predictions;
    }

    @Data
    public static class HourlyPredictionDto {
        private int hour;
        private double predicted_kw;
    }

    /**
     * A파트(FastAPI)에 특정 유저의 예측 전력량을 요청하고 DB 갱신.
     */
    @Transactional
    public void fetchAndSavePredictions(Long userId, LocalDate targetDate) {
        log.info("[AI-PREDICTION] FastAPI로 유저 {}의 {}일자 전력 예측 데이터 요청 시작", userId, targetDate);

        try {
            // 1. 강타입 DTO 매핑을 통한 Type-Safe API 호출 (Unchecked cast 경고 소멸)
            PredictionResponseDto response = fastApiWebClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/api/v1/predict")
                            .queryParam("user_id", userId)
                            .queryParam("target_date", targetDate.toString())
                            .build())
                    .retrieve()
                    .bodyToMono(PredictionResponseDto.class) // Map.class 대신 명확한 DTO 객체 주입
                    .block(); 

            if (response != null && response.getPredictions() != null) {
                List<HourlyPredictionDto> predictions = response.getPredictions();
                
                // 2. 응답받은 시간대별 예측값을 DB에 일괄 업데이트
                for (HourlyPredictionDto pred : predictions) {
                    energyDataRepository.updatePredictedKw(userId, targetDate, pred.getHour(), pred.getPredicted_kw());
                }
                log.info("[AI-PREDICTION] 유저 {} 예측 데이터 갱신 완료 (총 {}건)", userId, predictions.size());
            }

        } catch (Exception e) {
            log.error("[AI-PREDICTION-ERROR] FastAPI 연동 중 오류 발생: {}", e.getMessage());
        }
    }
}