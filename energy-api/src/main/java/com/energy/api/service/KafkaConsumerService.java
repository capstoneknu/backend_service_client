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
            String deviceId = json.get("device_id").asText();
            double kwhUsage = json.get("kwh_usage").asDouble();

            // ⭐ 데이터의 timestamp가 과거 날짜(2026-04-14 등)라서
            //    실제 수신 시점(지금)으로 저장하여 오늘 데이터로 집계
            LocalDateTime recordedAt = LocalDateTime.now();

            double powerKw = kwhUsage * 60;
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
                                    "deviceId", deviceId,
                                    "currentPower", powerKw,
                                    "kwhUsage", kwhUsage,
                                    "timestamp", recordedAt.toString()
                            )
                    );
                    webSocketHandler.broadcast(wsPayload);
                    log.info("⚡ Broadcast: device={}, power={}kW",
                            deviceId, String.format("%.2f", powerKw));
                }
            }

        } catch (Exception e) {
            log.error("Kafka 메시지 처리 에러: {}", e.getMessage());
        }
    }
}