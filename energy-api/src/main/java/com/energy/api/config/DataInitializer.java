package com.energy.api.config;

import com.energy.api.entity.*;
import com.energy.api.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final DREventRepository drEventRepository;
    private final MissionRepository missionRepository;
    private final PointHistoryRepository pointHistoryRepository;
    private final DRParticipationRepository participationRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // 이미 데이터가 있으면 스킵
        if (userRepository.count() > 0) return;

        log.info("========== 초기 테스트 데이터 생성 시작 ==========");

        // 1. 테스트 사용자
        User user = User.builder()
                .email("kim@energy.com")
                .password(passwordEncoder.encode("1234"))
                .name("김에너지")
                .location("강원도 춘천시")
                .household("3인 가구")
                .ecoLevel(3)
                .totalPoints(2450)
                .usedPoints(500)
                .build();
        userRepository.save(user);
        log.info("테스트 사용자 생성: kim@energy.com / 1234");

        // 2. DR 이벤트
        DREvent event1 = DREvent.builder()
                .title("하계 피크 절감 이벤트")
                .eventDate(LocalDate.now())
                .startTime(LocalTime.of(14, 0))
                .endTime(LocalTime.of(17, 0))
                .status(DREvent.EventStatus.ACTIVE)
                .targetKwh(2.0)
                .reward(500)
                .participantCount(1284)
                .build();
        drEventRepository.save(event1);

        DREvent event2 = DREvent.builder()
                .title("저녁 수요 분산 이벤트")
                .eventDate(LocalDate.now())
                .startTime(LocalTime.of(18, 0))
                .endTime(LocalTime.of(21, 0))
                .status(DREvent.EventStatus.UPCOMING)
                .targetKwh(1.5)
                .reward(300)
                .participantCount(0)
                .build();
        drEventRepository.save(event2);

        // 3. DR 참여 이력 (과거)
        DREvent pastEvent1 = DREvent.builder()
                .title("오후 피크 절감")
                .eventDate(LocalDate.now().minusDays(2))
                .startTime(LocalTime.of(14, 0))
                .endTime(LocalTime.of(17, 0))
                .status(DREvent.EventStatus.ENDED)
                .targetKwh(2.0)
                .reward(500)
                .participantCount(1100)
                .build();
        drEventRepository.save(pastEvent1);

        DRParticipation hist1 = DRParticipation.builder()
                .user(user).event(pastEvent1)
                .savedKwh(2.3).success(true).earnedPoints(500).build();
        participationRepository.save(hist1);

        DREvent pastEvent2 = DREvent.builder()
                .title("저녁 수요 분산")
                .eventDate(LocalDate.now().minusDays(3))
                .startTime(LocalTime.of(18, 0))
                .endTime(LocalTime.of(21, 0))
                .status(DREvent.EventStatus.ENDED)
                .targetKwh(1.5)
                .reward(300)
                .participantCount(900)
                .build();
        drEventRepository.save(pastEvent2);

        DRParticipation hist2 = DRParticipation.builder()
                .user(user).event(pastEvent2)
                .savedKwh(1.8).success(true).earnedPoints(300).build();
        participationRepository.save(hist2);

        DREvent pastEvent3 = DREvent.builder()
                .title("오후 피크 절감")
                .eventDate(LocalDate.now().minusDays(5))
                .startTime(LocalTime.of(14, 0))
                .endTime(LocalTime.of(17, 0))
                .status(DREvent.EventStatus.ENDED)
                .targetKwh(2.0)
                .reward(500)
                .participantCount(1050)
                .build();
        drEventRepository.save(pastEvent3);

        DRParticipation hist3 = DRParticipation.builder()
                .user(user).event(pastEvent3)
                .savedKwh(0.8).success(false).earnedPoints(100).build();
        participationRepository.save(hist3);

        // 4. 미션
        missionRepository.save(Mission.builder()
                .title("에어컨 1도 올리기").description("냉방 온도를 26°C 이상으로 설정")
                .category("냉난방").points(50).totalGoal(5).unit("일").icon("🌡️").build());

        missionRepository.save(Mission.builder()
                .title("대기전력 차단").description("미사용 전자기기 플러그 뽑기")
                .category("가전").points(30).totalGoal(7).unit("일").icon("✅").build());

        missionRepository.save(Mission.builder()
                .title("피크시간 절전").description("14~17시 전력 사용량 20% 줄이기")
                .category("DR").points(100).totalGoal(5).unit("회").icon("⏰").build());

        missionRepository.save(Mission.builder()
                .title("세탁기 모아 돌리기").description("주 2회 이하로 세탁기 사용")
                .category("가전").points(40).totalGoal(4).unit("주").icon("🧺").build());

        missionRepository.save(Mission.builder()
                .title("월간 10% 절감 달성").description("전월 대비 전력 사용량 10% 감소")
                .category("종합").points(200).totalGoal(1).unit("회").icon("📊").build());

        // 5. 포인트 내역
        pointHistoryRepository.save(PointHistory.builder()
                .user(user).type(PointHistory.PointType.EARN)
                .title("DR 이벤트 보상").points(500).build());

        pointHistoryRepository.save(PointHistory.builder()
                .user(user).type(PointHistory.PointType.EARN)
                .title("일일 절약 미션").points(100).build());

        pointHistoryRepository.save(PointHistory.builder()
                .user(user).type(PointHistory.PointType.SPEND)
                .title("춘천 닭갈비 골목").points(-300).build());

        pointHistoryRepository.save(PointHistory.builder()
                .user(user).type(PointHistory.PointType.EARN)
                .title("DR 이벤트 보상").points(300).build());

        pointHistoryRepository.save(PointHistory.builder()
                .user(user).type(PointHistory.PointType.SPEND)
                .title("강릉 커피거리").points(-500).build());

        pointHistoryRepository.save(PointHistory.builder()
                .user(user).type(PointHistory.PointType.EARN)
                .title("주간 절약 보너스").points(200).build());

        log.info("========== 초기 테스트 데이터 생성 완료 ==========");
    }
}
