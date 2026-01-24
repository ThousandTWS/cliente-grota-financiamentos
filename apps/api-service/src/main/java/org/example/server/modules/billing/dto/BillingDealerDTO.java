package org.example.server.modules.billing.dto;

public record BillingDealerDTO(
        Long id,
        String enterprise,
        String fullNameEnterprise,
        String cnpj,
        String phone
) {
}


