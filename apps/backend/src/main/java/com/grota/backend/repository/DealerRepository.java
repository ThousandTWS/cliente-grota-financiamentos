package com.grota.backend.repository;

import com.grota.backend.domain.Dealer;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DealerRepository extends R2dbcRepository<Dealer, Long> {}
