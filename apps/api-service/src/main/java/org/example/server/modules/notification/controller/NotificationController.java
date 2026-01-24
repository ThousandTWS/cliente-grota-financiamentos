package org.example.server.modules.notification.controller;

import jakarta.validation.Valid;
import org.example.server.modules.notification.dto.NotificationRequestDTO;
import org.example.server.modules.notification.dto.NotificationResponseDTO;
import org.example.server.modules.notification.service.NotificationService;
import org.example.server.modules.notification.service.NotificationStreamService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/v1/grota-financiamentos/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final NotificationStreamService notificationStreamService;

    public NotificationController(NotificationService notificationService, NotificationStreamService notificationStreamService) {
        this.notificationService = notificationService;
        this.notificationStreamService = notificationStreamService;
    }

    @PostMapping
    public ResponseEntity<NotificationResponseDTO> create(@Valid @RequestBody NotificationRequestDTO dto) {
        return ResponseEntity.ok(notificationService.create(dto));
    }

    @GetMapping
    public ResponseEntity<java.util.List<NotificationResponseDTO>> list(
            @RequestParam String targetType,
            @RequestParam(required = false) Long targetId
    ) {
        return ResponseEntity.ok(notificationService.listByTarget(targetType, targetId));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping(value = "/stream", produces = "text/event-stream")
    public SseEmitter stream(
            @RequestParam String targetType,
            @RequestParam(required = false) Long targetId
    ) {
        return notificationStreamService.register(targetType, targetId);
    }
}


