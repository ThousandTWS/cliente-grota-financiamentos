package org.example.server.service;

import org.example.server.dto.address.AddressMapper;
import org.example.server.dto.operator.OperatorMapper;
import org.example.server.dto.operator.OperatorRequestDTO;
import org.example.server.dto.operator.OperatorResponseDTO;
import org.example.server.enums.UserRole;
import org.example.server.exception.auth.AccessDeniedException;
import org.example.server.exception.generic.DataAlreadyExistsException;
import org.example.server.exception.generic.RecordNotFoundException;
import org.example.server.model.Dealer;
import org.example.server.model.Operator;
import org.example.server.model.OperatorDealerLink;
import org.example.server.model.User;
import org.example.server.repository.DealerRepository;
import org.example.server.repository.OperatorDealerLinkRepository;
import org.example.server.repository.OperatorRepository;
import org.example.server.repository.RefreshTokenRepository;
import org.example.server.repository.UserRepository;
import org.example.server.service.factory.OperatorUserFactory;
import org.example.server.util.PasswordGenerator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.ArrayList;
import java.util.List;

@Service
public class OperatorService {

    private final OperatorRepository operatorRepository;
    private final UserRepository userRepository;
    private final OperatorMapper operatorMapper;
    private final AddressMapper addressMapper;
    private final EmailService emailService;
    private final DealerRepository dealerRepository;
    private final OperatorUserFactory operatorUserFactory;
    private final RefreshTokenRepository refreshTokenRepository;
    private final OperatorDealerLinkRepository operatorDealerLinkRepository;

    public OperatorService(
            OperatorRepository operatorRepository,
            UserRepository userRepository,
            OperatorMapper operatorMapper,
            AddressMapper addressMapper,
            EmailService emailService,
            DealerRepository dealerRepository,
            OperatorUserFactory operatorUserFactory,
            RefreshTokenRepository refreshTokenRepository,
            OperatorDealerLinkRepository operatorDealerLinkRepository) {
        this.operatorRepository = operatorRepository;
        this.userRepository = userRepository;
        this.operatorMapper = operatorMapper;
        this.addressMapper = addressMapper;
        this.emailService = emailService;
        this.dealerRepository = dealerRepository;
        this.operatorUserFactory = operatorUserFactory;
        this.refreshTokenRepository = refreshTokenRepository;
        this.operatorDealerLinkRepository = operatorDealerLinkRepository;
    }

    @Transactional
    public OperatorResponseDTO create(User user, OperatorRequestDTO operatorRequestDTO) {

        if (!user.getRole().equals(UserRole.ADMIN)) {
            throw new AccessDeniedException("Apenas ADMIN pode cadastrar operador.");
        }

        if (userRepository.existsByEmail(operatorRequestDTO.email())) {
            throw new DataAlreadyExistsException("Email ja existe.");
        }

        if (operatorRepository.existsByPhone(operatorRequestDTO.phone())) {
            throw new DataAlreadyExistsException("Telefone ja existe.");
        }

        // Determine which dealers to link
        List<Long> dealerIdsToLink = new ArrayList<>();
        if (operatorRequestDTO.dealerIds() != null && !operatorRequestDTO.dealerIds().isEmpty()) {
            // Use new dealerIds array
            dealerIdsToLink.addAll(operatorRequestDTO.dealerIds());
        } else if (operatorRequestDTO.dealerId() != null) {
            // Fall back to legacy single dealerId
            dealerIdsToLink.add(operatorRequestDTO.dealerId());
        }

        // Validate all dealer IDs exist
        Dealer primaryDealer = null;
        List<Dealer> dealers = new ArrayList<>();
        for (Long dealerId : dealerIdsToLink) {
            Dealer dealer = dealerRepository.findById(dealerId)
                    .orElseThrow(() -> new RecordNotFoundException("Lojista nao encontrado: " + dealerId));
            dealers.add(dealer);
            if (primaryDealer == null) {
                primaryDealer = dealer;
            }
        }

        // Handle password - auto-generate if not provided
        String passwordToUse = operatorRequestDTO.password();
        String generatedPassword = null;
        if (PasswordGenerator.isNullOrBlank(passwordToUse)) {
            generatedPassword = PasswordGenerator.generate();
            passwordToUse = generatedPassword;
        }

        User newUser = operatorUserFactory.create(
                operatorRequestDTO.fullName(),
                operatorRequestDTO.email(),
                passwordToUse);

        Operator operator = new Operator();
        operator.setPhone(operatorRequestDTO.phone());
        operator.setCPF(operatorRequestDTO.CPF());
        operator.setBirthData(operatorRequestDTO.birthData());
        operator.setAddress(addressMapper.toEntity(operatorRequestDTO.address()));
        operator.setUser(newUser);
        operator.setCanView(operatorRequestDTO.canView() != null ? operatorRequestDTO.canView() : true);
        operator.setCanCreate(operatorRequestDTO.canCreate() != null ? operatorRequestDTO.canCreate() : true);
        operator.setCanUpdate(operatorRequestDTO.canUpdate() != null ? operatorRequestDTO.canUpdate() : true);
        operator.setCanDelete(operatorRequestDTO.canDelete() != null ? operatorRequestDTO.canDelete() : true);
        operator.setDealer(primaryDealer); // Keep legacy field for backwards compatibility

        newUser.setOperator(operator);

        // Save operator first to get ID
        Operator savedOperator = operatorRepository.save(operator);

        // Create dealer links for multi-dealer support
        for (Dealer dealer : dealers) {
            OperatorDealerLink link = new OperatorDealerLink(savedOperator, dealer);
            savedOperator.getDealerLinks().add(link);
        }
        operatorRepository.save(savedOperator);

        // Send password via email
        emailService.sendPasswordToEmail(operatorRequestDTO.email(), passwordToUse);

        return operatorMapper.toDTO(savedOperator, generatedPassword);
    }

    public java.util.List<OperatorResponseDTO> findAll(Long dealerId) {
        java.util.List<Operator> operators = dealerId != null
                ? operatorRepository.findByDealerId(dealerId)
                : operatorRepository.findAll();

        return operators
                .stream()
                .map(operatorMapper::toDTO)
                .toList();
    }

    public OperatorResponseDTO findById(@PathVariable Long id) {
        return operatorMapper.toDTO(operatorRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException(id)));
    }

    public OperatorResponseDTO update(Long id, OperatorRequestDTO operatorRequestDTO) {
        Operator operator = operatorRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException(id));

        User operatorUser = operator.getUser();
        Dealer dealer = operator.getDealer();
        if (operatorRequestDTO.dealerId() != null) {
            dealer = dealerRepository.findById(operatorRequestDTO.dealerId())
                    .orElseThrow(() -> new RecordNotFoundException("Lojista nao encontrado."));
        }

        operatorUser.setFullName(operatorRequestDTO.fullName());
        operatorUser.setEmail(operatorRequestDTO.email());

        operator.setPhone(operatorRequestDTO.phone());
        operator.setCPF(operatorRequestDTO.CPF());
        operator.setBirthData(operatorRequestDTO.birthData());
        operator.setAddress(addressMapper.toEntity(operatorRequestDTO.address()));
        operator.setCanView(
                operatorRequestDTO.canView() != null ? operatorRequestDTO.canView() : operator.getCanView());
        operator.setCanCreate(
                operatorRequestDTO.canCreate() != null ? operatorRequestDTO.canCreate() : operator.getCanCreate());
        operator.setCanUpdate(
                operatorRequestDTO.canUpdate() != null ? operatorRequestDTO.canUpdate() : operator.getCanUpdate());
        operator.setCanDelete(
                operatorRequestDTO.canDelete() != null ? operatorRequestDTO.canDelete() : operator.getCanDelete());
        operator.setDealer(dealer);

        userRepository.save(operatorUser);
        operatorRepository.save(operator);

        return operatorMapper.toDTO(operator);
    }

    public OperatorResponseDTO updateDealer(User requester, Long operatorId, Long dealerId) {
        if (!requester.getRole().equals(UserRole.ADMIN)) {
            throw new AccessDeniedException("Apenas ADMIN pode reatribuir operador.");
        }

        Operator operator = operatorRepository.findById(operatorId)
                .orElseThrow(() -> new RecordNotFoundException(operatorId));
        if (dealerId != null) {
            Dealer dealer = dealerRepository.findById(dealerId)
                    .orElseThrow(() -> new RecordNotFoundException("Lojista nao encontrado."));
            operator.setDealer(dealer);
        } else {
            operator.setDealer(null);
        }
        operatorRepository.save(operator);
        return operatorMapper.toDTO(operator);
    }

    @Transactional
    public void delete(User requester, Long operatorId) {
        if (!requester.getRole().equals(UserRole.ADMIN)) {
            throw new AccessDeniedException("Apenas ADMIN pode remover operador.");
        }
        Operator operator = operatorRepository.findById(operatorId)
                .orElseThrow(() -> new RecordNotFoundException(operatorId));
        User operatorUser = operator.getUser();
        if (operatorUser != null) {
            refreshTokenRepository.deleteByUser(operatorUser);
        }
        operatorRepository.delete(operator);
    }
}
