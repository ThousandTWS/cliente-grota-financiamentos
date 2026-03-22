package com.grota.backend.web.rest;

import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.csrf;

import com.grota.backend.IntegrationTest;
import com.grota.backend.repository.DealerRepository;
import com.grota.backend.service.keycloak.KeycloakAdminClient;
import com.grota.backend.service.keycloak.KeycloakUserRegistration;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Mono;

@AutoConfigureWebTestClient(timeout = IntegrationTest.DEFAULT_TIMEOUT)
@IntegrationTest
class AuthRegisterResourceIT {

    private static final String URI = "/api/v1/grota-financiamentos/auth/register";

    @Autowired
    private WebTestClient webTestClient;

    @Autowired
    private DealerRepository dealerRepository;

    @MockitoBean
    private KeycloakAdminClient keycloakAdminClient;

    @BeforeEach
    void setupCsrf() {
        webTestClient = webTestClient.mutateWith(csrf());
    }

    @AfterEach
    void cleanup() {
        dealerRepository.deleteAll().block();
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void registerShouldCreateDealerAndProvisionKeycloakUser() {
        when(keycloakAdminClient.registerDealerUser("João da Silva", "11988887777", "abc123"))
            .thenReturn(Mono.just(new KeycloakUserRegistration("keycloak-user-1", "11988887777")));

        webTestClient
            .post()
            .uri(URI)
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(
                """
                {
                  "fullName": "João da Silva",
                  "phone": "11988887777",
                  "enterprise": "Auto Center XPTO",
                  "password": "abc123",
                  "adminRegistration": true
                }
                """
            )
            .exchange()
            .expectStatus()
            .isCreated()
            .expectBody()
            .jsonPath("$.fullName").isEqualTo("João da Silva")
            .jsonPath("$.phone").isEqualTo("11988887777")
            .jsonPath("$.enterprise").isEqualTo("Auto Center XPTO")
            .jsonPath("$.status").isEqualTo("ATIVO")
            .jsonPath("$.referenceCode").isNotEmpty();
    }

    @Test
    void registerShouldReturnConflictWhenPhoneAlreadyExists() {
        when(keycloakAdminClient.registerDealerUser("João da Silva", "11988887777", "abc123"))
            .thenReturn(Mono.just(new KeycloakUserRegistration("keycloak-user-1", "11988887777")));

        webTestClient
            .post()
            .uri(URI)
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(
                """
                {
                  "fullName": "João da Silva",
                  "phone": "11988887777",
                  "enterprise": "Auto Center XPTO",
                  "password": "abc123",
                  "adminRegistration": true
                }
                """
            )
            .exchange()
            .expectStatus()
            .isCreated();

        webTestClient
            .post()
            .uri(URI)
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(
                """
                {
                  "fullName": "Maria Souza",
                  "phone": "11988887777",
                  "enterprise": "Empresa Nova",
                  "password": "abc123",
                  "adminRegistration": false
                }
                """
            )
            .exchange()
            .expectStatus()
            .isEqualTo(409);
    }
}
