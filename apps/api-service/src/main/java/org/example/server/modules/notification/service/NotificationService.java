package org.example.server.modules.notification.service;

import org.example.server.modules.notification.dto.NotificationRequestDTO;
import org.example.server.modules.notification.dto.NotificationResponseDTO;
import org.example.server.core.exception.generic.RecordNotFoundException;
import org.example.server.modules.notification.model.Notification;
import org.example.server.modules.notification.repository.NotificationRepository;
import org.example.server.modules.notification.factory.NotificationFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationStreamService notificationStreamService;
    private final NotificationFactory notificationFactory;

    public NotificationService(NotificationRepository notificationRepository, NotificationStreamService notificationStreamService, NotificationFactory notificationFactory) {
        this.notificationRepository = notificationRepository;
        this.notificationStreamService = notificationStreamService;
        this.notificationFactory = notificationFactory;
    }

    @Transactional
    public NotificationResponseDTO create(NotificationRequestDTO dto) {
        Notification notification = notificationFactory.create(dto);
        NotificationResponseDTO response = notificationFactory.toResponse(notificationRepository.save(notification));

        // Dispara em tempo real para os assinantes SSE
        notificationStreamService.broadcast(response);

        return response;
    }

    @Transactional(readOnly = true)
    public java.util.List<NotificationResponseDTO> listByTarget(String targetType, Long targetId) {
        java.util.List<Notification> list;
        if (targetId != null) {
            list = notificationRepository.findByTargetTypeAndTargetIdOrderByCreatedAtDesc(targetType, targetId);
        } else {
            list = notificationRepository.findByTargetTypeOrderByCreatedAtDesc(targetType);
        }
        return list.stream().map(notificationFactory::toResponse).toList();
    }

    @Transactional
    public void markAsRead(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException("Notificação não encontrada"));
        notification.setReadFlag(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void delete(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException("Notificação não encontrada"));
        notificationRepository.delete(notification);
    }

    @Transactional
    public long clearByTarget(String targetType, Long targetId) {
        if (targetId != null) {
            return notificationRepository.deleteByTargetTypeAndTargetId(targetType, targetId);
        }
        return notificationRepository.deleteByTargetType(targetType);
    }

}


