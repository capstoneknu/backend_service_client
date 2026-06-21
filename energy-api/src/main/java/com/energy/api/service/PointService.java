package com.energy.api.service;

import com.energy.api.dto.AppDto;
import com.energy.api.entity.*;
import com.energy.api.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j; // 추가
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PointService {

    private final PointHistoryRepository pointHistoryRepository;
    private final UserRepository userRepository;

    // [추가] Saga 패턴 보상 트랜잭션을 위한 전용 예외 클래스
    public static class ExternalPaymentException extends RuntimeException {
        public ExternalPaymentException(String message) {
            super(message);
        }
    }

    // ---- 포인트 요약 + 내역 ----
    public AppDto.PointSummaryResponse getPointSummary(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        List<PointHistory> histories = pointHistoryRepository
                .findByUserIdOrderByCreatedAtDesc(userId);

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("M/d");

        List<AppDto.PointHistoryResponse> historyResponses = histories.stream()
                .map(h -> AppDto.PointHistoryResponse.builder()
                        .id(h.getId())
                        .type(h.getType().name().toLowerCase())
                        .title(h.getTitle())
                        .date(h.getCreatedAt().format(fmt))
                        .points(h.getPoints())
                        .build())
                .collect(Collectors.toList());

        return AppDto.PointSummaryResponse.builder()
                .totalPoints(user.getTotalPoints())
                .usedPoints(user.getUsedPoints())
                .availablePoints(user.getAvailablePoints())
                .history(historyResponses)
                .build();
    }

    // ---- Saga 패턴 기반 분산 트랜잭션 (결제 및 보상) ----
    // 외부 결제 실패 예외가 터져도 스프링이 롤백하지 않고 '환불 내역'을 DB에 영구 커밋하도록 제어    
    @Transactional(noRollbackFor = ExternalPaymentException.class)
    public AppDto.PointSummaryResponse spendPoints(Long userId, AppDto.PointSpendRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        if (request.getPoints() > user.getAvailablePoints()) {
            throw new RuntimeException("포인트가 부족합니다.");
        }

        // 1. [Local Transaction] 우리 DB 포인트 사전 차감 (결제 대기)
        user.setUsedPoints(user.getUsedPoints() + request.getPoints());
        userRepository.save(user);

        // 내역 기록
        PointHistory spendHistory = PointHistory.builder()
                .user(user)
                .type(PointHistory.PointType.SPEND)
                .title(request.getTitle())
                .points(-request.getPoints())
                .build();
        pointHistoryRepository.save(spendHistory);

        log.info("[Saga Step 1] 로컬 DB 포인트 차감 완료 ({}P)", request.getPoints());

        // 2. [External API Call] 강원마트 결제망 연동 시도 (Mocking)
        boolean isExternalPaymentSuccessful = mockGangwonMartApi(request);

        if (!isExternalPaymentSuccessful) {
            // 3. [Compensating Transaction] 외부 결제 실패 감지 -> 보상 트랜잭션(환불) 실행
            log.error("[Saga Step 2 Fail]서버 통신 장애 감지. 보상 트랜잭션(환불)을 개시합니다.");
            
            // 사용 포인트를 차감 전으로 원상 복구 (-)
            user.setUsedPoints(user.getUsedPoints() - request.getPoints());
            userRepository.save(user);

            // DB 스키마 제약을 피하기 위해 REFUND 대신 EARN(적립) 타입 사용. 새로운 트랜잭션 로그로 영구 기록
            PointHistory refundHistory = PointHistory.builder()
                    .user(user)
                    .type(PointHistory.PointType.EARN)
                    .title("[결제 실패 환불] " + request.getTitle())
                    .points(request.getPoints())
                    .build();
            pointHistoryRepository.save(refundHistory);

            // 프론트엔드에 예외 메시지 전달 (noRollbackFor 덕분에 위 환불 내역은 DB에 안전하게 저장됨)
            throw new ExternalPaymentException("결제 서버 응답 지연으로 결제가 취소되었으며, " + request.getPoints() + "P가 환불되었습니다.");
        }

        log.info("[Saga Step 2 Success] 결제 승인 완료");
        return getPointSummary(userId);
    }

    // 테스트를 위해 강원마트 외부 결제망 50% 확률로 실패하는 Mock 서버 연동 메서드
    private boolean mockGangwonMartApi(AppDto.PointSpendRequest request) {
        log.info("[External API] 결제 서버로 트랜잭션 전송 중... (Target: {})", request.getTitle());
        // 실증 목적상 50% 확률로 통신 실패(Timeout/500 Error) 모사
        return Math.random() > 0.5;
    }
}
