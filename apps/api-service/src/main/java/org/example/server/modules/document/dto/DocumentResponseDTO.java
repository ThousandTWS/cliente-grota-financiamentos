package org.example.server.modules.document.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import org.example.server.modules.document.model.DocumentType;
import org.example.server.modules.document.model.ReviewStatus;

import java.time.LocalDateTime;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record DocumentResponseDTO(
        Long id,
        DocumentType documentType,
        String contentType,
        Long sizeBytes,
        ReviewStatus reviewStatus,
        String reviewComment,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
){}

