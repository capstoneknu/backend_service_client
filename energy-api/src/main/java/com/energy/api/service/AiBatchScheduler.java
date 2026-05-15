package com.energy.api.service;

import com.energy.api.entity.EnergyData;
import com.energy.api.entity.User;
import com.energy.api.repository.EnergyDataRepository;
import com.energy.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class AiBatchScheduler {

    private final AiPredictionService aiPredictionService;
    private final UserRepository userRepository;
    private final EnergyDataRepository energyDataRepository;

    // 1. 매일 자정(00:00)에 전 가구를 대상으로 AI 예측 데이터를 넣는 심장 역할
    @Scheduled(cron = "0 0 0 * * *")
    public void scheduleDailyPredictions() {
        log.info("[BATCH] 일간 AI 전력 수요 예측 배치 작업 시작");
        List<User> users = userRepository.findAll();

        for (User user : users) {
            // [아키텍처 방어] 무식하게 오늘(now)을 쓰지 않고, 시뮬레이터의 현재 시공간을 역추적하여 동기화
            EnergyData latest = energyDataRepository.findTopByUserIdOrderByRecordedAtDesc(user.getId());
            LocalDate targetDate = (latest != null) ? latest.getRecordDate() : LocalDate.now();

            // FastAPI로 예측 요청 발송 및 DB 갱신 (비동기 처리)
            aiPredictionService.fetchAndSavePredictions(user.getId(), targetDate);
        }
        log.info("[BATCH] 일간 AI 전력 수요 예측 배치 작업 완료");
    }

    // 2. [E2E 테스트용 강제 기폭제] 서버 기동 직후 즉시 1회 실행하여 파이프라인 관통 여부 검증
    @EventListener(ApplicationReadyEvent.class)
    public void triggerOnStartup() {
        log.info("[SYSTEM-INIT] 서버 기동 감지. 초기 AI 예측 데이터를 즉시 수혈합니다.");
        scheduleDailyPredictions();
    }
}