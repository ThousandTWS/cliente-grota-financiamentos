package org.example.server.modules.billing.repository;

import org.example.server.modules.billing.model.BillingContract;
import org.example.server.modules.billing.model.BillingInstallment;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface BillingInstallmentRepository extends JpaRepository<BillingInstallment, Long> {
    List<BillingInstallment> findByContractOrderByNumberAsc(BillingContract contract);

    Optional<BillingInstallment> findByContractAndNumber(BillingContract contract, Integer number);

    @Query("select i from BillingInstallment i join fetch i.contract c")
    List<BillingInstallment> findAllWithContract();

    @Query("""
        select i from BillingInstallment i
        join fetch i.contract c
        where c.customerDocument = :customerDocument
          and i.dueDate >= :fromDate
    """)
    List<BillingInstallment> findRecentByCustomerDocument(
            @Param("customerDocument") String customerDocument,
            @Param("fromDate") LocalDate fromDate
    );
}

