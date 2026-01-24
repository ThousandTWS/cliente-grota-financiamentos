package org.example.server.modules.proposal.dto;

import org.example.server.modules.proposal.model.ProposalStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record ProposalResponseDTO(
        Long id,
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
        ProposalStatus status,
        String notes,
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
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}


