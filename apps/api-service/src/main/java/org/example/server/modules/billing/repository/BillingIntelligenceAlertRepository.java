package org.example.server.modules.billing.repository;

import org.example.server.modules.billing.model.BillingIntelligenceAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface BillingIntelligenceAlertRepository extends JpaRepository<BillingIntelligenceAlert, Long> {

    Optional<BillingIntelligenceAlert> findTopByCustomerIdOrderByCreatedAtDesc(String customerId);

    List<BillingIntelligenceAlert> findTop200ByOrderByCreatedAtDesc();

    @Query("""
        select alert
        from BillingIntelligenceAlert alert
        where alert.customerId in :customerIds
          and alert.createdAt = (
            select max(latest.createdAt)
            from BillingIntelligenceAlert latest
            where latest.customerId = alert.customerId
          )
    """)
    List<BillingIntelligenceAlert> findLatestByCustomerIds(
            @Param("customerIds") Collection<String> customerIds
    );
}
