package org.example.server.modules.auth.service;

import org.example.server.modules.auth.exception.InvalidRefreshTokenException;
import org.example.server.modules.auth.exception.RefreshTokenExpiredException;
import org.example.server.modules.auth.exception.RefreshTokenRevokedException;
import org.example.server.core.exception.generic.RecordNotFoundException;
import org.example.server.modules.auth.model.RefreshToken;
import org.example.server.modules.user.model.User;
import org.example.server.modules.auth.repository.RefreshTokenRepository;
import org.example.server.modules.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class RefreshTokenService {

    @Value("${jwt.refresh-token.expiration}")
    private Long refreshTokenDurationMs;

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;

    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository, UserRepository userRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.userRepository = userRepository;
    }

    public RefreshToken createRefreshToken(Long userId){
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RecordNotFoundException(userId));

        Optional<RefreshToken> existingToken = refreshTokenRepository.findByUser(user);

        RefreshToken refreshToken;
        if (existingToken.isPresent()) {
            refreshToken = existingToken.get();
            refreshToken.setTokenHash(UUID.randomUUID().toString());
            refreshToken.setExpiryDate(Instant.now().plusMillis(refreshTokenDurationMs));
            refreshToken.setRevoked(false);
        } else {
            refreshToken = new RefreshToken();
            refreshToken.setUser(user);
            refreshToken.setTokenHash(UUID.randomUUID().toString());
            refreshToken.setExpiryDate(Instant.now().plusMillis(refreshTokenDurationMs));
            refreshToken.setRevoked(false);
        }

        return refreshTokenRepository.save(refreshToken);
    }

    public RefreshToken verifyExpiration(RefreshToken refreshToken){
        if (refreshToken.getExpiryDate().compareTo(Instant.now()) < 0){
            refreshTokenRepository.delete(refreshToken);
            throw new RefreshTokenExpiredException("Refresh token expirado. Faça login novamente.");
        }
        if (refreshToken.isRevoked()){
            throw new RefreshTokenRevokedException("Refresh token revogado.");
        }
        return refreshToken;
    }

    @Transactional
    public String refreshAccessToken(String refreshAccessTokenValue, JwtService jwtService){
        RefreshToken refreshToken = findByToken(refreshAccessTokenValue)
                .orElseThrow(() -> new InvalidRefreshTokenException("Refresh token inválido."));

        verifyExpiration(refreshToken);

        User user = refreshToken.getUser();
        return jwtService.generateToken(user);
    }

    @Transactional
    public void revokeRefreshToken(String refreshToken){
        refreshTokenRepository.findByTokenHash(refreshToken)
                .ifPresent(token -> {
                    token.setRevoked(true);
                    refreshTokenRepository.save(token);
                });
    }

    public Optional<RefreshToken> findByToken(String token) {
        return refreshTokenRepository.findByTokenHash(token);
    }
}



