package org.example.server.modules.document.dto;

import org.example.server.modules.document.model.ReviewStatus;

import java.time.LocalDateTime;

public record DocumentReviewResponseDTO(
        Long id,
        ReviewStatus reviewStatus,
        String reviewComment,
        String reviewByUsername,
        LocalDateTime reviewedAt
){}


