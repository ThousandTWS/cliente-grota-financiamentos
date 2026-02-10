package com.tws.auth.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "Auth API",
                version = "v1",
                description = "Authentication, authorization, and account management endpoints."
        )
)
public class OpenApiConfig {
}
