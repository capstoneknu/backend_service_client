package com.energy.api.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

//============================================
//  국가 공식 지표 기반 환경 지표 산출 유틸리티
//============================================
public class EcoMetricsCalculator {

    // 전력부문 온실가스 배출계수 (kgCO2/kWh)
    private static final BigDecimal CO2_EMISSION_FACTOR = new BigDecimal("0.46627");
    
    // 30년생 소나무 1그루 연간 CO2 흡수량 (kg)
    private static final BigDecimal PINE_TREE_ABSORPTION = new BigDecimal("6.6");

    public static BigDecimal calculateCo2Reduction(BigDecimal savedKwh) {
        if (savedKwh == null || savedKwh.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return savedKwh.multiply(CO2_EMISSION_FACTOR).setScale(2, RoundingMode.HALF_UP);
    }

    public static int calculateTreesPlanted(BigDecimal co2ReductionKg) {
        if (co2ReductionKg == null || co2ReductionKg.compareTo(BigDecimal.ZERO) <= 0) {
            return 0;
        }
        return co2ReductionKg.divide(PINE_TREE_ABSORPTION, 0, RoundingMode.HALF_UP).intValue();
    }
}