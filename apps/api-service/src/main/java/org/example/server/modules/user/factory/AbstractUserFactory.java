package org.example.server.modules.user.factory;

import org.example.server.modules.user.model.UserRole;
import org.example.server.modules.user.model.UserStatus;
import org.example.server.modules.user.model.User;
import org.springframework.security.crypto.password.PasswordEncoder;

public abstract class AbstractUserFactory {

    private final PasswordEncoder passwordEncoder;

    protected AbstractUserFactory(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }

    public User create(String fullName, String email, String rawPassword) {
        User user = new User();
        user.setFullName(fullName);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setRole(getRole());
        user.setStatus(getStatus());
        return user;
    }

    protected abstract UserRole getRole();

    protected UserStatus getStatus() {
        return UserStatus.ATIVO;
    }
}


