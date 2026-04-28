package com.energy.api.service;

import com.energy.api.config.JwtUtil;
import com.energy.api.dto.AuthDto;
import com.energy.api.entity.User;
import com.energy.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    // ---- 로그인 ----
    public AuthDto.LoginResponse login(AuthDto.LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("이메일 또는 비밀번호가 올바르지 않습니다."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("이메일 또는 비밀번호가 올바르지 않습니다.");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getEmail());

        return AuthDto.LoginResponse.builder()
                .token(token)
                .user(toUserInfo(user))
                .build();
    }

    // ---- 회원가입 ----
    @Transactional
    public AuthDto.UserInfo signUp(AuthDto.SignUpRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("이미 가입된 이메일입니다.");
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .location(request.getLocation())
                .household(request.getHousehold())
                .ecoLevel(1)
                .totalPoints(100)  // 신규 가입 보너스
                .usedPoints(0)
                .build();

        userRepository.save(user);
        return toUserInfo(user);
    }

    // ---- 내 정보 조회 ----
    public AuthDto.UserInfo getMyInfo(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        return toUserInfo(user);
    }

    private AuthDto.UserInfo toUserInfo(User user) {
        return AuthDto.UserInfo.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .location(user.getLocation())
                .household(user.getHousehold())
                .ecoLevel(user.getEcoLevel())
                .totalPoints(user.getTotalPoints())
                .availablePoints(user.getAvailablePoints())
                .build();
    }
}
