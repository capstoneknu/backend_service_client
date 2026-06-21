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
            // [추가] 출처 추적 식별 로그 및 ID 매핑
            // =================================================================
            if ("99999".equals(deviceIdStr)) {
                // 실제 esp32(디바이스 id : 99999)에서 쏘는 데이터 식별
                log.info("[PHYSICAL SENSOR] Inbound: REAL_ESP32, power={}kW", String.format("%.2f", powerKw));
                // 프론트엔드(React Native) 앱 연동을 위해 내부적으로 1번 유저로 매핑
                deviceIdStr = "1"; 
            } else if ("1".equals(deviceIdStr)) {
                // 기존 가상 esp32 센서에서 쏘는 데이터 식별
                log.info("[VIRTUAL SENSOR] Inbound: device=1, power={}kW", String.format("%.2f", powerKw));
            } else {
                // 1번(가상)과 99999번(물리) 데이터 외 타 가구 9,998대의 데이터는 여기서 드롭
                return; 
            }

            // 이후 로직은 물리/가상 모두 deviceIdStr이 "1"이 된 상태로 정상 진행
            Long incomingUserId = 1L;
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

            // WebSocket broadcast (1초 간격)
            long lastBroadcast = lastBroadcastTime.get();
            if (now - lastBroadcast >= BROADCAST_INTERVAL_MS) {
                if (lastBroadcastTime.compareAndSet(lastBroadcast, now)) {
                    String wsPayload = objectMapper.writeValueAsString(
                            java.util.Map.of(
                                    "type", "ENERGY_UPDATE",
                                    "deviceId", deviceIdStr,
                                    "currentPower", powerKw,
                                    "kwhUsage", kwhUsage,
                                    "timestamp", recordedAt.toString()
                            )
                    );
                    webSocketHandler.broadcast(wsPayload);
                    log.info("⚡ Broadcast: device={}, power={}kW",
                            deviceIdStr, String.format("%.2f", powerKw));
                }
            }

        } catch (Exception e) {
            log.error("Kafka 메시지 처리 에러: {}", e.getMessage());
        }
    }
}