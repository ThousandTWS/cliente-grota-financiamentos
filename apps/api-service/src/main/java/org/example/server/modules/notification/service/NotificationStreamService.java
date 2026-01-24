package org.example.server.modules.notification.service;

import org.example.server.modules.notification.dto.NotificationResponseDTO;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class NotificationStreamService {

    private static final long DEFAULT_TIMEOUT_MS = Duration.ofHours(6).toMillis();

    private final Map<String, List<SseEmitter>> emitters = new ConcurrentHashMap<>();

    public SseEmitter register(String targetType, Long targetId) {
        String key = buildKey(targetType, targetId);
        SseEmitter emitter = new SseEmitter(DEFAULT_TIMEOUT_MS);

        emitters.compute(key, (k, list) -> {
            if (list == null) return new java.util.ArrayList<>(List.of(emitter));
            list.add(emitter);
            return list;
        });

        emitter.onCompletion(() -> removeEmitter(key, emitter));
        emitter.onTimeout(() -> removeEmitter(key, emitter));
        emitter.onError(e -> removeEmitter(key, emitter));

        // Heartbeat to keep connection open
        try {
            emitter.send(SseEmitter.event().name("ping").data("ok"));
        } catch (IOException ignored) {
        }

        return emitter;
    }

    public void broadcast(NotificationResponseDTO notification) {
        dispatch(buildKey(notification.targetType(), notification.targetId()), notification);
        dispatch(buildKey(notification.targetType(), null), notification);
    }

    private void dispatch(String key, NotificationResponseDTO notification) {
        List<SseEmitter> list = emitters.get(key);
        if (list == null || list.isEmpty()) return;

        List<SseEmitter> alive = list.stream().filter(emitter -> {
            try {
                emitter.send(SseEmitter.event().name("notification").data(notification));
                return true;
            } catch (IOException e) {
                return false;
            }
        }).collect(Collectors.toList());

        if (alive.isEmpty()) {
            emitters.remove(key);
        } else {
            emitters.put(key, alive);
        }
    }

    private void removeEmitter(String key, SseEmitter emitter) {
        emitters.computeIfPresent(key, (k, list) -> {
            list.remove(emitter);
            return list.isEmpty() ? null : list;
        });
    }

    private String buildKey(String targetType, Long targetId) {
        return targetType + ":" + (targetId != null ? targetId : "all");
    }
}


