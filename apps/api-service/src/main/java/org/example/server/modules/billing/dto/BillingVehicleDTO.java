package org.example.server.modules.billing.dto;

public record BillingVehicleDTO(
        String brand,
        String model,
        Integer year,
        String plate,
        String renavam,
        Boolean dutIssued,
        Boolean dutPaid,
        java.time.LocalDate dutPaidDate
) {
}


