package org.example.server.modules.dealer.dto;

public record DealerMarketplaceSummaryDTO(
        Long id,
        String enterprise,
        String referenceCode,
        String logoUrl,
        String fullName,
        String fullNameEnterprise,
        String phone,
        String city,
        String state,
        long availableVehicles
) {
}
