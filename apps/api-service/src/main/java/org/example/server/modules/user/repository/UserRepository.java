package org.example.server.modules.user.repository;

import org.example.server.modules.user.model.UserRole;
import org.example.server.modules.user.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;


public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByEmail(String email);

    Optional<User> findByEmail(String email);

    User findByEmailAndVerificationCode(String email, String code);

    List<User> findByRole(UserRole role);
}


