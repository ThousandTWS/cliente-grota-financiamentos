package org.example.server.modules.document.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.example.server.modules.document.model.ReviewStatus;

public record DocumentReviewRequestDTO(

        @NotNull(message = "O status da revisão é obrigatorio (APROVADO ou REPROVADO)")
        ReviewStatus reviewStatus,

        @NotBlank(message = "O comentario é obrigatorio")
        @Size(max = 255, message = "O comentario pode ter no maximo 255 caracteres")
        String reviewComment
) {

}



