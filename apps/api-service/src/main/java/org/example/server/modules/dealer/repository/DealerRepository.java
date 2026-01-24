package org.example.server.modules.dealer.repository;

import org.example.server.modules.dealer.model.Dealer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DealerRepository extends JpaRepository<Dealer, Long> {
    boolean existsByPhone(String phone);
    Optional<Dealer> findByUserId(Long id);
    boolean existsByEnterpriseIgnoreCase(String enterprise);
    Optional<Dealer> findByEnterpriseIgnoreCase(String enterprise);
}


