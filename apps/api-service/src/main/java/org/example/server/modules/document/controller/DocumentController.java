package org.example.server.modules.document.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.example.server.modules.auth.dto.UserResponseDTO;
import org.example.server.modules.document.dto.DocumentResponseDTO;
import org.example.server.modules.document.dto.DocumentReviewRequestDTO;
import org.example.server.modules.document.dto.DocumentUploadRequestDTO;
import org.example.server.modules.document.model.DocumentType;
import org.example.server.modules.user.model.User;
import org.example.server.modules.document.service.DocumentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URL;
@Controller
@Tag(name = "Documents", description = "Documents cloudinary")
@RequestMapping("/api/v1/grota-financiamentos/documents")
public class DocumentController {

    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
       this.documentService = documentService;
    }

    @PostMapping("/upload")
    @Operation(summary = "Upload", description = "Realiza o upload de um documento associado ao logista autenticadp")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "", content = @Content(schema = @Schema(implementation = UserResponseDTO.class))),
            @ApiResponse(responseCode = "400", description = ""),
            @ApiResponse(responseCode = "401", description = ""),
            @ApiResponse(responseCode = "500", description = "")
    })
    public ResponseEntity<DocumentResponseDTO> uploadDocument(
            @RequestParam @NotNull DocumentType  documentType,
            @RequestParam @NotNull MultipartFile file,
            @RequestParam(required = false) Long dealerId,
            @AuthenticationPrincipal User user)

    {
        DocumentUploadRequestDTO uploadRequest = new DocumentUploadRequestDTO(documentType, file);
        DocumentResponseDTO response = documentService.uploadDocument(uploadRequest, user, dealerId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/review")
    @Operation(summary = "Revisar Documento", description = "Atualiza o status e/ou informações de revisao de um documento especifico")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Documento revisado com sucesso", content =  @Content(schema = @Schema(implementation = DocumentResponseDTO.class))),
            @ApiResponse(responseCode = "400", description = "Dados invalidos fornecidos para a revisão"),
            @ApiResponse(responseCode = "401", description = "Não autorizado"),
            @ApiResponse(responseCode = "403", description = "Usuario não possui permissão para revisar o documento"),
            @ApiResponse(responseCode = "404", description = "Documento não encontrado"),
            @ApiResponse(responseCode = "500", description = "Error interno no service")

    })
    public ResponseEntity<DocumentResponseDTO> reviewDocument(
            @PathVariable Long id,
            @RequestBody @Valid DocumentReviewRequestDTO documentReviewRequestDTO,
            @AuthenticationPrincipal User user
    ){

        DocumentResponseDTO response = documentService.reviewDocument(id, documentReviewRequestDTO, user);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @Operation(summary = "Listar Documentos", description = "Retornar a lista de documentos")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de documentos retornados com sucesso", content = @Content(schema = @Schema(implementation = UserResponseDTO.class))),
            @ApiResponse(responseCode = "401", description = "Não autorizado"),
            @ApiResponse(responseCode = "500", description = "Error interno no servidor")
    })
    public ResponseEntity<java.util.List<DocumentResponseDTO>> listUserDocuments(@AuthenticationPrincipal User user){
        java.util.List<DocumentResponseDTO> docs = documentService.listUserDocuments(user);
        return ResponseEntity.ok(docs);
    }

    @GetMapping("/{id}/url")
    @Operation(summary = "Obter URL do Documento", description = "Gera e retorna a URL de acesso do documento")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "URL pre-assinada gerada com sucesso", content = @Content(schema = @Schema(implementation = DocumentResponseDTO.class))),
            @ApiResponse(responseCode = "401", description = "Não autorizado"),
            @ApiResponse(responseCode = "403", description = "Usuario não possui permissão para acessar este documento"),
            @ApiResponse(responseCode = "404", description = "Documento nao encontrado"),
            @ApiResponse(responseCode = "500", description = "Error interno no servidor")
    })

    public ResponseEntity<String> getDocumentPresignedUrl(@PathVariable Long id, @AuthenticationPrincipal User user){
        URL url = documentService.getPresignedUrl(id, user);
        return ResponseEntity.ok(url.toString());
    }
}


