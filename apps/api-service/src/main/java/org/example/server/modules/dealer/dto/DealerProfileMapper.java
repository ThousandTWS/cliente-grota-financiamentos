package org.example.server.modules.dealer.dto;

import org.example.server.shared.address.dto.AddressMapper;
import org.example.server.modules.dealer.model.Dealer;
import org.springframework.stereotype.Component;

@Component
public class DealerProfileMapper {

    private final AddressMapper addressMapper;

    public DealerProfileMapper(AddressMapper addressMapper) {
        this.addressMapper = addressMapper;
    }

    public DealerProfileDTO toDTO(Dealer dealer){
        if (dealer == null) return null;

        return new DealerProfileDTO(
                dealer.getFullNameEnterprise(),
                dealer.getBirthData(),
                dealer.getCnpj(),
                addressMapper.toDTO(dealer.getAddress())
        );
    }

    public Dealer toEntity(DealerProfileDTO dto){
        if (dto == null) return null;

        Dealer dealer = new Dealer();
        dealer.setFullNameEnterprise(dto.fullNameEnterprise());
        dealer.setBirthData(dto.birthData());
        dealer.setCnpj(dto.cnpj());
        dealer.setAddress(addressMapper.toEntity(dto.address()));

        return dealer;
    }
}


