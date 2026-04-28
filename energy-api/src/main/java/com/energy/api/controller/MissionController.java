package com.energy.api.controller;

import com.energy.api.dto.AppDto;
import com.energy.api.entity.User;
import com.energy.api.service.MissionService;
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
}
