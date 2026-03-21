package com.grota.backend.repository;

import com.grota.backend.domain.Seller;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface SellerRepository extends R2dbcRepository<Seller, Long> {
    Mono<Boolean> existsByEmailIgnoreCase(String email);

    Mono<Boolean> existsByCpf(String cpf);

    Mono<Boolean> existsByPhone(String phone);

    Mono<Boolean> existsByEmailIgnoreCaseAndIdNot(String email, Long id);

    Mono<Boolean> existsByCpfAndIdNot(String cpf, Long id);

    Mono<Boolean> existsByPhoneAndIdNot(String phone, Long id);

    Flux<Seller> findAllByDealerIdOrderByFullNameAsc(Long dealerId);

    Flux<Seller> findAllByDealerIdInOrderByFullNameAsc(Iterable<Long> dealerIds);

    Flux<Seller> findAllByOrderByFullNameAsc();
}
