package com.energy.api.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "dr_events")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DREvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;                 // 하계 피크 절감 이벤트

    @Column(nullable = false)
    private LocalDate eventDate;

    @Column(nullable = false)
    private LocalTime startTime;          // 14:00

    @Column(nullable = false)
    private LocalTime endTime;            // 17:00

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private EventStatus status = EventStatus.UPCOMING;

    @Column(nullable = false)
    private Double targetKwh;             // 절감 목표 (kWh)

    @Column(nullable = false)
    private Integer reward;               // 보상 포인트

    @Builder.Default
    private Integer participantCount = 0;

    public enum EventStatus {
        UPCOMING, ACTIVE, ENDED
    }
}
