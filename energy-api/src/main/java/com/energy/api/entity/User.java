package com.energy.api.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal; //정밀한 단위 추가
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

    @Column(nullable = false, length = 100) // 보안 강화를 위한 길이 제한
    private String password;

    @Column(nullable = false)
    private String name;

    private String location;       // 강원도 춘천시 [cite: 36, 182]
    private String household;      // 3인 가구

    // [수정] 비즈니스 로직에 필요한 월간 목표 사용량 속성 추가 (기본값 400.0) [cite: 37, 120]
    @Builder.Default
    @Column(nullable = false)
    private Double targetKwh = 400.0; 

    @Builder.Default
    private Integer ecoLevel = 1;

    // [수정] 무결성을 위해 포인트를 BigDecimal로 정밀화하는 것을 고려하되, 
    // 기존 DTO와의 호환성을 위해 Integer를 유지하면서 정밀한 Getter 로직 제공 [cite: 303, 424]
    @Builder.Default
    private Integer totalPoints = 0;

    @Builder.Default
    private Integer usedPoints = 0;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    public Integer getAvailablePoints() {
        return (totalPoints != null ? totalPoints : 0) - (usedPoints != null ? usedPoints : 0);
    }
}