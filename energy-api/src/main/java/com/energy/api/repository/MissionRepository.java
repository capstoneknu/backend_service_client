package com.energy.api.repository;

import com.energy.api.entity.Mission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MissionRepository extends JpaRepository<Mission, Long> {

    List<Mission> findByActiveTrue();

    List<Mission> findByCategoryAndActiveTrue(String category);
}
