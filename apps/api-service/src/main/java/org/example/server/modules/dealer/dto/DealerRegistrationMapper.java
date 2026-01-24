package org.example.server.modules.dealer.dto;

import org.example.server.modules.dealer.model.Dealer;
import org.example.server.modules.user.model.User;
import org.springframework.stereotype.Component;

@Component
public class DealerRegistrationMapper {

    @SuppressWarnings("unused")
    public DealerRegistrationResponseDTO toDTO(Dealer dealer){
        if (dealer == null){
            return null;
        }

        User user = dealer.getUser();

        return new DealerRegistrationResponseDTO(
                dealer.getId(),
                dealer.getUser().getFullName(),
                dealer.getFullNameEnterprise(),
                dealer.getCnpj(),
                dealer.getReferenceCode(),
                dealer.getPhone(),
                dealer.getEnterprise(),
                dealer.getLogoUrl(),
                dealer.getUser().getVerificationStatus(),
                dealer.getUser().getCreatedAt()
        );
    }

    public Dealer toEntity(DealerRegistrationRequestDTO dto){
        if (dto == null) return null;

        Dealer dealer = new Dealer();
        dealer.setPhone(dto.phone());
        dealer.setEnterprise(dto.enterprise());
        return dealer;
    }
}


