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

    // [추가] ANFIS XAI 추론 근거 저장 필드 (데이터 잘림 방지를 위해 length = 500 설정)
    @Column(length = 500)
    private String explainabilityLog; 

    // 개인화 미션 식별자 (null = 전체 공용 미션, 값이 있으면 개인 전용 미션)
    @Column(name = "target_user_id")
    private Long targetUserId;

    @Builder.Default
    private Boolean active = true;
}