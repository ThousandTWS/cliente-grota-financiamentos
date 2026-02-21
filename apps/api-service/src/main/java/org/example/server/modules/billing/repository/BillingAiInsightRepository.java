package org.example.server.modules.billing.repository;

import org.example.server.modules.billing.model.BillingAiInsight;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface BillingAiInsightRepository extends JpaRepository<BillingAiInsight, Long> {

    Optional<BillingAiInsight> findFirstByTitleIdAndCustomerIdAndCreatedAtAfterOrderByCreatedAtDesc(
            String titleId,
            String customerId,
            LocalDateTime createdAt
    );

    Optional<BillingAiInsight> findTopByTitleIdAndCustomerIdOrderByCreatedAtDesc(
            String titleId,
            String customerId
    );
}
