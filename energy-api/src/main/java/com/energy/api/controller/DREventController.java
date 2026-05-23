package com.energy.api.controller;

import com.energy.api.dto.AppDto;
import com.energy.api.entity.User;
import com.energy.api.service.DREventService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dr")
@RequiredArgsConstructor
public class DREventController {

    private final DREventService drEventService;

    // GET /api/dr/events - 오늘의 이벤트 목록
    @GetMapping("/events")
    public ResponseEntity<?> getTodayEvents(@AuthenticationPrincipal User user) {
        List<AppDto.DREventResponse> events = drEventService.getTodayEvents(user.getId());
        return ResponseEntity.ok(AppDto.ApiResponse.ok(events));
    }

    // POST /api/dr/events/{eventId}/participate - 이벤트 참여
    @PostMapping("/events/{eventId}/participate")
    public ResponseEntity<?> participate(
            @AuthenticationPrincipal User user,
            @PathVariable Long eventId) {
        try {
            AppDto.DREventResponse response = drEventService.participateEvent(user.getId(), eventId);
            return ResponseEntity.ok(AppDto.ApiResponse.ok("이벤트에 참여했습니다.", response));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(AppDto.ApiResponse.error(e.getMessage()));
        }
    }

    // POST /api/dr/events/{eventId}/notification - 알림 설정 토글
    @PostMapping("/events/{eventId}/notification")
    public ResponseEntity<?> toggleNotification(
            @AuthenticationPrincipal User user,
            @PathVariable Long eventId) {
        drEventService.toggleNotification(user.getId(), eventId);
        return ResponseEntity.ok(AppDto.ApiResponse.ok("알림 설정이 변경되었습니다.", null));
    }

    // GET /api/dr/history - 참여 이력
    @GetMapping("/history")
    public ResponseEntity<?> getHistory(@AuthenticationPrincipal User user) {
        List<AppDto.DRHistoryResponse> history = drEventService.getHistory(user.getId());
        return ResponseEntity.ok(AppDto.ApiResponse.ok(history));
    }
}
