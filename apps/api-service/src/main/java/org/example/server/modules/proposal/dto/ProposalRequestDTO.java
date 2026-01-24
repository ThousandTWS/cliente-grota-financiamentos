package org.example.server.modules.proposal.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ProposalRequestDTO(
        Long dealerId,
        Long sellerId,
        String customerName,
        String customerCpf,
        LocalDate customerBirthDate,
        String customerEmail,
        String customerPhone,
        String cnhCategory,
        boolean hasCnh,
        String vehiclePlate,
        String fipeCode,
        BigDecimal fipeValue,
        String vehicleBrand,
        String vehicleModel,
        Integer vehicleYear,
        BigDecimal downPaymentValue,
        BigDecimal financedValue,
        Integer termMonths,
        Boolean vehicle0km,
        String maritalStatus,
        String cep,
        String address,
        String addressNumber,
        String addressComplement,
        String neighborhood,
        String uf,
        String city,
        BigDecimal income,
        BigDecimal otherIncomes,
        String metadata,
        String notes
) {
}


