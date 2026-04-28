package com.energy.api.repository;

import com.energy.api.entity.PointHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PointHistoryRepository extends JpaRepository<PointHistory, Long> {

    List<PointHistory> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("SELECT COALESCE(SUM(p.points), 0) FROM PointHistory p " +
           "WHERE p.user.id = :userId AND p.type = 'EARN'")
    Integer getTotalEarned(@Param("userId") Long userId);

    @Query("SELECT COALESCE(SUM(ABS(p.points)), 0) FROM PointHistory p " +
           "WHERE p.user.id = :userId AND p.type = 'SPEND'")
    Integer getTotalSpent(@Param("userId") Long userId);
}
