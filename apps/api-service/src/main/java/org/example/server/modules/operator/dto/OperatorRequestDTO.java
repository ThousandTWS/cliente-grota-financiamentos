package org.example.server.modules.operator.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.example.server.shared.address.dto.AddressDTO;

import java.time.LocalDate;
import java.util.List;

public record OperatorRequestDTO(

        Long dealerId,

        List<Long> dealerIds,

        @NotBlank(message = "O nome completo e obrigatorio")
        String fullName,

        @NotBlank(message = "O e-mail e obrigatorio")
        @Email(message = "E-mail invalido")
        String email,

        @NotBlank(message = "O telefone e obrigatorio")
        String phone,

        String password,

        @Size(min = 11, max = 14, message = "O CPF deve ter entre 11 e 14 caracteres")
        String CPF,

        LocalDate birthData,

        AddressDTO address,

        Boolean canView,
        Boolean canCreate,
        Boolean canUpdate,
        Boolean canDelete) {
}
