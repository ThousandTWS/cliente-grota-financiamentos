package com.grota.backend.service.dto;

import com.grota.backend.domain.dealer.DealerPartnerType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record DealerPartnerRequestDTO(
    @NotBlank(message = "CPF do sócio é obrigatório")
    String cpf,
    @NotBlank(message = "Nome do sócio é obrigatório")
    String name,
    @NotNull(message = "Tipo do sócio é obrigatório")
    DealerPartnerType type,
    @NotNull(message = "Campo signatory é obrigatório")
    Boolean signatory
) {}
