package org.example.server.modules.dealer.dto;

import org.example.server.modules.user.model.UserStatus;

public record DealerRegistrationResponseDTO(
        Long id,
        String fullName,
        String razaoSocial,
        String cnpj,
        String referenceCode,
        String phone,
        String enterprise,
        String logoUrl,
        UserStatus status,
        java.time.LocalDateTime createdAt
){} 


