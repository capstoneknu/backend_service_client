package com.energy.api.repository;

import com.energy.api.entity.DRParticipation;
import com.energy.api.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DRParticipationRepository extends JpaRepository<DRParticipation, Long> {

    // ===== 기존 메서드 (DREventService 사용) =====
    boolean existsByUserIdAndEventId(Long userId, Long eventId);

    Optional<DRParticipation> findByUserIdAndEventId(Long userId, Long eventId);

    List<DRParticipation> findByUserIdOrderByParticipatedAtDesc(Long userId);

    // ===== 신규 메서드 (ProfileService 사용) =====
    long countByUser(User user);

    @Query("SELECT COUNT(dp) FROM DRParticipation dp " +
           "WHERE dp.user = :user AND dp.success = true")
    long countSuccessByUser(@Param("user") User user);
}