package org.example.server.modules.manager.service;

import org.example.server.core.email.EmailService;
import org.example.server.shared.address.dto.AddressMapper;
import org.example.server.modules.manager.dto.ManagerMapper;
import org.example.server.modules.manager.dto.ManagerRequestDTO;
import org.example.server.modules.manager.dto.ManagerResponseDTO;
import org.example.server.modules.user.model.UserRole;
import org.example.server.modules.auth.exception.AccessDeniedException;
import org.example.server.core.exception.generic.DataAlreadyExistsException;
import org.example.server.core.exception.generic.RecordNotFoundException;
import org.example.server.modules.dealer.model.Dealer;
import org.example.server.modules.manager.model.Manager;
import org.example.server.modules.user.model.User;
import org.example.server.modules.dealer.repository.DealerRepository;
import org.example.server.modules.manager.repository.ManagerRepository;
import org.example.server.modules.auth.repository.RefreshTokenRepository;
import org.example.server.modules.user.repository.UserRepository;
import org.example.server.modules.manager.factory.ManagerUserFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@Service
public class ManagerService {

    private final ManagerRepository managerRepository;
    private final UserRepository userRepository;
    private final ManagerMapper managerMapper;
    private final AddressMapper addressMapper;
    private final EmailService emailService;
    private final DealerRepository dealerRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final ManagerUserFactory managerUserFactory;

    public ManagerService(
            ManagerRepository managerRepository,
            UserRepository userRepository,
            ManagerMapper managerMapper,
            AddressMapper addressMapper,
            EmailService emailService,
            DealerRepository dealerRepository,
            RefreshTokenRepository refreshTokenRepository,
            ManagerUserFactory managerUserFactory) {
        this.managerRepository = managerRepository;
        this.userRepository = userRepository;
        this.managerMapper = managerMapper;
        this.addressMapper = addressMapper;
        this.emailService = emailService;
        this.dealerRepository = dealerRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.managerUserFactory = managerUserFactory;
    }

    @Transactional
    public ManagerResponseDTO create(User user, ManagerRequestDTO managerRequestDTO) {

        if (!user.getRole().equals(UserRole.ADMIN)) {
            System.err.println(
                    "[DEBUG] Usuario " + user.getEmail() + " tentou criar gestor mas tem role: " + user.getRole());
            throw new AccessDeniedException("Apenas ADMIN pode cadastrar gestor. Seu role atual: " + user.getRole());
        }

        if (userRepository.existsByEmail(managerRequestDTO.email())) {
            throw new DataAlreadyExistsException("Email ja existe.");
        }

        if (managerRepository.existsByPhone(managerRequestDTO.phone())) {
            throw new DataAlreadyExistsException("Telefone ja existe.");
        }

        if (managerRequestDTO.CPF() != null && !managerRequestDTO.CPF().isBlank()
                && managerRepository.existsByCPF(managerRequestDTO.CPF())) {
            throw new DataAlreadyExistsException("CPF ja existe.");
        }

        Dealer dealer = null;
        if (managerRequestDTO.dealerId() != null) {
            dealer = dealerRepository.findById(managerRequestDTO.dealerId())
                    .orElseThrow(() -> new RecordNotFoundException("Lojista nao encontrado."));
        }

        User newUser = managerUserFactory.create(
                managerRequestDTO.fullName(),
                managerRequestDTO.email(),
                managerRequestDTO.password());

        Manager manager = new Manager();
        manager.setPhone(managerRequestDTO.phone());
        manager.setCPF(managerRequestDTO.CPF());
        manager.setBirthData(managerRequestDTO.birthData());
        manager.setAddress(addressMapper.toEntity(managerRequestDTO.address()));
        manager.setUser(newUser);
        manager.setCanView(managerRequestDTO.canView() != null ? managerRequestDTO.canView() : true);
        manager.setCanCreate(managerRequestDTO.canCreate() != null ? managerRequestDTO.canCreate() : true);
        manager.setCanUpdate(managerRequestDTO.canUpdate() != null ? managerRequestDTO.canUpdate() : true);
        manager.setCanDelete(managerRequestDTO.canDelete() != null ? managerRequestDTO.canDelete() : true);
        manager.setDealer(dealer);

        newUser.setManager(manager);

        emailService.sendPasswordToEmail(managerRequestDTO.email(), managerRequestDTO.password());

        return managerMapper.toDTO(managerRepository.save(manager));
    }

    public List<ManagerResponseDTO> findAll(Long dealerId) {
        List<Manager> managers = dealerId != null
                ? managerRepository.findByDealerId(dealerId)
                : managerRepository.findAll();

        return managers
                .stream()
                .map(managerMapper::toDTO)
                .collect(java.util.stream.Collectors.toList());
    }

    public ManagerResponseDTO findById(@PathVariable Long id) {
        return managerMapper.toDTO(managerRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException(id)));
    }

    public ManagerResponseDTO updateDealer(User requester, Long managerId, Long dealerId) {
        if (!requester.getRole().equals(UserRole.ADMIN)) {
            throw new AccessDeniedException("Apenas ADMIN pode reatribuir gestor.");
        }

        Manager manager = managerRepository.findById(managerId)
                .orElseThrow(() -> new RecordNotFoundException(managerId));
        if (dealerId != null) {
            Dealer dealer = dealerRepository.findById(dealerId)
                    .orElseThrow(() -> new RecordNotFoundException("Lojista nao encontrado."));
            manager.setDealer(dealer);
        } else {
            manager.setDealer(null);
        }
        managerRepository.save(manager);
        return managerMapper.toDTO(manager);
    }

    public ManagerResponseDTO update(User requester, Long id, ManagerRequestDTO managerRequestDTO) {
        if (!requester.getRole().equals(UserRole.ADMIN)) {
            throw new AccessDeniedException("Apenas ADMIN pode atualizar gestor.");
        }

        Manager manager = managerRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException(id));

        User managerUser = manager.getUser();

        // Check email uniqueness if email is being changed
        if (!managerUser.getEmail().equalsIgnoreCase(managerRequestDTO.email())
                && userRepository.existsByEmail(managerRequestDTO.email())) {
            throw new DataAlreadyExistsException("Email ja esta em uso.");
        }

        Dealer dealer = manager.getDealer();
        if (managerRequestDTO.dealerId() != null) {
            dealer = dealerRepository.findById(managerRequestDTO.dealerId())
                    .orElseThrow(() -> new RecordNotFoundException("Lojista nao encontrado."));
        }

        managerUser.setFullName(managerRequestDTO.fullName());
        managerUser.setEmail(managerRequestDTO.email());

        manager.setPhone(managerRequestDTO.phone());
        manager.setCPF(managerRequestDTO.CPF());
        manager.setBirthData(managerRequestDTO.birthData());
        manager.setAddress(addressMapper.toEntity(managerRequestDTO.address()));
        manager.setCanView(managerRequestDTO.canView() != null ? managerRequestDTO.canView() : manager.getCanView());
        manager.setCanCreate(
                managerRequestDTO.canCreate() != null ? managerRequestDTO.canCreate() : manager.getCanCreate());
        manager.setCanUpdate(
                managerRequestDTO.canUpdate() != null ? managerRequestDTO.canUpdate() : manager.getCanUpdate());
        manager.setCanDelete(
                managerRequestDTO.canDelete() != null ? managerRequestDTO.canDelete() : manager.getCanDelete());
        manager.setDealer(dealer);

        userRepository.save(managerUser);
        managerRepository.save(manager);

        return managerMapper.toDTO(manager);
    }

    public void delete(User requester, Long managerId) {
        if (!requester.getRole().equals(UserRole.ADMIN)) {
            throw new AccessDeniedException("Apenas ADMIN pode remover gestor.");
        }
        Manager manager = managerRepository.findById(managerId)
                .orElseThrow(() -> new RecordNotFoundException(managerId));
        User managerUser = manager.getUser();
        if (managerUser != null) {
            refreshTokenRepository.deleteByUser(managerUser);
        }
        managerRepository.delete(manager);
    }
}
