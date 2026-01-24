package org.example.server.modules.notification.factory;

import org.example.server.modules.notification.dto.NotificationRequestDTO;
import org.example.server.modules.notification.dto.NotificationResponseDTO;
import org.example.server.modules.notification.model.Notification;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class NotificationFactoryTests {

    @Test
    void createsEntityAndResponseWithSamePayload() {
        NotificationFactory factory = new NotificationFactory();
        NotificationRequestDTO request = new NotificationRequestDTO(
                "Título do evento",
                "Descrição detalhada",
                "Sistema",
                "ADMIN",
                42L,
                "/painel"
        );

        Notification entity = factory.create(request);

        NotificationResponseDTO response = factory.toResponse(entity);

        assertEquals(entity.getId(), response.id());
        assertEquals(entity.getTitle(), response.title());
        assertEquals(entity.getDescription(), response.description());
        assertEquals(entity.getActor(), response.actor());
        assertEquals(entity.getTargetType(), response.targetType());
        assertEquals(entity.getTargetId(), response.targetId());
        assertEquals(entity.getHref(), response.href());
    }
}


