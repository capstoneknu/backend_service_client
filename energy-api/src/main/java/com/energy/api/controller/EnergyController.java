package com.energy.api.controller;

import com.energy.api.dto.AppDto;
import com.energy.api.entity.User;
import com.energy.api.service.AiEngineClient;
import com.energy.api.service.EnergyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/energy")
@RequiredArgsConstructor
public class EnergyController {

    private final EnergyService energyService;
    private final AiEngineClient aiEngineClient;

    // GET /api/energy/dashboard
    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboard(@AuthenticationPrincipal User user) {
        AppDto.DashboardResponse dashboard = energyService.getDashboard(user.getId());
        return ResponseEntity.ok(AppDto.ApiResponse.ok(dashboard));
    }

    // GET /api/energy/timeseries - InfluxDB 시계열 추이 (시계열 분석 화면)
    @GetMapping("/timeseries")
    public ResponseEntity<?> getTimeseries(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "USER_0000") String deviceId,
            @RequestParam(defaultValue = "1d") String window) {
        return ResponseEntity.ok(AppDto.ApiResponse.ok(
                aiEngineClient.fetchTimeseries(deviceId, window)));
    }
}
