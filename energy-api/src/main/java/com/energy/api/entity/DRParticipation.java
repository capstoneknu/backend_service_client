package com.energy.api.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "dr_participations")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DRParticipation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private DREvent event;

    @Builder.Default
    private Double savedKwh = 0.0;        // 실제 절감량

    @Column(nullable = false)
    @Builder.Default
    private Boolean success = false;       // 목표 달성 여부

    @Builder.Default
    private Integer earnedPoints = 0;      // 획득 포인트

    @Builder.Default
    private Boolean notificationSet = false;

    @Builder.Default
    private LocalDateTime participatedAt = LocalDateTime.now();
}
