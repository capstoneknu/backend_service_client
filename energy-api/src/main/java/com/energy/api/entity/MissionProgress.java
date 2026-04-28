package com.energy.api.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "mission_progress")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MissionProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mission_id", nullable = false)
    private Mission mission;

    @Builder.Default
    private Integer progress = 0;

    @Builder.Default
    private Boolean completed = false;

    private LocalDateTime completedAt;

    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
