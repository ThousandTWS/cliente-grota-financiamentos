package org.example.server.dto.operator;

import org.example.server.enums.UserStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record OperatorResponseDTO(
        Long id,
        /**
         * Legacy field - use dealerIds for multi-dealer support
         */
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
        /**
         * Only populated when operator is created with auto-generated password.
         * Will be null on subsequent reads.
         */
        String generatedPassword) {
}
