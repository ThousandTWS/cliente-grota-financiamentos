package org.example.server.modules.dealer.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.example.server.shared.address.dto.AdminAddressDTO;

import java.util.List;

@Schema(name = "DealerAdminRegistrationRequest", description = "Payload de cadastro completo de lojista via painel admin")
public record DealerAdminRegistrationRequestDTO(
        @Schema(description = "Nome completo do responsável", example = "João da Silva")
        @NotBlank(message = "O nome completo é obrigatório")
        @Size(min = 2, max = 100, message = "O nome completo deve ter entre 2 a 100 caracteres")
        String fullName,

        @Schema(description = "Telefone (apenas dígitos)", example = "11988887777")
        @NotBlank(message = "O telefone é obrigatório")
        String phone,

        @Schema(description = "Nome da empresa usado como login", example = "Auto Center XPTO")
        @NotBlank(message = "A empresa é obrigatória")
        @Size(min = 2, max = 100, message = "O nome da empresa deve ter entre 2 a 100 caracteres")
        String enterprise,

        @Schema(description = "Senha inicial (6 a 8 caracteres)", example = "abc123")
        @NotBlank(message = "A senha é obrigatória")
        @Size(min = 6, max = 8, message = "A senha deve ter entre 6 e 8 caracteres")
        String password,

        @Schema(description = "Razão social da empresa", example = "Auto Center XPTO LTDA")
        @Size(min = 2, max = 255, message = "A razão social deve ter entre 2 e 255 caracteres")
        String razaoSocial,

        @Schema(description = "CNPJ apenas com números", example = "12345678000199")
        @Pattern(regexp = "\\d{14}", message = "O CNPJ deve conter exatamente 14 dígitos numéricos")
        String cnpj,

        @Schema(description = "Endereço completo do lojista")
        @Valid
        AdminAddressDTO address,

        @Schema(description = "Lista de sócios/procuradores", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
        List<@Valid PartnerRequestDTO> partners,

        @Schema(description = "Observações internas sobre o lojista", example = "Cliente indica financiamento de usados.")
        @Size(max = 500, message = "A observação deve ter no máximo 500 caracteres")
        String observation
) {}


