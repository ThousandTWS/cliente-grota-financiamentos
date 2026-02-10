package com.tws.auth.controller;

import com.tws.auth.dto.AuthResponse;
import com.tws.auth.dto.ChangePasswordRequest;
import com.tws.auth.dto.ForgotPasswordRequest;
import com.tws.auth.dto.GenericResponse;
import com.tws.auth.dto.LoginRequest;
import com.tws.auth.dto.MeResponse;
import com.tws.auth.dto.RefreshRequest;
import com.tws.auth.dto.ResendCodeRequest;
import com.tws.auth.dto.ResetPasswordRequest;
import com.tws.auth.dto.VerifyCodeRequest;
import com.tws.auth.model.User;
import com.tws.auth.service.AuthService;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/login/admin")
    public AuthResponse loginAdmin(@Valid @RequestBody LoginRequest request) {
        return authService.loginForRole(request, AuthService.ROLE_ADMIN);
    }

    @PostMapping("/login/operador")
    public AuthResponse loginOperador(@Valid @RequestBody LoginRequest request) {
        return authService.loginForRole(request, AuthService.ROLE_OPERADOR);
    }

    @PostMapping("/login/vendedor")
    public AuthResponse loginVendedor(@Valid @RequestBody LoginRequest request) {
        return authService.loginForRole(request, AuthService.ROLE_VENDEDOR);
    }

    @PostMapping("/login/gestor")
    public AuthResponse loginGestor(@Valid @RequestBody LoginRequest request) {
        return authService.loginForRole(request, AuthService.ROLE_GESTOR);
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshRequest request) {
        return authService.refresh(request);
    }

    @PostMapping("/logout")
    public GenericResponse logout(@Valid @RequestBody com.tws.auth.dto.LogoutRequest request) {
        return authService.logout(request.getRefreshToken());
    }

    @PostMapping("/forgot-password")
    public GenericResponse forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return authService.forgotPassword(request.getEmail());
    }

    @PostMapping("/reset-password")
    public GenericResponse resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        return authService.resetPassword(request);
    }

    @PutMapping("/verify-code")
    public GenericResponse verifyCode(@Valid @RequestBody VerifyCodeRequest request) {
        return authService.verifyCode(request);
    }

    @PostMapping("/resend-code")
    public GenericResponse resendCode(@Valid @RequestBody ResendCodeRequest request) {
        return authService.resendCode(request.getEmail());
    }

    @PutMapping("/change-password")
    public GenericResponse changePassword(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody ChangePasswordRequest request) {
        UUID userId = user.getId();
        return authService.changePassword(userId, request);
    }

    @GetMapping("/me")
    public MeResponse me(@AuthenticationPrincipal User user) {
        return authService.toMeResponse(user);
    }
}
