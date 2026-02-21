package org.example.server.modules.billing.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record BillingAiAnalyzeRequestDTO(
        @NotNull(message = "contractId e obrigatorio")
        Long contractId,
        @NotNull(message = "installmentNumber e obrigatorio")
        @Min(value = 1, message = "installmentNumber deve ser maior que zero")
        Integer installmentNumber,
        Boolean forceRefresh
) {
}
