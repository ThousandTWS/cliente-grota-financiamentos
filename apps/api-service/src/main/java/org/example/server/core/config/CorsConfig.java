package org.example.server.core.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(@SuppressWarnings("null") CorsRegistry registry) {
        registry.addMapping("/**")
                // permite qualquer origem
                .allowedOriginPatterns("*")
                // permite todos os métodos HTTP
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                // permite todos os headers
                .allowedHeaders("*")
                // permite envio de cookies, Authorization, etc.
                .allowCredentials(false)
                // tempo em segundos para o navegador manter a resposta de preflight
                .maxAge(3600);
    }
}


