package com.energy.api.config;

import com.energy.api.entity.DREvent;
import com.energy.api.entity.DRParticipation;
import com.energy.api.entity.User;
import com.energy.api.repository.DREventRepository;
import com.energy.api.repository.DRParticipationRepository;
import com.energy.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DRDataInitializer {

    private final DREventRepository drEventRepository;
    private final DRParticipationRepository drParticipationRepository;
    private final UserRepository userRepository;

    /**
     * [TDM] 스프링 부트 서버 기동이 완전히 끝난 직후(ApplicationReadyEvent) 실행.
     * 하드코딩을 배제하고 '현재 시간'을 역산하여 시연용 이벤트를 동적 생성.
     */
    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seedDynamicDREvents() {
        log.info("[TDM] 시연용 동적 DR 이벤트 및 참여 이력 Seeding 프로세스 개시...");

        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        // 1. [멱등성 검증] ddl-auto: update 환경에서의 중복 데이터 증식 원천 차단
        List<DREvent> existingEvents = drEventRepository.findAll();
        boolean hasEventsToday = existingEvents.stream()
                .anyMatch(e -> e.getEventDate().equals(today));

        if (hasEventsToday) {
            log.info("[TDM] 이미 오늘 일자의 DR 이벤트가 존재합니다. 멱등성 보장을 위해 Seeding을 건너뜁니다.");
            return;
        }

        // 시간 역전(Edge Case) 방어 로직: 자정 부근에서 minusHours 계산 시 발생하는 모순 방지
        LocalTime safeStartTime = now.getHour() < 1 ? LocalTime.of(0, 1) : now.minusHours(1);
        LocalTime safeEndTime = now.getHour() > 21 ? LocalTime.of(23, 59) : now.plusHours(2);

        // 2. [ACTIVE] 현재 무조건 진행 중인 타임어택 이벤트 생성
        DREvent activeEvent = DREvent.builder()
                .title("긴급 전력 수급 주의보 발령")
                .eventDate(today)
                .startTime(safeStartTime)
                .endTime(safeEndTime)
                .status(DREvent.EventStatus.ACTIVE)
                .targetKwh(2.5)
                .reward(500)
                .participantCount(1243) // 시연을 위한 리얼리티 부여
                .build();
        drEventRepository.save(activeEvent);

        // 3. [UPCOMING] 알림 설정 시연을 위한 예정 이벤트 생성
        DREvent upcomingEvent = DREvent.builder()
                .title("야간 전력 피크 분산 이벤트")
                .eventDate(today)
                .startTime(now.getHour() > 20 ? LocalTime.of(23, 50) : now.plusHours(2))
                .endTime(now.getHour() > 20 ? LocalTime.of(23, 59) : now.plusHours(4))
                .status(DREvent.EventStatus.UPCOMING)
                .targetKwh(1.0)
                .reward(300)
                .participantCount(0)
                .build();
        drEventRepository.save(upcomingEvent);

        // 4. [ENDED & PARTICIPATION] 지난 이력(History) 화면 렌더링용 과거 데이터 및 조인 엔티티 세팅
        // (1번 테스트 유저가 존재할 경우에만 릴레이션 매핑)
        userRepository.findById(1L).ifPresentOrElse(testUser -> {
            DREvent pastEvent = DREvent.builder()
                    .title("어제 오후 피크 절감")
                    .eventDate(today.minusDays(1))
                    .startTime(LocalTime.of(14, 0))
                    .endTime(LocalTime.of(17, 0))
                    .status(DREvent.EventStatus.ENDED)
                    .targetKwh(2.0)
                    .reward(400)
                    .participantCount(5210)
                    .build();
            drEventRepository.save(pastEvent);

            DRParticipation pastParticipation = DRParticipation.builder()
                    .user(testUser)
                    .event(pastEvent)
                    .savedKwh(2.3) // 목표(2.0) 초과 달성의 리얼리티
                    .success(true)
                    .earnedPoints(400)
                    .notificationSet(true)
                    .build();
            drParticipationRepository.save(pastParticipation);

            log.info("[TDM] 1번 유저의 과거 DR 참여 이력(History) 매핑 완료.");
        }, () -> log.warn("[TDM] 1번 유저를 찾을 수 없어 과거 참여 이력 매핑은 생략합니다."));

        log.info("[TDM] 동적 DR 이벤트 Seeding 프로세스 정상 종료.");
    }
}