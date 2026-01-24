package org.example.server.modules.proposal.repository;

import org.example.server.modules.proposal.model.Proposal;
import org.example.server.modules.proposal.model.ProposalEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProposalEventRepository extends JpaRepository<ProposalEvent, Long> {
    List<ProposalEvent> findByProposalOrderByCreatedAtAsc(Proposal proposal);
    void deleteAllByProposal(Proposal proposal);
    void deleteAllByProposalIn(List<Proposal> proposals);
}


