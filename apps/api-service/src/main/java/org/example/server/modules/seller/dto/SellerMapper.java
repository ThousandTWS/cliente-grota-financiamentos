package org.example.server.modules.seller.dto;

import org.example.server.shared.address.dto.AddressMapper;
import org.example.server.modules.seller.model.Seller;
import org.example.server.modules.user.model.User;
import org.springframework.stereotype.Component;

@Component
public class SellerMapper {

    private final AddressMapper addressMapper;

    public SellerMapper(AddressMapper addressMapper) {
        this.addressMapper = addressMapper;
    }

    @SuppressWarnings("unused")
    public SellerResponseDTO toDTO(Seller seller) {
        if (seller == null) {
            return null;
        }

        User user = seller.getUser();

        return new SellerResponseDTO(
                seller.getId(),
                seller.getDealer() != null ? seller.getDealer().getId() : null,
                seller.getUser().getFullName(),
                seller.getUser().getEmail(),
                seller.getPhone(),
                seller.getCPF(),
                seller.getBirthData(),
                seller.getUser().getVerificationStatus(),
                seller.getCreatedAt(),
                seller.getCanView(),
                seller.getCanCreate(),
                seller.getCanUpdate(),
                seller.getCanDelete()
        );
    }

    public Seller toEntity(SellerRequestDTO dto) {
        if (dto == null) {
            return null;
        }

        Seller seller = new Seller(
                dto.phone(),
                dto.CPF(),
                dto.birthData(),
                addressMapper.toEntity(dto.address())
        );
        return seller;
    }
}


