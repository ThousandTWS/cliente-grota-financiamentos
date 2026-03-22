package com.grota.backend.service;

import com.grota.backend.domain.dealer.Dealer;
import com.grota.backend.domain.dealer.DealerStatus;
import com.grota.backend.repository.DealerRepository;
import com.grota.backend.security.AuthoritiesConstants;
import com.grota.backend.security.SecurityUtils;
import com.grota.backend.service.dto.AuthRegisterRequestDTO;
import com.grota.backend.service.dto.DealerAdminRegisterResponseDTO;
import com.grota.backend.service.keycloak.KeycloakAdminClient;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

@Service
public class AuthService {

    private final DealerRepository dealerRepository;
    private final KeycloakAdminClient keycloakAdminClient;

    public AuthService(DealerRepository dealerRepository, KeycloakAdminClient keycloakAdminClient) {
        this.dealerRepository = dealerRepository;
        this.keycloakAdminClient = keycloakAdminClient;
    }

    @Transactional
    public Mono<DealerAdminRegisterResponseDTO> registerDealer(AuthRegisterRequestDTO request) {
        String normalizedPhone = request.phone().trim();

        return dealerRepository
            .existsByPhone(normalizedPhone)
            .flatMap(phoneExists -> {
                if (Boolean.TRUE.equals(phoneExists)) {
                    return Mono.error(new ResponseStatusException(HttpStatus.CONFLICT, "Telefone já cadastrado"));
                }
                return dealerRepository.existsByAuthLogin(normalizedPhone);
            })
            .flatMap(authLoginExists -> {
                if (Boolean.TRUE.equals(authLoginExists)) {
                    return Mono.error(new ResponseStatusException(HttpStatus.CONFLICT, "Login já cadastrado"));
                }
                return keycloakAdminClient.registerDealerUser(request.fullName().trim(), normalizedPhone, request.password());
            })
            .flatMap(keycloakUser ->
                resolveDealerStatus(request.adminRegistration()).flatMap(dealerStatus -> {
                Dealer dealer = new Dealer();
                dealer.setName(request.enterprise().trim());
                dealer.setActive(true);
                dealer.setFullName(request.fullName().trim());
                dealer.setPhone(normalizedPhone);
                dealer.setEnterprise(request.enterprise().trim());
                dealer.setReferenceCode(generateReferenceCode());
                dealer.setStatus(dealerStatus);
                dealer.setCreatedAt(Instant.now());
                dealer.setAuthLogin(keycloakUser.username());
                dealer.setKeycloakUserId(keycloakUser.userId());
                return dealerRepository.save(dealer);
                })
            )
            .map(DealerAdminRegisterResponseDTO::new);
    }

    private String generateReferenceCode() {
        return "DLR-" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase(Locale.ROOT);
    }

    private Mono<DealerStatus> resolveDealerStatus(boolean adminRegistration) {
        if (!adminRegistration) {
            return Mono.just(DealerStatus.PENDENTE);
        }
        return SecurityUtils
            .hasCurrentUserThisAuthority(AuthoritiesConstants.ADMIN)
            .map(isAdmin -> Boolean.TRUE.equals(isAdmin) ? DealerStatus.ATIVO : DealerStatus.PENDENTE)
            .defaultIfEmpty(DealerStatus.PENDENTE);
    }
}
