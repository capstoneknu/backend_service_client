package com.energy.api.repository;

import com.energy.api.entity.EnergyData;
import com.energy.api.entity.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface EnergyDataRepository extends JpaRepository<EnergyData, Long> {

    // 최신 데이터 1건 (현재 전력용)
    Optional<EnergyData> findFirstByUserOrderByRecordedAtDesc(User user);

    // 오늘 사용량 합계 (kWh)
    @Query("SELECT COALESCE(SUM(e.accumulatedKwh), 0) FROM EnergyData e " +
           "WHERE e.user = :user AND e.recordDate = :date")
    Double sumKwhByUserAndDate(@Param("user") User user,
                                @Param("date") LocalDate date);

    // 이번 달 사용량 합계 (kWh)
    @Query("SELECT COALESCE(SUM(e.accumulatedKwh), 0) FROM EnergyData e " +
           "WHERE e.user = :user " +
           "AND e.recordDate BETWEEN :start AND :end")
    Double sumKwhByUserAndDateRange(@Param("user") User user,
                                     @Param("start") LocalDate start,
                                     @Param("end") LocalDate end);

    // 시간대별 평균 전력 (오늘 데이터, hour 그룹화)
    @Query("SELECT HOUR(e.recordedAt) as hour, AVG(e.powerKw) as avgPower " +
           "FROM EnergyData e " +
           "WHERE e.user = :user AND e.recordDate = :date " +
           "GROUP BY HOUR(e.recordedAt) " +
           "ORDER BY hour")
    List<Object[]> findHourlyAverageByUserAndDate(@Param("user") User user,
                                                   @Param("date") LocalDate date);

    // 최근 N건 (트렌드 계산용)
    List<EnergyData> findTop100ByUserOrderByRecordedAtDesc(User user);
}