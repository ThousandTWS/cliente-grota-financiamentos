package org.example.server.modules.notification.dto;

import java.time.LocalDateTime;

public record NotificationResponseDTO(
        Long id,
        String title,
        String description,
        String actor,
        String targetType,
        Long targetId,
        String href,
        boolean readFlag,
        LocalDateTime createdAt
) {
}


