package com.energy.api.controller;

import com.energy.api.dto.AppDto;
import com.energy.api.entity.User;
import com.energy.api.service.PointService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/points")
@RequiredArgsConstructor
public class PointController {

    private final PointService pointService;

    // GET /api/points - 포인트 요약 + 내역
    @GetMapping
    public ResponseEntity<?> getPoints(@AuthenticationPrincipal User user) {
        AppDto.PointSummaryResponse summary = pointService.getPointSummary(user.getId());
        return ResponseEntity.ok(AppDto.ApiResponse.ok(summary));
    }

    // POST /api/points/spend - 포인트 사용
    @PostMapping("/spend")
    public ResponseEntity<?> spendPoints(
            @AuthenticationPrincipal User user,
            @RequestBody AppDto.PointSpendRequest request) {
        try {
            AppDto.PointSummaryResponse summary =
                    pointService.spendPoints(user.getId(), request);
            return ResponseEntity.ok(AppDto.ApiResponse.ok("포인트가 사용되었습니다.", summary));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(AppDto.ApiResponse.error(e.getMessage()));
        }
    }
}
