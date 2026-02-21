package org.example.server.modules.billing.dto;

import java.time.LocalDateTime;
import java.util.List;

public record BillingIntelligenceSummaryDTO(
        LocalDateTime generatedAt,
        BillingIntelligenceKpisDTO kpis,
        BillingIntelligenceAgingDTO aging,
        List<BillingIntelligenceTitleDTO> titles
) {
}
