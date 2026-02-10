package com.tws.auth.service;

import com.tws.auth.config.CodeProperties;
import com.tws.auth.config.JwtProperties;
import com.tws.auth.dto.AdminCreateUserRequest;
import com.tws.auth.dto.AdminResetPasswordRequest;
import com.tws.auth.dto.AdminUserResponse;
import com.tws.auth.dto.AuthResponse;
import com.tws.auth.dto.ChangePasswordRequest;
import com.tws.auth.dto.GenericResponse;
import com.tws.auth.dto.LoginRequest;
import com.tws.auth.dto.MeResponse;
import com.tws.auth.dto.RefreshRequest;
import com.tws.auth.dto.RegisterRequest;
import com.tws.auth.dto.RegisterResponse;
import com.tws.auth.dto.ResetPasswordRequest;
import com.tws.auth.dto.VerifyCodeRequest;
import com.tws.auth.model.RefreshToken;
import com.tws.auth.model.User;
import com.tws.auth.model.VerificationCode;
import com.tws.auth.repository.RefreshTokenRepository;
import com.tws.auth.repository.UserRepository;
import com.tws.auth.repository.VerificationCodeRepository;
import java.time.Instant;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {
    public static final String ROLE_ADMIN = "ADMIN";
    public static final String ROLE_OPERADOR = "OPERADOR";
    public static final String ROLE_VENDEDOR = "VENDEDOR";
    public static final String ROLE_GESTOR = "GESTOR";    private static final String PURPOSE_REGISTER = "REGISTER";
    private static final String PURPOSE_PASSWORD_RESET = "PASSWORD_RESET";
    private static final Set<String> ADMIN_MANAGED_ROLES = Set.of(
            ROLE_ADMIN,
            ROLE_OPERADOR,
            ROLE_VENDEDOR,
            ROLE_GESTOR
    );

    private final UserRepository userRepository;
    private final VerificationCodeRepository verificationCodeRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final CodeService codeService;
    private final MailService mailService;
    private final CodeProperties codeProperties;
    private final JwtProperties jwtProperties;

    public AuthService(
            UserRepository userRepository,
            VerificationCodeRepository verificationCodeRepository,
            RefreshTokenRepository refreshTokenRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            CodeService codeService,
            MailService mailService,
            CodeProperties codeProperties,
            JwtProperties jwtProperties) {
        this.userRepository = userRepository;
        this.verificationCodeRepository = verificationCodeRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.codeService = codeService;
        this.mailService = mailService;
        this.codeProperties = codeProperties;
        this.jwtProperties = jwtProperties;
    }

    public RegisterResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.getEmail());
        if (userRepository.findByEmail(email).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email ja cadastrado");
        }
        Instant now = Instant.now();
        User user = new User(
                UUID.randomUUID(),
                request.getName(),
                email,
                passwordEncoder.encode(request.getPassword()),
                ROLE_ADMIN,
                false,
                true,
                null,
                null,
                null,
                now,
                now);
        User saved = userRepository.save(user);
        createAndSendCode(saved.getEmail(), saved.getName(), PURPOSE_REGISTER);
        return new RegisterResponse(saved.getId(), saved.getEmail(), true);
    }

    public AuthResponse login(LoginRequest request) {
        return loginInternal(request, null);
    }

    public AuthResponse loginForRole(LoginRequest request, String requiredRole) {
        return loginInternal(request, requiredRole);
    }

    public AdminUserResponse createUserByAdmin(AdminCreateUserRequest request) {
        String email = normalizeEmail(request.getEmail());
        String role = normalizeRole(request.getRole());
        if (!ADMIN_MANAGED_ROLES.contains(role)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role invalida");
        }
        if (userRepository.findByEmail(email).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email ja cadastrado");
        }
        Instant now = Instant.now();
        User user = new User(
                UUID.randomUUID(),
                request.getName(),
                email,
                passwordEncoder.encode(request.getPassword()),
                role,
                true,
                true,
                request.getPhone(),
                request.getCpf(),
                request.getAddress(),
                now,
                now);
        User saved = userRepository.save(user);
        return new AdminUserResponse(
                saved.getId(),
                saved.getName(),
                saved.getEmail(),
                saved.getRole(),
                saved.isVerified(),
                saved.isActive());
    }

    public GenericResponse setUserActive(UUID userId, boolean active) {
        Instant now = Instant.now();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario nao encontrado"));
        user.setActive(active);
        user.setUpdatedAt(now);
        userRepository.save(user);
        return new GenericResponse(active ? "Usuario desbloqueado" : "Usuario bloqueado");
    }

    public GenericResponse resetPasswordByAdmin(UUID userId, AdminResetPasswordRequest request) {
        Instant now = Instant.now();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario nao encontrado"));
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setUpdatedAt(now);
        userRepository.save(user);
        return new GenericResponse("Senha atualizada");
    }

    public AuthResponse refresh(RefreshRequest request) {
        Instant now = Instant.now();
        RefreshToken refreshToken = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token invalido"));
        if (refreshToken.getRevokedAt() != null || refreshToken.getExpiresAt().isBefore(now)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token expirado");
        }
        User user = userRepository.findById(refreshToken.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario nao encontrado"));
        refreshToken.setRevokedAt(now);
        refreshTokenRepository.save(refreshToken);
        return issueTokens(user);
    }

    public GenericResponse logout(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            return new GenericResponse("Logout realizado");
        }
        refreshTokenRepository.findByToken(refreshToken).ifPresent(token -> {
            token.setRevokedAt(Instant.now());
            refreshTokenRepository.save(token);
        });
        return new GenericResponse("Logout realizado");
    }

    public GenericResponse forgotPassword(String email) {
        String normalized = normalizeEmail(email);
        Optional<User> user = userRepository.findByEmail(normalized);
        user.ifPresent(value -> createAndSendCode(value.getEmail(), value.getName(), PURPOSE_PASSWORD_RESET));
        return new GenericResponse("Se existir uma conta, o codigo foi enviado");
    }

    public GenericResponse resetPassword(ResetPasswordRequest request) {
        String email = normalizeEmail(request.getEmail());
        Instant now = Instant.now();
        VerificationCode code = verificationCodeRepository
                .findValidCode(email, PURPOSE_PASSWORD_RESET, request.getCode(), now)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Codigo invalido"));
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario nao encontrado"));
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setUpdatedAt(now);
        code.setUsedAt(now);
        userRepository.save(user);
        verificationCodeRepository.save(code);
        return new GenericResponse("Senha atualizada");
    }

    public GenericResponse verifyCode(VerifyCodeRequest request) {
        String email = normalizeEmail(request.getEmail());
        Instant now = Instant.now();
        VerificationCode code = verificationCodeRepository
                .findValidCode(email, PURPOSE_REGISTER, request.getCode(), now)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Codigo invalido"));
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario nao encontrado"));
        user.setVerified(true);
        user.setUpdatedAt(now);
        code.setUsedAt(now);
        userRepository.save(user);
        verificationCodeRepository.save(code);
        return new GenericResponse("Conta verificada");
    }

    public GenericResponse resendCode(String email) {
        String normalized = normalizeEmail(email);
        User user = userRepository.findByEmail(normalized)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario nao encontrado"));
        if (user.isVerified()) {
            return new GenericResponse("Conta ja verificada");
        }
        createAndSendCode(user.getEmail(), user.getName(), PURPOSE_REGISTER);
        return new GenericResponse("Codigo reenviado");
    }

    public GenericResponse changePassword(UUID userId, ChangePasswordRequest request) {
        Instant now = Instant.now();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario nao encontrado"));
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Senha atual incorreta");
        }
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setUpdatedAt(now);
        userRepository.save(user);
        return new GenericResponse("Senha alterada");
    }

    public MeResponse toMeResponse(User user) {
        return new MeResponse(user.getId(), user.getName(), user.getEmail(), user.getRole(), user.isVerified());
    }

    private AuthResponse loginInternal(LoginRequest request, String requiredRole) {
        String email = normalizeEmail(request.getEmail());
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciais invalidas"));
        if (!user.isActive()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Usuario bloqueado");
        }
        if (!user.isVerified()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Conta nao verificada");
        }
        if (requiredRole != null && !requiredRole.equalsIgnoreCase(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Role invalida");
        }
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciais invalidas");
        }
        return issueTokens(user);
    }

    private AuthResponse issueTokens(User user) {
        String accessToken = jwtService.generateAccessToken(user.getId(), user.getEmail(), user.getRole());
        String refreshToken = jwtService.generateRefreshToken(user.getId(), user.getEmail(), user.getRole());
        Instant now = Instant.now();
        RefreshToken token = new RefreshToken(
                UUID.randomUUID(),
                user.getId(),
                refreshToken,
                now.plus(jwtProperties.getRefreshTokenTtl()),
                null,
                now);
        refreshTokenRepository.save(token);
        return new AuthResponse(accessToken, refreshToken, jwtProperties.getAccessTokenTtl().toSeconds());
    }

    private void createAndSendCode(String email, String name, String purpose) {
        String code = codeService.generateNumericCode(6);
        Instant now = Instant.now();
        VerificationCode verificationCode = new VerificationCode(
                UUID.randomUUID(),
                email,
                code,
                purpose,
                now.plus(codeProperties.getTtl()),
                null,
                now);
        verificationCodeRepository.save(verificationCode);
        mailService.sendVerificationCode(email, name, code);
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    private String normalizeRole(String role) {
        return role == null ? null : role.trim().toUpperCase();
    }
}


