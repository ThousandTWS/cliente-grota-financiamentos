package com.grota.backend.service.dto;

import java.io.Serial;
import java.io.Serializable;
import java.time.Instant;

public class DealerDocumentResponseDTO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    private Long id;
    private String documentType;
    private String contentType;
    private Long sizeBytes;
    private String reviewStatus;
    private String reviewComment;
    private Instant createdAt;
    private Instant updatedAt;

    public DealerDocumentResponseDTO() {}

    public DealerDocumentResponseDTO(
        Long id,
        String documentType,
        String contentType,
        Long sizeBytes,
        String reviewStatus,
        String reviewComment,
        Instant createdAt,
        Instant updatedAt
    ) {
        this.id = id;
        this.documentType = documentType;
        this.contentType = contentType;
        this.sizeBytes = sizeBytes;
        this.reviewStatus = reviewStatus;
        this.reviewComment = reviewComment;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getDocumentType() {
        return documentType;
    }

    public void setDocumentType(String documentType) {
        this.documentType = documentType;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public Long getSizeBytes() {
        return sizeBytes;
    }

    public void setSizeBytes(Long sizeBytes) {
        this.sizeBytes = sizeBytes;
    }

    public String getReviewStatus() {
        return reviewStatus;
    }

    public void setReviewStatus(String reviewStatus) {
        this.reviewStatus = reviewStatus;
    }

    public String getReviewComment() {
        return reviewComment;
    }

    public void setReviewComment(String reviewComment) {
        this.reviewComment = reviewComment;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
