package org.example.server.modules.proposal.repository;

import org.example.server.modules.proposal.model.ProposalStatus;
import org.example.server.modules.dealer.model.Dealer;
import org.example.server.modules.proposal.model.Proposal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface ProposalRepository extends JpaRepository<Proposal, Long> {
    List<Proposal> findByDealer(Dealer dealer);
    List<Proposal> findByStatus(ProposalStatus status);
    List<Proposal> findByDealerAndStatus(Dealer dealer, ProposalStatus status);

    @Modifying
    @Transactional
    @Query("UPDATE Proposal p SET p.seller = null WHERE p.seller.id = :sellerId")
    void detachSellerFromProposals(@Param("sellerId") Long sellerId);
}


