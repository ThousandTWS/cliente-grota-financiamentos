package org.example.server.core.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenAPIConfig {

    @Value("${api.title:Grota Financiamentos - API}")
    private String apiTitle;

    @Value("${api.version:1.0.1}")
    private String apiVersion;

    @Value("${api.contact.name:Suporte Grota Financiamentos}")
    private String contactName;

    @Value("${api.contact.email:suporte@grota.com}")
    private String contactEmail;

    @Value("${api.contact.url:http://suporte.grota.com}")
    private String contactUrl;

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI().info(createApiInfo());
    }

    private Info createApiInfo() {
        return new Info()
                .title(apiTitle)
                .description("Documentação da API de Grota Financiamentos")
                .version(apiVersion)
                .contact(createContact());
    }

    private Contact createContact() {
        return new Contact()
                .name(contactName)
                .email(contactEmail)
                .url(contactUrl);
    }
}


