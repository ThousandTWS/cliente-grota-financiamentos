package org.example.server.shared.address.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@Schema(name = "AdminAddress", description = "Endereço completo do lojista (opcional)")
public record AdminAddressDTO(
        @Schema(description = "CEP sem máscara", example = "12345678")
        @Pattern(regexp = "\\d{8}", message = "O CEP deve conter exatamente 8 dígitos")
        String zipCode,

        @Schema(description = "Logradouro", example = "Avenida Paulista")
        @Size(min = 2, max = 255, message = "O logradouro deve ter entre 2 e 255 caracteres")
        String street,

        @Schema(description = "Número", example = "1000")
        @Size(max = 20, message = "O número deve ter no máximo 20 caracteres")
        String number,

        @Schema(description = "Complemento", example = "Conjunto 101")
        @Size(max = 255, message = "O complemento deve ter no máximo 255 caracteres")
        String complement,

        @Schema(description = "Bairro", example = "Bela Vista")
        @Size(min = 2, max = 100, message = "O bairro deve ter entre 2 e 100 caracteres")
        String neighborhood,

        @Schema(description = "Cidade", example = "São Paulo")
        @Size(min = 2, max = 100, message = "A cidade deve ter entre 2 e 100 caracteres")
        String city,

        @Schema(description = "UF", example = "SP")
        @Size(min = 2, max = 2, message = "O estado deve ser a sigla com 2 caracteres")
        @Pattern(regexp = "[A-Z]{2}", message = "O estado deve ser uma sigla válida (ex: SP, RJ)")
        String state
) {}


