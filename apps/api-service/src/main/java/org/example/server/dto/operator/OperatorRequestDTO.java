package org.example.server.dto.operator;

import org.example.server.dto.address.AddressDTO;

import java.time.LocalDate;
import java.util.List;

public record OperatorRequestDTO(
        /**
         * Legacy field - use dealerIds for multi-dealer support
         */
        Long dealerId,

        /**
         * List of dealer IDs to link the operator to multiple stores.
         * Takes precedence over dealerId if provided.
         */
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
