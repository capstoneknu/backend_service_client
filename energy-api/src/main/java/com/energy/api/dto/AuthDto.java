package com.energy.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

public class AuthDto {

    // ======== 로그인 요청 ========
    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    public static class LoginRequest {
        @NotBlank(message = "이메일을 입력해주세요")
        @Email(message = "올바른 이메일 형식이 아닙니다")
        private String email;

        @NotBlank(message = "비밀번호를 입력해주세요")
        private String password;
    }

    // ======== 회원가입 요청 ========
    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    public static class SignUpRequest {
        @NotBlank(message = "이메일을 입력해주세요")
        @Email(message = "올바른 이메일 형식이 아닙니다")
        private String email;

        @NotBlank(message = "비밀번호를 입력해주세요")
        @Size(min = 4, message = "비밀번호는 4자리 이상이어야 합니다")
        private String password;

        @NotBlank(message = "이름을 입력해주세요")
        private String name;

        private String location;
        private String household;
    }

    // ======== 로그인 응답 ========
    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class LoginResponse {
        private String token;
        private UserInfo user;
    }

    // ======== 사용자 정보 ========
    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class UserInfo {
        private Long id;
        private String email;
        private String name;
        private String location;
        private String household;
        private Integer ecoLevel;
        private Integer totalPoints;
        private Integer availablePoints;
    }
}
