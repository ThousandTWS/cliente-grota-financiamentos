package org.example.server.modules.billing.repository;

import org.example.server.modules.billing.model.BillingContract;
import org.example.server.modules.billing.model.BillingOccurrence;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BillingOccurrenceRepository extends JpaRepository<BillingOccurrence, Long> {
    List<BillingOccurrence> findByContractOrderByDateDesc(BillingContract contract);
}


