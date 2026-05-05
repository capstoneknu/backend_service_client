package com.energy.api.service;

import com.energy.api.entity.EnergyData;
import com.energy.api.entity.User;
import com.energy.api.repository.EnergyDataRepository;
import com.energy.api.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

@Slf4j
@Service
@RequiredArgsConstructor
public class KafkaConsumerService {

    private final EnergyDataRepository energyDataRepository;
    private final UserRepository userRepository;
    private final EnergyWebSocketHandler webSocketHandler;
    private final ObjectMapper objectMapper;

    // 여러 타임스탬프 포맷 대응
    private static final DateTimeFormatter[] FORMATTERS = {
            DateTimeFormatter.ISO_LOCAL_DATE_TIME,                    // 2024-08-01T00:00:00
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"),      // 2024-08-01 00:00:00
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"),         // 2024-08-01 00:00
    };

    /**
     * A파트의 Kafka 토픽(power-usage-topic)에서 데이터를 소비
     *
     * A파트 데이터 포맷:
     * {
     *   "device_id": "USER_0001",
     *   "timestamp": "2024-08-01 00:00:00",
     *   "kwh_usage": 0.42
     * }
     */
    @KafkaListener(topics = "power-usage-topic", groupId = "spring-backend-group")
    public void consume(String message) {
        try {
            JsonNode json = objectMapper.readTree(message);

            // A파트 데이터 필드명에 맞춤
            String deviceId = json.get("device_id").asText();
            String timestampStr = json.get("timestamp").asText();
            double kwhUsage = json.get("kwh_usage").asDouble();

            // 타임스탬프 파싱 (여러 포맷 대응)
            LocalDateTime recordedAt = parseTimestamp(timestampStr);
            if (recordedAt == null) {
                log.warn("타임스탬프 파싱 실패: {}", timestampStr);
                return;
            }

            // device_id에서 사용자 매핑
            // A파트: "USER_0001" → B파트 DB의 userId로 변환
            // 현재는 첫 번째 사용자(테스트 계정)로 매핑
            // TODO: device_id ↔ userId 매핑 테이블 구현
            User user = userRepository.findById(1L).orElse(null);
            if (user == null) {
                log.warn("매핑할 사용자 없음: deviceId={}", deviceId);
                return;
            }

            // kWh → kW 변환 (1분 간격 데이터인 경우: kWh * 60 = kW)
            // A파트 데이터가 1분 단위 kWh이므로 순간 전력(kW)으로 환산
            double powerKw = kwhUsage * 60;

            // DB 저장
            EnergyData data = EnergyData.builder()
                    .user(user)
                    .recordedAt(recordedAt)
                    .powerKw(powerKw)
                    .accumulatedKwh(kwhUsage)
                    .predictedKw(null)
                    .recordDate(recordedAt.toLocalDate())
                    .build();

            energyDataRepository.save(data);

            // WebSocket으로 앱에 실시간 전송
            String wsPayload = objectMapper.writeValueAsString(
                    java.util.Map.of(
                            "type", "ENERGY_UPDATE",
                            "deviceId", deviceId,
                            "currentPower", powerKw,
                            "kwhUsage", kwhUsage,
                            "timestamp", timestampStr
                    )
            );
            webSocketHandler.broadcast(wsPayload);

            log.debug("전력 데이터 처리: device={}, power={:.2f}kW", deviceId, powerKw);

        } catch (Exception e) {
            log.error("Kafka 메시지 처리 에러: {}", e.getMessage());
        }
    }

    private LocalDateTime parseTimestamp(String ts) {
        for (DateTimeFormatter fmt : FORMATTERS) {
            try {
                return LocalDateTime.parse(ts, fmt);
            } catch (DateTimeParseException ignored) {
            }
        }
        return null;
    }
}
