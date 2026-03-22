package com.grota.backend.service;

import com.grota.backend.domain.dealer.Dealer;
import com.grota.backend.domain.dealer.DealerPartner;
import com.grota.backend.domain.dealer.DealerStatus;
import com.grota.backend.repository.DealerPartnerRepository;
import com.grota.backend.repository.DealerRepository;
import com.grota.backend.service.cloudinary.DealerDocumentCloudinaryClient;
import com.grota.backend.service.dto.DealerAdminRegisterRequestDTO;
import com.grota.backend.service.dto.DealerAdminRegisterResponseDTO;
import com.grota.backend.service.dto.DealerDetailsResponseDTO;
import com.grota.backend.service.dto.DealerDocumentResponseDTO;
import com.grota.backend.service.dto.DealerProfileUpdateRequestDTO;
import com.grota.backend.service.dto.DealerProfileUpdateResponseDTO;
import com.grota.backend.security.SecurityUtils;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
public class DealerService {

    private final DealerRepository dealerRepository;
    private final DealerPartnerRepository dealerPartnerRepository;
    private final DealerDocumentCloudinaryClient dealerDocumentCloudinaryClient;
    private final PasswordEncoder passwordEncoder;

    public DealerService(
        DealerRepository dealerRepository,
        DealerPartnerRepository dealerPartnerRepository,
        DealerDocumentCloudinaryClient dealerDocumentCloudinaryClient,
        PasswordEncoder passwordEncoder
    ) {
        this.dealerRepository = dealerRepository;
        this.dealerPartnerRepository = dealerPartnerRepository;
        this.dealerDocumentCloudinaryClient = dealerDocumentCloudinaryClient;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public Mono<DealerAdminRegisterResponseDTO> adminRegister(DealerAdminRegisterRequestDTO request) {
        String normalizedCnpj = request.cnpj().trim();
        String normalizedPhone = request.phone().trim();

        return dealerRepository
            .existsByCnpj(normalizedCnpj)
            .flatMap(cnpjExists -> {
                if (Boolean.TRUE.equals(cnpjExists)) {
                    return Mono.error(new ResponseStatusException(HttpStatus.CONFLICT, "CNPJ já cadastrado"));
                }
                return dealerRepository.existsByPhone(normalizedPhone);
            })
            .flatMap(phoneExists -> {
                if (Boolean.TRUE.equals(phoneExists)) {
                    return Mono.error(new ResponseStatusException(HttpStatus.CONFLICT, "Telefone já cadastrado"));
                }
                return createDealer(request, normalizedCnpj, normalizedPhone);
            });
    }

    @Transactional
    public Mono<DealerProfileUpdateResponseDTO> updateCurrentDealerProfile(DealerProfileUpdateRequestDTO request) {
        return SecurityUtils.getCurrentUserLogin()
            .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized")))
            .flatMap(this::findAuthenticatedDealer)
            .flatMap(dealer -> updateDealerProfile(dealer, request))
            .map(DealerProfileUpdateResponseDTO::new);
    }

    @Transactional(readOnly = true)
    public Flux<DealerAdminRegisterResponseDTO> listDealers() {
        return dealerRepository.findTop10OrderByFullNameAsc().map(DealerAdminRegisterResponseDTO::new);
    }

    @Transactional(readOnly = true)
    public Mono<DealerAdminRegisterResponseDTO> getDealerById(Long id) {
        return dealerRepository
            .findById(id)
            .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Lojista não encontrado para o ID fornecido")))
            .map(DealerAdminRegisterResponseDTO::new);
    }

    @Transactional(readOnly = true)
    public Mono<DealerDetailsResponseDTO> getDealerDetailsById(Long id) {
        return dealerRepository
            .findById(id)
            .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Lojista não encontrado para o ID fornecido")))
            .map(DealerDetailsResponseDTO::new);
    }

    @Transactional(readOnly = true)
    public Mono<DealerDetailsResponseDTO> getCurrentDealerDetails() {
        return SecurityUtils.getCurrentUserLogin()
            .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Não Autorizado")))
            .flatMap(this::findAuthenticatedDealer)
            .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Lojista não encontrado para o usuário autenticado")))
            .map(DealerDetailsResponseDTO::new);
    }

    @Transactional
    public Mono<Void> deleteDealerById(Long id) {
        return dealerRepository
            .findById(id)
            .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Lojista não encontrado para o ID fornecido")))
            .flatMap(dealer -> dealerPartnerRepository.deleteAllByDealerId(dealer.getId()).then(dealerRepository.deleteById(dealer.getId())));
    }

    @Transactional(readOnly = true)
    public Flux<DealerDocumentResponseDTO> listDealerDocuments(Long id) {
        return dealerRepository
            .existsById(id)
            .flatMapMany(exists -> {
                if (!Boolean.TRUE.equals(exists)) {
                    return Flux.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Lojista não encontrado para o ID fornecido"));
                }
                return dealerDocumentCloudinaryClient.listDealerDocuments(id);
            });
    }

    private Mono<DealerAdminRegisterResponseDTO> createDealer(
        DealerAdminRegisterRequestDTO request,
        String normalizedCnpj,
        String normalizedPhone
    ) {
        Dealer dealer = new Dealer();
        dealer.setName(request.enterprise().trim());
        dealer.setActive(true);
        dealer.setFullName(request.fullName().trim());
        dealer.setPhone(normalizedPhone);
        dealer.setEnterprise(request.enterprise().trim());
        dealer.setPasswordHash(passwordEncoder.encode(request.password()));
        dealer.setRazaoSocial(request.razaoSocial().trim());
        dealer.setCnpj(normalizedCnpj);
        if (request.address() != null) {
            dealer.setZipCode(request.address().zipCode());
            dealer.setStreet(request.address().street());
            dealer.setNumber(request.address().number());
            dealer.setComplement(request.address().complement());
            dealer.setNeighborhood(request.address().neighborhood());
            dealer.setCity(request.address().city());
            dealer.setState(request.address().state());
        }
        dealer.setObservation(request.observation());
        dealer.setReferenceCode(generateReferenceCode());
        dealer.setStatus(DealerStatus.ATIVO);
        dealer.setCreatedAt(Instant.now());

        return dealerRepository
            .save(dealer)
            .flatMap(saved ->
                Flux.fromIterable(request.partners())
                    .flatMap(partnerRequest -> {
                        DealerPartner partner = new DealerPartner();
                        partner.setDealerId(saved.getId());
                        partner.setCpf(partnerRequest.cpf().trim());
                        partner.setName(partnerRequest.name().trim());
                        partner.setType(partnerRequest.type());
                        partner.setSignatory(partnerRequest.signatory());
                        return dealerPartnerRepository.save(partner);
                    })
                    .then(Mono.just(saved))
            )
            .map(DealerAdminRegisterResponseDTO::new);
    }

    private String generateReferenceCode() {
        return "DLR-" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase(Locale.ROOT);
    }

    private Mono<Dealer> updateDealerProfile(Dealer dealer, DealerProfileUpdateRequestDTO request) {
        String normalizedCnpj = request.cnpj().trim();

        Mono<Void> cnpjValidation;
        if (normalizedCnpj.equals(dealer.getCnpj())) {
            cnpjValidation = Mono.empty();
        } else {
            cnpjValidation = dealerRepository
                .existsByCnpjAndIdNot(normalizedCnpj, dealer.getId())
                .flatMap(exists -> Boolean.TRUE.equals(exists)
                    ? Mono.error(new ResponseStatusException(HttpStatus.CONFLICT, "CNPJ já cadastrado"))
                    : Mono.empty());
        }

        return cnpjValidation.then(
            Mono.defer(() -> {
                dealer.setEnterprise(request.fullNameEnterprise().trim());
                dealer.setName(request.fullNameEnterprise().trim());
                dealer.setBirthData(request.birthData());
                dealer.setCnpj(normalizedCnpj);
                if (request.address() != null) {
                    dealer.setStreet(request.address().street());
                    dealer.setNumber(request.address().number());
                    dealer.setComplement(request.address().complement());
                    dealer.setNeighborhood(request.address().neighborhood());
                    dealer.setCity(request.address().city());
                    dealer.setState(request.address().state());
                    dealer.setZipCode(request.address().zipCode());
                }
                return dealerRepository.save(dealer);
            })
        );
    }

    private Mono<Dealer> findAuthenticatedDealer(String currentLogin) {
        return dealerRepository
            .findOneByAuthLogin(currentLogin)
            .switchIfEmpty(dealerRepository.findOneByCnpj(currentLogin))
            .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Lojista não encontrado para o usuário autenticado")));
    }
}
