package org.example.server.modules.billing.dto;

import org.example.server.modules.billing.model.BillingStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record BillingContractDetailsDTO(
        Long id,
        String contractNumber,
        Long proposalId,
        BillingStatus status,
        LocalDate paidAt,
        LocalDate startDate,
        BigDecimal financedValue,
        BigDecimal installmentValue,
        Integer installmentsTotal,
        BigDecimal outstandingBalance,
        BigDecimal remainingBalance,
        BillingCustomerDTO customer,
        BillingProfessionalDataDTO professionalData,
        BillingVehicleDTO vehicle,
        BillingDealerDTO dealer,
        List<BillingInstallmentDTO> installments,
        List<BillingOccurrenceDTO> occurrences,
        List<BillingContractSummaryDTO> otherContracts,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}


