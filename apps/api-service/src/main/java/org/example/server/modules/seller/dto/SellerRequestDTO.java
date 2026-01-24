package org.example.server.modules.seller.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;
import org.example.server.shared.address.dto.AddressDTO;

import java.time.LocalDate;

public record SellerRequestDTO(
        Long dealerId,

        @NotBlank(message = "O nome completo e obrigatorio")
        @Size(min = 2, max = 100, message = "O nome completo deve ter entre 2 e 100 caracteres")
        String fullName,

        @NotBlank(message = "O e-mail e obrigatorio")
        @Email(message = "E-mail invalido")
        String email,

        String phone,

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


