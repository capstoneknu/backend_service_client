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

    // [수정] 이전 AiPredictionService 및 Repository 쿼리와의 정합성 확보
    // DB의 'predicted_kw' 컬럼과 JPA의 'predictedKw' 필드를 명시적으로 매핑 [cite: 130, 391]
    @Column(name = "predicted_kw")
    private Double predictedKw;

    @Column(nullable = false)
    private LocalDate recordDate;        // 날짜 (인덱싱용)
}
