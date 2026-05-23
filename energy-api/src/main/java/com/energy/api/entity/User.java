package com.energy.api.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String name;

    private String location;       // 강원도 춘천시
    private String household;      // 3인 가구

    @Builder.Default
    private Integer ecoLevel = 1;

    @Builder.Default
    private Integer totalPoints = 0;

    @Builder.Default
    private Integer usedPoints = 0;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    // 사용 가능 포인트
    public Integer getAvailablePoints() {
        return totalPoints - usedPoints;
    }
}
