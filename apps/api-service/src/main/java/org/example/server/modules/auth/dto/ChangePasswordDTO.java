package org.example.server.modules.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordDTO(
        @NotBlank(message = "A senha antiga é obrigatoria")
        @Size(min = 6, max = 8, message = "A senha deve ter entre 6 e 8 caracteres")
        String oldPassword,

        @NotBlank(message = "A nova senha é obrigatoria")
        @Size(min = 6, max = 8, message = "A senha deve ter entre 6 e 8 caracteres")
        String newPassword
) {
}


