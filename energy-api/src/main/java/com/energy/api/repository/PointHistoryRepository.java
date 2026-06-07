package com.energy.api.repository;

import com.energy.api.entity.PointHistory;
import com.energy.api.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PointHistoryRepository extends JpaRepository<PointHistory, Long> {

    // ===== 기존 메서드 (PointService 사용) =====
    List<PointHistory> findByUserIdOrderByCreatedAtDesc(Long userId);

    // ===== 신규: ProfileService에서 사용자의 순 포인트 합계 =====
    /**
     * 사용자의 적립-사용 차감한 현재 보유 포인트
     */

    // [버그 수정] 하드코딩된 '사용' 이라는 한글 조건을 정확한 Enum 규격인 'SPEND'로 변경
    @Query("SELECT COALESCE(SUM(CASE WHEN ph.type ='SPEND' THEN -ph.points ELSE ph.points END), 0) " +
           "FROM PointHistory ph WHERE ph.user = :user")
    Long sumNetPointsByUser(@Param("user") User user);
}