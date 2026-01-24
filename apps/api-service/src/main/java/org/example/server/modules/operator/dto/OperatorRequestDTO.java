package org.example.server.modules.operator.dto;

import org.example.server.shared.address.dto.AddressDTO;

import java.time.LocalDate;
import java.util.List;

public record OperatorRequestDTO(

        Long dealerId,

        List<Long> dealerIds,

        String fullName,

        String email,

        String phone,

        String password,

        String CPF,

        LocalDate birthData,

        AddressDTO address,

        Boolean canView,
        Boolean canCreate,
        Boolean canUpdate,
        Boolean canDelete) {
}


