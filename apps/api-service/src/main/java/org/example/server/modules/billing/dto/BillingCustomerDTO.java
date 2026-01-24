package org.example.server.modules.billing.dto;

import java.time.LocalDate;

public record BillingCustomerDTO(
        String name,
        String document,
        LocalDate birthDate,
        String email,
        String phone,
        String address,
        String city,
        String state
) {
}


