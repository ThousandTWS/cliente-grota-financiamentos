package com.grota.backend.service.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record SellerUpdateRequestDTO(
    Long dealerId,
    @Size(min = 2, max = 100, message = "O nome completo deve ter entre 2 e 100 caracteres")
    String fullName,
    @Email(message = "E-mail inválido")
    String email,
    String phone,
    @Size(min = 6, max = 100, message = "A senha deve ter entre 6 e 100 caracteres")
    String password,
    String CPF,
    LocalDate birthData,
    @Valid
    AddressDTO address,
    Boolean canView,
    Boolean canCreate,
    Boolean canUpdate,
    Boolean canDelete
) {}
