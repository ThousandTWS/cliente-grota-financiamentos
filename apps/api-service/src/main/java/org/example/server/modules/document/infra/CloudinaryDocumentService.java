package org.example.server.modules.document.infra;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.Map;

@Service
public class CloudinaryDocumentService {

    private final Cloudinary cloudinary;

    @Value("${cloudinary.documents-folder:documents}")
    private String documentsFolder;

    public CloudinaryDocumentService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    @SuppressWarnings("unchecked")
    public String uploadFile(String publicId, MultipartFile file) throws IOException {
        Map<String, Object> uploadResult = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                        "folder", documentsFolder,
                        "public_id", publicId,
                        "overwrite", true,
                        "invalidate", true,
                        "resource_type", "image"
                )
        );

        String uploadedPublicId = (String) uploadResult.get("public_id");
        if (uploadedPublicId == null || uploadedPublicId.isBlank()) {
            throw new IllegalStateException("Resposta inválida do Cloudinary ao enviar o documento.");
        }

        return uploadedPublicId;
    }

    public URL generateFileUrl(String publicId) {
        String url = cloudinary.url()
                .secure(true)
                .resourceType("image")
                .generate(publicId);

        try {
            return new URL(url);
        } catch (MalformedURLException e) {
            throw new IllegalStateException("Falha ao gerar URL do documento no Cloudinary.", e);
        }
    }
}


