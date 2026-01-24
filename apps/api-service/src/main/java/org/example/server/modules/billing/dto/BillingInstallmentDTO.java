package org.example.server.modules.billing.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record BillingInstallmentDTO(
        Integer number,
        LocalDate dueDate,
        BigDecimal amount,
        boolean paid,
        LocalDate paidAt,
        Integer daysLate
) {
}


