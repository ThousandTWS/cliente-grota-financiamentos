package org.example.server.modules.user.dto;

import org.example.server.modules.user.model.UserStatus;

import java.time.LocalDateTime;

public record UserResponseDTO(
        Long id,
        String fullName,
        String email,
        UserStatus status,
        String role,
        LocalDateTime createdAt,
        Long dealerId
) {}


