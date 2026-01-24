package org.example.server.modules.document.factory;

import org.example.server.modules.document.dto.DocumentUploadRequestDTO;
import org.example.server.modules.document.dto.DocumentMapper;
import org.example.server.modules.document.model.DocumentType;
import org.example.server.modules.dealer.model.Dealer;
import org.example.server.modules.document.model.Document;
import org.example.server.modules.user.model.User;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class DocumentFactoryTests {

    private static final byte[] FILE_CONTENT = "conteudo".getBytes();

    @Test
    void createsDocumentWithMetadataAndTimestamp() {
        DocumentMapper mapper = new DocumentMapper();
        DocumentFactory factory = new DocumentFactory(mapper);
        MockMultipartFile file = new MockMultipartFile("file", "contrato.png", "image/png", FILE_CONTENT);
        DocumentUploadRequestDTO dto = new DocumentUploadRequestDTO(DocumentType.RG_FRENTE, file);
        Dealer dealer = new Dealer();
        User user = new User();
        user.setDealer(dealer);

        Document document = factory.create(dto, user, "dealers/1/documents/contrato.png");

        assertEquals(DocumentType.RG_FRENTE, document.getDocumentType());
        assertEquals(file.getOriginalFilename(), document.getDocumentName());
        assertEquals(file.getContentType(), document.getContentType());
        assertEquals(file.getSize(), document.getSizeBytes());
        assertEquals(dealer, document.getDealer());
        assertEquals("dealers/1/documents/contrato.png", document.getS3Key());
        assertNotNull(document.getCreatedAt());
    }
}


