package com.grota.backend.service;

import com.grota.backend.domain.FinancingUserRole;
import com.grota.backend.repository.DealerRepository;
import com.grota.backend.repository.SellerRepository;
import com.grota.backend.repository.FinancingUserAllowedDealerRepository;
import com.grota.backend.repository.FinancingUserRepository;
import com.grota.backend.domain.Seller;
import com.grota.backend.domain.SellerStatus;
import com.grota.backend.security.SecurityUtils;
import com.grota.backend.service.dto.SellerResponseDTO;
import com.grota.backend.service.dto.SellerUpdateRequestDTO;
import com.grota.backend.web.rest.errors.EmailAlreadyRegisteredException;
import java.time.Instant;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
public class SellerService {

    private final SellerRepository sellerRepository;
    private final FinancingUserRepository financingUserRepository;
    private final FinancingUserAllowedDealerRepository financingUserAllowedDealerRepository;
    private final DealerRepository dealerRepository;
    private final PasswordEncoder passwordEncoder;

    public SellerService(
        SellerRepository sellerRepository,
        FinancingUserRepository financingUserRepository,
        FinancingUserAllowedDealerRepository financingUserAllowedDealerRepository,
        DealerRepository dealerRepository,
        PasswordEncoder passwordEncoder
    ) {
        this.sellerRepository = sellerRepository;
        this.financingUserRepository = financingUserRepository;
        this.financingUserAllowedDealerRepository = financingUserAllowedDealerRepository;
        this.dealerRepository = dealerRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public Mono<SellerResponseDTO> findById(Long id) {
        return sellerRepository
            .findById(id)
            .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Vendedor não encontrado para o ID fornecido")))
            .map(SellerResponseDTO::new);
    }

    @Transactional(readOnly = true)
    public Flux<SellerResponseDTO> findAll(Optional<Long> dealerId) {
        return dealerId
            .map(sellerRepository::findAllByDealerIdOrderByFullNameAsc)
            .orElseGet(sellerRepository::findAllByOrderByFullNameAsc)
            .take(10)
            .map(SellerResponseDTO::new);
    }

    @Transactional(readOnly = true)
    public Flux<SellerResponseDTO> findAllForOperatorPanel(Optional<Long> dealerId) {
        return SecurityUtils.getCurrentUserLogin()
            .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Não autorizado")))
            .flatMapMany(currentLogin ->
                financingUserRepository
                    .findOneByEmailIgnoreCase(currentLogin)
                    .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado")))
                    .flatMapMany(user -> {
                        if (user.getRole() == FinancingUserRole.ADMIN) {
                            return findAll(dealerId);
                        }

                        if (user.getRole() != FinancingUserRole.OPERADOR) {
                            return Flux.error(new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso negado - operador não vinculado à loja"));
                        }
                        return financingUserAllowedDealerRepository.findDealerIdsByFinancingUserId(user.getId()).collectList().flatMapMany(allowedDealerIds -> {
                            java.util.List<Long> normalizedDealerIds = !allowedDealerIds.isEmpty()
                                ? allowedDealerIds
                                : (user.getDealerId() != null ? java.util.List.of(user.getDealerId()) : java.util.List.of());

                            if (normalizedDealerIds.isEmpty()) {
                                return Flux.error(new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso negado - operador não vinculado à loja"));
                            }

                            if (dealerId.isPresent() && !normalizedDealerIds.contains(dealerId.get())) {
                                return Flux.error(new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso negado - operador não vinculado à loja"));
                            }

                            if (dealerId.isPresent()) {
                                return sellerRepository.findAllByDealerIdOrderByFullNameAsc(dealerId.get()).take(10).map(SellerResponseDTO::new);
                            }

                            return sellerRepository.findAllByDealerIdInOrderByFullNameAsc(normalizedDealerIds).take(10).map(SellerResponseDTO::new);
                        });
                    })
            );
    }

    @Transactional(readOnly = true)
    public Flux<SellerResponseDTO> findAllForManagerPanel() {
        return SecurityUtils.getCurrentUserLogin()
            .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Não autorizado")))
            .flatMapMany(currentLogin ->
                financingUserRepository
                    .findOneByEmailIgnoreCase(currentLogin)
                    .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado")))
                    .flatMapMany(user -> {
                        if (user.getRole() == FinancingUserRole.ADMIN) {
                            return findAll(Optional.empty());
                        }

                        if (user.getRole() != FinancingUserRole.GESTOR) {
                            return Flux.error(new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden"));
                        }

                        if (user.getDealerId() == null) {
                            return Flux.error(new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Gestor sem loja vinculada"));
                        }

                        return sellerRepository.findAllByDealerIdOrderByFullNameAsc(user.getDealerId()).take(10).map(SellerResponseDTO::new);
                    })
            );
    }

    @Transactional
    public Mono<SellerResponseDTO> create(SellerUpdateRequestDTO request) {
        return validateDealerExists(request.dealerId())
            .then(validateUniqueFieldsForCreate(request))
            .then(Mono.defer(() -> {
                Seller seller = new Seller();
                seller.setDealerId(request.dealerId());
                seller.setFullName(request.fullName() != null ? request.fullName().trim() : null);
                seller.setEmail(request.email() != null ? request.email().trim().toLowerCase() : null);
                seller.setPhone(request.phone() != null ? request.phone().trim() : null);
                seller.setCpf(request.CPF() != null ? request.CPF().trim() : null);
                seller.setBirthData(request.birthData());
                seller.setStatus(SellerStatus.ATIVO);
                seller.setCreatedAt(Instant.now());
                seller.setCanView(request.canView() != null ? request.canView() : true);
                seller.setCanCreate(request.canCreate() != null ? request.canCreate() : true);
                seller.setCanUpdate(request.canUpdate() != null ? request.canUpdate() : true);
                seller.setCanDelete(request.canDelete() != null ? request.canDelete() : true);
                if (request.password() != null && !request.password().isBlank()) {
                    seller.setPasswordHash(passwordEncoder.encode(request.password()));
                }
                if (request.address() != null) {
                    seller.setStreet(request.address().street());
                    seller.setNumber(request.address().number());
                    seller.setComplement(request.address().complement());
                    seller.setNeighborhood(request.address().neighborhood());
                    seller.setCity(request.address().city());
                    seller.setState(request.address().state());
                    seller.setZipCode(request.address().zipCode());
                }
                return sellerRepository.save(seller).map(SellerResponseDTO::new);
            }));
    }

    @Transactional
    public Mono<SellerResponseDTO> update(Long id, SellerUpdateRequestDTO request) {
        return sellerRepository
            .findById(id)
            .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Vendedor não encontrado para o ID fornecido")))
            .flatMap(seller -> validateDealerExists(request.dealerId()).then(validateUniqueFields(id, request)).then(updateSeller(seller, request)))
            .map(SellerResponseDTO::new);
    }

    @Transactional
    public Mono<SellerResponseDTO> updateDealer(Long id, Long dealerId) {
        return sellerRepository
            .findById(id)
            .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Vendedor ou lojista não encontrados")))
            .flatMap(seller -> validateDealerExists(dealerId).then(Mono.defer(() -> {
                seller.setDealerId(dealerId);
                return sellerRepository.save(seller);
            })))
            .map(SellerResponseDTO::new);
    }

    @Transactional
    public Mono<Void> delete(Long id) {
        return sellerRepository
            .findById(id)
            .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Vendedor não encontrado")))
            .flatMap(sellerRepository::delete);
    }

    private Mono<Void> validateUniqueFieldsForCreate(SellerUpdateRequestDTO request) {
        Mono<Void> emailValidation = Mono.empty();
        if (request.email() != null && !request.email().isBlank()) {
            emailValidation = sellerRepository
                .existsByEmailIgnoreCase(request.email().trim().toLowerCase())
                .flatMap(exists -> Boolean.TRUE.equals(exists)
                    ? Mono.error(new EmailAlreadyRegisteredException("E-mail já cadastrado"))
                    : Mono.empty());
        }

        Mono<Void> cpfValidation = Mono.empty();
        if (request.CPF() != null && !request.CPF().isBlank()) {
            cpfValidation = sellerRepository
                .existsByCpf(request.CPF().trim())
                .flatMap(exists -> Boolean.TRUE.equals(exists)
                    ? Mono.error(new ResponseStatusException(HttpStatus.CONFLICT, "CPF já cadastrado"))
                    : Mono.empty());
        }

        Mono<Void> phoneValidation = Mono.empty();
        if (request.phone() != null && !request.phone().isBlank()) {
            phoneValidation = sellerRepository
                .existsByPhone(request.phone().trim())
                .flatMap(exists -> Boolean.TRUE.equals(exists)
                    ? Mono.error(new ResponseStatusException(HttpStatus.CONFLICT, "Telefone já cadastrado"))
                    : Mono.empty());
        }

        return emailValidation.then(cpfValidation).then(phoneValidation);
    }

    private Mono<Void> validateDealerExists(Long dealerId) {
        if (dealerId == null) {
            return Mono.empty();
        }
        return dealerRepository
            .existsById(dealerId)
            .flatMap(exists -> Boolean.TRUE.equals(exists) ? Mono.empty() : Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Lojista não encontrado")));
    }

    private Mono<Void> validateUniqueFields(Long id, SellerUpdateRequestDTO request) {
        Mono<Void> emailValidation = Mono.empty();
        if (request.email() != null && !request.email().isBlank()) {
            emailValidation = sellerRepository
                .existsByEmailIgnoreCaseAndIdNot(request.email().trim().toLowerCase(), id)
                .flatMap(exists -> Boolean.TRUE.equals(exists)
                    ? Mono.error(new EmailAlreadyRegisteredException("E-mail já cadastrado"))
                    : Mono.empty());
        }

        Mono<Void> cpfValidation = Mono.empty();
        if (request.CPF() != null && !request.CPF().isBlank()) {
            cpfValidation = sellerRepository
                .existsByCpfAndIdNot(request.CPF().trim(), id)
                .flatMap(exists -> Boolean.TRUE.equals(exists)
                    ? Mono.error(new ResponseStatusException(HttpStatus.CONFLICT, "CPF já cadastrado"))
                    : Mono.empty());
        }

        Mono<Void> phoneValidation = Mono.empty();
        if (request.phone() != null && !request.phone().isBlank()) {
            phoneValidation = sellerRepository
                .existsByPhoneAndIdNot(request.phone().trim(), id)
                .flatMap(exists -> Boolean.TRUE.equals(exists)
                    ? Mono.error(new ResponseStatusException(HttpStatus.CONFLICT, "Telefone já cadastrado"))
                    : Mono.empty());
        }

        return emailValidation.then(cpfValidation).then(phoneValidation);
    }

    private Mono<com.grota.backend.domain.Seller> updateSeller(com.grota.backend.domain.Seller seller, SellerUpdateRequestDTO request) {
        if (request.dealerId() != null) {
            seller.setDealerId(request.dealerId());
        }
        if (request.fullName() != null && !request.fullName().isBlank()) {
            seller.setFullName(request.fullName().trim());
        }
        if (request.email() != null && !request.email().isBlank()) {
            seller.setEmail(request.email().trim().toLowerCase());
        }
        if (request.phone() != null) {
            seller.setPhone(request.phone().trim());
        }
        if (request.password() != null && !request.password().isBlank()) {
            seller.setPasswordHash(passwordEncoder.encode(request.password()));
        }
        if (request.CPF() != null) {
            seller.setCpf(request.CPF().trim());
        }
        if (request.birthData() != null) {
            seller.setBirthData(request.birthData());
        }
        if (request.address() != null) {
            seller.setStreet(request.address().street());
            seller.setNumber(request.address().number());
            seller.setComplement(request.address().complement());
            seller.setNeighborhood(request.address().neighborhood());
            seller.setCity(request.address().city());
            seller.setState(request.address().state());
            seller.setZipCode(request.address().zipCode());
        }
        if (request.canView() != null) {
            seller.setCanView(request.canView());
        }
        if (request.canCreate() != null) {
            seller.setCanCreate(request.canCreate());
        }
        if (request.canUpdate() != null) {
            seller.setCanUpdate(request.canUpdate());
        }
        if (request.canDelete() != null) {
            seller.setCanDelete(request.canDelete());
        }

        return sellerRepository.save(seller);
    }
}
