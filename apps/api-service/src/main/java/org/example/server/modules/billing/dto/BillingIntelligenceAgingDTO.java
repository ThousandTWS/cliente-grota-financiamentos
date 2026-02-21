package org.example.server.modules.billing.dto;

public record BillingIntelligenceAgingDTO(
        long bucket0To7,
        long bucket8To15,
        long bucket16To30,
        long bucket31To60,
        long bucket61Plus
) {
}
