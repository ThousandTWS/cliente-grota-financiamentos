package org.example.server.modules.auth.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AuthRequest(
        @Pattern(
                regexp = "^$|^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$",
                message = "E-mail inválido"
        )
        String email,

        @Size(min = 2, max = 100, message = "O nome da empresa deve ter entre 2 e 100 caracteres")
        String enterprise,

        @NotBlank(message = "A senha é obrigatória")
        @Size(min = 6, max = 8, message = "A senha deve ter entre 6 e 8 caracteres")
        String password
) {

    @AssertTrue(message = "Informe o e-mail ou o nome da empresa")
    public boolean hasEmailOrEnterprise() {
        boolean hasEmail = this.email != null && !this.email.isBlank();
        boolean hasEnterprise = this.enterprise != null && !this.enterprise.isBlank();
        return hasEmail || hasEnterprise;
    }
}


