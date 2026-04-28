package com.energy.api.repository;

import com.energy.api.entity.DRParticipation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DRParticipationRepository extends JpaRepository<DRParticipation, Long> {

    Optional<DRParticipation> findByUserIdAndEventId(Long userId, Long eventId);

    List<DRParticipation> findByUserIdOrderByParticipatedAtDesc(Long userId);

    boolean existsByUserIdAndEventId(Long userId, Long eventId);

    long countByEventId(Long eventId);
}
