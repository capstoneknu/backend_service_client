package com.energy.api.repository;

import com.energy.api.entity.MissionProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MissionProgressRepository extends JpaRepository<MissionProgress, Long> {

    List<MissionProgress> findByUserId(Long userId);

    Optional<MissionProgress> findByUserIdAndMissionId(Long userId, Long missionId);

    long countByUserIdAndCompletedTrue(Long userId);
}
