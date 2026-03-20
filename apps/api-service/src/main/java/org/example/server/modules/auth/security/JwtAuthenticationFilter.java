package org.example.server.modules.auth.security;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.example.server.modules.auth.service.JwtService;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import jakarta.servlet.http.Cookie;
import org.example.server.modules.user.model.User;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String PUBLIC_API_PREFIX = "/api/v1/grota-financiamentos";

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    public JwtAuthenticationFilter(JwtService jwtService, UserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();

        return path.startsWith(PUBLIC_API_PREFIX + "/auth/")
                || path.equals(PUBLIC_API_PREFIX + "/proposals/public");
    }

    @SuppressWarnings("null")
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String jwt = extractToken(request);
        System.out.println("[AuthFilter] Token extraído: " + (jwt != null ? "PRESENTE" : "AUSENTE"));

        if (jwt == null) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String username = jwtService.extractUsername(jwt);
            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails user;
                try {
                    user = userDetailsService.loadUserByUsername(username);
                    System.out.println("[AuthFilter] Usuário carregado do banco: " + user.getUsername() + ", Role: "
                            + (user instanceof User ? ((User) user).getRole() : "N/A"));
                } catch (UsernameNotFoundException e) {
                    System.err.println("[AuthFilter] Usuário não encontrado no banco: " + username);
                    filterChain.doFilter(request, response);
                    return;
                }

                if (jwtService.isTokenValid(jwt, user)) {
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            user,
                            null,
                            user.getAuthorities());
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                } else {
                    System.err.println("[AuthFilter] Token INVÁLIDO para usuário: " + username);
                }
            }
        } catch (ExpiredJwtException ex) {
            System.err.println("[AuthFilter] Token EXPIRADO detectado no filtro");
            request.setAttribute("exception", ex);
        } catch (JwtException ex) {
            System.err.println("[AuthFilter] Erro de JWT detectado: " + ex.getMessage());
            request.setAttribute("exception", ex);
        } catch (Exception ex) {
            System.err.println("[AuthFilter] Erro inesperado na autenticação: " + ex.getMessage());
            ex.printStackTrace();
        }

        filterChain.doFilter(request, response);
    }

    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer "))
            return header.substring(7);

        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if (cookie.getName().equals("access_token"))
                    return cookie.getValue();
            }
        }
        return null;
    }
}
