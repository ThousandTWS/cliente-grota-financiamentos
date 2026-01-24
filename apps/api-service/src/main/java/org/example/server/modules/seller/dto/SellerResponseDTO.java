package org.example.server.modules.seller.dto;

import org.example.server.modules.user.model.UserStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record SellerResponseDTO(
        Long id,
        Long dealerId,
        String fullName,
        String email,
        String phone,
        String CPF,
        LocalDate birthData,
        UserStatus status,
        LocalDateTime createdAt,
        Boolean canView,
        Boolean canCreate,
        Boolean canUpdate,
        Boolean canDelete
) {}


