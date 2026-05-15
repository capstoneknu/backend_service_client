package com.energy.api.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
@RequiredArgsConstructor
public class EnergyWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper;
    
    // [수정] 단순 Set이 아닌, DeviceId와 Session을 1:1 매핑하는 라우팅 테이블
    private final ConcurrentHashMap<String, WebSocketSession> deviceSessions = new ConcurrentHashMap<>();
    
    // 세션의 DeviceId를 역추적하기 위한 보조 테이블
    private final ConcurrentHashMap<String, String> sessionToDeviceMap = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        log.info("WebSocket 물리적 연결 완료: {} (구독 대기 중...)", session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        try {
            JsonNode payload = objectMapper.readTree(message.getPayload());
            String action = payload.has("action") ? payload.get("action").asText() : "";
            
            // 클라이언트가 연결 직후 자신의 DeviceID를 등록(구독)하는 프로세스
            if ("SUBSCRIBE".equals(action)) {
                String deviceId = payload.get("deviceId").asText();
                deviceSessions.put(deviceId, session);
                sessionToDeviceMap.put(session.getId(), deviceId);
                log.info("WebSocket 라우팅 등록 완료 - Session: {}, DeviceID: {}", session.getId(), deviceId);
            }
        } catch (Exception e) {
            log.error("WebSocket 수신 메시지 파싱 에러: {}", e.getMessage());
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String deviceId = sessionToDeviceMap.remove(session.getId());
        if (deviceId != null) {
            deviceSessions.remove(deviceId);
        }
        log.info("WebSocket 해제: {}", session.getId());
    }

    // [수정] 전체 브로드캐스트가 아닌, 특정 디바이스 세션에만 1:1 핀셋 전송
    public void sendToDevice(String deviceId, String message) {
        WebSocketSession session = deviceSessions.get(deviceId);
        if (session != null && session.isOpen()) {
            try {
                session.sendMessage(new TextMessage(message));
            } catch (IOException e) {
                log.error("WebSocket 타겟 전송 실패 (Device: {}): {}", deviceId, e.getMessage());
                deviceSessions.remove(deviceId);
            }
        }
    }
}