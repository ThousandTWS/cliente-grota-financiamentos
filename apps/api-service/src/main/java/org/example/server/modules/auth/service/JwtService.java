package org.example.server.modules.auth.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.example.server.modules.user.model.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Instant;
import java.util.Date;
import java.util.function.Function;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.expiration}")
    private long jwtExpirationMillis;

    @Value("${jwt.refresh-token.expiration}")
    private long refreshTokenExpirationMillis;

    private Key getSigningKey() {
        System.out.println("[JWT] Usando secretKey com tamanho: " + (secretKey != null ? secretKey.length() : 0));
        return Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
    }

    private Claims parseToken(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            System.err.println("[JWT] Token EXPIRADO para usuario: " + e.getClaims().getSubject());
            throw e; // Re-throw para ser tratado no filter
        } catch (io.jsonwebtoken.security.SignatureException e) {
            System.err.println("[JWT] ASSINATURA INVALIDA - JWT_SECRET pode ter mudado! " + e.getMessage());
            return null;
        } catch (io.jsonwebtoken.MalformedJwtException e) {
            System.err.println("[JWT] Token MAL FORMADO: " + e.getMessage());
            return null;
        } catch (JwtException | IllegalArgumentException e) {
            System.err.println("[JWT] Erro ao parsear token: " + e.getClass().getSimpleName() + " - " + e.getMessage());
            return null;
        }
    }

    public <T> T extractClaim(String token, Function<Claims, T> resolver) {
        final Claims claims = parseToken(token);
        return (claims != null) ? resolver.apply(claims) : null;
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Long extractUserId(String token) {
        return extractClaim(token, claims -> claims.get("id", Long.class));
    }

    public boolean isRefreshToken(String token) {
        String type = extractClaim(token, c -> c.get("type", String.class));
        return "refresh".equals(type);
    }

    public Instant getExpirationDateFromToken(String token) {
        Date exp = extractClaim(token, Claims::getExpiration);
        return (exp != null) ? exp.toInstant() : null;
    }

    public String generateToken(UserDetails userDetails) {
        User user = (User) userDetails;
        return Jwts.builder()
                .setSubject(user.getUsername())
                .claim("id", user.getId())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpirationMillis))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String generateRefreshToken(UserDetails userDetails) {
        User user = (User) userDetails;
        return Jwts.builder()
                .setSubject(user.getUsername())
                .claim("id", user.getId())
                .claim("type", "refresh")
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + refreshTokenExpirationMillis))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {

        Claims claims = parseToken(token);
        if (claims == null) {
            System.err.println("[JWT] Falha na validação: Claims nulos (talvez erro de assinatura)");
            return false;
        }

        String username = claims.getSubject();
        // Comparação case-insensitive para evitar erro 401 por diferença de
        // maiúsculas/minúsculas
        if (username == null || !username.equalsIgnoreCase(userDetails.getUsername())) {
            System.err.println("[JWT] Mismatch de usuário: token=" + username + ", banco=" + userDetails.getUsername());
            return false;
        }

        if (isTokenExpired(claims)) {
            System.err.println("[JWT] Token expirado para: " + username);
            return false;
        }

        // Adicionada tolerância de 1 minuto para evitar problemas com relógios
        // dessincronizados
        if (wasIssuedInFuture(claims, 60000)) {
            System.err.println("[JWT] Token emitido no futuro (clock skew) para: " + username);
            return false;
        }

        System.out.println("[JWT] Token validado COM SUCESSO para: " + username);
        return true;
    }

    private boolean isTokenExpired(Claims claims) {
        Date expiration = claims.getExpiration();
        return expiration == null || expiration.before(new Date());
    }

    private boolean wasIssuedInFuture(Claims claims, long skewMillis) {
        Date iat = claims.getIssuedAt();
        // Se a data de emissão for posterior a AGORA + tolerância, rejeita
        return iat != null && iat.getTime() > (System.currentTimeMillis() + skewMillis);
    }
}
