package org.example.server.modules.dealer.dto;

import org.example.server.shared.address.dto.AddressDTO;
import org.example.server.modules.user.model.UserStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record DealerDetailsResponseDTO(
        Long id,
        String fullName,
        String email,
        String phone,
        String enterprise,
        String referenceCode,
        String logoUrl,
        UserStatus status,
        String fullNameEnterprise,
        LocalDate birthData,
        String cnpj,
        AddressDTO address,
        LocalDateTime createdAt
) {
}


