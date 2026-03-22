package com.grota.backend.web.rest;

import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.csrf;
import static org.mockito.Mockito.when;

import com.grota.backend.IntegrationTest;
import com.grota.backend.domain.dealer.Dealer;
import com.grota.backend.domain.dealer.DealerStatus;
import com.grota.backend.repository.DealerPartnerRepository;
import com.grota.backend.repository.DealerRepository;
import com.grota.backend.service.cloudinary.DealerDocumentCloudinaryClient;
import com.grota.backend.service.dto.DealerDocumentResponseDTO;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Flux;

@AutoConfigureWebTestClient(timeout = IntegrationTest.DEFAULT_TIMEOUT)
@IntegrationTest
class DealerResourceIT {

    private static final String URI = "/api/v1/grota-financiamentos/dealers";

    @Autowired
    private WebTestClient webTestClient;

    @Autowired
    private DealerRepository dealerRepository;

    @Autowired
    private DealerPartnerRepository dealerPartnerRepository;

    @MockitoBean
    private DealerDocumentCloudinaryClient dealerDocumentCloudinaryClient;

    @BeforeEach
    void setupCsrf() {
        webTestClient = webTestClient.mutateWith(csrf());
    }

    @AfterEach
    void cleanup() {
        dealerPartnerRepository.deleteAll().block();
        dealerRepository.deleteAll().block();
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void listDealersShouldReturnTop10OrderedByFullName() {
        for (int i = 12; i >= 1; i--) {
            Dealer dealer = new Dealer();
            dealer.setName("Dealer " + i);
            dealer.setActive(true);
            dealer.setFullName(String.format("Dealer %02d", i));
            dealer.setEnterprise("Empresa " + i);
            dealer.setRazaoSocial("Razao " + i);
            dealer.setPhone("119999900" + String.format("%02d", i));
            dealer.setCnpj("1234567800" + String.format("%04d", i));
            dealer.setReferenceCode("DLR-LST" + String.format("%03d", i));
            dealer.setStatus(DealerStatus.ATIVO);
            dealer.setCreatedAt(Instant.now());
            dealerRepository.save(dealer).block();
        }

        webTestClient
            .get()
            .uri(URI)
            .exchange()
            .expectStatus()
            .isOk()
            .expectBody()
            .jsonPath("$.length()").isEqualTo(10)
            .jsonPath("$[0].fullName").isEqualTo("Dealer 01")
            .jsonPath("$[9].fullName").isEqualTo("Dealer 10");
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void getDealerByIdShouldReturnDealer() {
        Dealer dealer = new Dealer();
        dealer.setName("Dealer XPTO");
        dealer.setActive(true);
        dealer.setFullName("João da Silva");
        dealer.setEnterprise("Auto Center XPTO");
        dealer.setRazaoSocial("Auto Center XPTO LTDA");
        dealer.setPhone("11988887777");
        dealer.setCnpj("12345678000199");
        dealer.setReferenceCode("DLR-GET001");
        dealer.setStatus(DealerStatus.ATIVO);
        dealer.setCreatedAt(Instant.now());
        Dealer savedDealer = dealerRepository.save(dealer).block();

        webTestClient
            .get()
            .uri(URI + "/" + savedDealer.getId())
            .exchange()
            .expectStatus()
            .isOk()
            .expectBody()
            .jsonPath("$.id").isEqualTo(savedDealer.getId().intValue())
            .jsonPath("$.fullName").isEqualTo("João da Silva")
            .jsonPath("$.enterprise").isEqualTo("Auto Center XPTO")
            .jsonPath("$.cnpj").isEqualTo("12345678000199");
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void getDealerDetailsByIdShouldReturnDealerDetails() {
        Dealer dealer = new Dealer();
        dealer.setName("Dealer XPTO");
        dealer.setActive(true);
        dealer.setFullName("João da Silva");
        dealer.setEnterprise("Auto Center XPTO");
        dealer.setRazaoSocial("Auto Center XPTO LTDA");
        dealer.setPhone("11988887777");
        dealer.setCnpj("12345678000199");
        dealer.setReferenceCode("DLR-DET001");
        dealer.setStatus(DealerStatus.ATIVO);
        dealer.setBirthData(LocalDate.of(2026, 3, 21));
        dealer.setStreet("Avenida Paulista");
        dealer.setNumber("1000");
        dealer.setComplement("Conjunto 101");
        dealer.setNeighborhood("Bela Vista");
        dealer.setCity("São Paulo");
        dealer.setState("SP");
        dealer.setZipCode("12345678");
        dealer.setCreatedAt(Instant.now());
        Dealer savedDealer = dealerRepository.save(dealer).block();

        webTestClient
            .get()
            .uri(URI + "/" + savedDealer.getId() + "/details")
            .exchange()
            .expectStatus()
            .isOk()
            .expectBody()
            .jsonPath("$.id").isEqualTo(savedDealer.getId().intValue())
            .jsonPath("$.fullName").isEqualTo("João da Silva")
            .jsonPath("$.phone").isEqualTo("11988887777")
            .jsonPath("$.enterprise").isEqualTo("Auto Center XPTO")
            .jsonPath("$.fullNameEnterprise").isEqualTo("Auto Center XPTO")
            .jsonPath("$.birthData").isEqualTo("2026-03-21")
            .jsonPath("$.cnpj").isEqualTo("12345678000199")
            .jsonPath("$.address.street").isEqualTo("Avenida Paulista")
            .jsonPath("$.address.number").isEqualTo("1000");
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void getDealerDocumentsShouldReturnDocuments() {
        Dealer dealer = new Dealer();
        dealer.setName("Dealer Docs");
        dealer.setActive(true);
        dealer.setFullName("Dealer Docs");
        dealer.setEnterprise("Empresa Docs");
        dealer.setRazaoSocial("Razao Docs");
        dealer.setPhone("11988887755");
        dealer.setCnpj("12345678000155");
        dealer.setReferenceCode("DLR-DOC001");
        dealer.setStatus(DealerStatus.ATIVO);
        dealer.setCreatedAt(Instant.now());
        Dealer savedDealer = dealerRepository.save(dealer).block();

        when(dealerDocumentCloudinaryClient.listDealerDocuments(savedDealer.getId()))
            .thenReturn(
                Flux.fromIterable(
                    List.of(
                        new DealerDocumentResponseDTO(
                            1L,
                            "RG_FRENTE",
                            "image/jpeg",
                            12345L,
                            "PENDENTE",
                            "Aguardando análise",
                            Instant.parse("2026-03-21T18:46:25.077Z"),
                            Instant.parse("2026-03-21T18:46:25.077Z")
                        )
                    )
                )
            );

        webTestClient
            .get()
            .uri(URI + "/" + savedDealer.getId() + "/documents")
            .exchange()
            .expectStatus()
            .isOk()
            .expectBody()
            .jsonPath("$.length()").isEqualTo(1)
            .jsonPath("$[0].documentType").isEqualTo("RG_FRENTE")
            .jsonPath("$[0].contentType").isEqualTo("image/jpeg")
            .jsonPath("$[0].reviewStatus").isEqualTo("PENDENTE");
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void getDealerDocumentsShouldReturnNotFoundWhenDealerDoesNotExist() {
        webTestClient.get().uri(URI + "/999999/documents").exchange().expectStatus().isNotFound();
    }

    @Test
    void getDealerDocumentsShouldReturnUnauthorizedWhenNotAuthenticated() {
        webTestClient.get().uri(URI + "/1/documents").exchange().expectStatus().isUnauthorized();
    }

    @Test
    @WithMockUser(authorities = "ROLE_USER")
    void getDealerDocumentsShouldReturnForbiddenWhenUserIsNotAdmin() {
        webTestClient.get().uri(URI + "/1/documents").exchange().expectStatus().isForbidden();
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void getDealerDetailsByIdShouldReturnNotFoundWhenDealerDoesNotExist() {
        webTestClient.get().uri(URI + "/999999/details").exchange().expectStatus().isNotFound();
    }

    @Test
    void getDealerDetailsByIdShouldReturnUnauthorizedWhenNotAuthenticated() {
        webTestClient.get().uri(URI + "/1/details").exchange().expectStatus().isUnauthorized();
    }

    @Test
    @WithMockUser(authorities = "ROLE_USER")
    void getDealerDetailsByIdShouldReturnForbiddenWhenUserIsNotAdmin() {
        webTestClient.get().uri(URI + "/1/details").exchange().expectStatus().isForbidden();
    }

    @Test
    @WithMockUser(username = "12345678000199", authorities = "ROLE_USER")
    void getCurrentDealerDetailsShouldReturnDealerDetails() {
        Dealer dealer = new Dealer();
        dealer.setName("Dealer Me");
        dealer.setActive(true);
        dealer.setFullName("João da Silva");
        dealer.setEnterprise("Auto Center XPTO");
        dealer.setRazaoSocial("Auto Center XPTO LTDA");
        dealer.setPhone("11988887777");
        dealer.setCnpj("12345678000199");
        dealer.setReferenceCode("DLR-ME001");
        dealer.setStatus(DealerStatus.ATIVO);
        dealer.setBirthData(LocalDate.of(2026, 3, 21));
        dealer.setStreet("Avenida Paulista");
        dealer.setNumber("1000");
        dealer.setComplement("Conjunto 101");
        dealer.setNeighborhood("Bela Vista");
        dealer.setCity("São Paulo");
        dealer.setState("SP");
        dealer.setZipCode("12345678");
        dealer.setCreatedAt(Instant.now());
        dealerRepository.save(dealer).block();

        webTestClient
            .get()
            .uri(URI + "/me/details")
            .exchange()
            .expectStatus()
            .isOk()
            .expectBody()
            .jsonPath("$.fullName").isEqualTo("João da Silva")
            .jsonPath("$.cnpj").isEqualTo("12345678000199")
            .jsonPath("$.address.street").isEqualTo("Avenida Paulista");
    }

    @Test
    @WithMockUser(username = "nao-existe", authorities = "ROLE_USER")
    void getCurrentDealerDetailsShouldReturnNotFoundWhenDealerDoesNotExist() {
        webTestClient.get().uri(URI + "/me/details").exchange().expectStatus().isNotFound();
    }

    @Test
    void getCurrentDealerDetailsShouldReturnUnauthorizedWhenNotAuthenticated() {
        webTestClient.get().uri(URI + "/me/details").exchange().expectStatus().isUnauthorized();
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void getCurrentDealerDetailsShouldReturnForbiddenWhenUserIsNotDealer() {
        webTestClient.get().uri(URI + "/me/details").exchange().expectStatus().isForbidden();
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void getDealerByIdShouldReturnNotFoundWhenDealerDoesNotExist() {
        webTestClient.get().uri(URI + "/999999").exchange().expectStatus().isNotFound();
    }

    @Test
    void getDealerByIdShouldReturnUnauthorizedWhenNotAuthenticated() {
        webTestClient.get().uri(URI + "/1").exchange().expectStatus().isUnauthorized();
    }

    @Test
    @WithMockUser(authorities = "ROLE_USER")
    void getDealerByIdShouldReturnForbiddenWhenUserIsNotAdmin() {
        webTestClient.get().uri(URI + "/1").exchange().expectStatus().isForbidden();
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void deleteDealerByIdShouldDeleteDealer() {
        Dealer dealer = new Dealer();
        dealer.setName("Dealer Delete");
        dealer.setActive(true);
        dealer.setFullName("Dealer Delete");
        dealer.setEnterprise("Empresa Delete");
        dealer.setRazaoSocial("Razao Delete");
        dealer.setPhone("11988887766");
        dealer.setCnpj("12345678000999");
        dealer.setReferenceCode("DLR-DEL001");
        dealer.setStatus(DealerStatus.ATIVO);
        dealer.setCreatedAt(Instant.now());
        Dealer savedDealer = dealerRepository.save(dealer).block();

        webTestClient.delete().uri(URI + "/" + savedDealer.getId()).exchange().expectStatus().isOk();
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void deleteDealerByIdShouldReturnNotFoundWhenDealerDoesNotExist() {
        webTestClient.delete().uri(URI + "/999999").exchange().expectStatus().isNotFound();
    }

    @Test
    void deleteDealerByIdShouldReturnUnauthorizedWhenNotAuthenticated() {
        webTestClient.delete().uri(URI + "/1").exchange().expectStatus().isUnauthorized();
    }

    @Test
    @WithMockUser(authorities = "ROLE_USER")
    void deleteDealerByIdShouldReturnForbiddenWhenUserIsNotAdmin() {
        webTestClient.delete().uri(URI + "/1").exchange().expectStatus().isForbidden();
    }

    @Test
    void listDealersShouldReturnUnauthorizedWhenNotAuthenticated() {
        webTestClient.get().uri(URI).exchange().expectStatus().isUnauthorized();
    }

    @Test
    @WithMockUser(authorities = "ROLE_USER")
    void listDealersShouldReturnForbiddenWhenUserIsNotAdmin() {
        webTestClient.get().uri(URI).exchange().expectStatus().isForbidden();
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void adminRegisterShouldCreateDealer() {
        webTestClient
            .post()
            .uri(URI + "/admin-register")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(
                """
                {
                  "fullName": "João da Silva",
                  "phone": "11988887777",
                  "enterprise": "Auto Center XPTO",
                  "password": "abc123",
                  "razaoSocial": "Auto Center XPTO LTDA",
                  "cnpj": "12345678000199",
                  "address": {
                    "zipCode": "12345678",
                    "street": "Avenida Paulista",
                    "number": "1000",
                    "complement": "Conjunto 101",
                    "neighborhood": "Bela Vista",
                    "city": "São Paulo",
                    "state": "SP"
                  },
                  "partners": [
                    {
                      "cpf": "12345678901",
                      "name": "Maria Souza",
                      "type": "SOCIO",
                      "signatory": true
                    }
                  ],
                  "observation": "Cliente indica financiamento de usados."
                }
                """
            )
            .exchange()
            .expectStatus()
            .isCreated()
            .expectBody()
            .jsonPath("$.id").isNumber()
            .jsonPath("$.fullName").isEqualTo("João da Silva")
            .jsonPath("$.razaoSocial").isEqualTo("Auto Center XPTO LTDA")
            .jsonPath("$.cnpj").isEqualTo("12345678000199")
            .jsonPath("$.phone").isEqualTo("11988887777")
            .jsonPath("$.enterprise").isEqualTo("Auto Center XPTO")
            .jsonPath("$.referenceCode").isNotEmpty()
            .jsonPath("$.status").isEqualTo("ATIVO");
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void adminRegisterShouldReturnConflictWhenCnpjAlreadyExists() {
        Dealer dealer = new Dealer();
        dealer.setName("Dealer Existente");
        dealer.setActive(true);
        dealer.setFullName("Existente");
        dealer.setPhone("11988887777");
        dealer.setEnterprise("Auto Center XPTO");
        dealer.setRazaoSocial("Auto Center XPTO LTDA");
        dealer.setCnpj("12345678000199");
        dealer.setReferenceCode("DLR-EXIST01");
        dealer.setStatus(DealerStatus.ATIVO);
        dealer.setCreatedAt(Instant.now());
        dealerRepository.save(dealer).block();

        webTestClient
            .post()
            .uri(URI + "/admin-register")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(
                """
                {
                  "fullName": "João da Silva",
                  "phone": "11977776666",
                  "enterprise": "Auto Center XPTO",
                  "password": "abc123",
                  "razaoSocial": "Auto Center XPTO LTDA",
                  "cnpj": "12345678000199",
                  "partners": [
                    {
                      "cpf": "12345678901",
                      "name": "Maria Souza",
                      "type": "SOCIO",
                      "signatory": true
                    }
                  ]
                }
                """
            )
            .exchange()
            .expectStatus()
            .isEqualTo(409);
    }

    @Test
    void adminRegisterShouldReturnUnauthorizedWhenNotAuthenticated() {
        webTestClient
            .post()
            .uri(URI + "/admin-register")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue("{}")
            .exchange()
            .expectStatus()
            .isUnauthorized();
    }

    @Test
    @WithMockUser(authorities = "ROLE_USER")
    void adminRegisterShouldReturnForbiddenWhenUserIsNotAdmin() {
        webTestClient
            .post()
            .uri(URI + "/admin-register")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue("{}")
            .exchange()
            .expectStatus()
            .isForbidden();
    }

    @Test
    @WithMockUser(username = "37425972492559", authorities = "ROLE_USER")
    void updateProfileShouldUpdateCurrentDealer() {
        Dealer dealer = new Dealer();
        dealer.setName("Empresa Antiga");
        dealer.setActive(true);
        dealer.setEnterprise("Empresa Antiga");
        dealer.setCnpj("37425972492559");
        dealer.setBirthData(LocalDate.of(1990, 1, 1));
        dealer.setStreet("Rua A");
        dealer.setNumber("10");
        dealer.setNeighborhood("Centro");
        dealer.setCity("São Paulo");
        dealer.setState("SP");
        dealer.setZipCode("01000000");
        dealer.setReferenceCode("DLR-UPD001");
        dealer.setStatus(DealerStatus.ATIVO);
        dealer.setCreatedAt(Instant.now());
        dealerRepository.save(dealer).block();

        webTestClient
            .patch()
            .uri(URI + "/profile/update")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(
                """
                {
                  "fullNameEnterprise": "Empresa Nova",
                  "birthData": "2026-03-21",
                  "cnpj": "37425972492559",
                  "address": {
                    "street": "Rua Nova",
                    "number": "200",
                    "complement": "Sala 4",
                    "neighborhood": "Centro",
                    "city": "Campinas",
                    "state": "SP",
                    "zipCode": "13000000"
                  }
                }
                """
            )
            .exchange()
            .expectStatus()
            .isOk()
            .expectBody()
            .jsonPath("$.fullNameEnterprise").isEqualTo("Empresa Nova")
            .jsonPath("$.birthData").isEqualTo("2026-03-21")
            .jsonPath("$.cnpj").isEqualTo("37425972492559")
            .jsonPath("$.address.street").isEqualTo("Rua Nova")
            .jsonPath("$.address.number").isEqualTo("200")
            .jsonPath("$.address.city").isEqualTo("Campinas");
    }

    @Test
    @WithMockUser(username = "37425972492559", authorities = "ROLE_USER")
    void updateProfileShouldReturnConflictWhenCnpjAlreadyExists() {
        Dealer currentDealer = new Dealer();
        currentDealer.setName("Empresa Atual");
        currentDealer.setActive(true);
        currentDealer.setEnterprise("Empresa Atual");
        currentDealer.setCnpj("37425972492559");
        currentDealer.setReferenceCode("DLR-UPD002");
        currentDealer.setStatus(DealerStatus.ATIVO);
        currentDealer.setCreatedAt(Instant.now());

        Dealer otherDealer = new Dealer();
        otherDealer.setName("Empresa Outra");
        otherDealer.setActive(true);
        otherDealer.setEnterprise("Empresa Outra");
        otherDealer.setCnpj("93048694931944");
        otherDealer.setReferenceCode("DLR-UPD003");
        otherDealer.setStatus(DealerStatus.ATIVO);
        otherDealer.setCreatedAt(Instant.now());

        dealerRepository.save(currentDealer).block();
        dealerRepository.save(otherDealer).block();

        webTestClient
            .patch()
            .uri(URI + "/profile/update")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(
                """
                {
                  "fullNameEnterprise": "Empresa Atualizada",
                  "birthData": "2026-03-21",
                  "cnpj": "93048694931944",
                  "address": {
                    "street": "Rua Nova",
                    "number": "200",
                    "complement": "Sala 4",
                    "neighborhood": "Centro",
                    "city": "Campinas",
                    "state": "SP",
                    "zipCode": "13000000"
                  }
                }
                """
            )
            .exchange()
            .expectStatus()
            .isEqualTo(409);
    }

    @Test
    @WithMockUser(username = "nao-existe", authorities = "ROLE_USER")
    void updateProfileShouldReturnNotFoundWhenDealerDoesNotExist() {
        webTestClient
            .patch()
            .uri(URI + "/profile/update")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(
                """
                {
                  "fullNameEnterprise": "Empresa Nova",
                  "birthData": "2026-03-21",
                  "cnpj": "37425972492559",
                  "address": {
                    "street": "Rua Nova",
                    "number": "200",
                    "complement": "Sala 4",
                    "neighborhood": "Centro",
                    "city": "Campinas",
                    "state": "SP",
                    "zipCode": "13000000"
                  }
                }
                """
            )
            .exchange()
            .expectStatus()
            .isNotFound();
    }

    @Test
    void updateProfileShouldReturnUnauthorizedWhenNotAuthenticated() {
        webTestClient
            .patch()
            .uri(URI + "/profile/update")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue("{}")
            .exchange()
            .expectStatus()
            .isUnauthorized();
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void updateProfileShouldReturnForbiddenWhenUserIsNotDealer() {
        webTestClient
            .patch()
            .uri(URI + "/profile/update")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue("{}")
            .exchange()
            .expectStatus()
            .isForbidden();
    }
}
