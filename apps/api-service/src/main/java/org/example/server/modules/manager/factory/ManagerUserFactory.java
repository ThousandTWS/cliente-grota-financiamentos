package org.example.server.modules.manager.factory;

import org.example.server.modules.user.factory.AbstractUserFactory;
import org.example.server.modules.user.model.UserRole;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class ManagerUserFactory extends AbstractUserFactory {

    public ManagerUserFactory(PasswordEncoder passwordEncoder) {
        super(passwordEncoder);
    }

    @Override
    protected UserRole getRole() {
        return UserRole.GESTOR;
    }
}


