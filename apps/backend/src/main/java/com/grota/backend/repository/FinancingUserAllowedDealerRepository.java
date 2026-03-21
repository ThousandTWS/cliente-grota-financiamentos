package com.grota.backend.repository;

import java.util.List;
import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public class FinancingUserAllowedDealerRepository {

    private static final EntityManager.LinkTable LINK_TABLE = new EntityManager.LinkTable(
        "financing_user_allowed_dealer",
        "financing_user_id",
        "dealer_id"
    );

    private final DatabaseClient databaseClient;
    private final EntityManager entityManager;

    public FinancingUserAllowedDealerRepository(DatabaseClient databaseClient, EntityManager entityManager) {
        this.databaseClient = databaseClient;
        this.entityManager = entityManager;
    }

    public Flux<Long> findDealerIdsByFinancingUserId(Long financingUserId) {
        return databaseClient
            .sql(
                """
                SELECT dealer_id
                FROM financing_user_allowed_dealer
                WHERE financing_user_id = :financingUserId
                ORDER BY dealer_id
                """
            )
            .bind("financingUserId", financingUserId)
            .map((row, metadata) -> row.get("dealer_id", Long.class))
            .all();
    }

    public Mono<Void> replaceDealerIds(Long financingUserId, List<Long> dealerIds) {
        return entityManager.updateLinkTable(LINK_TABLE, financingUserId, dealerIds.stream()).then();
    }
}
