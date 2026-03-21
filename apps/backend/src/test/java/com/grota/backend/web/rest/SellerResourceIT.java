package com.grota.backend.web.rest;

import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.csrf;

import com.grota.backend.IntegrationTest;
import com.grota.backend.domain.FinancingUser;
import com.grota.backend.domain.FinancingUserRole;
import com.grota.backend.domain.Seller;
import com.grota.backend.domain.SellerStatus;
import com.grota.backend.repository.FinancingUserRepository;
import com.grota.backend.repository.SellerRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.MediaType;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.reactive.server.WebTestClient;

@AutoConfigureWebTestClient(timeout = IntegrationTest.DEFAULT_TIMEOUT)
@IntegrationTest
class SellerResourceIT {

    private static final String URI = "/api/v1/grota-financiamentos/sellers";

    @Autowired
    private WebTestClient webTestClient;

    @Autowired
    private SellerRepository sellerRepository;

    @Autowired
    private FinancingUserRepository financingUserRepository;

    @BeforeEach
    void setupCsrf() {
        webTestClient = webTestClient.mutateWith(csrf());
    }

    @AfterEach
    void cleanup() {
        sellerRepository.deleteAll().block();
        financingUserRepository.deleteAll().block();
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void findByIdShouldReturnSeller() {
        Seller seller = new Seller();
        seller.setDealerId(10L);
        seller.setFullName("Vendedor Teste");
        seller.setEmail("seller@grota.com");
        seller.setPhone("11999999999");
        seller.setCpf("12345678901");
        seller.setBirthData(LocalDate.of(1990, 1, 1));
        seller.setStatus(SellerStatus.ATIVO);
        seller.setCreatedAt(Instant.parse("2026-03-21T11:49:16.326Z"));
        seller.setCanView(true);
        seller.setCanCreate(true);
        seller.setCanUpdate(true);
        seller.setCanDelete(true);
        Seller saved = sellerRepository.save(seller).block();

        webTestClient
            .get()
            .uri(URI + "/" + saved.getId())
            .exchange()
            .expectStatus()
            .isOk()
            .expectBody()
            .jsonPath("$.id").isEqualTo(saved.getId())
            .jsonPath("$.dealerId").isEqualTo(10)
            .jsonPath("$.fullName").isEqualTo("Vendedor Teste")
            .jsonPath("$.email").isEqualTo("seller@grota.com")
            .jsonPath("$.phone").isEqualTo("11999999999")
            .jsonPath("$.CPF").isEqualTo("12345678901")
            .jsonPath("$.birthData").isEqualTo("1990-01-01")
            .jsonPath("$.status").isEqualTo("ATIVO")
            .jsonPath("$.canView").isEqualTo(true);
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void createShouldCreateSeller() {
        webTestClient
            .post()
            .uri(URI)
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue("""
                {
                  "dealerId": 10,
                  "fullName": "Seller Novo",
                  "email": "seller-create@grota.com",
                  "phone": "11999999999",
                  "password": "123456",
                  "CPF": "12345678901",
                  "birthData": "1990-01-01",
                  "address": {
                    "street": "Rua A",
                    "number": "100",
                    "complement": "Ap 1",
                    "neighborhood": "Centro",
                    "city": "Sao Paulo",
                    "state": "SP",
                    "zipCode": "01000-000"
                  },
                  "canView": true,
                  "canCreate": true,
                  "canUpdate": true,
                  "canDelete": true
                }
                """)
            .exchange()
            .expectStatus()
            .isCreated()
            .expectBody()
            .jsonPath("$.id").isNumber()
            .jsonPath("$.dealerId").isEqualTo(10)
            .jsonPath("$.fullName").isEqualTo("Seller Novo")
            .jsonPath("$.email").isEqualTo("seller-create@grota.com")
            .jsonPath("$.CPF").isEqualTo("12345678901")
            .jsonPath("$.status").isEqualTo("ATIVO");
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void createShouldReturnConflictWhenEmailAlreadyExists() {
        Seller seller = new Seller();
        seller.setEmail("seller-conflict@grota.com");
        seller.setFullName("Existente");
        seller.setStatus(SellerStatus.ATIVO);
        sellerRepository.save(seller).block();

        webTestClient
            .post()
            .uri(URI)
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue("""
                {
                  "fullName": "Novo",
                  "email": "seller-conflict@grota.com"
                }
                """)
            .exchange()
            .expectStatus()
            .isEqualTo(409);
    }

    @Test
    void createShouldReturnUnauthorizedWhenNotAuthenticated() {
        webTestClient.post().uri(URI).contentType(MediaType.APPLICATION_JSON).bodyValue("{}").exchange().expectStatus().isUnauthorized();
    }

    @Test
    @WithMockUser(authorities = "ROLE_USER")
    void createShouldReturnForbiddenWhenUserIsNotAdmin() {
        webTestClient.post().uri(URI).contentType(MediaType.APPLICATION_JSON).bodyValue("{}").exchange().expectStatus().isForbidden();
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void findAllShouldReturnSellersOrderedAndLimited() {
        for (int i = 0; i < 12; i++) {
            Seller seller = new Seller();
            seller.setDealerId((long) (i % 2 == 0 ? 10 : 20));
            seller.setFullName(String.format("Seller %02d", i));
            seller.setEmail("seller-list-" + i + "@grota.com");
            seller.setStatus(SellerStatus.ATIVO);
            sellerRepository.save(seller).block();
        }

        webTestClient
            .get()
            .uri(URI)
            .exchange()
            .expectStatus()
            .isOk()
            .expectBody()
            .jsonPath("$.length()").isEqualTo(10)
            .jsonPath("$[0].fullName").isEqualTo("Seller 00")
            .jsonPath("$[9].fullName").isEqualTo("Seller 09");
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void findAllShouldFilterByDealerId() {
        Seller sellerA = new Seller();
        sellerA.setDealerId(10L);
        sellerA.setFullName("Dealer 10 Seller");
        sellerA.setEmail("dealer10@grota.com");
        sellerA.setStatus(SellerStatus.ATIVO);

        Seller sellerB = new Seller();
        sellerB.setDealerId(20L);
        sellerB.setFullName("Dealer 20 Seller");
        sellerB.setEmail("dealer20@grota.com");
        sellerB.setStatus(SellerStatus.ATIVO);

        sellerRepository.save(sellerA).block();
        sellerRepository.save(sellerB).block();

        webTestClient
            .get()
            .uri(uriBuilder -> uriBuilder.path(URI).queryParam("dealerId", 10).build())
            .exchange()
            .expectStatus()
            .isOk()
            .expectBody()
            .jsonPath("$.length()").isEqualTo(1)
            .jsonPath("$[0].dealerId").isEqualTo(10);
    }

    @Test
    @WithMockUser(username = "admin-operator-panel@grota.com", authorities = "ROLE_USER")
    void findAllForOperatorPanelShouldReturnAllForAdmin() {
        FinancingUser admin = new FinancingUser();
        admin.setFullName("Admin");
        admin.setEmail("admin-operator-panel@grota.com");
        admin.setPasswordHash("$2a$10$7EqJtq98hPqEX7fNZaFWoOHiA1R8U0S3m2r3Y9Y8R6w9u2j3l4n5K");
        admin.setRole(FinancingUserRole.ADMIN);
        admin.setCreatedBy("system");
        admin.setLastModifiedBy("system");
        admin.setAllowedDealerIds(List.of());
        admin.setAllowedDealersCount(0);
        financingUserRepository.save(admin).block();

        Seller sellerA = new Seller();
        sellerA.setDealerId(10L);
        sellerA.setFullName("Admin Panel A");
        sellerA.setEmail("admin-panel-a@grota.com");
        sellerA.setStatus(SellerStatus.ATIVO);

        Seller sellerB = new Seller();
        sellerB.setDealerId(20L);
        sellerB.setFullName("Admin Panel B");
        sellerB.setEmail("admin-panel-b@grota.com");
        sellerB.setStatus(SellerStatus.ATIVO);

        sellerRepository.save(sellerA).block();
        sellerRepository.save(sellerB).block();

        webTestClient
            .get()
            .uri(URI + "/operator-panel")
            .exchange()
            .expectStatus()
            .isOk()
            .expectBody()
            .jsonPath("$.length()").isEqualTo(2);
    }

    @Test
    @WithMockUser(username = "operador-panel@grota.com", authorities = "ROLE_USER")
    void findAllForOperatorPanelShouldFilterByOperatorDealer() {
        FinancingUser operador = new FinancingUser();
        operador.setFullName("Operador");
        operador.setEmail("operador-panel@grota.com");
        operador.setPasswordHash("$2a$10$7EqJtq98hPqEX7fNZaFWoOHiA1R8U0S3m2r3Y9Y8R6w9u2j3l4n5K");
        operador.setRole(FinancingUserRole.OPERADOR);
        operador.setDealerId(10L);
        operador.setCreatedBy("system");
        operador.setLastModifiedBy("system");
        operador.setAllowedDealerIds(List.of(10L));
        operador.setAllowedDealersCount(1);
        financingUserRepository.save(operador).block();

        Seller sellerA = new Seller();
        sellerA.setDealerId(10L);
        sellerA.setFullName("Dealer 10 Seller");
        sellerA.setEmail("operator-panel-a@grota.com");
        sellerA.setStatus(SellerStatus.ATIVO);

        Seller sellerB = new Seller();
        sellerB.setDealerId(20L);
        sellerB.setFullName("Dealer 20 Seller");
        sellerB.setEmail("operator-panel-b@grota.com");
        sellerB.setStatus(SellerStatus.ATIVO);

        sellerRepository.save(sellerA).block();
        sellerRepository.save(sellerB).block();

        webTestClient
            .get()
            .uri(URI + "/operator-panel")
            .exchange()
            .expectStatus()
            .isOk()
            .expectBody()
            .jsonPath("$.length()").isEqualTo(1)
            .jsonPath("$[0].dealerId").isEqualTo(10);
    }

    @Test
    @WithMockUser(username = "operador-panel-403@grota.com", authorities = "ROLE_USER")
    void findAllForOperatorPanelShouldReturnForbiddenWhenDealerDoesNotMatch() {
        FinancingUser operador = new FinancingUser();
        operador.setFullName("Operador");
        operador.setEmail("operador-panel-403@grota.com");
        operador.setPasswordHash("$2a$10$7EqJtq98hPqEX7fNZaFWoOHiA1R8U0S3m2r3Y9Y8R6w9u2j3l4n5K");
        operador.setRole(FinancingUserRole.OPERADOR);
        operador.setDealerId(10L);
        operador.setCreatedBy("system");
        operador.setLastModifiedBy("system");
        operador.setAllowedDealerIds(List.of(10L));
        operador.setAllowedDealersCount(1);
        financingUserRepository.save(operador).block();

        webTestClient
            .get()
            .uri(uriBuilder -> uriBuilder.path(URI + "/operator-panel").queryParam("dealerId", 20).build())
            .exchange()
            .expectStatus()
            .isForbidden();
    }

    @Test
    void findAllForOperatorPanelShouldReturnUnauthorizedWhenNotAuthenticated() {
        webTestClient.get().uri(URI + "/operator-panel").exchange().expectStatus().isUnauthorized();
    }

    @Test
    @WithMockUser(username = "admin-manager-panel@grota.com", authorities = "ROLE_USER")
    void findAllForManagerPanelShouldReturnAllForAdmin() {
        FinancingUser admin = new FinancingUser();
        admin.setFullName("Admin");
        admin.setEmail("admin-manager-panel@grota.com");
        admin.setPasswordHash("$2a$10$7EqJtq98hPqEX7fNZaFWoOHiA1R8U0S3m2r3Y9Y8R6w9u2j3l4n5K");
        admin.setRole(FinancingUserRole.ADMIN);
        admin.setCreatedBy("system");
        admin.setLastModifiedBy("system");
        admin.setAllowedDealerIds(List.of());
        admin.setAllowedDealersCount(0);
        financingUserRepository.save(admin).block();

        Seller sellerA = new Seller();
        sellerA.setDealerId(10L);
        sellerA.setFullName("Manager Admin A");
        sellerA.setEmail("manager-admin-a@grota.com");
        sellerA.setStatus(SellerStatus.ATIVO);

        Seller sellerB = new Seller();
        sellerB.setDealerId(20L);
        sellerB.setFullName("Manager Admin B");
        sellerB.setEmail("manager-admin-b@grota.com");
        sellerB.setStatus(SellerStatus.ATIVO);

        sellerRepository.save(sellerA).block();
        sellerRepository.save(sellerB).block();

        webTestClient
            .get()
            .uri(URI + "/manager-panel")
            .exchange()
            .expectStatus()
            .isOk()
            .expectBody()
            .jsonPath("$.length()").isEqualTo(2);
    }

    @Test
    @WithMockUser(username = "gestor-panel@grota.com", authorities = "ROLE_USER")
    void findAllForManagerPanelShouldFilterByManagerDealer() {
        FinancingUser gestor = new FinancingUser();
        gestor.setFullName("Gestor");
        gestor.setEmail("gestor-panel@grota.com");
        gestor.setPasswordHash("$2a$10$7EqJtq98hPqEX7fNZaFWoOHiA1R8U0S3m2r3Y9Y8R6w9u2j3l4n5K");
        gestor.setRole(FinancingUserRole.GESTOR);
        gestor.setDealerId(10L);
        gestor.setCreatedBy("system");
        gestor.setLastModifiedBy("system");
        gestor.setAllowedDealerIds(List.of(10L));
        gestor.setAllowedDealersCount(1);
        financingUserRepository.save(gestor).block();

        Seller sellerA = new Seller();
        sellerA.setDealerId(10L);
        sellerA.setFullName("Dealer 10 Seller");
        sellerA.setEmail("manager-panel-a@grota.com");
        sellerA.setStatus(SellerStatus.ATIVO);

        Seller sellerB = new Seller();
        sellerB.setDealerId(20L);
        sellerB.setFullName("Dealer 20 Seller");
        sellerB.setEmail("manager-panel-b@grota.com");
        sellerB.setStatus(SellerStatus.ATIVO);

        sellerRepository.save(sellerA).block();
        sellerRepository.save(sellerB).block();

        webTestClient
            .get()
            .uri(URI + "/manager-panel")
            .exchange()
            .expectStatus()
            .isOk()
            .expectBody()
            .jsonPath("$.length()").isEqualTo(1)
            .jsonPath("$[0].dealerId").isEqualTo(10);
    }

    @Test
    @WithMockUser(username = "gestor-sem-loja@grota.com", authorities = "ROLE_USER")
    void findAllForManagerPanelShouldReturnUnprocessableEntityWhenManagerHasNoDealer() {
        FinancingUser gestor = new FinancingUser();
        gestor.setFullName("Gestor");
        gestor.setEmail("gestor-sem-loja@grota.com");
        gestor.setPasswordHash("$2a$10$7EqJtq98hPqEX7fNZaFWoOHiA1R8U0S3m2r3Y9Y8R6w9u2j3l4n5K");
        gestor.setRole(FinancingUserRole.GESTOR);
        gestor.setCreatedBy("system");
        gestor.setLastModifiedBy("system");
        gestor.setAllowedDealerIds(List.of());
        gestor.setAllowedDealersCount(0);
        financingUserRepository.save(gestor).block();

        webTestClient.get().uri(URI + "/manager-panel").exchange().expectStatus().isEqualTo(422);
    }

    @Test
    @WithMockUser(username = "operador-no-manager-panel@grota.com", authorities = "ROLE_USER")
    void findAllForManagerPanelShouldReturnForbiddenForNonManager() {
        FinancingUser operador = new FinancingUser();
        operador.setFullName("Operador");
        operador.setEmail("operador-no-manager-panel@grota.com");
        operador.setPasswordHash("$2a$10$7EqJtq98hPqEX7fNZaFWoOHiA1R8U0S3m2r3Y9Y8R6w9u2j3l4n5K");
        operador.setRole(FinancingUserRole.OPERADOR);
        operador.setDealerId(10L);
        operador.setCreatedBy("system");
        operador.setLastModifiedBy("system");
        operador.setAllowedDealerIds(List.of(10L));
        operador.setAllowedDealersCount(1);
        financingUserRepository.save(operador).block();

        webTestClient.get().uri(URI + "/manager-panel").exchange().expectStatus().isForbidden();
    }

    @Test
    void findAllForManagerPanelShouldReturnUnauthorizedWhenNotAuthenticated() {
        webTestClient.get().uri(URI + "/manager-panel").exchange().expectStatus().isUnauthorized();
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
    void findAllShouldReturnUnauthorizedWhenNotAuthenticated() {
        webTestClient.get().uri(URI).exchange().expectStatus().isUnauthorized();
    }

    @Test
    @WithMockUser(authorities = "ROLE_USER")
    void findAllShouldReturnForbiddenWhenUserIsNotAdmin() {
        webTestClient.get().uri(URI).exchange().expectStatus().isForbidden();
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void updateShouldUpdateSeller() {
        Seller seller = new Seller();
        seller.setDealerId(10L);
        seller.setFullName("Vendedor Antigo");
        seller.setEmail("seller-update@grota.com");
        seller.setPhone("11999999999");
        seller.setCpf("12345678901");
        seller.setBirthData(LocalDate.of(1990, 1, 1));
        seller.setStatus(SellerStatus.ATIVO);
        seller.setCreatedAt(Instant.parse("2026-03-21T11:49:16.326Z"));
        seller.setCanView(true);
        seller.setCanCreate(true);
        seller.setCanUpdate(true);
        seller.setCanDelete(true);
        Seller saved = sellerRepository.save(seller).block();

        webTestClient
            .put()
            .uri(URI + "/" + saved.getId())
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue("""
                {
                  "dealerId": 20,
                  "fullName": "Vendedor Novo",
                  "email": "seller-novo@grota.com",
                  "phone": "11888888888",
                  "password": "123456",
                  "CPF": "98765432100",
                  "birthData": "1995-05-10",
                  "address": {
                    "street": "Rua A",
                    "number": "100",
                    "complement": "Ap 1",
                    "neighborhood": "Centro",
                    "city": "Sao Paulo",
                    "state": "SP",
                    "zipCode": "01000-000"
                  },
                  "canView": true,
                  "canCreate": false,
                  "canUpdate": true,
                  "canDelete": false
                }
                """)
            .exchange()
            .expectStatus()
            .isOk()
            .expectBody()
            .jsonPath("$.dealerId").isEqualTo(20)
            .jsonPath("$.fullName").isEqualTo("Vendedor Novo")
            .jsonPath("$.email").isEqualTo("seller-novo@grota.com")
            .jsonPath("$.phone").isEqualTo("11888888888")
            .jsonPath("$.CPF").isEqualTo("98765432100")
            .jsonPath("$.birthData").isEqualTo("1995-05-10")
            .jsonPath("$.canCreate").isEqualTo(false)
            .jsonPath("$.canDelete").isEqualTo(false);
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void updateShouldReturnConflictWhenEmailAlreadyExists() {
        Seller seller = new Seller();
        seller.setDealerId(10L);
        seller.setFullName("Vendedor 1");
        seller.setEmail("seller1@grota.com");
        seller.setPhone("11999999999");
        seller.setCpf("12345678901");
        seller.setStatus(SellerStatus.ATIVO);
        seller.setCreatedAt(Instant.parse("2026-03-21T11:49:16.326Z"));

        Seller other = new Seller();
        other.setDealerId(10L);
        other.setFullName("Vendedor 2");
        other.setEmail("seller2@grota.com");
        other.setPhone("11888888888");
        other.setCpf("98765432100");
        other.setStatus(SellerStatus.ATIVO);
        other.setCreatedAt(Instant.parse("2026-03-21T11:49:16.326Z"));

        Seller saved = sellerRepository.save(seller).block();
        sellerRepository.save(other).block();

        webTestClient
            .put()
            .uri(URI + "/" + saved.getId())
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue("""
                {
                  "email": "seller2@grota.com"
                }
                """)
            .exchange()
            .expectStatus()
            .isEqualTo(409);
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void updateShouldReturnNotFound() {
        webTestClient
            .put()
            .uri(URI + "/999999")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue("""
                {
                  "fullName": "Novo Nome"
                }
                """)
            .exchange()
            .expectStatus()
            .isNotFound();
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void updateDealerShouldReassignSeller() {
        Seller seller = new Seller();
        seller.setDealerId(10L);
        seller.setFullName("Vendedor Dealer");
        seller.setEmail("seller-dealer@grota.com");
        seller.setStatus(SellerStatus.ATIVO);
        Seller saved = sellerRepository.save(seller).block();

        webTestClient
            .patch()
            .uri(uriBuilder -> uriBuilder.path(URI + "/" + saved.getId() + "/dealer").queryParam("dealerId", 20).build())
            .exchange()
            .expectStatus()
            .isOk()
            .expectBody()
            .jsonPath("$.id").isEqualTo(saved.getId())
            .jsonPath("$.dealerId").isEqualTo(20);
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void updateDealerShouldReturnNotFound() {
        webTestClient
            .patch()
            .uri(uriBuilder -> uriBuilder.path(URI + "/999999/dealer").queryParam("dealerId", 20).build())
            .exchange()
            .expectStatus()
            .isNotFound();
    }

    @Test
    void updateDealerShouldReturnUnauthorizedWhenNotAuthenticated() {
        webTestClient
            .patch()
            .uri(uriBuilder -> uriBuilder.path(URI + "/1/dealer").queryParam("dealerId", 20).build())
            .exchange()
            .expectStatus()
            .isUnauthorized();
    }

    @Test
    @WithMockUser(authorities = "ROLE_USER")
    void updateDealerShouldReturnForbiddenWhenUserIsNotAdmin() {
        webTestClient
            .patch()
            .uri(uriBuilder -> uriBuilder.path(URI + "/1/dealer").queryParam("dealerId", 20).build())
            .exchange()
            .expectStatus()
            .isForbidden();
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void deleteShouldRemoveSeller() {
        Seller seller = new Seller();
        seller.setDealerId(10L);
        seller.setFullName("Vendedor Delete");
        seller.setEmail("seller-delete@grota.com");
        seller.setStatus(SellerStatus.ATIVO);
        Seller saved = sellerRepository.save(seller).block();

        webTestClient.delete().uri(URI + "/" + saved.getId()).exchange().expectStatus().isNoContent();
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void deleteShouldReturnNotFound() {
        webTestClient.delete().uri(URI + "/999999").exchange().expectStatus().isNotFound();
    }

    @Test
    void deleteShouldReturnUnauthorizedWhenNotAuthenticated() {
        webTestClient.delete().uri(URI + "/1").exchange().expectStatus().isUnauthorized();
    }

    @Test
    @WithMockUser(authorities = "ROLE_USER")
    void deleteShouldReturnForbiddenWhenUserIsNotAdmin() {
        webTestClient.delete().uri(URI + "/1").exchange().expectStatus().isForbidden();
    }
}
