package org.example.server.modules.billing.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record BillingInstallmentInputDTO(
        @NotNull(message = "O numero da parcela e obrigatorio")
        @Min(value = 1, message = "O numero da parcela deve ser maior que zero")
        Integer number,

        @NotNull(message = "A data de vencimento e obrigatoria")
        LocalDate dueDate,

        @NotNull(message = "O valor da parcela e obrigatorio")
        BigDecimal amount,

        Boolean paid,
        LocalDate paidAt
) {
}


