package com.grota.backend.service.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

public record DealerAdminRegisterRequestDTO(
    @NotBlank(message = "Nome completo é obrigatório")
    String fullName,
    @NotBlank(message = "Telefone é obrigatório")
    String phone,
    @NotBlank(message = "Nome da empresa é obrigatório")
    String enterprise,
    @NotBlank(message = "Senha é obrigatória")
    @Size(min = 6, max = 100, message = "A senha deve ter entre 6 e 100 caracteres")
    String password,
    @NotBlank(message = "Razão social é obrigatória")
    String razaoSocial,
    @NotBlank(message = "CNPJ é obrigatório")
    String cnpj,
    @Valid
    AddressDTO address,
    @Valid
    @NotEmpty(message = "Ao menos um sócio é obrigatório")
    List<DealerPartnerRequestDTO> partners,
    String observation
) {}
