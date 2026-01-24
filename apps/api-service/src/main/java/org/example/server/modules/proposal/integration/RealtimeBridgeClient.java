package org.example.server.modules.proposal.integration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Component
public class RealtimeBridgeClient {

    private static final Logger LOGGER = LoggerFactory.getLogger(RealtimeBridgeClient.class);

    private final RestTemplate restTemplate = new RestTemplate();
    private final String broadcastUrl;

    public RealtimeBridgeClient(
            @Value("${realtime.bridge.url:https://websocket-production-6330.up.railway.app/broadcast}") String broadcastUrl
    ) {
        this.broadcastUrl = broadcastUrl;
    }

    public void publish(String event, Object payload, String channel, String sender) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("event", event);
            body.put("payload", payload);
            body.put("channel", channel);
            body.put("sender", sender);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(broadcastUrl, request, String.class);
            if (!response.getStatusCode().is2xxSuccessful()) {
                LOGGER.warn("Realtime publish failed with status {} for event {}", response.getStatusCode(), event);
            }
        } catch (Exception ex) {
            LOGGER.warn("Failed to publish realtime event {}: {}", event, ex.getMessage());
        }
    }
}


