package org.example.server.modules.billing.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record BillingOccurrenceRequestDTO(
        @NotNull(message = "A data da ocorrencia e obrigatoria")
        LocalDate date,

        @NotBlank(message = "O contato e obrigatorio")
        String contact,

        @NotBlank(message = "A ocorrencia e obrigatoria")
        String note
) {
}


