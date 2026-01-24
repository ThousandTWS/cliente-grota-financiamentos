package org.example.server.modules.billing.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record BillingProfessionalDataDTO(
        String enterprise,
        String function,
        LocalDate admissionDate,
        BigDecimal income,
        BigDecimal otherIncomes,
        String maritalStatus
) {
}


