package org.example.server.modules.dealer.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.example.server.modules.dealer.dto.DealerLogoResponseDTO;
import org.example.server.modules.user.model.UserRole;
import org.example.server.modules.dealer.exception.InvalidLogoException;
import org.example.server.modules.dealer.exception.LogoUploadException;
import org.example.server.modules.auth.exception.AccessDeniedException;
import org.example.server.core.exception.generic.RecordNotFoundException;
import org.example.server.modules.dealer.model.Dealer;
import org.example.server.modules.user.model.User;
import org.example.server.modules.dealer.repository.DealerRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Service
public class DealerLogoService {

    private static final long MAX_FILE_BYTES = 5 * 1024 * 1024;
    private static final String[] ALLOWED_CONTENT_TYPES = {"image/png", "image/jpeg", "image/jpg", "image/webp"};

    private final DealerRepository dealerRepository;
    private final Cloudinary cloudinary;

    @Value("${cloudinary.dealer-logo-folder:dealer-logos}")
    private String dealerLogoFolder;

    public DealerLogoService(DealerRepository dealerRepository, Cloudinary cloudinary) {
        this.dealerRepository = dealerRepository;
        this.cloudinary = cloudinary;
    }

    @SuppressWarnings("unchecked")
    @Transactional
    public DealerLogoResponseDTO uploadLogo(User user, MultipartFile file) {
        if (user == null || user.getRole() != UserRole.LOJISTA) {
            throw new AccessDeniedException("Apenas lojistas podem atualizar a logomarca.");
        }

        Dealer dealer = dealerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RecordNotFoundException("Lojista não encontrado para o usuário autenticado."));

        validateFile(file);

        String publicId = buildPublicId(dealer.getId());
        Map<String, Object> uploadResult;

        try {
            uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", dealerLogoFolder,
                            "public_id", publicId,
                            "overwrite", true,
                            "invalidate", true,
                            "resource_type", "image"
                    )
            );
        } catch (IOException e) {
            throw new LogoUploadException("Falha ao enviar a logomarca para o Cloudinary.", e);
        }

        String secureUrl = (String) uploadResult.get("secure_url");
        String uploadedPublicId = (String) uploadResult.get("public_id");

        if (secureUrl == null || uploadedPublicId == null) {
            throw new LogoUploadException("Resposta inválida do Cloudinary ao enviar a logomarca.");
        }

        removePreviousLogo(dealer.getLogoPublicId());

        dealer.setLogoUrl(secureUrl);
        dealer.setLogoPublicId(uploadedPublicId);
        dealerRepository.save(dealer);

        return new DealerLogoResponseDTO(secureUrl);
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidLogoException("Selecione um arquivo de imagem para enviar.");
        }

        if (file.getSize() > MAX_FILE_BYTES) {
            throw new InvalidLogoException("A logomarca deve ter no máximo 5MB.");
        }

        String contentType = file.getContentType();
        boolean ok = false;

        for (String type : ALLOWED_CONTENT_TYPES) {
            if (type.equalsIgnoreCase(contentType)) {
                ok = true;
                break;
            }
        }

        if (!ok) {
            throw new InvalidLogoException("Formato de arquivo não suportado. Use PNG, JPG ou WEBP.");
        }
    }

    private void removePreviousLogo(String publicId) {
        if (publicId == null || publicId.isBlank()) {
            return;
        }

        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
        } catch (Exception ignored) {
            // Se falhar na remoção antiga, seguimos com a nova logo salva no dealer.
        }
    }

    private String buildPublicId(Long dealerId) {
        return "dealer-" + dealerId + "-logo-" + UUID.randomUUID();
    }
}


