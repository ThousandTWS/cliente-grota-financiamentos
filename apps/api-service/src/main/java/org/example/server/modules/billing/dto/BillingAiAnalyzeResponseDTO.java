package org.example.server.modules.billing.dto;

import java.time.LocalDateTime;

public record BillingAiAnalyzeResponseDTO(
        Long contractId,
        Integer installmentNumber,
        String riskLevel,
        Integer riskScore,
        String recommendedNextAction,
        String recommendedChannel,
        String alertReason,
        String suggestedMessage,
        String source,
        LocalDateTime createdAt
) {
}
