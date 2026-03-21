package com.grota.backend.web.rest;

import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.csrf;

import com.grota.backend.IntegrationTest;
import com.grota.backend.domain.FinancingUser;
import com.grota.backend.domain.FinancingUserRole;
import com.grota.backend.repository.FinancingUserRepository;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.reactive.server.WebTestClient;

@AutoConfigureWebTestClient(timeout = IntegrationTest.DEFAULT_TIMEOUT)
@IntegrationTest
class FinancingUserResourceIT {

    private static final String URI = "/api/v1/grota-financiamentos/users";

    @Autowired
    private WebTestClient webTestClient;

    @Autowired
    private FinancingUserRepository financingUserRepository;

    @BeforeEach
    void setupCsrf() {
        webTestClient = webTestClient.mutateWith(csrf());
    }

    @AfterEach
    void cleanup() {
        financingUserRepository.deleteAll().block();
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void createUser() {
        webTestClient
            .post()
            .uri(URI)
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue("""
                {
                  "fullName": "Maria da Silva",
                  "email": "maria@grota.com",
                  "password": "123456"
                }
                """)
            .exchange()
            .expectStatus()
            .isCreated()
            .expectBody()
            .jsonPath("$.id").isNumber()
            .jsonPath("$.email").isEqualTo("maria@grota.com")
            .jsonPath("$.fullName").isEqualTo("Maria da Silva")
            .jsonPath("$.role").isEqualTo("ADMIN")
            .jsonPath("$.canView").isEqualTo(true)
            .jsonPath("$.canCreate").isEqualTo(true)
            .jsonPath("$.canUpdate").isEqualTo(true)
            .jsonPath("$.canDelete").isEqualTo(true)
            .jsonPath("$.canChangeProposalStatus").isEqualTo(true)
            .jsonPath("$.allowedDealerIds").isArray()
            .jsonPath("$.allowedDealersCount").isEqualTo(0);
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void createUserShouldAllowAdminToCreateOperatorWithDealer() {
        webTestClient
            .post()
            .uri(URI)
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue("""
                {
                  "fullName": "Operador Loja 10",
                  "email": "operador10@grota.com",
                  "password": "123456",
                  "role": "OPERADOR",
                  "dealerId": 10,
                  "canView": true,
                  "canCreate": false,
                  "canUpdate": true,
                  "canDelete": false,
                  "canChangeProposalStatus": false
                }
                """)
            .exchange()
            .expectStatus()
            .isCreated()
            .expectBody()
            .jsonPath("$.email").isEqualTo("operador10@grota.com")
            .jsonPath("$.role").isEqualTo("OPERADOR")
            .jsonPath("$.dealerId").isEqualTo(10)
            .jsonPath("$.allowedDealerIds[0]").isEqualTo(10)
            .jsonPath("$.allowedDealersCount").isEqualTo(1)
            .jsonPath("$.canCreate").isEqualTo(false)
            .jsonPath("$.canDelete").isEqualTo(false)
            .jsonPath("$.canChangeProposalStatus").isEqualTo(false);
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void createUserShouldReturnConflictWhenEmailAlreadyExists() {
        FinancingUser user = new FinancingUser();
        user.setFullName("Usuário Existente");
        user.setEmail("duplicado@grota.com");
        user.setPasswordHash("$2a$10$7EqJtq98hPqEX7fNZaFWoOHiA1R8U0S3m2r3Y9Y8R6w9u2j3l4n5K");
        user.setRole(FinancingUserRole.ADMIN);
        user.setCreatedBy("system");
        user.setLastModifiedBy("system");
        user.setAllowedDealerIds(List.of());
        user.setAllowedDealersCount(0);
        financingUserRepository.save(user).block();

        webTestClient
            .post()
            .uri(URI)
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue("""
                {
                  "fullName": "Outro Usuário",
                  "email": "duplicado@grota.com",
                  "password": "123456"
                }
                """)
            .exchange()
            .expectStatus()
            .isEqualTo(409)
            .expectBody()
            .jsonPath("$.detail").isEqualTo("E-mail já cadastrado");
    }

    @Test
    void createUserShouldReturnUnauthorizedWhenNotAuthenticated() {
        webTestClient
            .post()
            .uri(URI)
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue("""
                {
                  "fullName": "Maria da Silva",
                  "email": "maria@grota.com",
                  "password": "123456"
                }
                """)
            .exchange()
            .expectStatus()
            .isUnauthorized();
    }

    @Test
    @WithMockUser(authorities = "ROLE_USER")
    void createUserShouldReturnForbiddenWhenUserIsNotAdmin() {
        webTestClient
            .post()
            .uri(URI)
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue("""
                {
                  "fullName": "Maria da Silva",
                  "email": "maria@grota.com",
                  "password": "123456"
                }
                """)
            .exchange()
            .expectStatus()
            .isForbidden();
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void findByIdShouldReturnUser() {
        FinancingUser user = new FinancingUser();
        user.setFullName("Usuário Busca");
        user.setEmail("busca@grota.com");
        user.setPasswordHash("$2a$10$7EqJtq98hPqEX7fNZaFWoOHiA1R8U0S3m2r3Y9Y8R6w9u2j3l4n5K");
        user.setRole(FinancingUserRole.ADMIN);
        user.setDealerId(12L);
        user.setCreatedBy("system");
        user.setLastModifiedBy("system");
        user.setAllowedDealerIds(List.of(12L));
        user.setAllowedDealersCount(1);
        FinancingUser saved = financingUserRepository.save(user).block();

        webTestClient
            .get()
            .uri(URI + "/" + saved.getId())
            .exchange()
            .expectStatus()
            .isOk()
            .expectBody()
            .jsonPath("$.id").isEqualTo(saved.getId())
            .jsonPath("$.email").isEqualTo("busca@grota.com")
            .jsonPath("$.fullName").isEqualTo("Usuário Busca")
            .jsonPath("$.dealerId").isEqualTo(12)
            .jsonPath("$.allowedDealerIds[0]").isEqualTo(12)
            .jsonPath("$.allowedDealersCount").isEqualTo(1);
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void findAllShouldReturnUsers() {
        FinancingUser admin = new FinancingUser();
        admin.setFullName("Admin");
        admin.setEmail("admin-list@grota.com");
        admin.setPasswordHash("$2a$10$7EqJtq98hPqEX7fNZaFWoOHiA1R8U0S3m2r3Y9Y8R6w9u2j3l4n5K");
        admin.setRole(FinancingUserRole.ADMIN);
        admin.setCreatedBy("system");
        admin.setLastModifiedBy("system");
        admin.setAllowedDealerIds(List.of());
        admin.setAllowedDealersCount(0);

        FinancingUser gestor = new FinancingUser();
        gestor.setFullName("Gestor");
        gestor.setEmail("gestor-list@grota.com");
        gestor.setPasswordHash("$2a$10$7EqJtq98hPqEX7fNZaFWoOHiA1R8U0S3m2r3Y9Y8R6w9u2j3l4n5K");
        gestor.setRole(FinancingUserRole.GESTOR);
        gestor.setCreatedBy("system");
        gestor.setLastModifiedBy("system");
        gestor.setAllowedDealerIds(List.of());
        gestor.setAllowedDealersCount(0);

        financingUserRepository.save(admin).block();
        financingUserRepository.save(gestor).block();

        webTestClient.get().uri(URI).exchange().expectStatus().isOk().expectBody().jsonPath("$").isArray().jsonPath("$.length()").isEqualTo(2);
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void findAllShouldFilterByRole() {
        FinancingUser admin = new FinancingUser();
        admin.setFullName("Admin");
        admin.setEmail("admin-filter@grota.com");
        admin.setPasswordHash("$2a$10$7EqJtq98hPqEX7fNZaFWoOHiA1R8U0S3m2r3Y9Y8R6w9u2j3l4n5K");
        admin.setRole(FinancingUserRole.ADMIN);
        admin.setCreatedBy("system");
        admin.setLastModifiedBy("system");
        admin.setAllowedDealerIds(List.of());
        admin.setAllowedDealersCount(0);

        FinancingUser gestor = new FinancingUser();
        gestor.setFullName("Gestor");
        gestor.setEmail("gestor-filter@grota.com");
        gestor.setPasswordHash("$2a$10$7EqJtq98hPqEX7fNZaFWoOHiA1R8U0S3m2r3Y9Y8R6w9u2j3l4n5K");
        gestor.setRole(FinancingUserRole.GESTOR);
        gestor.setCreatedBy("system");
        gestor.setLastModifiedBy("system");
        gestor.setAllowedDealerIds(List.of());
        gestor.setAllowedDealersCount(0);

        financingUserRepository.save(admin).block();
        financingUserRepository.save(gestor).block();

        webTestClient
            .get()
            .uri(uriBuilder -> uriBuilder.path(URI).queryParam("role", "GESTOR").build())
            .exchange()
            .expectStatus()
            .isOk()
            .expectBody()
            .jsonPath("$.length()").isEqualTo(1)
            .jsonPath("$[0].role").isEqualTo("GESTOR");
    }

    @Test
    void findAllShouldReturnUnauthorizedWhenNotAuthenticated() {
        webTestClient.get().uri(URI).exchange().expectStatus().isUnauthorized();
    }

    @Test
    @WithMockUser(authorities = "ROLE_USER")
    void findAllShouldReturnForbiddenWhenUserIsNotAdmin() {
        webTestClient.get().uri(URI).exchange().expectStatus().isForbidden();
    }

    @Test
    @WithMockUser(username = "me-get@grota.com", authorities = "ROLE_ADMIN")
    void getMeShouldReturnAuthenticatedUserProfile() {
        FinancingUser user = new FinancingUser();
        user.setFullName("Perfil Atual");
        user.setEmail("me-get@grota.com");
        user.setPasswordHash("$2a$10$7EqJtq98hPqEX7fNZaFWoOHiA1R8U0S3m2r3Y9Y8R6w9u2j3l4n5K");
        user.setRole(FinancingUserRole.ADMIN);
        user.setCreatedBy("system");
        user.setLastModifiedBy("system");
        user.setAllowedDealerIds(List.of());
        user.setAllowedDealersCount(0);
        financingUserRepository.save(user).block();

        webTestClient
            .get()
            .uri(URI + "/me")
            .exchange()
            .expectStatus()
            .isOk()
            .expectBody()
            .jsonPath("$.email").isEqualTo("me-get@grota.com")
            .jsonPath("$.fullName").isEqualTo("Perfil Atual");
    }

    @Test
    @WithMockUser(username = "naoexiste-me@grota.com", authorities = "ROLE_ADMIN")
    void getMeShouldReturnNotFoundWhenAuthenticatedUserIsMissing() {
        webTestClient.get().uri(URI + "/me").exchange().expectStatus().isNotFound();
    }

    @Test
    void getMeShouldReturnUnauthorizedWhenNotAuthenticated() {
        webTestClient.get().uri(URI + "/me").exchange().expectStatus().isUnauthorized();
    }

    @Test
    @WithMockUser(username = "me@grota.com", authorities = "ROLE_ADMIN")
    void updateMeShouldUpdateProfile() {
        FinancingUser user = new FinancingUser();
        user.setFullName("Nome Antigo");
        user.setEmail("me@grota.com");
        user.setPasswordHash("$2a$10$7EqJtq98hPqEX7fNZaFWoOHiA1R8U0S3m2r3Y9Y8R6w9u2j3l4n5K");
        user.setRole(FinancingUserRole.ADMIN);
        user.setCreatedBy("system");
        user.setLastModifiedBy("system");
        user.setAllowedDealerIds(List.of());
        user.setAllowedDealersCount(0);
        financingUserRepository.save(user).block();

        webTestClient
            .put()
            .uri(URI + "/me")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue("""
                {
                  "fullName": "Nome Novo",
                  "email": "me-novo@grota.com"
                }
                """)
            .exchange()
            .expectStatus()
            .isOk()
            .expectBody()
            .jsonPath("$.fullName").isEqualTo("Nome Novo")
            .jsonPath("$.email").isEqualTo("me-novo@grota.com");
    }

    @Test
    @WithMockUser(username = "me@grota.com", authorities = "ROLE_ADMIN")
    void updateMeShouldReturnConflictWhenEmailAlreadyExists() {
        FinancingUser currentUser = new FinancingUser();
        currentUser.setFullName("Atual");
        currentUser.setEmail("me@grota.com");
        currentUser.setPasswordHash("$2a$10$7EqJtq98hPqEX7fNZaFWoOHiA1R8U0S3m2r3Y9Y8R6w9u2j3l4n5K");
        currentUser.setRole(FinancingUserRole.ADMIN);
        currentUser.setCreatedBy("system");
        currentUser.setLastModifiedBy("system");
        currentUser.setAllowedDealerIds(List.of());
        currentUser.setAllowedDealersCount(0);

        FinancingUser otherUser = new FinancingUser();
        otherUser.setFullName("Outro");
        otherUser.setEmail("existente@grota.com");
        otherUser.setPasswordHash("$2a$10$7EqJtq98hPqEX7fNZaFWoOHiA1R8U0S3m2r3Y9Y8R6w9u2j3l4n5K");
        otherUser.setRole(FinancingUserRole.ADMIN);
        otherUser.setCreatedBy("system");
        otherUser.setLastModifiedBy("system");
        otherUser.setAllowedDealerIds(List.of());
        otherUser.setAllowedDealersCount(0);

        financingUserRepository.save(currentUser).block();
        financingUserRepository.save(otherUser).block();

        webTestClient
            .put()
            .uri(URI + "/me")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue("""
                {
                  "fullName": "Nome Novo",
                  "email": "existente@grota.com"
                }
                """)
            .exchange()
            .expectStatus()
            .isEqualTo(409);
    }

    @Test
    @WithMockUser(username = "naoexiste@grota.com", authorities = "ROLE_ADMIN")
    void updateMeShouldReturnNotFoundWhenAuthenticatedUserIsMissing() {
        webTestClient
            .put()
            .uri(URI + "/me")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue("""
                {
                  "fullName": "Nome Novo",
                  "email": "novo@grota.com"
                }
                """)
            .exchange()
            .expectStatus()
            .isNotFound();
    }

    @Test
    void updateMeShouldReturnUnauthorizedWhenNotAuthenticated() {
        webTestClient
            .put()
            .uri(URI + "/me")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue("""
                {
                  "fullName": "Nome Novo",
                  "email": "novo@grota.com"
                }
                """)
            .exchange()
            .expectStatus()
            .isUnauthorized();
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void findByIdShouldReturnNotFound() {
        webTestClient.get().uri(URI + "/999999").exchange().expectStatus().isNotFound();
    }

    @Test
    void findByIdShouldReturnUnauthorizedWhenNotAuthenticated() {
        webTestClient.get().uri(URI + "/1").exchange().expectStatus().isUnauthorized();
    }

    @Test
    @WithMockUser(authorities = "ROLE_USER")
    void findByIdShouldReturnForbiddenWhenUserIsNotAdmin() {
        webTestClient.get().uri(URI + "/1").exchange().expectStatus().isForbidden();
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void updateDealerShouldAssociateUser() {
        FinancingUser user = new FinancingUser();
        user.setFullName("Usuário");
        user.setEmail("usuario@grota.com");
        user.setPasswordHash("$2a$10$7EqJtq98hPqEX7fNZaFWoOHiA1R8U0S3m2r3Y9Y8R6w9u2j3l4n5K");
        user.setRole(FinancingUserRole.ADMIN);
        user.setCreatedBy("system");
        user.setLastModifiedBy("system");
        user.setAllowedDealerIds(List.of());
        user.setAllowedDealersCount(0);
        FinancingUser saved = financingUserRepository.save(user).block();

        webTestClient
            .patch()
            .uri(uriBuilder -> uriBuilder.path(URI + "/{id}/dealer").queryParam("dealerId", 99).build(saved.getId()))
            .exchange()
            .expectStatus()
            .isOk()
            .expectBody()
            .jsonPath("$.dealerId").isEqualTo(99)
            .jsonPath("$.allowedDealerIds[0]").isEqualTo(99)
            .jsonPath("$.allowedDealersCount").isEqualTo(1);
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void updateDealerShouldRemoveAssociation() {
        FinancingUser user = new FinancingUser();
        user.setFullName("Usuário");
        user.setEmail("usuario2@grota.com");
        user.setPasswordHash("$2a$10$7EqJtq98hPqEX7fNZaFWoOHiA1R8U0S3m2r3Y9Y8R6w9u2j3l4n5K");
        user.setRole(FinancingUserRole.ADMIN);
        user.setDealerId(99L);
        user.setCreatedBy("system");
        user.setLastModifiedBy("system");
        user.setAllowedDealerIds(List.of(99L));
        user.setAllowedDealersCount(1);
        FinancingUser saved = financingUserRepository.save(user).block();

        webTestClient
            .patch()
            .uri(URI + "/" + saved.getId() + "/dealer")
            .exchange()
            .expectStatus()
            .isOk()
            .expectBody()
            .jsonPath("$.dealerId").doesNotExist()
            .jsonPath("$.allowedDealerIds").isArray()
            .jsonPath("$.allowedDealersCount").isEqualTo(0);
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void updateDealerShouldReturnNotFound() {
        webTestClient
            .patch()
            .uri(uriBuilder -> uriBuilder.path(URI + "/{id}/dealer").queryParam("dealerId", 99).build(999999))
            .exchange()
            .expectStatus()
            .isNotFound();
    }

    @Test
    void updateDealerShouldReturnUnauthorizedWhenNotAuthenticated() {
        webTestClient.patch().uri(uriBuilder -> uriBuilder.path(URI + "/{id}/dealer").queryParam("dealerId", 99).build(1)).exchange().expectStatus().isUnauthorized();
    }

    @Test
    @WithMockUser(authorities = "ROLE_USER")
    void updateDealerShouldReturnForbiddenWhenUserIsNotAdmin() {
        webTestClient.patch().uri(uriBuilder -> uriBuilder.path(URI + "/{id}/dealer").queryParam("dealerId", 99).build(1)).exchange().expectStatus().isForbidden();
    }
}
