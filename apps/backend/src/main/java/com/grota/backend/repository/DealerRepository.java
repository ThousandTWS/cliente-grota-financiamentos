package com.grota.backend.repository;

import com.grota.backend.domain.dealer.Dealer;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface DealerRepository extends R2dbcRepository<Dealer, Long> {
    @Query("SELECT * FROM dealer ORDER BY full_name ASC LIMIT 10")
    Flux<Dealer> findTop10OrderByFullNameAsc();

    Mono<Boolean> existsByCnpj(String cnpj);

    Mono<Boolean> existsByCnpjAndIdNot(String cnpj, Long id);

    Mono<Boolean> existsByPhone(String phone);

    Mono<Boolean> existsByAuthLogin(String authLogin);

    Mono<Boolean> existsByReferenceCode(String referenceCode);

    Mono<Dealer> findOneByCnpj(String cnpj);

    Mono<Dealer> findOneByAuthLogin(String authLogin);
}
