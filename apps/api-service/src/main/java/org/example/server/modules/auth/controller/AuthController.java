package org.example.server.modules.auth.controller;

import java.time.Duration;
import java.time.Instant;

import org.example.server.core.web.Api_Response;
import org.example.server.modules.auth.dto.AuthRequest;
import org.example.server.modules.auth.dto.AuthResponseDTO;
import org.example.server.modules.auth.dto.ChangePasswordDTO;
import org.example.server.modules.auth.dto.EmailResponseDTO;
import org.example.server.modules.auth.dto.PasswordResetConfirmRequestDTO;
import org.example.server.modules.auth.dto.PasswordResetRequestDTO;
import org.example.server.modules.auth.dto.UserResponseDTO;
import org.example.server.modules.auth.dto.VerificationCodeRequestDTO;
import org.example.server.modules.auth.model.RefreshToken;
import org.example.server.modules.auth.service.JwtService;
import org.example.server.modules.auth.service.RefreshTokenService;
import org.example.server.modules.dealer.dto.DealerRegistrationRequestDTO;
import org.example.server.modules.dealer.dto.DealerRegistrationResponseDTO;
import org.example.server.modules.dealer.service.DealerService;
import org.example.server.modules.user.model.User;
import org.example.server.modules.user.service.UserService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/grota-financiamentos/auth")
@Tag(name = "Auth", description = "Authentication management")
public class AuthController {

        private final JwtService jwtService;
        private final UserService userService;
        private final DealerService dealerService;
        private final RefreshTokenService refreshTokenService;
        private final boolean cookieSecure;
        private final String cookieSameSite;

        public AuthController(
                        JwtService jwtService,
                        UserService userService,
                        DealerService dealerService,
                        RefreshTokenService refreshTokenService,
                        @Value("${app.security.cookies.secure:true}") boolean cookieSecure,
                        @Value("${app.security.cookies.same-site:Lax}") String cookieSameSite) {
                this.jwtService = jwtService;
                this.userService = userService;
                this.dealerService = dealerService;
                this.refreshTokenService = refreshTokenService;
                this.cookieSecure = cookieSecure;
                this.cookieSameSite = cookieSameSite;
        }
 
        @PostMapping("/register")
        @Operation(summary = "Cadastrar Lojista", description = "Cadastra um Lojista no banco de dados")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "201", description = "Lojista cadastrada com sucesso"),
                        @ApiResponse(responseCode = "400", description = "Dados inválidos"),
                        @ApiResponse(responseCode = "500", description = "Erro interno no servidor")
        })
        public ResponseEntity<DealerRegistrationResponseDTO> create(
                        @Valid @RequestBody DealerRegistrationRequestDTO dealerRegistrationRequestDTO) {
                DealerRegistrationResponseDTO responseDTO = dealerService.create(dealerRegistrationRequestDTO);
                return ResponseEntity.status(HttpStatus.CREATED).body(responseDTO);
        }

        @PostMapping("/login")
        @Operation(summary = "Login do Lojista", description = "Realiza a autenticação de um lojista no sistema, retornando o token de acesso em caso de sucesso.")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Login realizado com sucesso. Token de autenticação retornado."),
                        @ApiResponse(responseCode = "401", description = "Não autorizado. Credencias inválidas"),
                        @ApiResponse(responseCode = "500", description = "Erro interno no servidor.")
        })
        public ResponseEntity<AuthResponseDTO> login(@RequestBody @Valid AuthRequest request) {
                String accessToken = userService.login(request);
                String loginIdentifier = userService.resolveLoginIdentifier(request);
                UserDetails userDetails = userService.loadUserByUsername(loginIdentifier);

                RefreshToken refreshToken = refreshTokenService.createRefreshToken(
                                ((User) userDetails).getId());

                ResponseCookie accessTokenCookie = createAuthCookie(accessToken, false);
                ResponseCookie refreshTokenCookie = createRefreshCookie(refreshToken.getTokenHash(), false);

                Instant expiresAt = jwtService.getExpirationDateFromToken(accessToken);

                AuthResponseDTO response = new AuthResponseDTO(
                                accessToken,
                                refreshToken.getTokenHash(),
                                expiresAt);

                return ResponseEntity.ok()
                                .header(HttpHeaders.SET_COOKIE, accessTokenCookie.toString())
                                .header(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString())
                                .body(response);
        }

        @PostMapping("/refresh")
        @Operation(summary = "Refresh Token", description = "Gera um novo access token usando o refresh token")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Token atualizado com sucesso."),
                        @ApiResponse(responseCode = "401", description = "Refresh token inválido ou expirado."),
                        @ApiResponse(responseCode = "403", description = "Refresh token revogado."),
                        @ApiResponse(responseCode = "500", description = "Erro interno no servidor.")
        })
        public ResponseEntity<AuthResponseDTO> refreshToken(@CookieValue(name = "refresh_token") String refreshToken) {

                String newAccessToken = refreshTokenService.refreshAccessToken(refreshToken, jwtService);
                Instant expiresAt = jwtService.getExpirationDateFromToken(newAccessToken);

                ResponseCookie newAccessTokenCookie = createAuthCookie(newAccessToken, false);

                AuthResponseDTO response = new AuthResponseDTO(
                                newAccessToken,
                                refreshToken,
                                expiresAt);

                return ResponseEntity.ok()
                                .header(HttpHeaders.SET_COOKIE, newAccessTokenCookie.toString())
                                .body(response);
        }

        @PostMapping("/logout")
        @Operation(summary = "Realizar logout", description = "Remover o cookie de autenticação")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Logout realizado com sucesso"),
                        @ApiResponse(responseCode = "401", description = "Não autorizado. Credencias inválidas"),
                        @ApiResponse(responseCode = "500", description = "Erro interno no servidor.")
        })
        public ResponseEntity<Api_Response> logout(
                        @CookieValue(name = "refresh_token", required = false) String refreshToken) {
                if (refreshToken != null && !refreshToken.isBlank()) {
                        refreshTokenService.revokeRefreshToken(refreshToken);
                }

                ResponseCookie expiredAccessCookie = createAuthCookie("", true);
                ResponseCookie expiredRefreshCookie = createRefreshCookie("", true);

                return ResponseEntity.ok()
                                .header(HttpHeaders.SET_COOKIE, expiredAccessCookie.toString())
                                .header(HttpHeaders.SET_COOKIE, expiredRefreshCookie.toString())
                                .body(new Api_Response(true, "Logout realizado com sucesso"));
        }
 
        @GetMapping("/me")
        @Operation(summary = "Obter usuário autenticado", description = "Retorna as informações do usuário atualmente autenticado ")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Lojista autenticado retornado com sucesso"),
                        @ApiResponse(responseCode = "401", description = "Não Autorizado"),
                        @ApiResponse(responseCode = "500", description = "Erro interno no servidor.")
        })
        public ResponseEntity<?> getAuthenticatedUser(@AuthenticationPrincipal User user) {
                if (user == null) {
                        return ResponseEntity.status(401).build();
                }

                Boolean canView = true;
                Boolean canCreate = true;
                Boolean canUpdate = true;
                Boolean canDelete = true;
                Boolean canChangeProposalStatus = true;
                Long dealerId = null;
                java.util.List<Long> allowedDealerIds = null;
                Integer allowedDealersCount = null;

                if (user.getManager() != null) {
                        var m = user.getManager();
                        canView = m.getCanView();
                        canCreate = m.getCanCreate();
                        canUpdate = m.getCanUpdate();
                        canDelete = m.getCanDelete();
                        if (m.getDealer() != null) {
                                dealerId = m.getDealer().getId();
                        }
                } else if (user.getOperator() != null) {
                        var o = user.getOperator();
                        canView = o.getCanView();
                        canCreate = o.getCanCreate();
                        canUpdate = o.getCanUpdate();
                        canDelete = o.getCanDelete();
                        canChangeProposalStatus = o.getCanChangeProposalStatus();
                        allowedDealerIds = o.getDealerIds();
                        allowedDealersCount = allowedDealerIds != null ? allowedDealerIds.size() : 0;
                } else if (user.getSeller() != null) {
                        var s = user.getSeller();
                        canView = s.getCanView();
                        canCreate = s.getCanCreate();
                        canUpdate = s.getCanUpdate();
                        canDelete = s.getCanDelete();
                }

                UserResponseDTO userResponseDTO = new UserResponseDTO(
                                user.getId(),
                                user.getEmail(),
                                user.getDealer() != null ? user.getDealer().getUser().getFullName()
                                                : user.getFullName(),
                                user.getRole(),
                                canView,
                                canCreate,
                                canUpdate,
                                canDelete,
                                canChangeProposalStatus,
                                dealerId,
                                allowedDealerIds,
                                allowedDealersCount);
                return ResponseEntity.ok(userResponseDTO);
        }

        @PutMapping("/verify-code")
        @Operation(summary = "Verificar código de autenticação do usuário", description = "Valida o código de verificação enviado por e-mail ao usuário para concluir o processo de login e ativar o acesso ao sistema.")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Código verificado com sucesso. usuário autenticado."),
                        @ApiResponse(responseCode = "401", description = "Não autorizado"),
                        @ApiResponse(responseCode = "400", description = "Código inválido ou usuário já verificado."),
                        @ApiResponse(responseCode = "404", description = "Usuário não encontrado."),
                        @ApiResponse(responseCode = "410", description = "Código expirado. Solicite um novo código."),
                        @ApiResponse(responseCode = "500", description = "Erro interno no servidor.")
        })
        public ResponseEntity<Api_Response> verifyCode(
                        @RequestBody @Valid VerificationCodeRequestDTO verificationCodeRequestDTO) {
                userService.verifyUser(verificationCodeRequestDTO);
                return ResponseEntity.ok(new Api_Response(true, "Usuário verificado com sucesso"));
        }

        @Operation(summary = "Reenvia o código de verificação para o e-mail", description = "Permite que o usuário solicite o reenvio do código de verificação caso não tenha recebido ou o código anterior tenha expirado. "
                        + "Um novo código é gerado e enviado para o e-mail cadastrado, com tempo de expiração definido.")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Novo código de verificação enviado com sucesso"),
                        @ApiResponse(responseCode = "400", description = "Requisição inválida. Verifique se o e-mail foi informado corretamente."),
                        @ApiResponse(responseCode = "409", description = "Usuário já verificado. Reenvio não necessário."),
                        @ApiResponse(responseCode = "500", description = "Erro interno no servidor.")
        })
        @PostMapping("/resend-code")
        public ResponseEntity<Api_Response> resendCode(@RequestBody EmailResponseDTO dto) {
                userService.resendCode(dto);
                return ResponseEntity.ok(new Api_Response(true, "Código reenviado som sucesso"));
        }

        @PutMapping("/change-password")
        @Operation(summary = "Alterar senha do usuário", description = "Permite que o usuário autenticado altere sua senha informando a senha atual e a nova senha desejada.")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Senha alterada com sucesso."),
                        @ApiResponse(responseCode = "400", description = "Requisição inválida. Verifique os dados informados."),
                        @ApiResponse(responseCode = "401", description = "Não autorizado. É necessário estar autenticado para alterar a senha."),
                        @ApiResponse(responseCode = "500", description = "Erro interno no servidor.")
        })
        public ResponseEntity<Api_Response> changePassword(@RequestBody @Valid ChangePasswordDTO changePasswordDTO,
                        Authentication authentication) {
                String email = authentication.getName();
                userService.changePassword(email, changePasswordDTO);
                return ResponseEntity.ok(new Api_Response(true, "Senha alterada com sucesso"));
        }

        @PostMapping("/forgot-password")
        @Operation(summary = "Solicitar redefinição de senha do usuário", description = "Permite que o usuário solicite a redefinição de senha. Um código de verificação será enviado para o e-mail cadastrado.")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Código de redefinição enviado com sucesso."),
                        @ApiResponse(responseCode = "400", description = "Requisição inválida. Verifique o e-mail informado."),
                        @ApiResponse(responseCode = "404", description = "E-mail não encontrado."),
                        @ApiResponse(responseCode = "500", description = "Erro interno no servidor.")
        })
        public ResponseEntity<Api_Response> resetPassword(
                        @Valid @RequestBody PasswordResetRequestDTO passwordResetRequestDTO) {
                userService.requestPasswordReset(passwordResetRequestDTO);
                return ResponseEntity.ok(new Api_Response(true, "Código de redefinição enviado para o email"));
        }

        @PostMapping("/reset-password")
        @Operation(summary = "Confirmar redefinição de senha do usuário", description = "Permite que o usuario redefina a senha utilizando o código enviado por e-mail e informando a nova senha desejada.")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Senha alterada com sucesso."),
                        @ApiResponse(responseCode = "400", description = "Requisição inválida. Verifique os dados informados, incluindo o código de verificação."),
                        @ApiResponse(responseCode = "401", description = "Código de verificação inválido ou expirado."),
                        @ApiResponse(responseCode = "404", description = "Usuário não encontrado."),
                        @ApiResponse(responseCode = "500", description = "Erro interno no servidor.")
        })
        public ResponseEntity<Api_Response> resetPassword(
                        @Valid @RequestBody PasswordResetConfirmRequestDTO passwordResetConfirmRequestDTO) {
                userService.resetPassword(passwordResetConfirmRequestDTO);
                return ResponseEntity.ok(new Api_Response(true, "Senha alterada com sucesso"));
        }

        @SuppressWarnings("null")
        private ResponseCookie createAuthCookie(String token, boolean expire) {
                return ResponseCookie.from("access_token", expire ? "" : token)
                                .httpOnly(true)
                                .secure(cookieSecure)
                                .sameSite(cookieSameSite)
                                .domain(null)
                                .path("/")
                                .maxAge(expire ? Duration.ZERO : Duration.ofMinutes(15)) // 15 minutos para access token
                                .build();
        }

        @SuppressWarnings("null")
        private ResponseCookie createRefreshCookie(String token, boolean expire) {
                return ResponseCookie.from("refresh_token", expire ? "" : token)
                                .httpOnly(true)
                                .secure(cookieSecure)
                                .sameSite(cookieSameSite)
                                .path("/")
                                .maxAge(expire ? Duration.ZERO : Duration.ofDays(7)) // 7 dias para refresh token
                                .build();
        }
}


