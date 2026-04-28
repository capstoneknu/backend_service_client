package com.energy.api.repository;

import com.energy.api.entity.EnergyData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface EnergyDataRepository extends JpaRepository<EnergyData, Long> {

    // 특정 사용자의 특정 날짜 전력 데이터
    List<EnergyData> findByUserIdAndRecordDateOrderByRecordedAtAsc(Long userId, LocalDate date);

    // 특정 사용자의 월간 데이터
    @Query("SELECT e FROM EnergyData e WHERE e.user.id = :userId " +
           "AND YEAR(e.recordDate) = :year AND MONTH(e.recordDate) = :month " +
           "ORDER BY e.recordedAt ASC")
    List<EnergyData> findMonthlyData(@Param("userId") Long userId,
                                     @Param("year") int year,
                                     @Param("month") int month);

    // 오늘 누적 사용량
    @Query("SELECT COALESCE(MAX(e.accumulatedKwh), 0) FROM EnergyData e " +
           "WHERE e.user.id = :userId AND e.recordDate = :date")
    Double getTodayAccumulated(@Param("userId") Long userId, @Param("date") LocalDate date);

    // 가장 최근 전력 데이터
    EnergyData findTopByUserIdOrderByRecordedAtDesc(Long userId);
}
