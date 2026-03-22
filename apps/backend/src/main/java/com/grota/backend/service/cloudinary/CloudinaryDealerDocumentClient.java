package com.grota.backend.service.cloudinary;

import com.grota.backend.config.ApplicationProperties;
import com.grota.backend.service.dto.DealerDocumentResponseDTO;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Component
public class CloudinaryDealerDocumentClient implements DealerDocumentCloudinaryClient {

    private static final ParameterizedTypeReference<Map<String, Object>> MAP_TYPE = new ParameterizedTypeReference<>() {};

    private final WebClient webClient;
    private final ApplicationProperties applicationProperties;

    public CloudinaryDealerDocumentClient(ApplicationProperties applicationProperties) {
        this.webClient = WebClient.builder().baseUrl("https://api.cloudinary.com/v1_1").build();
        this.applicationProperties = applicationProperties;
    }

    @Override
    public Flux<DealerDocumentResponseDTO> listDealerDocuments(Long dealerId) {
        ApplicationProperties.Cloudinary cloudinary = applicationProperties.getCloudinary();
        if (
            !StringUtils.hasText(cloudinary.getCloudName()) ||
            !StringUtils.hasText(cloudinary.getApiKey()) ||
            !StringUtils.hasText(cloudinary.getApiSecret())
        ) {
            return Flux.error(new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Integração Cloudinary não configurada"));
        }

        Map<String, Object> body = Map.of(
            "expression",
            "folder=\"" + buildFolder(dealerId, cloudinary.getDealerDocumentsFolder()) + "\"",
            "max_results",
            100,
            "sort_by",
            List.of(Map.of("created_at", "desc"))
        );

        return webClient
            .post()
            .uri("/{cloudName}/resources/search", cloudinary.getCloudName())
            .headers(headers -> headers.setBasicAuth(cloudinary.getApiKey(), cloudinary.getApiSecret()))
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(body)
            .retrieve()
            .onStatus(
                status -> status.isError(),
                response ->
                    response
                        .bodyToMono(String.class)
                        .defaultIfEmpty("")
                        .flatMap(message ->
                            Mono.error(new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Erro ao consultar documentos no Cloudinary"))
                        )
            )
            .bodyToMono(MAP_TYPE)
            .flatMapMany(response -> Flux.fromIterable(extractResources(response)))
            .map(this::toResponse);
    }

    private String buildFolder(Long dealerId, String rootFolder) {
        return rootFolder + "/" + dealerId + "/documents";
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> extractResources(Map<String, Object> response) {
        Object resources = response.get("resources");
        if (resources instanceof List<?> resourceList) {
            return (List<Map<String, Object>>) resourceList;
        }
        return List.of();
    }

    @SuppressWarnings("unchecked")
    private DealerDocumentResponseDTO toResponse(Map<String, Object> resource) {
        Map<String, Object> context = resource.get("context") instanceof Map<?, ?> map ? (Map<String, Object>) map : Map.of();
        Map<String, Object> customContext = context.get("custom") instanceof Map<?, ?> map ? (Map<String, Object>) map : Map.of();
        Map<String, Object> metadata = resource.get("metadata") instanceof Map<?, ?> map ? (Map<String, Object>) map : Map.of();

        String format = stringValue(resource.get("format"));
        String resourceType = stringValue(resource.get("resource_type"));
        Instant createdAt = instantValue(resource.get("created_at"));
        Instant updatedAt = instantValue(resource.get("updated_at"));
        if (updatedAt == null) {
            updatedAt = instantValue(resource.get("uploaded_at"));
        }
        if (updatedAt == null) {
            updatedAt = createdAt;
        }

        return new DealerDocumentResponseDTO(
            extractId(resource),
            firstNonBlank(customContext.get("documentType"), metadata.get("documentType"), resource.get("documentType"), "DESCONHECIDO"),
            firstNonBlank(customContext.get("contentType"), metadata.get("contentType"), resource.get("mime_type"), deriveContentType(resourceType, format)),
            longValue(resource.get("bytes")),
            firstNonBlank(customContext.get("reviewStatus"), metadata.get("reviewStatus"), resource.get("reviewStatus"), "PENDENTE"),
            firstNonBlank(customContext.get("reviewComment"), metadata.get("reviewComment"), resource.get("reviewComment"), null),
            createdAt,
            updatedAt
        );
    }

    private Long extractId(Map<String, Object> resource) {
        Long version = longValue(resource.get("version"));
        if (version != null) {
            return version;
        }
        String publicId = stringValue(resource.get("public_id"));
        return publicId == null ? null : Math.abs((long) publicId.hashCode());
    }

    private Long longValue(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        if (value instanceof String string && StringUtils.hasText(string)) {
            try {
                return Long.valueOf(string);
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    private Instant instantValue(Object value) {
        String string = stringValue(value);
        if (!StringUtils.hasText(string)) {
            return null;
        }
        return Instant.parse(string);
    }

    private String stringValue(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private String firstNonBlank(Object first, Object second, Object third, String fallback) {
        for (Object candidate : new Object[] { first, second, third, fallback }) {
            String stringValue = stringValue(candidate);
            if (StringUtils.hasText(stringValue)) {
                return stringValue;
            }
        }
        return null;
    }

    private String deriveContentType(String resourceType, String format) {
        if (!StringUtils.hasText(format)) {
            return "application/octet-stream";
        }
        if ("pdf".equalsIgnoreCase(format)) {
            return "application/pdf";
        }
        if (StringUtils.hasText(resourceType) && !"raw".equalsIgnoreCase(resourceType)) {
            return resourceType + "/" + format.toLowerCase();
        }
        return "application/octet-stream";
    }
}
