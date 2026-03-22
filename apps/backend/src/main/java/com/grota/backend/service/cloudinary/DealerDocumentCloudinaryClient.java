package com.grota.backend.service.cloudinary;

import com.grota.backend.service.dto.DealerDocumentResponseDTO;
import reactor.core.publisher.Flux;

public interface DealerDocumentCloudinaryClient {
    Flux<DealerDocumentResponseDTO> listDealerDocuments(Long dealerId);
}
