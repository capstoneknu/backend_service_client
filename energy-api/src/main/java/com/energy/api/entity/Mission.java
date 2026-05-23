package com.energy.api.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "missions")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Mission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;            // 에어컨 1도 올리기

    private String description;      // 냉방 온도를 26°C 이상으로 설정

    @Column(nullable = false)
    private String category;         // DR, 냉난방, 가전, 종합

    @Column(nullable = false)
    private Integer points;          // 보상 포인트

    @Column(nullable = false)
    private Integer totalGoal;       // 목표 횟수

    @Column(nullable = false)
    private String unit;             // 일, 회, 주

    private String icon;             // 이모지 아이콘

    @Builder.Default
    private Boolean active = true;
}
