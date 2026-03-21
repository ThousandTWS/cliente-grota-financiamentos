package com.grota.backend.service.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record FinancingUserProfileUpdateDTO(
    @Size(min = 2, max = 100, message = "O nome completo deve ter entre 2 e 100 caracteres")
    String fullName,
    @Email(message = "E-mail inválido")
    String email
) {}
