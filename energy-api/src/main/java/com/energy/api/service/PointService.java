package com.energy.api.service;

import com.energy.api.dto.AppDto;
import com.energy.api.entity.*;
import com.energy.api.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PointService {

    private final PointHistoryRepository pointHistoryRepository;
    private final UserRepository userRepository;

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

    // ---- 포인트 사용 ----
    @Transactional
    public AppDto.PointSummaryResponse spendPoints(Long userId, AppDto.PointSpendRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        if (request.getPoints() > user.getAvailablePoints()) {
            throw new RuntimeException("포인트가 부족합니다.");
        }

        // 사용 포인트 증가
        user.setUsedPoints(user.getUsedPoints() + request.getPoints());
        userRepository.save(user);

        // 내역 기록
        PointHistory history = PointHistory.builder()
                .user(user)
                .type(PointHistory.PointType.SPEND)
                .title(request.getTitle())
                .points(-request.getPoints())
                .build();
        pointHistoryRepository.save(history);

        return getPointSummary(userId);
    }
}
