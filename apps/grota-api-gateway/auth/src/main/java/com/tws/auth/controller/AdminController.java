package com.tws.auth.controller;

import com.tws.auth.dto.AdminCreateUserRequest;
import com.tws.auth.dto.AdminResetPasswordRequest;
import com.tws.auth.dto.AdminUserResponse;
import com.tws.auth.dto.GenericResponse;
import com.tws.auth.service.AuthService;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/users")
public class AdminController {
    private final AuthService authService;

    public AdminController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping
    public AdminUserResponse createUser(@Valid @RequestBody AdminCreateUserRequest request) {
        return authService.createUserByAdmin(request);
    }

    @PutMapping("/{userId}/block")
    public GenericResponse blockUser(@PathVariable UUID userId) {
        return authService.setUserActive(userId, false);
    }

    @PutMapping("/{userId}/unblock")
    public GenericResponse unblockUser(@PathVariable UUID userId) {
        return authService.setUserActive(userId, true);
    }

    @PutMapping("/{userId}/reset-password")
    public GenericResponse resetPassword(
            @PathVariable UUID userId,
            @Valid @RequestBody AdminResetPasswordRequest request) {
        return authService.resetPasswordByAdmin(userId, request);
    }
}
