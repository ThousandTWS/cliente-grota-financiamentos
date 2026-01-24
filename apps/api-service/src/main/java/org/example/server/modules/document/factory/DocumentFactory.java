package org.example.server.modules.document.factory;

import org.example.server.modules.document.dto.DocumentUploadRequestDTO;
import org.example.server.modules.document.dto.DocumentMapper;
import org.example.server.modules.document.model.Document;
import org.example.server.modules.user.model.User;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class DocumentFactory {

    private final DocumentMapper mapper;

    public DocumentFactory(DocumentMapper mapper) {
        this.mapper = mapper;
    }

    public Document create(DocumentUploadRequestDTO dto, User user, String s3Key) {
        Document document = mapper.toEntity(dto, user, s3Key);
        document.setCreatedAt(LocalDateTime.now());
        return document;
    }
}


