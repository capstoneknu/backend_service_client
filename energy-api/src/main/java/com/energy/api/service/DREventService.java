package com.energy.api.service;

import com.energy.api.dto.AppDto;
import com.energy.api.entity.*;
import com.energy.api.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DREventService {

    private final DREventRepository drEventRepository;
    private final DRParticipationRepository participationRepository;
    private final UserRepository userRepository;

    // ---- 오늘의 이벤트 목록 ----
    public List<AppDto.DREventResponse> getTodayEvents(Long userId) {
        LocalDate today = LocalDate.now();
        List<DREvent> events = drEventRepository.findByEventDateOrderByStartTimeAsc(today);

        return events.stream().map(event -> {
            boolean isParticipating = participationRepository
                    .existsByUserIdAndEventId(userId, event.getId());

            DRParticipation participation = participationRepository
                    .findByUserIdAndEventId(userId, event.getId())
                    .orElse(null);

            double currentKwh = participation != null ? participation.getSavedKwh() : 0.0;
            boolean notificationSet = participation != null && participation.getNotificationSet();

            return AppDto.DREventResponse.builder()
                    .id(event.getId())
                    .title(event.getTitle())
                    .startTime(event.getStartTime().toString())
                    .endTime(event.getEndTime().toString())
                    .status(event.getStatus().name().toLowerCase())
                    .targetKwh(event.getTargetKwh())
                    .currentKwh(currentKwh)
                    .reward(event.getReward())
                    .participants(event.getParticipantCount())
                    .isParticipating(isParticipating)
                    .notificationSet(notificationSet)
                    .build();
        }).collect(Collectors.toList());
    }

    // ---- 이벤트 참여 ----
    @Transactional
    public AppDto.DREventResponse participateEvent(Long userId, Long eventId) {
        DREvent event = drEventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("이벤트를 찾을 수 없습니다."));

        if (participationRepository.existsByUserIdAndEventId(userId, eventId)) {
            throw new RuntimeException("이미 참여 중인 이벤트입니다.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        DRParticipation participation = DRParticipation.builder()
                .user(user)
                .event(event)
                .savedKwh(0.0)
                .success(false)
                .build();

        participationRepository.save(participation);

        // 참여자 수 증가
        event.setParticipantCount(event.getParticipantCount() + 1);
        drEventRepository.save(event);

        return AppDto.DREventResponse.builder()
                .id(event.getId())
                .title(event.getTitle())
                .isParticipating(true)
                .participants(event.getParticipantCount())
                .build();
    }

    // ---- 알림 설정 토글 ----
    @Transactional
    public void toggleNotification(Long userId, Long eventId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        DRParticipation participation = participationRepository
                .findByUserIdAndEventId(userId, eventId)
                .orElseGet(() -> {
                    DREvent event = drEventRepository.findById(eventId)
                            .orElseThrow(() -> new RuntimeException("이벤트를 찾을 수 없습니다."));
                    return DRParticipation.builder()
                            .user(user)
                            .event(event)
                            .build();
                });

        participation.setNotificationSet(!participation.getNotificationSet());
        participationRepository.save(participation);
    }

    // ---- 참여 이력 ----
    public List<AppDto.DRHistoryResponse> getHistory(Long userId) {
        List<DRParticipation> participations = participationRepository
                .findByUserIdOrderByParticipatedAtDesc(userId);

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("M/d");

        return participations.stream().map(p -> AppDto.DRHistoryResponse.builder()
                .id(p.getId())
                .date(p.getEvent().getEventDate().format(fmt))
                .title(p.getEvent().getTitle())
                .success(p.getSuccess())
                .kwh(p.getSavedKwh())
                .points(p.getEarnedPoints())
                .build()
        ).collect(Collectors.toList());
    }
}
