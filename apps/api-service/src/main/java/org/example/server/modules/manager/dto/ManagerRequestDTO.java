package org.example.server.modules.manager.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;
import org.example.server.shared.address.dto.AddressDTO;

import java.time.LocalDate;

public record ManagerRequestDTO(
        Long dealerId,

        @NotBlank(message = "O nome completo e obrigatorio")
        @Size(min = 2, max = 100, message = "O nome completo deve ter entre 2 e 100 caracteres")
        String fullName,

        @NotBlank(message = "O e-mail e obrigatorio")
        @Email(message = "E-mail invalido")
        String email,

        @NotBlank(message = "O telefone e obrigatorio")
        String phone,

        @NotBlank(message = "A senha e obrigatoria")
        @Size(min = 6, max = 8, message = "A senha deve ter entre 6 e 8 caracteres")
        String password,

        @NotBlank(message = "O CPF e obrigatorio")
        @Size(min = 11, max = 14, message = "O CPF deve ter entre 11 e 14 caracteres")
        String CPF,

        @Past(message = "A data de nascimento deve ser uma data no passado")
        LocalDate birthData,

        @Valid
        AddressDTO address,

        Boolean canView,
        Boolean canCreate,
        Boolean canUpdate,
        Boolean canDelete
) {}


