package org.example.server.modules.billing.dto;

import java.time.LocalDate;

public record BillingContractUpdateDTO(
        LocalDate paidAt,
        LocalDate startDate
) {
}


