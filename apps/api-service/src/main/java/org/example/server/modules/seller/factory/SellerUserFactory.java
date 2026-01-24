package org.example.server.modules.seller.factory;

import org.example.server.modules.user.model.UserRole;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class SellerUserFactory extends AbstractUserFactory {

    public SellerUserFactory(PasswordEncoder passwordEncoder) {
        super(passwordEncoder);
    }

    @Override
    protected UserRole getRole() {
        return UserRole.VENDEDOR;
    }
}


