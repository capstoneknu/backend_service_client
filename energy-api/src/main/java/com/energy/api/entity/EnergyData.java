package com.energy.api.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "energy_data")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EnergyData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDateTime recordedAt;    // 기록 시간

    @Column(nullable = false)
    private Double powerKw;              // 순간 전력 (kW)

    private Double accumulatedKwh;       // 누적 사용량 (kWh)

    private Double predictedKw;          // AI 예측 전력 (kW)

    @Column(nullable = false)
    private LocalDate recordDate;        // 날짜 (인덱싱용)
}
