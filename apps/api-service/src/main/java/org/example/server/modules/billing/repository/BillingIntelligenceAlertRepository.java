package org.example.server.modules.billing.repository;

import org.example.server.modules.billing.model.BillingIntelligenceAlert;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BillingIntelligenceAlertRepository extends JpaRepository<BillingIntelligenceAlert, Long> {

    Optional<BillingIntelligenceAlert> findTopByCustomerIdOrderByCreatedAtDesc(String customerId);

    List<BillingIntelligenceAlert> findTop200ByOrderByCreatedAtDesc();
}
