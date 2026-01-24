package org.example.server.modules.billing.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record BillingInstallmentUpdateDTO(
        @NotNull(message = "O status de pagamento e obrigatorio")
        Boolean paid,
        LocalDate paidAt
) {
}


