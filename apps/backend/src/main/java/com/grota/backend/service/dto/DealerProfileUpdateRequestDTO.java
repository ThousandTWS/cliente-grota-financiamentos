package com.grota.backend.service.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;

public record DealerProfileUpdateRequestDTO(
    @NotBlank(message = "Nome da empresa é obrigatório")
    String fullNameEnterprise,
    LocalDate birthData,
    @NotBlank(message = "CNPJ é obrigatório")
    String cnpj,
    @Valid
    AddressDTO address
) {}
