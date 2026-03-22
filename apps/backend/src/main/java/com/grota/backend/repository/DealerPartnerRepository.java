package com.grota.backend.repository;

import com.grota.backend.domain.dealer.DealerPartner;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface DealerPartnerRepository extends R2dbcRepository<DealerPartner, Long> {
    Mono<Void> deleteAllByDealerId(Long dealerId);
}
