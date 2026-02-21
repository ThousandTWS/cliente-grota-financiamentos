package org.example.server.modules.billing.dto;

import java.math.BigDecimal;

public record BillingIntelligenceKpisDTO(
        BigDecimal totalOpenAmount,
        long totalTitles,
        BigDecimal overduePercentage,
        BigDecimal forecastRecoveryAmount,
        BigDecimal forecastRecoveryPercentage
) {
}
