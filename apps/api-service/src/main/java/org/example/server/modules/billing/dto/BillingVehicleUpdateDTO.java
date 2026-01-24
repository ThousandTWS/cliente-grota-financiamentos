package org.example.server.modules.billing.dto;

public record BillingVehicleUpdateDTO(
        String plate,
        String renavam,
        Boolean dutIssued,
        Boolean dutPaid,
        java.time.LocalDate dutPaidDate
) {
}


