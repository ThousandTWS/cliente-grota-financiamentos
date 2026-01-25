package org.example.server.modules.proposal.dto;

import org.example.server.modules.proposal.model.ProposalStatus;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ProposalStatusUpdateDTO(
        ProposalStatus status,
        String notes,
        String actor,
        String contractNumber,
        BigDecimal financedValue,
        Integer installmentCount,
        BigDecimal installmentValue,
        LocalDate paymentDate,
        LocalDate firstDueDate
) {
}
