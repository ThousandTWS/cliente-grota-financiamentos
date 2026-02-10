package com.tws.auth.dto;

import java.util.UUID;

public class RegisterResponse {
    private UUID userId;
    private String email;
    private boolean verificationRequired;

    public RegisterResponse() {
    }

    public RegisterResponse(UUID userId, String email, boolean verificationRequired) {
        this.userId = userId;
        this.email = email;
        this.verificationRequired = verificationRequired;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public boolean isVerificationRequired() {
        return verificationRequired;
    }

    public void setVerificationRequired(boolean verificationRequired) {
        this.verificationRequired = verificationRequired;
    }
}
