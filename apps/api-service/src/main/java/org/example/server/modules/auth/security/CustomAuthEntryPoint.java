package org.example.server.modules.auth.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.example.server.core.exception.ErrorResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class CustomAuthEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper mapper;

    public CustomAuthEntryPoint(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException) throws IOException {

        ErrorResponse error = new ErrorResponse(
                HttpStatus.UNAUTHORIZED,
                resolveMessage(authException)
        );

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json;charset=UTF-8");

        mapper.writeValue(response.getWriter(), error);
    }

    private String resolveMessage(AuthenticationException ex) {

        if (ex.getCause() instanceof ExpiredJwtException) {
            return "Token expirado, faça login novamente";
        }

        if (ex instanceof BadCredentialsException) {
            return "Credenciais inválidas";
        }

        if (ex instanceof UsernameNotFoundException) {
            return "Usuário não encontrado";
        }

        return "Acesso não autorizado";
    }
}


