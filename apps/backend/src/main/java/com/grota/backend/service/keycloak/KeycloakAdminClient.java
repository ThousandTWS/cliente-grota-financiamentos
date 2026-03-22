package com.grota.backend.service.keycloak;

import reactor.core.publisher.Mono;

public interface KeycloakAdminClient {
    Mono<KeycloakUserRegistration> registerDealerUser(String fullName, String username, String password);
}
