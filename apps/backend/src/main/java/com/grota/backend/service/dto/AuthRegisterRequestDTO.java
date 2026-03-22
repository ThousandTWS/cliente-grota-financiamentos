package com.grota.backend.service.dto;

import jakarta.validation.constraints.NotBlank;

public record AuthRegisterRequestDTO(
    @NotBlank(message = "Nome completo é obrigatório")
    String fullName,
    @NotBlank(message = "Telefone é obrigatório")
    String phone,
    @NotBlank(message = "Empresa é obrigatória")
    String enterprise,
    @NotBlank(message = "Senha é obrigatória")
    String password,
    boolean adminRegistration
) {}
