package org.example.server.modules.user.service;

import org.example.server.core.email.EmailService;
import org.example.server.modules.auth.dto.*;
import org.example.server.modules.auth.service.JwtService;
import org.example.server.modules.user.dto.UserMapper;
import org.example.server.modules.user.dto.UserRequestDTO;
import org.example.server.modules.user.dto.UserResponseDTO;
import org.example.server.modules.user.dto.UserProfileUpdateDTO;
import org.example.server.modules.user.model.UserRole;
import org.example.server.modules.user.model.UserStatus;
import org.example.server.modules.auth.exception.AccessDeniedException;
import org.example.server.modules.auth.exception.CodeInvalidException;
import org.example.server.modules.auth.exception.InvalidPasswordException;
import org.example.server.core.exception.generic.DataAlreadyExistsException;
import org.example.server.core.exception.generic.RecordNotFoundException;
import org.example.server.modules.user.exception.UserAlreadyVerifiedException;
import org.example.server.modules.user.exception.UserNotVerifiedException;
import org.example.server.modules.user.model.User;
import org.example.server.modules.dealer.repository.DealerRepository;
import org.example.server.modules.user.repository.UserRepository;
import org.example.server.core.util.VerificationCodeGenerator;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final DealerRepository dealerRepository;
    @SuppressWarnings("unused")
    private final UserDetailsService userDetailsService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager manager;
    private final EmailService emailService;
    private final UserMapper userMapper;
    private final VerificationCodeGenerator codeGenerator;

    public UserService(
            UserRepository userRepository,
            DealerRepository dealerRepository,
            UserDetailsService userDetailsService,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationManager manager,
            EmailService emailService,
            UserMapper userMapper,
            VerificationCodeGenerator codeGenerator) {
        this.userRepository = userRepository;
        this.dealerRepository = dealerRepository;
        this.userDetailsService = userDetailsService;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.manager = manager;
        this.emailService = emailService;
        this.userMapper = userMapper;
        this.codeGenerator = codeGenerator;
    }

    public UserResponseDTO create(UserRequestDTO userRequestDTO) {
        return create(userRequestDTO, true);
    }

    @Transactional
    public UserResponseDTO create(UserRequestDTO userRequestDTO, boolean sendVerification) {
        if (userRepository.existsByEmail(userRequestDTO.email())) {
            throw new DataAlreadyExistsException("E-mail já cadastrado");
        }

        User user = userMapper.toEntity(userRequestDTO);

        user.setRole(UserRole.ADMIN);

        user.setPassword(passwordEncoder.encode(user.getPassword()));

        user.generateVerificationCode(codeGenerator.generate(), Duration.ofMinutes(10));
        userRepository.save(user);

        if (sendVerification) {
            emailService.sendVerificationEmail(user.getEmail(), user.getVerificationCode());
        }

        return userMapper.toDto(user);
    }

    @Transactional
    public void changePassword(String email, ChangePasswordDTO changePasswordDTO) {
        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RecordNotFoundException("Usuário não encontrado com o e-mail: " + email));

        if (!passwordEncoder.matches(changePasswordDTO.oldPassword(), user.getPassword())) {
            throw new InvalidPasswordException("Senha atual incorreta");
        }

        if (passwordEncoder.matches(changePasswordDTO.newPassword(), user.getPassword())) {
            throw new InvalidPasswordException("A nova senha não pode ser igual à senha atual");
        }

        user.setPassword(passwordEncoder.encode(changePasswordDTO.newPassword()));
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public String login(AuthRequest request) {
        String username = resolveLoginIdentifier(request);

        manager.authenticate(
                new UsernamePasswordAuthenticationToken(username, request.password()));

        User user = (User) loadUserByUsername(username);

        if (user.getVerificationStatus() == UserStatus.PENDENTE) {
            throw new UserNotVerifiedException("Conta ainda não verificada. Verifique seu e-mail.");
        }

        ensureDealerAssociation(user);

        return jwtService.generateToken(user);
    }

    @Transactional
    public void verifyUser(VerificationCodeRequestDTO verificationCodeRequestDTO) {
        User user = userRepository.findByEmail(verificationCodeRequestDTO.email())
                .orElseThrow(() -> new RecordNotFoundException(
                        "Usuario não encontrado com o e-mail: " + verificationCodeRequestDTO.email()));

        if (user.getVerificationStatus() == UserStatus.ATIVO) {
            throw new UserAlreadyVerifiedException("Usuário já verificado");
        }
        if (user.isVerificationCodeExpired()) {
            throw new CodeInvalidException("Código expirado. Solicite um novo código");
        }
        if (!user.doesVerificationCodeMatch(verificationCodeRequestDTO.code())) {
            throw new CodeInvalidException("Código inválido");
        }

        user.markAsVerified();
        userRepository.save(user);
    }

    @Transactional
    public void resendCode(EmailResponseDTO dto) {
        User user = userRepository.findByEmail(dto.email())
                .orElseThrow(() -> new RecordNotFoundException("Usuario não encontrado com e-mail: " + dto.email()));

        if (user.getVerificationStatus() == UserStatus.ATIVO) {
            throw new UserAlreadyVerifiedException("Usuário já verificado. Não é necessário reenviar o código.");
        }

        user.generateVerificationCode(codeGenerator.generate(), Duration.ofMinutes(10));
        userRepository.save(user);

        emailService.sendVerificationEmail(user.getEmail(), user.getVerificationCode());
    }

    @Transactional
    public void requestPasswordReset(PasswordResetRequestDTO passwordResetRequestDTO) {
        User user = userRepository.findByEmail(passwordResetRequestDTO.email())
                .orElseThrow(() -> new RecordNotFoundException(
                        "Usuário não encontrado com e-mail: " + passwordResetRequestDTO.email()));

        String resetCode = codeGenerator.generate();
        user.generateResetCode(resetCode, Duration.ofMinutes(10));

        userRepository.save(user);
        emailService.sendPasswordResetEmail(user.getEmail(), resetCode);
    }

    @Transactional
    public void resetPassword(PasswordResetConfirmRequestDTO passwordResetConfirmRequestDTO) {
        User user = userRepository.findByEmail(passwordResetConfirmRequestDTO.email())
                .orElseThrow(() -> new RecordNotFoundException(
                        "Usuário não encontrado com e-mail: " + passwordResetConfirmRequestDTO.email()));

        if (user.isResetCodeExpired()) {
            throw new CodeInvalidException("Código de redefinição expirado. Solicite um novo.");
        }
        if (!user.doesResetCodeMatch(passwordResetConfirmRequestDTO.code())) {
            throw new CodeInvalidException("Código inválido.");
        }

        user.setPassword(passwordEncoder.encode(passwordResetConfirmRequestDTO.newPassword()));
        user.clearResetCode();
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public List<UserResponseDTO> findAll(Optional<UserRole> role) {
        List<User> users = role.map(userRepository::findByRole)
                .orElseGet(userRepository::findAll);
        return users.stream()
                .map(userMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UserResponseDTO findById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException(id));
        return userMapper.toDto(user);
    }

    @Transactional
    public UserResponseDTO updateProfile(Long userId, UserProfileUpdateDTO dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RecordNotFoundException(userId));

        if (dto.email() != null && !dto.email().isBlank()) {
            String normalizedEmail = dto.email().trim();
            if (!normalizedEmail.equalsIgnoreCase(user.getEmail())
                    && userRepository.existsByEmail(normalizedEmail)) {
                throw new DataAlreadyExistsException("E-mail já cadastrado");
            }
            user.setEmail(normalizedEmail);
        }

        if (dto.fullName() != null && !dto.fullName().isBlank()) {
            user.setFullName(dto.fullName().trim());
        }

        return userMapper.toDto(userRepository.save(user));
    }

    @Transactional
    public UserResponseDTO updateDealer(Long userId, Long dealerId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RecordNotFoundException("Usuário não encontrado"));

        if (user.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("Apenas administradores podem ser vinculados diretamente a um lojista.");
        }

        if (dealerId != null && dealerId > 0) {
            var dealer = dealerRepository.findById(dealerId)
                    .orElseThrow(() -> new RecordNotFoundException("Lojista não encontrado"));
            user.setDealer(dealer);
        } else {
            user.setDealer(null);
        }

        return userMapper.toDto(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String identifier) {
        return userRepository.findByEmail(identifier)
                .or(() -> dealerRepository.findByEnterpriseIgnoreCase(identifier)
                        .map(dealer -> (User) dealer.getUser()))
                .orElseThrow(
                        () -> new RecordNotFoundException("Usuário não encontrado com identificador: " + identifier));
    }

    public String resolveLoginIdentifier(AuthRequest request) {
        if (request.enterprise() != null && !request.enterprise().isBlank()) {
            return request.enterprise().trim();
        }
        if (request.email() != null && !request.email().isBlank()) {
            return request.email().trim();
        }
        throw new IllegalArgumentException("Identificador de login ausente");
    }

    private void ensureDealerAssociation(User user) {
        UserRole role = user.getRole();
        if (role == null) {
            throw new AccessDeniedException("Perfil de usuário não configurado.");
        }

        boolean hasDealerAssociation = switch (role) {
            case ADMIN -> true;
            case LOJISTA -> user.getDealer() != null;
            case GESTOR -> user.getManager() != null && user.getManager().getDealer() != null;
            case OPERADOR -> user.getOperator() != null &&
                    (user.getOperator().getDealerLinks() != null && !user.getOperator().getDealerLinks().isEmpty()
                            || user.getOperator().getDealer() != null);
            case VENDEDOR -> user.getSeller() != null && user.getSeller().getDealer() != null;
        };

        if (!hasDealerAssociation) {
            throw new AccessDeniedException(
                    "Usuário não está associado a uma loja. Solicite o vínculo com um lojista para acessar o painel.");
        }
    }

}



