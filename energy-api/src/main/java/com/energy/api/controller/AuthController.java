package com.energy.api.controller;

import com.energy.api.dto.AppDto;
import com.energy.api.dto.AuthDto;
import com.energy.api.entity.User;
import com.energy.api.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // POST /api/auth/login
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthDto.LoginRequest request) {
        try {
            AuthDto.LoginResponse response = authService.login(request);
            return ResponseEntity.ok(AppDto.ApiResponse.ok(response));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(AppDto.ApiResponse.error(e.getMessage()));
        }
    }

    // POST /api/auth/signup
    @PostMapping("/signup")
    public ResponseEntity<?> signUp(@Valid @RequestBody AuthDto.SignUpRequest request) {
        try {
            AuthDto.UserInfo userInfo = authService.signUp(request);
            return ResponseEntity.ok(AppDto.ApiResponse.ok("회원가입 성공", userInfo));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(AppDto.ApiResponse.error(e.getMessage()));
        }
    }

    // GET /api/auth/me
    @GetMapping("/me")
    public ResponseEntity<?> getMyInfo(@AuthenticationPrincipal User user) {
        AuthDto.UserInfo info = authService.getMyInfo(user.getId());
        return ResponseEntity.ok(AppDto.ApiResponse.ok(info));
    }
}
