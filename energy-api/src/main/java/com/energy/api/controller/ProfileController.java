package com.energy.api.controller;

import com.energy.api.dto.AppDto;
import com.energy.api.dto.ProfileDto;
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
    public AppDto.ApiResponse<ProfileDto.ProfileResponse> getProfile(Authentication auth) {
        String principal = auth.getName();
        log.info("📍 [Profile] 요청 받음, principal={}", principal);

        Long userId;
        try {
            // JWT subject가 userId(Long)인 경우 (이 앱의 인증 방식)
            userId = Long.parseLong(principal);
        } catch (NumberFormatException e) {
            // JWT subject가 email인 경우 (fallback)
            User user = userRepository.findByEmail(principal)
                    .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다: " + principal));
            userId = user.getId();
        }

        ProfileDto.ProfileResponse profile = profileService.getProfile(userId);
        return AppDto.ApiResponse.<ProfileDto.ProfileResponse>builder()
                .success(true)
                .data(profile)
                .build();
    }
}