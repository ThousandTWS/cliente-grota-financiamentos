package org.example.server.modules.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record VerificationCodeRequestDTO(
   @NotBlank(message = "O E-mail é obrigatório")
   @Email(message = "E-mail inválido")
   String email,

   @NotBlank(message = "O Codigo é obrigatório")
   @Size(min = 6, message = "O código deve ter no máximo 6 caraacteres")
   String code
) {}


