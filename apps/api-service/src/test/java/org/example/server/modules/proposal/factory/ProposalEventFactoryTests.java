package org.example.server.modules.proposal.factory;

import org.example.server.modules.proposal.dto.ProposalEventResponseDTO;
import org.example.server.modules.proposal.model.ProposalStatus;
import org.example.server.modules.proposal.model.Proposal;
import org.example.server.modules.proposal.model.ProposalEvent;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ProposalEventFactoryTests {

    @Test
    void createEventAndResponse() {
        ProposalEventFactory factory = new ProposalEventFactory();
        Proposal proposal = new Proposal();
        proposal.getId();

        ProposalEvent event = factory.create(
                proposal,
                "STATUS_CHANGED",
                ProposalStatus.PENDING,
                ProposalStatus.APPROVED,
                null,
                "Mudança automática",
                "{\"reason\":\"auto\"}"
        );

        assertEquals("system", event.getActor());
        assertEquals(ProposalStatus.PENDING, event.getStatusFrom());
        assertEquals(ProposalStatus.APPROVED, event.getStatusTo());
        assertEquals(proposal, event.getProposal());

        ProposalEventResponseDTO response = factory.toResponse(event);
        assertEquals(event.getId(), response.id());
        assertEquals(event.getActor(), response.actor());
        assertEquals(event.getPayload(), response.payload());
        assertEquals(event.getCreatedAt(), response.createdAt());
    }
}


