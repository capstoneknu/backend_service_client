package com.energy.api.service;

import com.energy.api.dto.AppDto;
import com.energy.api.dto.AiMissionResponse;
import com.energy.api.entity.*;
import com.energy.api.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MissionService {

    private final MissionRepository missionRepository;
    private final MissionProgressRepository progressRepository;
    private final UserRepository userRepository;
    private final PointHistoryRepository pointHistoryRepository;

    // ---- 미션 목록 (사용자 진행도 포함, 개인 미션 격리 방어 로직 추가) ----
    public List<AppDto.MissionResponse> getMissions(Long userId, String category) {
        List<Mission> allActive;
        if (category == null || category.equals("전체")) {
            allActive = missionRepository.findByActiveTrue();
        } else {
            allActive = missionRepository.findByCategoryAndActiveTrue(category);
        }

        return allActive.stream()
                // [방어] 대상 유저가 지정되지 않은 '공용 미션' 이거나, '내 전용 미션'만 통과시킴
                .filter(m -> m.getTargetUserId() == null || m.getTargetUserId().equals(userId))
                .map(mission -> {
                    MissionProgress prog = progressRepository
                            .findByUserIdAndMissionId(userId, mission.getId())
                            .orElse(null);

                    int progress = prog != null ? prog.getProgress() : 0;
                    boolean completed = prog != null && prog.getCompleted();

                    return AppDto.MissionResponse.builder()
                            .id(mission.getId())
                            .icon(mission.getIcon())
                            .title(mission.getTitle())
                            .description(mission.getDescription())
                            .category(mission.getCategory())
                            .points(mission.getPoints())
                            .progress(progress)
                            .total(mission.getTotalGoal())
                            .unit(mission.getUnit())
                            .completed(completed)
                            .explainabilityLog(mission.getExplainabilityLog()) 
                            .build();
                }).collect(Collectors.toList());
    }

    // ---- [추가] AI 미션 생성 및 Progress 1:1 매핑 트랜잭션 ----
    @Transactional
    public Mission createPersonalAiMission(User user, AiMissionResponse aiResponse) {
        Mission newMission = Mission.builder()
                .title("AI 맞춤형 " + aiResponse.getDifficulty() + " 미션")
                .description("AI 예측 CBL 대비 " + aiResponse.getCurtailmentRatioPercent() + "% 절감하기")
                .category("AI")
                .points(aiResponse.getExpectedRewardPoints())
                .totalGoal(1)
                .unit("회")
                .icon("🤖")
                .explainabilityLog(aiResponse.getExplainabilityLog())
                .active(true)
                .targetUserId(user.getId()) // 개인 전용 꼬리표 부착
                .build();
        
        missionRepository.save(newMission);

        // 생성과 동시에 내 진행도(Progress) 테이블에 0% 상태로 묶음
        MissionProgress progress = MissionProgress.builder()
                .user(user)
                .mission(newMission)
                .progress(0)
                .completed(false)
                .build();
                
        progressRepository.save(progress);

        return newMission;
    }

    // ---- 미션 진행도 업데이트 ----
    @Transactional
    public AppDto.MissionResponse incrementProgress(Long userId, Long missionId) {
        Mission mission = missionRepository.findById(missionId)
                .orElseThrow(() -> new RuntimeException("미션을 찾을 수 없습니다."));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        MissionProgress progress = progressRepository
                .findByUserIdAndMissionId(userId, missionId)
                .orElseGet(() -> MissionProgress.builder()
                        .user(user)
                        .mission(mission)
                        .progress(0)
                        .completed(false)
                        .build());

        if (progress.getCompleted()) {
            throw new RuntimeException("이미 완료된 미션입니다.");
        }

        // 진행도 +1
        progress.setProgress(progress.getProgress() + 1);
        progress.setUpdatedAt(LocalDateTime.now());

        // 미션 완료 체크
        if (progress.getProgress() >= mission.getTotalGoal()) {
            progress.setCompleted(true);
            progress.setCompletedAt(LocalDateTime.now());

            // 포인트 적립
            user.setTotalPoints(user.getTotalPoints() + mission.getPoints());
            userRepository.save(user);

            // 포인트 내역 기록
            PointHistory pointHistory = PointHistory.builder()
                    .user(user)
                    .type(PointHistory.PointType.EARN)
                    .title(mission.getTitle() + " 미션")
                    .points(mission.getPoints())
                    .build();
            pointHistoryRepository.save(pointHistory);
        }

        progressRepository.save(progress);

        return AppDto.MissionResponse.builder()
                .id(mission.getId())
                .title(mission.getTitle())
                .progress(progress.getProgress())
                .total(mission.getTotalGoal())
                .completed(progress.getCompleted())
                .points(mission.getPoints())
                // [추가] 업데이트 응답에도 XAI 로그 포함
                .explainabilityLog(mission.getExplainabilityLog())
                .build();
    }

    // ---- 미션 통계 ----
    public long getCompletedCount(Long userId) {
        return progressRepository.countByUserIdAndCompletedTrue(userId);
    }
}