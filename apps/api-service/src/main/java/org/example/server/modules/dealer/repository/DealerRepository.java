package org.example.server.modules.dealer.repository;

import org.example.server.modules.dealer.model.Dealer;
import org.example.server.modules.user.model.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DealerRepository extends JpaRepository<Dealer, Long> {
    boolean existsByPhone(String phone);
    Optional<Dealer> findByUserId(Long id);
    boolean existsByEnterpriseIgnoreCase(String enterprise);
    Optional<Dealer> findByEnterpriseIgnoreCase(String enterprise);
    List<Dealer> findAllByUser_StatusOrderByEnterpriseAsc(UserStatus status);
}

