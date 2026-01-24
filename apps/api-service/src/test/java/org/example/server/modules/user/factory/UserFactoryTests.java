package org.example.server.modules.user.factory;

import org.example.server.modules.user.model.UserRole;
import org.example.server.modules.user.model.UserStatus;
import org.example.server.modules.user.model.User;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class UserFactoryTests {

    private static final String RAW_PASSWORD = "SenhaSecreta123!";
    private final PasswordEncoder encoder = new BCryptPasswordEncoder();

    @Test
    void sellerFactorySetsRoleAndEncodesPassword() {
        verifyFactory(new SellerUserFactory(encoder), UserRole.VENDEDOR);
    }

    @Test
    void managerFactorySetsRoleAndEncodesPassword() {
        verifyFactory(new ManagerUserFactory(encoder), UserRole.GESTOR);
    }

    @Test
    void operatorFactorySetsRoleAndEncodesPassword() {
        verifyFactory(new OperatorUserFactory(encoder), UserRole.OPERADOR);
    }

    private void verifyFactory(AbstractUserFactory factory, UserRole expectedRole) {
        User user = factory.create("Test Nome", "email@teste.local", RAW_PASSWORD);

        assertEquals("Test Nome", user.getFullName());
        assertEquals("email@teste.local", user.getEmail());
        assertEquals(UserStatus.ATIVO, user.getVerificationStatus());
        assertEquals(expectedRole, user.getRole());
        assertNotEquals(RAW_PASSWORD, user.getPassword());
        assertTrue(encoder.matches(RAW_PASSWORD, user.getPassword()));
    }
}


