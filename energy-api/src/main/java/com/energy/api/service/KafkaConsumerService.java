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
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.OffsetDateTime;
import java.time.ZoneId;

@Slf4j
@Service
@RequiredArgsConstructor
public class KafkaConsumerService {

    private final EnergyDataRepository energyDataRepository;
    private final UserRepository userRepository;
    private final EnergyWebSocketHandler webSocketHandler;
    private final ObjectMapper objectMapper;

    private static final DateTimeFormatter[] FORMATTERS = {
            DateTimeFormatter.ISO_LOCAL_DATE_TIME,
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"),
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"),
    };

    @KafkaListener(topics = "power-usage-topic", groupId = "spring-backend-group")
    public void consume(String message) {
        try {
            JsonNode json = objectMapper.readTree(message);

            String rawDeviceId = json.get("device_id").asText();
            String timestampStr = json.get("timestamp").asText();
            double kwhUsage = json.get("kwh_usage").asDouble();

            LocalDateTime recordedAt = parseTimestamp(timestampStr);
            if (recordedAt == null) return;

            Long targetUserId;
            try {
                targetUserId = Long.parseLong(rawDeviceId.replaceAll("[^0-9]", ""));
            } catch (Exception e) {
                return; 
            }

            // 파이썬이 쏘는 1만 가구 중, 오직 1번 센서의 데이터 하나만 수용하고 나머지는 버림.
            if (targetUserId != 1L) {
                return;
            }

            // 로그인한 유저의 DB 고유 ID가 1이 아닐지라도, 무조건 DB의 첫 번째 유저를 잡아 데이터를 안전하게 전송.
            User user = userRepository.findById(targetUserId).orElseGet(() -> 
                userRepository.findAll().stream().findFirst().orElse(null)
            );
            
            if (user == null) return;

            double powerKw = kwhUsage * 60;

            EnergyData data = EnergyData.builder()
                    .user(user)
                    .recordedAt(recordedAt)
                    .powerKw(powerKw)
                    .accumulatedKwh(kwhUsage)
                    .predictedKw(null)
                    .recordDate(recordedAt.toLocalDate())
                    .build();

            energyDataRepository.save(data);

            Double todayAccumulated = energyDataRepository.getTodayAccumulated(user.getId(), recordedAt.toLocalDate());
            double safeAccumulated = todayAccumulated != null ? todayAccumulated : 0.0;

            String actualUserIdStr = String.valueOf(user.getId());
            String wsPayload = objectMapper.writeValueAsString(
                    java.util.Map.of(
                            "type", "ENERGY_UPDATE",
                            "deviceId", actualUserIdStr,
                            "currentPower", powerKw,
                            "kwhUsage", safeAccumulated,
                            "timestamp", timestampStr
                    )
            );

            webSocketHandler.sendToDevice(actualUserIdStr, wsPayload);

        } catch (Exception e) {
            log.error("Kafka 메시지 처리 에러: {}", e.getMessage());
        }
    }

    private LocalDateTime parseTimestamp(String ts) {
        try {
            return OffsetDateTime.parse(ts, DateTimeFormatter.ISO_OFFSET_DATE_TIME)
                    .atZoneSameInstant(ZoneId.of("Asia/Seoul"))
                    .toLocalDateTime();
        } catch (DateTimeParseException e1) {
            for (DateTimeFormatter fmt : FORMATTERS) {
                try {
                    return LocalDateTime.parse(ts, fmt);
                } catch (DateTimeParseException ignored) {}
            }
        }
        return null; 
    }
}