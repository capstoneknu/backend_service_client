package com.energy.api.repository;

import com.energy.api.entity.EnergyData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

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
    @Query("SELECT COALESCE(SUM(e.accumulatedKwh), 0.0) FROM EnergyData e " +
           "WHERE e.user.id = :userId AND e.recordDate = :date")
    Double getTodayAccumulated(@Param("userId") Long userId, @Param("date") LocalDate date);

    // 월간 누적량: 1분 단위 데이터의 총합(SUM)으로 수학적 계산
    @Query(value = "SELECT COALESCE(SUM(accumulated_kwh), 0.0) FROM energy_data " +
                   "WHERE user_id = :userId AND YEAR(record_date) = :year AND MONTH(record_date) = :month", nativeQuery = true)
    Double getMonthlyAccumulated(@Param("userId") Long userId, @Param("year") int year, @Param("month") int month);

    // 가장 최근 전력 데이터
    EnergyData findTopByUserIdOrderByRecordedAtDesc(Long userId);

    // AI 서버에서 받아온 예측 전력량을 해당 유저의 특정 날짜/시간대 로우에 업데이트
    @Modifying
    @Transactional
    @Query(value = "UPDATE energy_data " +
                   "SET predicted_kw = :predictedKw " +
                   "WHERE user_id = :userId " +
                   "AND record_date = :targetDate " +
                   "AND HOUR(recorded_at) = :hour", nativeQuery = true)
    int updatePredictedKw(@Param("userId") Long userId, 
                          @Param("targetDate") LocalDate targetDate, 
                          @Param("hour") int hour, 
                          @Param("predictedKw") double predictedKw);
}
