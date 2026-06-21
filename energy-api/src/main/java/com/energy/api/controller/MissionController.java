package com.energy.api.controller;

import com.energy.api.dto.AppDto;
import com.energy.api.dto.AiMissionResponse;
import com.energy.api.entity.Mission;
import com.energy.api.entity.User;
import com.energy.api.repository.MissionRepository;
import com.energy.api.service.MissionService;
import com.energy.api.service.AiEngineClient;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/missions")
@RequiredArgsConstructor
public class MissionController {

    private final MissionService missionService;
    private final AiEngineClient aiEngineClient;
    private final MissionRepository missionRepository;

    // GET /api/missions?category=전체
    @GetMapping
    public ResponseEntity<?> getMissions(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "전체") String category) {
        List<AppDto.MissionResponse> missions =
                missionService.getMissions(user.getId(), category);
        return ResponseEntity.ok(AppDto.ApiResponse.ok(missions));
    }

    // POST /api/missions/{missionId}/progress - 진행도 증가
    @PostMapping("/{missionId}/progress")
    public ResponseEntity<?> incrementProgress(
            @AuthenticationPrincipal User user,
            @PathVariable Long missionId) {
        try {
            AppDto.MissionResponse response =
                    missionService.incrementProgress(user.getId(), missionId);
            String msg = response.getCompleted()
                    ? "미션 완료! +" + response.getPoints() + "P 적립!"
                    : "진행도가 업데이트되었습니다.";
            return ResponseEntity.ok(AppDto.ApiResponse.ok(msg, response));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(AppDto.ApiResponse.error(e.getMessage()));
        }
    }

    // ====================================================================
    // [추가 - E2E] POST /api/missions/generate - AI 기반 실시간 동적 미션 생성
    // ====================================================================
    @PostMapping("/generate")
    public ResponseEntity<?> generateDynamicMission(@AuthenticationPrincipal User user) {
        try {
            // 1. A파트(FastAPI) AI 호출 
            AiMissionResponse aiResponse = aiEngineClient.fetchDynamicMissionFromAI(
                    String.valueOf(user.getId()), 
                    2.5,  // 현재 전력량 
                    0.6   // 전력망 스트레스
            );

            // 2. DB 저장을 트랜잭션 단위로 캡슐화된 서비스 레이어에 위임
            missionService.createPersonalAiMission(user, aiResponse);

            return ResponseEntity.ok(AppDto.ApiResponse.ok("AI 동적 미션이 생성되었습니다.", aiResponse));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(AppDto.ApiResponse.error("AI 미션 생성 실패: " + e.getMessage()));
        }
    }
}