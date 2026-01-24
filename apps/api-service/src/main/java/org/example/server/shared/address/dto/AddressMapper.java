package org.example.server.shared.address.dto;

import org.example.server.shared.address.model.Address;
import org.springframework.stereotype.Component;

@Component
public class AddressMapper {

    public AddressDTO toDTO(Address address){
        if (address == null) return null;

        return new AddressDTO(
                address.getStreet(),
                address.getNumber(),
                address.getComplement(),
                address.getNeighborhood(),
                address.getCity(),
                address.getState(),
                address.getZipCode()
        );
    }

    public Address toEntity(AddressDTO dto){
        if (dto == null) return null;

        Address address = new Address(
                dto.street(),
                dto.number(),
                dto.complement(),
                dto.neighborhood(),
                dto.city(),
                dto.state(),
                dto.zipCode()
        );
        return address;
    };

    public Address fromAdmin(AdminAddressDTO dto) {
        if (dto == null) return null;
        return new Address(
                dto.street(),
                dto.number(),
                dto.complement(),
                dto.neighborhood(),
                dto.city(),
                dto.state(),
                dto.zipCode()
        );
    }
}


