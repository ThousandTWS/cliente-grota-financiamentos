package org.example.server.service;

import org.example.server.dto.address.AddressMapper;
import org.example.server.dto.seller.SellerMapper;
import org.example.server.dto.seller.SellerRequestDTO;
import org.example.server.dto.seller.SellerResponseDTO;
import org.example.server.enums.UserRole;
import org.example.server.exception.auth.AccessDeniedException;
import org.example.server.exception.generic.DataAlreadyExistsException;
import org.example.server.exception.generic.RecordNotFoundException;
import org.example.server.model.Dealer;
import org.example.server.model.Seller;
import org.example.server.model.User;
import org.example.server.repository.DealerRepository;
import org.example.server.repository.ProposalRepository;
import org.example.server.repository.RefreshTokenRepository;
import org.example.server.repository.SellerRepository;
import org.example.server.repository.UserRepository;
import org.example.server.service.EmailService;
import org.example.server.service.factory.SellerUserFactory;
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

    public SellerService(
            SellerRepository sellerRepository,
            UserRepository userRepository,
            SellerMapper sellerMapper,
            AddressMapper addressMapper,
            EmailService emailService,
            DealerRepository dealerRepository,
            ProposalRepository proposalRepository,
            RefreshTokenRepository refreshTokenRepository,
            SellerUserFactory sellerUserFactory) {
        this.sellerRepository = sellerRepository;
        this.userRepository = userRepository;
        this.sellerMapper = sellerMapper;
        this.addressMapper = addressMapper;
        this.emailService = emailService;
        this.dealerRepository = dealerRepository;
        this.proposalRepository = proposalRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.sellerUserFactory = sellerUserFactory;
    }

    @Transactional
    public SellerResponseDTO create(User user, SellerRequestDTO sellerRequestDTO) {

        if (!user.getRole().equals(UserRole.ADMIN)) {
            throw new AccessDeniedException("Apenas ADMIN pode cadastrar vendedor.");
        }

        if (userRepository.existsByEmail(sellerRequestDTO.email())) {
            throw new DataAlreadyExistsException("Email ja existe.");
        }

        if (sellerRepository.existsByPhone(sellerRequestDTO.phone())) {
            throw new DataAlreadyExistsException("Telefone ja existe.");
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

        // Garantir que o email seja setado se por acaso a factory não o fizer
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

        return sellerMapper.toDTO(sellerRepository.save(seller));
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

    public SellerResponseDTO update(Long id, SellerRequestDTO sellerRequestDTO) {
        Seller seller = sellerRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException(id));

        User user = seller.getUser();
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
            // Admin can see all sellers
            if (dealerId != null) {
                return sellerRepository.findByDealerId(dealerId).stream()
                        .map(sellerMapper::toDTO)
                        .toList();
            }
            return sellerRepository.findAll().stream()
                    .map(sellerMapper::toDTO)
                    .toList();
        }

        // Operator - get allowed dealer IDs
        if (requester.getOperator() == null) {
            return java.util.List.of();
        }

        allowedDealerIds = requester.getOperator().getDealerIds();

        if (allowedDealerIds == null || allowedDealerIds.isEmpty()) {
            return java.util.List.of();
        }

        // If specific dealer requested, validate it's in allowed list
        if (dealerId != null) {
            if (!allowedDealerIds.contains(dealerId)) {
                throw new AccessDeniedException("Operador nao tem acesso a esta loja.");
            }
            return sellerRepository.findByDealerId(dealerId).stream()
                    .map(sellerMapper::toDTO)
                    .toList();
        }

        // Return all sellers from allowed dealers
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
            // Admin can see all sellers
            return sellerRepository.findAll().stream()
                    .map(sellerMapper::toDTO)
                    .toList();
        }

        // Manager - get their dealer
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
