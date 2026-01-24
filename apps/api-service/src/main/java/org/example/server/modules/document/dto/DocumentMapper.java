package org.example.server.modules.document.dto;

import org.example.server.modules.document.model.ReviewStatus;
import org.example.server.modules.document.model.Document;
import org.example.server.modules.user.model.User;
import org.springframework.stereotype.Component;


@Component
public class DocumentMapper {

    public DocumentResponseDTO toDTO(Document document) {
        if (document == null) {
            return null;
        }

        return new DocumentResponseDTO(
                document.getId(),
                document.getDocumentType(),
                document.getContentType(),
                document.getSizeBytes(),
                document.getReviewStatus(),
                document.getReviewComment(),
                document.getCreatedAt(),
                document.getUpdatedAt()
        );
    }
    
    public Document toEntity(DocumentUploadRequestDTO dto, User user, String s3Key){
        if (dto == null) {
            return null;
        }
        
        Document document = new Document();
        document.setDocumentType(dto.documentType());
        document.setDocumentName(dto.file().getOriginalFilename());
        document.setSizeBytes(dto.file().getSize());
        document.setDealer(user.getDealer());
        document.setS3Key(s3Key);
        document.setContentType(dto.file().getContentType());
        document.setReviewStatus(ReviewStatus.PENDENTE);

        return document;
    }
}


