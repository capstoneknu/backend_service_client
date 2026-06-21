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

import java.time.LocalDateTime;
import java.util.concurrent.atomic.AtomicLong;

@Slf4j
@Service
@RequiredArgsConstructor
public class KafkaConsumerService {

    private final EnergyDataRepository energyDataRepository;
    private final UserRepository userRepository;
    private final EnergyWebSocketHandler webSocketHandler;
    private final ObjectMapper objectMapper;

    // WebSocket broadcast: 1초당 1회
    private static final long BROADCAST_INTERVAL_MS = 1000;
    private final AtomicLong lastBroadcastTime = new AtomicLong(0);

    // DB 저장: 5초당 1회
    private static final long DB_SAVE_INTERVAL_MS = 5000;
    private final AtomicLong lastDbSaveTime = new AtomicLong(0);

    @KafkaListener(topics = "power-usage-topic", groupId = "spring-backend-group")
    public void consume(String message) {
        try {
            JsonNode json = objectMapper.readTree(message);
            String deviceIdStr = json.get("device_id").asText();
            double kwhUsage = json.get("kwh_usage").asDouble();
            double powerKw = kwhUsage * 60;

            // =================================================================
            // 출처 식별(물리 99999 vs 가상) + 데모 타깃 가구(1번)로 정규화.
            //   - 물리 ESP32: device_id "99999"
            //   - 가상 시뮬레이터: 합성데이터 키(숫자 ID 또는 "USER_XXXX")로 인입
            //   모든 인입을 내부 논리 가구 1L로 매핑하여 단일 대시보드로 집계한다.
            // =================================================================
            boolean isPhysical = "99999".equals(deviceIdStr);
            LocalDateTime recordedAt = LocalDateTime.now();
            long now = System.currentTimeMillis();

            // DB 저장 (5초 간격)
            long lastDb = lastDbSaveTime.get();
            if (now - lastDb >= DB_SAVE_INTERVAL_MS) {
                if (lastDbSaveTime.compareAndSet(lastDb, now)) {
                    User user = userRepository.findById(1L).orElse(null);
                    if (user != null) {
                        EnergyData data = EnergyData.builder()
                                .user(user)
                                .recordedAt(recordedAt)
                                .powerKw(powerKw)
                                .accumulatedKwh(kwhUsage)
                                .predictedKw(null)
                                .recordDate(recordedAt.toLocalDate())
                                .build();
                        energyDataRepository.save(data);
                    }
                }
            }

            // WebSocket broadcast (1초 간격) + 출처 추적 로그(스로틀 내부에서만 출력하여 로그 폭주 방지)
            long lastBroadcast = lastBroadcastTime.get();
            if (now - lastBroadcast >= BROADCAST_INTERVAL_MS) {
                if (lastBroadcastTime.compareAndSet(lastBroadcast, now)) {
                    log.info("{} Inbound: src={}, power={}kW",
                            isPhysical ? "[PHYSICAL SENSOR]" : "[VIRTUAL SENSOR]",
                            deviceIdStr, String.format("%.2f", powerKw));
                    String wsPayload = objectMapper.writeValueAsString(
                            java.util.Map.of(
                                    "type", "ENERGY_UPDATE",
                                    "deviceId", "1",
                                    "currentPower", powerKw,
                                    "kwhUsage", kwhUsage,
                                    "timestamp", recordedAt.toString()
                            )
                    );
                    webSocketHandler.broadcast(wsPayload);
                }
            }

        } catch (Exception e) {
            log.error("Kafka 메시지 처리 에러: {}", e.getMessage());
        }
    }
}