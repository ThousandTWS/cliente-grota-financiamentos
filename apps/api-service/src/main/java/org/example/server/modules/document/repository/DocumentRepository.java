package org.example.server.modules.document.repository;

import org.example.server.modules.document.dto.DocumentResponseDTO;
import org.example.server.modules.document.model.DocumentType;
import org.example.server.modules.document.model.Document;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document>findByDealer_UserId(Long id);
    boolean existsByDealerIdAndDocumentType(Long dealerId, DocumentType documentType);
    List<DocumentResponseDTO> findDocumentsByDealerId(Long id);
    void deleteByDealerId(Long dealerId);
}


