package org.example.server.shared.address.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AddressDTO(
        String street,

        String number,

        String complement,

        String neighborhood,

        String city,

        String state,

        String zipCode
) {
}


