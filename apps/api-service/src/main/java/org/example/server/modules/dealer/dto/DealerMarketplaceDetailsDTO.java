package org.example.server.modules.dealer.dto;

import org.example.server.shared.address.dto.AddressDTO;

public record DealerMarketplaceDetailsDTO(
        Long id,
        String enterprise,
        String referenceCode,
        String logoUrl,
        String fullName,
        String fullNameEnterprise,
        String phone,
        String cnpj,
        String observation,
        AddressDTO address,
        long availableVehicles
) {
}
