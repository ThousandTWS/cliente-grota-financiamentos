package org.example.server.modules.notification.dto;

public record NotificationRequestDTO(
        String title,
        String description,
        String actor,
        String targetType,
        Long targetId,
        String href
) {
}


