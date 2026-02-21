package org.example.server.modules.billing.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record BillingIntelligenceAlertDTO(
        Long id,
        String customerId,
        String customerName,
        String severity,
        String reason,
        String recommendedAction,
        String recommendedChannel,
        Long contractId,
        Integer installmentNumber,
        BigDecimal amount,
        Integer daysLate,
        LocalDateTime createdAt
) {
}
