package org.example.server.dto.operator;

import org.example.server.dto.address.AddressDTO;

import java.time.LocalDate;

public record OperatorRequestDTO(
        Long dealerId,

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
        Boolean canDelete
) {}
