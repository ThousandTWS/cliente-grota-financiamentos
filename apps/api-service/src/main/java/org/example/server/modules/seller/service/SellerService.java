package org.example.server.modules.seller.service;

import org.example.server.shared.address.dto.AddressMapper;
import org.example.server.modules.seller.dto.SellerMapper;
import org.example.server.modules.seller.dto.SellerRequestDTO;
import org.example.server.modules.seller.dto.SellerResponseDTO;
import org.example.server.modules.user.model.UserRole;
import org.example.server.modules.auth.exception.AccessDeniedException;
import org.example.server.core.exception.generic.DataAlreadyExistsException;
import org.example.server.core.exception.generic.RecordNotFoundException;
import org.example.server.modules.dealer.model.Dealer;
import org.example.server.modules.seller.model.Seller;
import org.example.server.modules.user.model.User;
import org.example.server.modules.dealer.repository.DealerRepository;
import org.example.server.modules.proposal.repository.ProposalRepository;
import org.example.server.modules.auth.repository.RefreshTokenRepository;
import org.example.server.modules.seller.repository.SellerRepository;
import org.example.server.modules.user.repository.UserRepository;
import org.example.server.core.email.EmailService;
import org.example.server.modules.seller.factory.SellerUserFactory;
import org.example.server.modules.notification.dto.NotificationRequestDTO;
import org.example.server.modules.notification.service.NotificationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PathVariable;

@Service
public class SellerService {

    private final SellerRepository sellerRepository;
    private final UserRepository userRepository;
    private final SellerMapper sellerMapper;
    private final AddressMapper addressMapper;
    private final EmailService emailService;
    private final DealerRepository dealerRepository;
    private final ProposalRepository proposalRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final SellerUserFactory sellerUserFactory;
    private final NotificationService notificationService;

    public SellerService(
            SellerRepository sellerRepository,
            UserRepository userRepository,
            SellerMapper sellerMapper,
            AddressMapper addressMapper,
            EmailService emailService,
            DealerRepository dealerRepository,
            ProposalRepository proposalRepository,
            RefreshTokenRepository refreshTokenRepository,
            SellerUserFactory sellerUserFactory,
            NotificationService notificationService) {
        this.sellerRepository = sellerRepository;
        this.userRepository = userRepository;
        this.sellerMapper = sellerMapper;
        this.addressMapper = addressMapper;
        this.emailService = emailService;
        this.dealerRepository = dealerRepository;
        this.proposalRepository = proposalRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.sellerUserFactory = sellerUserFactory;
        this.notificationService = notificationService;
    }

    @Transactional
    public SellerResponseDTO create(User user, SellerRequestDTO sellerRequestDTO) {

        if (!(user.getRole().equals(UserRole.ADMIN)
                || user.getRole().equals(UserRole.OPERADOR)
                || user.getRole().equals(UserRole.GESTOR))) {
            System.err.println(
                    "[DEBUG] Usuario " + user.getEmail() + " tentou criar vendedor mas tem role: " + user.getRole());
            throw new AccessDeniedException(
                    "Apenas ADMIN, OPERADOR ou GESTOR podem cadastrar vendedor. Seu role atual: " + user.getRole());
        }

        if (userRepository.existsByEmail(sellerRequestDTO.email())) {
            throw new DataAlreadyExistsException("Email ja existe.");
        }

        if (sellerRepository.existsByPhone(sellerRequestDTO.phone())) {
            throw new DataAlreadyExistsException("Telefone ja existe.");
        }

        if (sellerRequestDTO.CPF() != null && !sellerRequestDTO.CPF().isBlank()
                && sellerRepository.existsByCPF(sellerRequestDTO.CPF())) {
            throw new DataAlreadyExistsException("CPF ja existe.");
        }

        Dealer dealer = null;
        if (sellerRequestDTO.dealerId() != null) {
            dealer = dealerRepository.findById(sellerRequestDTO.dealerId())
                    .orElseThrow(() -> new RecordNotFoundException("Lojista nao encontrado."));
        }

        User newUser = sellerUserFactory.create(
                sellerRequestDTO.fullName(),
                sellerRequestDTO.email(),
                sellerRequestDTO.password());

        if (sellerRequestDTO.email() != null && !sellerRequestDTO.email().isBlank()) {
            newUser.setEmail(sellerRequestDTO.email().trim().toLowerCase());
        }

        Seller seller = new Seller();
        seller.setPhone(sellerRequestDTO.phone());
        seller.setCPF(sellerRequestDTO.CPF());
        seller.setBirthData(sellerRequestDTO.birthData());
        seller.setAddress(addressMapper.toEntity(sellerRequestDTO.address()));
        seller.setUser(newUser);
        seller.setCanView(sellerRequestDTO.canView() != null ? sellerRequestDTO.canView() : true);
        seller.setCanCreate(sellerRequestDTO.canCreate() != null ? sellerRequestDTO.canCreate() : true);
        seller.setCanUpdate(sellerRequestDTO.canUpdate() != null ? sellerRequestDTO.canUpdate() : true);
        seller.setCanDelete(sellerRequestDTO.canDelete() != null ? sellerRequestDTO.canDelete() : true);
        seller.setDealer(dealer);

        newUser.setSeller(seller);

        emailService.sendPasswordToEmail(sellerRequestDTO.email(), sellerRequestDTO.password());

        Seller savedSeller = sellerRepository.save(seller);

        // Send notification to ADMIN about new seller
        notificationService.create(new NotificationRequestDTO(
                "Novo vendedor cadastrado",
                "O vendedor " + sellerRequestDTO.fullName() + " foi cadastrado no sistema.",
                "SYSTEM",
                "ADMIN",
                null,
                "/vendedores"));

        return sellerMapper.toDTO(savedSeller);
    }

    public java.util.List<SellerResponseDTO> findAll(Long dealerId) {
        java.util.List<Seller> sellers = dealerId != null
                ? sellerRepository.findByDealerId(dealerId)
                : sellerRepository.findAll();

        return sellers
                .stream()
                .map(sellerMapper::toDTO)
                .toList();
    }

    public SellerResponseDTO findById(@PathVariable Long id) {
        return sellerMapper.toDTO(sellerRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException(id)));
    }

    public SellerResponseDTO updateDealer(User requester, Long sellerId, Long dealerId) {
        if (!requester.getRole().equals(UserRole.ADMIN)) {
            throw new AccessDeniedException("Apenas ADMIN pode reatribuir vendedor.");
        }

        Seller seller = sellerRepository.findById(sellerId)
                .orElseThrow(() -> new RecordNotFoundException(sellerId));

        if (dealerId != null) {
            Dealer dealer = dealerRepository.findById(dealerId)
                    .orElseThrow(() -> new RecordNotFoundException("Lojista nao encontrado."));
            seller.setDealer(dealer);
        } else {
            seller.setDealer(null);
        }

        sellerRepository.save(seller);
        return sellerMapper.toDTO(seller);
    }

    public SellerResponseDTO update(User requester, Long id, SellerRequestDTO sellerRequestDTO) {
        if (!requester.getRole().equals(UserRole.ADMIN)) {
            throw new AccessDeniedException("Apenas ADMIN pode atualizar vendedor.");
        }

        Seller seller = sellerRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException(id));

        User user = seller.getUser();

        // Check email uniqueness if email is being changed
        if (!user.getEmail().equalsIgnoreCase(sellerRequestDTO.email())
                && userRepository.existsByEmail(sellerRequestDTO.email())) {
            throw new DataAlreadyExistsException("Email ja esta em uso.");
        }

        Dealer dealer = seller.getDealer();
        if (sellerRequestDTO.dealerId() != null) {
            dealer = dealerRepository.findById(sellerRequestDTO.dealerId())
                    .orElseThrow(() -> new RecordNotFoundException("Lojista nao encontrado."));
        }

        user.setFullName(sellerRequestDTO.fullName());
        user.setEmail(sellerRequestDTO.email());

        seller.setPhone(sellerRequestDTO.phone());
        seller.setCPF(sellerRequestDTO.CPF());
        seller.setBirthData(sellerRequestDTO.birthData());
        seller.setCanView(sellerRequestDTO.canView() != null ? sellerRequestDTO.canView() : seller.getCanView());
        seller.setCanCreate(
                sellerRequestDTO.canCreate() != null ? sellerRequestDTO.canCreate() : seller.getCanCreate());
        seller.setCanUpdate(
                sellerRequestDTO.canUpdate() != null ? sellerRequestDTO.canUpdate() : seller.getCanUpdate());
        seller.setCanDelete(
                sellerRequestDTO.canDelete() != null ? sellerRequestDTO.canDelete() : seller.getCanDelete());
        seller.setDealer(dealer);

        userRepository.save(user);
        sellerRepository.save(seller);

        return sellerMapper.toDTO(seller);
    }

    @Transactional
    public void delete(User requester, Long sellerId) {
        if (!requester.getRole().equals(UserRole.ADMIN)) {
            throw new AccessDeniedException("Apenas ADMIN pode remover vendedor.");
        }
        Seller seller = sellerRepository.findById(sellerId)
                .orElseThrow(() -> new RecordNotFoundException(sellerId));
        User sellerUser = seller.getUser();
        if (sellerUser != null) {
            refreshTokenRepository.deleteByUser(sellerUser);
        }
        proposalRepository.detachSellerFromProposals(sellerId);
        sellerRepository.delete(seller);
    }

    /**
     * Find sellers for operator panel.
     * Operator can only see sellers from their allowed dealers.
     * 
     * @param requester the authenticated operator (or admin)
     * @param dealerId  optional filter by specific dealer (must be in allowed list)
     * @return list of sellers
     */
    public java.util.List<SellerResponseDTO> findForOperatorPanel(User requester, Long dealerId) {
        if (!requester.getRole().equals(UserRole.OPERADOR) && !requester.getRole().equals(UserRole.ADMIN)) {
            throw new AccessDeniedException("Apenas OPERADOR ou ADMIN pode acessar este painel.");
        }

        java.util.List<Long> allowedDealerIds;

        if (requester.getRole().equals(UserRole.ADMIN)) {
            if (dealerId != null) {
                return sellerRepository.findByDealerId(dealerId).stream()
                        .map(sellerMapper::toDTO)
                        .toList();
            }
            return sellerRepository.findAll().stream()
                    .map(sellerMapper::toDTO)
                    .toList();
        }

        if (requester.getOperator() == null) {
            return java.util.List.of();
        }

        allowedDealerIds = requester.getOperator().getDealerIds();

        if (allowedDealerIds == null || allowedDealerIds.isEmpty()) {
            return java.util.List.of();
        }

        if (dealerId != null) {
            if (!allowedDealerIds.contains(dealerId)) {
                throw new AccessDeniedException("Operador nao tem acesso a esta loja.");
            }
            return sellerRepository.findByDealerId(dealerId).stream()
                    .map(sellerMapper::toDTO)
                    .toList();
        }

        return sellerRepository.findByDealerIdIn(allowedDealerIds).stream()
                .map(sellerMapper::toDTO)
                .toList();
    }

    /**
     * Find sellers for manager panel.
     * Manager can only see sellers from their own dealer.
     * 
     * @param requester the authenticated manager (or admin)
     * @return list of sellers
     */
    public java.util.List<SellerResponseDTO> findForManagerPanel(User requester) {
        if (!requester.getRole().equals(UserRole.GESTOR) && !requester.getRole().equals(UserRole.ADMIN)) {
            throw new AccessDeniedException("Apenas GESTOR ou ADMIN pode acessar este painel.");
        }

        if (requester.getRole().equals(UserRole.ADMIN)) {
            return sellerRepository.findAll().stream()
                    .map(sellerMapper::toDTO)
                    .toList();
        }

        if (requester.getManager() == null) {
            throw new RecordNotFoundException("Gestor sem perfil de manager.");
        }

        if (requester.getManager().getDealer() == null) {
            throw new RecordNotFoundException("Gestor sem loja vinculada.");
        }

        Long managerDealerId = requester.getManager().getDealer().getId();

        return sellerRepository.findByDealerId(managerDealerId).stream()
                .map(sellerMapper::toDTO)
                .toList();
    }
}


