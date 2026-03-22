package com.grota.backend.service.keycloak;

import com.grota.backend.config.ApplicationProperties;
import java.net.URI;
import java.util.List;
import java.util.Map;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

@Component
public class KeycloakAdminWebClient implements KeycloakAdminClient {

    private static final ParameterizedTypeReference<Map<String, Object>> MAP_TYPE = new ParameterizedTypeReference<>() {};

    private final ApplicationProperties applicationProperties;
    private final WebClient webClient;

    public KeycloakAdminWebClient(ApplicationProperties applicationProperties) {
        this.applicationProperties = applicationProperties;
        this.webClient = WebClient.builder().build();
    }

    @Override
    public Mono<KeycloakUserRegistration> registerDealerUser(String fullName, String username, String password) {
        ApplicationProperties.Keycloak keycloak = applicationProperties.getKeycloak();
        return adminAccessToken(keycloak).flatMap(token -> createUser(keycloak, token, fullName, username, password));
    }

    private Mono<String> adminAccessToken(ApplicationProperties.Keycloak keycloak) {
        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        formData.add("grant_type", "password");
        formData.add("client_id", keycloak.getAdminClientId());
        formData.add("username", keycloak.getAdminUsername());
        formData.add("password", keycloak.getAdminPassword());

        return webClient
            .post()
            .uri(keycloak.getBaseUrl() + "/realms/" + keycloak.getAdminRealm() + "/protocol/openid-connect/token")
            .contentType(MediaType.APPLICATION_FORM_URLENCODED)
            .bodyValue(formData)
            .retrieve()
            .onStatus(
                status -> status.isError(),
                response ->
                    response
                        .bodyToMono(String.class)
                        .defaultIfEmpty("")
                        .flatMap(body -> Mono.error(new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Erro ao autenticar no Keycloak")))
            )
            .bodyToMono(MAP_TYPE)
            .map(body -> String.valueOf(body.get("access_token")));
    }

    private Mono<KeycloakUserRegistration> createUser(
        ApplicationProperties.Keycloak keycloak,
        String token,
        String fullName,
        String username,
        String password
    ) {
        Map<String, Object> payload = Map.of(
            "username",
            username,
            "enabled",
            true,
            "firstName",
            firstName(fullName),
            "lastName",
            lastName(fullName),
            "credentials",
            List.of(Map.of("type", "password", "value", password, "temporary", false))
        );

        return webClient
            .post()
            .uri(keycloak.getBaseUrl() + "/admin/realms/" + keycloak.getRealm() + "/users")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(payload)
            .exchangeToMono(response -> {
                if (response.statusCode().is2xxSuccessful() || response.statusCode().value() == 201) {
                    String location = response.headers().asHttpHeaders().getFirst(HttpHeaders.LOCATION);
                    String userId = extractUserId(location);
                    return assignRealmUserRole(keycloak, token, userId).thenReturn(new KeycloakUserRegistration(userId, username));
                }
                if (response.statusCode().value() == 409) {
                    return Mono.error(new ResponseStatusException(HttpStatus.CONFLICT, "Usuário já cadastrado no Keycloak"));
                }
                return response
                    .bodyToMono(String.class)
                    .defaultIfEmpty("")
                    .flatMap(body -> Mono.error(new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Erro ao criar usuário no Keycloak")));
            });
    }

    private Mono<Void> assignRealmUserRole(ApplicationProperties.Keycloak keycloak, String token, String userId) {
        return realmRoleRepresentation(keycloak, token, "ROLE_USER").flatMap(roleRepresentation ->
            webClient
                .post()
                .uri(keycloak.getBaseUrl() + "/admin/realms/" + keycloak.getRealm() + "/users/" + userId + "/role-mappings/realm")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(List.of(roleRepresentation))
                .retrieve()
                .onStatus(
                    status -> status.isError(),
                    response ->
                        response
                            .bodyToMono(String.class)
                            .defaultIfEmpty("")
                            .flatMap(body ->
                                Mono.error(new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Erro ao atribuir perfil ao usuário no Keycloak"))
                            )
                )
                .bodyToMono(Void.class)
        );
    }

    private Mono<Map<String, Object>> realmRoleRepresentation(ApplicationProperties.Keycloak keycloak, String token, String roleName) {
        return webClient
            .get()
            .uri(keycloak.getBaseUrl() + "/admin/realms/" + keycloak.getRealm() + "/roles/" + roleName)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
            .retrieve()
            .onStatus(
                status -> status.isError(),
                response ->
                    response
                        .bodyToMono(String.class)
                        .defaultIfEmpty("")
                        .flatMap(body -> Mono.error(new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Erro ao consultar perfil no Keycloak")))
            )
            .bodyToMono(MAP_TYPE);
    }

    private String extractUserId(String location) {
        if (!StringUtils.hasText(location)) {
            return null;
        }
        String path = URI.create(location).getPath();
        return path.substring(path.lastIndexOf('/') + 1);
    }

    private String firstName(String fullName) {
        String normalized = fullName.trim();
        int index = normalized.indexOf(' ');
        return index > 0 ? normalized.substring(0, index) : normalized;
    }

    private String lastName(String fullName) {
        String normalized = fullName.trim();
        int index = normalized.indexOf(' ');
        return index > 0 ? normalized.substring(index + 1) : "";
    }
}
