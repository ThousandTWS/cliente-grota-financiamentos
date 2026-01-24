package org.example.server.modules.proposal.dto;

import org.example.server.modules.proposal.model.ProposalStatus;

import java.time.LocalDateTime;

public record ProposalEventResponseDTO(
        Long id,
        Long proposalId,
        String type,
        ProposalStatus statusFrom,
        ProposalStatus statusTo,
        String note,
        String actor,
        String payload,
        LocalDateTime createdAt
) {
}


