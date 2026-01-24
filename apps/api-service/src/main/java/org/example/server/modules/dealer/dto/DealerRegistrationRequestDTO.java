package org.example.server.modules.dealer.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DealerRegistrationRequestDTO(

        @NotBlank(message = "O nome completo é obrigatório")
        @Size(min = 2, max = 100, message = "O nome completo deve ter entre 2 a 100 caracteres")
        String fullName,

        @NotBlank(message = "O telefone é obrigatório")
        String phone,

        @NotBlank(message = "A empresa é obrigatória")
        @Size(min = 2, max = 100, message = "O nome da empresa deve ter entre 2 a 100 caracteres")
        String enterprise,

        @NotBlank(message = "A senha é obrigatória")
        @Size(min = 6, max = 8, message = "A senha deve ter entre 6 e 8 caracteres")
        String password,

        Boolean adminRegistration
){} 


