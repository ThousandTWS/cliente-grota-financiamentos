package org.example.server.repository;

import org.example.server.model.Seller;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SellerRepository extends JpaRepository<Seller, Long> {
    boolean existsByPhone(String phone);

    List<Seller> findByDealerId(Long dealerId);

    java.util.Optional<Seller> findByUserId(Long userId);

    /**
     * Find sellers by multiple dealer IDs (for operator panel).
     */
    List<Seller> findByDealerIdIn(List<Long> dealerIds);
}
