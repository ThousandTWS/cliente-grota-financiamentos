package org.example.server.modules.dealer.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.example.server.modules.dealer.model.PartnerType;

@Schema(name = "PartnerRequest", description = "Dados de sócio ou procurador do lojista")
public record PartnerRequestDTO(
        @Schema(description = "CPF do sócio/procurador (apenas números)", example = "12345678901")
        @NotBlank(message = "O CPF é obrigatório")
        @Pattern(regexp = "\\d{11}", message = "O CPF deve conter exatamente 11 dígitos numéricos")
        String cpf,

        @Schema(description = "Nome completo do sócio/procurador", example = "Maria Souza")
        @NotBlank(message = "O nome do sócio é obrigatório")
        @Size(min = 2, max = 150, message = "O nome deve ter entre 2 e 150 caracteres")
        String name,

        @Schema(description = "Tipo do participante: SOCIO ou PROCURADOR", example = "SOCIO")
        @NotNull(message = "O tipo é obrigatório")
        PartnerType type,

        @Schema(description = "Indica se assina pela empresa", example = "true")
        boolean signatory
) {}


