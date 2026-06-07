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
            AppDto.PointSummaryResponse summary = pointService.spendPoints(user.getId(), request);
            return ResponseEntity.ok(AppDto.ApiResponse.ok("포인트 결제가 성공적으로 승인되었습니다.", summary));
        } catch (PointService.ExternalPaymentException e){
            // [Saga 패턴] 보상 트랜잭션(환불) 완료 메시지를 클라이언트로 안전하게 전달
            return ResponseEntity.badRequest()
                    .body(AppDto.ApiResponse.error(e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(AppDto.ApiResponse.error(e.getMessage()));
        }
    }
}
