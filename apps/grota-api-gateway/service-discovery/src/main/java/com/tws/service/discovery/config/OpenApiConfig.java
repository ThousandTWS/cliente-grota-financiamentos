package com.tws.service.discovery.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "Service Discovery API",
                version = "v1",
                description = "Eureka service discovery endpoints and operational APIs."
        )
)
public class OpenApiConfig {
}
