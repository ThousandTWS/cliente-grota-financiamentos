package com.grota.backend.service.dto;

import com.grota.backend.domain.FinancingUserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public record FinancingUserCreateRequestDTO(
    @NotBlank(message = "O nome completo é obrigatório")
    @Size(min = 2, max = 100, message = "O nome completo deve ter entre 2 e 100 caracteres")
    String fullName,
    @NotBlank(message = "O e-mail é obrigatório")
    @Email(message = "E-mail inválido")
    String email,
    @NotBlank(message = "A senha é obrigatória")
    @Size(min = 6, max = 8, message = "A senha deve ter entre 6 e 8 caracteres")
    String password,
    FinancingUserRole role,
    Long dealerId,
    List<Long> allowedDealerIds,
    Boolean canView,
    Boolean canCreate,
    Boolean canUpdate,
    Boolean canDelete,
    Boolean canChangeProposalStatus
) {}
