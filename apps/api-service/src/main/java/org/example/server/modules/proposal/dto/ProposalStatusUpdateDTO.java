package org.example.server.modules.proposal.dto;

import org.example.server.modules.proposal.model.ProposalStatus;

public record ProposalStatusUpdateDTO(
        ProposalStatus status,
        String notes,
        String actor,
        String contractNumber
) {
}


