package org.example.server.modules.document.dto;

import jakarta.validation.constraints.NotNull;
import org.example.server.modules.document.model.DocumentType;
import org.springframework.web.multipart.MultipartFile;

public record DocumentUploadRequestDTO(
        @NotNull(message = "O tipo de document é obrigatorio.")
        DocumentType documentType,

        @NotNull(message = "O arquivo da imagem é obrigatorio.")
        MultipartFile file
) {
}


