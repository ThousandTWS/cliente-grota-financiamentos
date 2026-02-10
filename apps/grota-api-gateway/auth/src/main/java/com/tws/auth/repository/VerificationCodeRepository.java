package com.tws.auth.repository;

import com.tws.auth.model.VerificationCode;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface VerificationCodeRepository extends JpaRepository<VerificationCode, UUID> {

    @Query(value = """
            SELECT * FROM verification_codes
            WHERE email = :email
              AND purpose = :purpose
              AND code = :code
              AND used_at IS NULL
              AND expires_at > :now
            ORDER BY created_at DESC
            LIMIT 1
            """, nativeQuery = true)
    Optional<VerificationCode> findValidCode(
            @Param("email") String email,
            @Param("purpose") String purpose,
            @Param("code") String code,
            @Param("now") Instant now);
}
