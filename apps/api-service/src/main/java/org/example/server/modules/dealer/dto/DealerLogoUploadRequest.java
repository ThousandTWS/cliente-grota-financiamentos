package org.example.server.modules.dealer.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import org.springframework.web.multipart.MultipartFile;

public class DealerLogoUploadRequest {

    @Schema(description = "Arquivo de imagem da logomarca (PNG, JPG ou WEBP) até 5MB", type = "string", format = "binary")
    private MultipartFile file;

    public MultipartFile getFile() {
        return file;
    }

    public void setFile(MultipartFile file) {
        this.file = file;
    }
}


