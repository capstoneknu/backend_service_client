package com.energy.api.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "point_history")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PointHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private PointType type;           // EARN, SPEND

    @Column(nullable = false)
    private String title;             // DR 이벤트 보상, 춘천 닭갈비 골목

    @Column(nullable = false)
    private Integer points;           // 양수: 적립, 음수: 사용

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum PointType {
        EARN, SPEND
    }
}
