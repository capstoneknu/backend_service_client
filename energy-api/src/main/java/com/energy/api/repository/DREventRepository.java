package com.energy.api.repository;

import com.energy.api.entity.DREvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface DREventRepository extends JpaRepository<DREvent, Long> {

    List<DREvent> findByEventDateOrderByStartTimeAsc(LocalDate date);

    List<DREvent> findByStatusOrderByEventDateDesc(DREvent.EventStatus status);

    List<DREvent> findByEventDateAndStatusIn(LocalDate date, List<DREvent.EventStatus> statuses);
}
