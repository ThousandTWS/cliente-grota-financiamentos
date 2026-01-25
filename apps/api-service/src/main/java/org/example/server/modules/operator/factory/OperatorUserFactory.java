package org.example.server.modules.operator.factory;

import org.example.server.modules.user.factory.AbstractUserFactory;
import org.example.server.modules.user.model.UserRole;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class OperatorUserFactory extends AbstractUserFactory {

    public OperatorUserFactory(PasswordEncoder passwordEncoder) {
        super(passwordEncoder);
    }

    @Override
    protected UserRole getRole() {
        return UserRole.OPERADOR;
    }
}


