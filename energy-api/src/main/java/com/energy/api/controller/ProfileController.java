package com.energy.api.controller;

import com.energy.api.dto.AppDto;
import com.energy.api.entity.User;
import com.energy.api.repository.UserRepository;
import com.energy.api.service.ProfileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;
    private final UserRepository userRepository;

    @GetMapping
    public AppDto.ApiResponse<AppDto.ProfileResponse> getProfile(Authentication auth) {
        Object principal = auth.getPrincipal();
        log.info("📍 [Profile] 요청 받음, principal={}", principal);
        Long userId;
        // [수정] Spring Security 주체(Principal)의 실제 타입 기반 안전한 ID 추출
        if (principal instanceof User) {
            // JwtAuthenticationFilter가 User 객체 자체를 Context에 넣은 경우
            userId = ((User) principal).getId();
        } else if (principal instanceof String) {
            // 문자열(이메일 또는 ID)이 들어있는 경우의 Fallback 방어 로직
            String principalStr = (String) principal;
            try {
                userId = Long.parseLong(principalStr);
            } catch (NumberFormatException e) {
                User user = userRepository.findByEmail(principalStr)
                        .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다: " + principalStr));
                userId = user.getId();
            }
        } else {
            throw new RuntimeException("인증 주체(Principal)의 타입을 알 수 없습니다: " + principal.getClass());
        }

        log.info("📍 [Profile] 프로필 조회 요청 성공, userId={}", userId);

        // [수정] 비즈니스 로직 호출
        AppDto.ProfileResponse profile = profileService.getProfile(userId);
        
        // [수정] AppDto 내부에 정의된 ok() 메서드를 사용하여 응답
        return AppDto.ApiResponse.ok(profile);
    }
}