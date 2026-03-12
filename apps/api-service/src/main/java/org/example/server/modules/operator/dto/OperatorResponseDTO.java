package org.example.server.modules.operator.dto;

import org.example.server.modules.user.model.UserStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record OperatorResponseDTO(
        Long id,

        Long dealerId,
        List<Long> dealerIds,
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
        Boolean canDelete,
        Boolean canChangeProposalStatus,

        String generatedPassword) {
}

