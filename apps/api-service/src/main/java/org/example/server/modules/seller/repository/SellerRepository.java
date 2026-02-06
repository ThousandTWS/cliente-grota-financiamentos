package org.example.server.modules.seller.repository;

import org.example.server.modules.seller.model.Seller;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SellerRepository extends JpaRepository<Seller, Long> {
    boolean existsByPhone(String phone);

    boolean existsByCPF(String CPF);

    List<Seller> findByDealerId(Long dealerId);

    java.util.Optional<Seller> findByUserId(Long userId);

    List<Seller> findByDealerIdIn(List<Long> dealerIds);
}
