package org.example.server.modules.dealer.factory;

import org.example.server.modules.user.factory.AbstractUserFactory;
import org.example.server.modules.user.model.UserRole;
import org.example.server.modules.user.model.User;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DealerUserFactory extends AbstractUserFactory {

    public DealerUserFactory(PasswordEncoder passwordEncoder) {
        super(passwordEncoder);
    }

    @Override
    protected UserRole getRole() {
        return UserRole.LOJISTA;
    }

    @Override
    public User create(String fullName, String email, String rawPassword) {
        User user = super.create(fullName, email, rawPassword);
        user.markAsVerified();
        return user;
    }
}


