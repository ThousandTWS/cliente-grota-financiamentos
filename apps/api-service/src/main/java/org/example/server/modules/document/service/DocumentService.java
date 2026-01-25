package org.example.server.modules.document.service;

import org.example.server.core.email.EmailService;
import org.example.server.modules.document.dto.DocumentMapper;
import org.example.server.modules.document.dto.DocumentResponseDTO;
import org.example.server.modules.document.dto.DocumentReviewRequestDTO;
import org.example.server.modules.document.dto.DocumentUploadRequestDTO;
import org.example.server.modules.document.factory.DocumentFactory;
import org.example.server.modules.user.model.UserRole;
import org.example.server.modules.document.exception.DocumentUploadException;
import org.example.server.modules.auth.exception.AccessDeniedException;
import org.example.server.core.exception.generic.DataAlreadyExistsException;
import org.example.server.core.exception.generic.RecordNotFoundException;
import org.example.server.modules.document.infra.CloudinaryDocumentService;
import org.example.server.modules.document.model.Document;
import org.example.server.modules.user.model.User;
import org.example.server.modules.dealer.repository.DealerRepository;
import org.example.server.modules.document.repository.DocumentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class DocumentService {

    private final CloudinaryDocumentService cloudinaryDocumentService;
    private final DocumentRepository documentRepository;
    private final DealerRepository dealerRepository;
    private final EmailService emailService;
    private final DocumentFactory documentFactory;
    private final DocumentMapper mapper;

    private static final long MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB
    private static final String[] ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "application/pdf"};

    public DocumentService(CloudinaryDocumentService cloudinaryDocumentService, DocumentRepository documentRepository, DealerRepository dealerRepository, EmailService emailService, DocumentFactory documentFactory, DocumentMapper mapper) {
        this.cloudinaryDocumentService = cloudinaryDocumentService;
        this.documentRepository = documentRepository;
        this.dealerRepository = dealerRepository;
        this.emailService = emailService;
        this.documentFactory = documentFactory;
        this.mapper = mapper;
    }

    @Transactional
    public DocumentResponseDTO uploadDocument(DocumentUploadRequestDTO dto, User user, Long dealerId) {

        if (user.getRole().equals(UserRole.ADMIN)) {
            if (dealerId == null) {
                throw new RecordNotFoundException("ADMIN precisa informar o id do lojista.");
            }
            dealerRepository.findById(dealerId)
                    .orElseThrow(() -> new RecordNotFoundException("Lojista não encontrado."));
        } else if (user.getRole().equals(UserRole.LOJISTA)) {
            var dealer = user.getDealer();
            if (dealer == null) {
                throw new AccessDeniedException("Usuário LOJISTA não possui dealer associado.");
            }
        } else {
            throw new AccessDeniedException("Este usuário não tem permissão para enviar documentos.");
        }

        if (documentRepository.existsByDealerIdAndDocumentType(dealerId, dto.documentType())) {
            throw new DataAlreadyExistsException("O documento " + dto.documentType() + " já foi enviado para este dealer.");
        }

        MultipartFile file = dto.file();
        validateFile(file);

        String publicId = buildCloudinaryPublicId(user.getId());

        try {
            publicId = cloudinaryDocumentService.uploadFile(publicId, file);
        } catch (IOException e) {
            throw new DocumentUploadException("Falha ao enviar documento para o Cloudinary.", e);
        }

        Document document = documentFactory.create(dto, user, publicId);

        return mapper.toDTO(documentRepository.save(document));
    }

    @Transactional
    public java.net.URL getPresignedUrl(Long documentId, User user) {

        @SuppressWarnings("null")
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new RecordNotFoundException("Documento não encontrado"));

        boolean isAdmin = user.getRole() == UserRole.ADMIN;
        boolean isOwnerDealer = doc.getDealer().getUser().getId().equals(user.getId());

        if (!isAdmin && !isOwnerDealer) {
            throw new AccessDeniedException("Acesso negado: você não tem permissão para visualizar este documento.");
        }

        return cloudinaryDocumentService.generateFileUrl(doc.getS3Key());
    }

    @Transactional
    public DocumentResponseDTO reviewDocument(Long id, DocumentReviewRequestDTO reviewDTO, User user) {

        if (user.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("Apenas administradores podem revisar documentos.");
        }

        @SuppressWarnings("null")
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException(id));

        document.setReviewStatus(reviewDTO.reviewStatus());
        document.setReviewComment(reviewDTO.reviewComment());
        document.setUpdatedAt(LocalDateTime.now());

        Document saved = documentRepository.save(document);

        emailService.sendReviewDocument(document.getDealer().getUser().getEmail(), document);

        return mapper.toDTO(saved);
    }


    public java.util.List<DocumentResponseDTO> listUserDocuments(User user) {

        if (user.getRole() == UserRole.ADMIN) {
            return documentRepository.findAll()
                    .stream().map(mapper::toDTO)
                    .collect(java.util.stream.Collectors.toList());
        }

        return documentRepository.findByDealer_UserId(user.getId())
                .stream().map(mapper::toDTO)
                .collect(java.util.stream.Collectors.toList());
    }

    private String buildCloudinaryPublicId(Long userId) {
        return "user-" + userId + "-document-" + UUID.randomUUID();
    }

    private void validateFile(MultipartFile file) {

        if (file == null || file.isEmpty()) {
            throw new DocumentUploadException("O arquivo não pode estar vazio.");
        }

        if (file.getSize() > MAX_FILE_BYTES) {
            throw new DocumentUploadException("O arquivo não pode ser maior que 10MB.");
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
            throw new DocumentUploadException("Tipo de arquivo não permitido. Use JPEG, PNG ou PDF.");
        }
    }
}


