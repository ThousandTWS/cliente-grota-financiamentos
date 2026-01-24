package org.example.server.modules.billing.repository;

import org.example.server.modules.billing.model.BillingContract;
import org.example.server.modules.billing.model.BillingInstallment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BillingInstallmentRepository extends JpaRepository<BillingInstallment, Long> {
    List<BillingInstallment> findByContractOrderByNumberAsc(BillingContract contract);

    Optional<BillingInstallment> findByContractAndNumber(BillingContract contract, Integer number);
}


