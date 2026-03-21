package com.grota.backend.repository;

import com.grota.backend.domain.FinancingUser;
import com.grota.backend.domain.FinancingUserRole;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface FinancingUserRepository extends R2dbcRepository<FinancingUser, Long> {
    Mono<Boolean> existsByEmailIgnoreCase(String email);

    Flux<FinancingUser> findAllByRole(FinancingUserRole role);

    Mono<FinancingUser> findOneByEmailIgnoreCase(String email);
}
