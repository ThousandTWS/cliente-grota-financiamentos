package org.example.server.modules.notification.repository;

import org.example.server.modules.notification.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByTargetTypeOrderByCreatedAtDesc(String targetType);
    List<Notification> findByTargetTypeAndTargetIdOrderByCreatedAtDesc(String targetType, Long targetId);
    long deleteByTargetType(String targetType);
    long deleteByTargetTypeAndTargetId(String targetType, Long targetId);
}

