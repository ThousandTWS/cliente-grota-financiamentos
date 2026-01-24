package org.example.server.modules.dealer.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.example.server.shared.address.dto.AddressDTO;

import java.time.LocalDate;

public record DealerProfileDTO(
        @NotBlank(message = "O nome completo da empresa é obrigatório")
        @Size(min = 2, max = 255, message = "O nome da empresa deve ter entre 2 e 255 caracteres")
        String fullNameEnterprise,

        @NotNull(message = "A data de nascimento é obrigatória")
        @Past(message = "A data de nascimento deve ser uma data passada")
        LocalDate birthData,

        @NotBlank(message = "O CNPJ é obrigatório")
        @Pattern(regexp = "\\d{14}", message = "O CNPJ deve conter exatamente 14 dígitos numéricos")
        String cnpj,

        @NotNull(message = "O endereço é obrigatório")
        @Valid
        AddressDTO address
) {}


