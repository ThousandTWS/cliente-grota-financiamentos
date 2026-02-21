package org.example.server.modules.billing.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record BillingIntelligenceTitleDTO(
        Long contractId,
        String contractNumber,
        Integer installmentNumber,
        LocalDate dueDate,
        BigDecimal amount,
        Integer daysLate,
        String status,
        String customerName,
        String customerId,
        String customerDocumentMasked,
        String customerSegment,
        LocalDate lastContactDate,
        Integer remindersCount,
        Integer recurrence90Days,
        String riskLevel,
        Integer riskScore,
        String recommendedNextAction,
        String recommendedChannel,
        String alertReason,
        String suggestedMessage,
        String severity
) {
}
