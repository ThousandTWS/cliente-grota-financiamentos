package org.example.server.modules.notification.factory;

import org.example.server.modules.notification.dto.NotificationRequestDTO;
import org.example.server.modules.notification.dto.NotificationResponseDTO;
import org.example.server.modules.notification.model.Notification;
import org.springframework.stereotype.Component;

@Component
public class NotificationFactory {

    public Notification create(NotificationRequestDTO dto) {
        Notification notification = new Notification();
        notification.setTitle(dto.title());
        notification.setDescription(dto.description());
        notification.setActor(dto.actor());
        notification.setTargetType(dto.targetType());
        notification.setTargetId(dto.targetId());
        notification.setHref(dto.href());
        return notification;
    }

    public NotificationResponseDTO toResponse(Notification notification) {
        return new NotificationResponseDTO(
                notification.getId(),
                notification.getTitle(),
                notification.getDescription(),
                notification.getActor(),
                notification.getTargetType(),
                notification.getTargetId(),
                notification.getHref(),
                notification.isReadFlag(),
                notification.getCreatedAt()
        );
    }
}


