package com.grota.backend.service;

import com.grota.backend.config.Constants;
import com.grota.backend.domain.FinancingUser;
import com.grota.backend.domain.FinancingUserRole;
import com.grota.backend.repository.DealerRepository;
import com.grota.backend.repository.FinancingUserAllowedDealerRepository;
import com.grota.backend.repository.FinancingUserRepository;
import com.grota.backend.security.SecurityUtils;
import com.grota.backend.service.dto.FinancingUserCreateRequestDTO;
import com.grota.backend.service.dto.FinancingUserProfileUpdateDTO;
import com.grota.backend.service.dto.FinancingUserResponseDTO;
import com.grota.backend.web.rest.errors.EmailAlreadyRegisteredException;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
public class FinancingUserService {

    private final FinancingUserRepository financingUserRepository;
    private final FinancingUserAllowedDealerRepository financingUserAllowedDealerRepository;
    private final DealerRepository dealerRepository;
    private final PasswordEncoder passwordEncoder;

    public FinancingUserService(
        FinancingUserRepository financingUserRepository,
        FinancingUserAllowedDealerRepository financingUserAllowedDealerRepository,
        DealerRepository dealerRepository,
        PasswordEncoder passwordEncoder
    ) {
        this.financingUserRepository = financingUserRepository;
        this.financingUserAllowedDealerRepository = financingUserAllowedDealerRepository;
        this.dealerRepository = dealerRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public Mono<FinancingUserResponseDTO> create(FinancingUserCreateRequestDTO request) {
        String normalizedEmail = request.email().trim().toLowerCase();
        FinancingUserRole role = request.role() != null ? request.role() : FinancingUserRole.ADMIN;
        List<Long> allowedDealerIds = normalizeAllowedDealerIds(request.dealerId(), request.allowedDealerIds());
        Long dealerId = request.dealerId() != null ? request.dealerId() : allowedDealerIds.stream().findFirst().orElse(null);

        return financingUserRepository
            .existsByEmailIgnoreCase(normalizedEmail)
            .flatMap(exists -> {
                if (Boolean.TRUE.equals(exists)) {
                    return Mono.error(new EmailAlreadyRegisteredException("E-mail já cadastrado"));
                }

                return validateDealersExist(allowedDealerIds)
                    .then(
                        Mono.defer(() -> {
                            FinancingUser user = new FinancingUser();
                            user.setFullName(request.fullName().trim());
                            user.setEmail(normalizedEmail);
                            user.setPasswordHash(passwordEncoder.encode(request.password()));
                            user.setRole(role);
                            user.setDealerId(dealerId);
                            user.setCanView(request.canView() != null ? request.canView() : true);
                            user.setCanCreate(request.canCreate() != null ? request.canCreate() : true);
                            user.setCanUpdate(request.canUpdate() != null ? request.canUpdate() : true);
                            user.setCanDelete(request.canDelete() != null ? request.canDelete() : true);
                            user.setCanChangeProposalStatus(request.canChangeProposalStatus() != null ? request.canChangeProposalStatus() : true);
                            user.setAllowedDealerIds(allowedDealerIds);
                            user.setAllowedDealersCount(allowedDealerIds.size());
                            user.setCreatedBy(Constants.SYSTEM);
                            user.setLastModifiedBy(Constants.SYSTEM);

                            return financingUserRepository
                                .save(user)
                                .flatMap(saved ->
                                    financingUserAllowedDealerRepository
                                        .replaceDealerIds(saved.getId(), allowedDealerIds)
                                        .then(enrichAllowedDealers(saved))
                                )
                                .map(FinancingUserResponseDTO::new);
                        })
                    );
            });
    }

    @Transactional
    public Mono<FinancingUserResponseDTO> updateDealer(Long id, Long dealerId) {
        List<Long> allowedDealerIds = dealerId != null ? List.of(dealerId) : List.of();
        return financingUserRepository
            .findById(id)
            .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado")))
            .flatMap(user ->
                validateDealersExist(allowedDealerIds).then(
                    Mono.defer(() -> {
                        user.setDealerId(dealerId);
                        user.setAllowedDealerIds(allowedDealerIds);
                        user.setAllowedDealersCount(allowedDealerIds.size());
                        user.setLastModifiedBy(Constants.SYSTEM);
                        return financingUserRepository
                            .save(user)
                            .flatMap(saved -> financingUserAllowedDealerRepository.replaceDealerIds(saved.getId(), allowedDealerIds).then(enrichAllowedDealers(saved)));
                    })
                )
            )
            .map(FinancingUserResponseDTO::new);
    }

    @Transactional(readOnly = true)
    public Mono<FinancingUserResponseDTO> findById(Long id) {
        return financingUserRepository
            .findById(id)
            .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado")))
            .flatMap(this::enrichAllowedDealers)
            .map(FinancingUserResponseDTO::new);
    }

    @Transactional(readOnly = true)
    public Flux<FinancingUserResponseDTO> findAll(Optional<FinancingUserRole> role) {
        return role
            .map(financingUserRepository::findAllByRole)
            .orElseGet(financingUserRepository::findAll)
            .flatMap(this::enrichAllowedDealers)
            .map(FinancingUserResponseDTO::new);
    }

    @Transactional
    public Mono<FinancingUserResponseDTO> updateCurrentUserProfile(FinancingUserProfileUpdateDTO request) {
        return SecurityUtils.getCurrentUserLogin()
            .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized")))
            .flatMap(currentLogin ->
                financingUserRepository
                    .findOneByEmailIgnoreCase(currentLogin)
                    .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado")))
                    .flatMap(user -> updateProfile(user, request))
            )
            .flatMap(this::enrichAllowedDealers)
            .map(FinancingUserResponseDTO::new);
    }

    @Transactional(readOnly = true)
    public Mono<FinancingUserResponseDTO> getCurrentUserProfile() {
        return SecurityUtils.getCurrentUserLogin()
            .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized")))
            .flatMap(currentLogin ->
                financingUserRepository
                    .findOneByEmailIgnoreCase(currentLogin)
                    .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado")))
            )
            .flatMap(this::enrichAllowedDealers)
            .map(FinancingUserResponseDTO::new);
    }

    private Mono<FinancingUser> enrichAllowedDealers(FinancingUser user) {
        return financingUserAllowedDealerRepository
            .findDealerIdsByFinancingUserId(user.getId())
            .collectList()
            .map(dealerIds -> {
                List<Long> normalizedDealerIds = !dealerIds.isEmpty()
                    ? dealerIds
                    : (user.getDealerId() != null ? List.of(user.getDealerId()) : List.of());
                user.setAllowedDealerIds(normalizedDealerIds);
                user.setAllowedDealersCount(normalizedDealerIds.size());
                return user;
            });
    }

    private Mono<Void> validateDealersExist(List<Long> dealerIds) {
        if (dealerIds.isEmpty()) {
            return Mono.empty();
        }

        return dealerRepository
            .findAllById(dealerIds)
            .count()
            .flatMap(count ->
                count == dealerIds.size()
                    ? Mono.empty()
                    : Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Lojista não encontrado"))
            );
    }

    private List<Long> normalizeAllowedDealerIds(Long dealerId, List<Long> allowedDealerIds) {
        List<Long> normalizedDealerIds = (allowedDealerIds == null ? List.<Long>of() : allowedDealerIds)
            .stream()
            .filter(java.util.Objects::nonNull)
            .distinct()
            .collect(Collectors.toList());

        if (dealerId != null && !normalizedDealerIds.contains(dealerId)) {
            normalizedDealerIds =
                java.util.stream.Stream.concat(java.util.stream.Stream.of(dealerId), normalizedDealerIds.stream()).distinct().collect(Collectors.toList());
        }

        return normalizedDealerIds;
    }

    private Mono<FinancingUser> updateProfile(FinancingUser user, FinancingUserProfileUpdateDTO request) {
        if (request.fullName() != null && !request.fullName().isBlank()) {
            user.setFullName(request.fullName().trim());
        }

        if (request.email() == null || request.email().isBlank()) {
            user.setLastModifiedBy(Constants.SYSTEM);
            return financingUserRepository.save(user);
        }

        String normalizedEmail = request.email().trim().toLowerCase();

        if (normalizedEmail.equalsIgnoreCase(user.getEmail())) {
            user.setEmail(normalizedEmail);
            user.setLastModifiedBy(Constants.SYSTEM);
            return financingUserRepository.save(user);
        }

        return financingUserRepository
            .existsByEmailIgnoreCase(normalizedEmail)
            .flatMap(exists -> {
                if (Boolean.TRUE.equals(exists)) {
                    return Mono.error(new EmailAlreadyRegisteredException("E-mail já cadastrado"));
                }
                user.setEmail(normalizedEmail);
                user.setLastModifiedBy(Constants.SYSTEM);
                return financingUserRepository.save(user);
            });
    }
}
