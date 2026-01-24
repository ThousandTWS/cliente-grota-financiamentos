package org.example.server.modules.billing.dto;

import org.example.server.modules.billing.model.BillingStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record BillingContractSummaryDTO(
        Long id,
        String contractNumber,
        BillingStatus status,
        LocalDate paidAt,
        LocalDate startDate,
        BigDecimal installmentValue,
        Integer installmentsTotal,
        BillingCustomerDTO customer,
        LocalDateTime createdAt
) {
}


