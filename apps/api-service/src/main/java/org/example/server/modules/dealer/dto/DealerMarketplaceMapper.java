package org.example.server.modules.dealer.dto;

import org.example.server.modules.dealer.model.Dealer;
import org.example.server.modules.user.model.User;
import org.example.server.shared.address.dto.AddressDTO;
import org.example.server.shared.address.dto.AddressMapper;
import org.springframework.stereotype.Component;

@Component
public class DealerMarketplaceMapper {

    private final AddressMapper addressMapper;

    public DealerMarketplaceMapper(AddressMapper addressMapper) {
        this.addressMapper = addressMapper;
    }

    public DealerMarketplaceSummaryDTO toSummaryDTO(Dealer dealer, long availableVehicles) {
        if (dealer == null) {
            return null;
        }

        User user = dealer.getUser();
        AddressDTO address = addressMapper.toDTO(dealer.getAddress());

        return new DealerMarketplaceSummaryDTO(
                dealer.getId(),
                dealer.getEnterprise(),
                dealer.getReferenceCode(),
                dealer.getLogoUrl(),
                user != null ? user.getFullName() : null,
                dealer.getFullNameEnterprise(),
                dealer.getPhone(),
                address != null ? address.city() : null,
                address != null ? address.state() : null,
                availableVehicles
        );
    }

    public DealerMarketplaceDetailsDTO toDetailsDTO(Dealer dealer, long availableVehicles) {
        if (dealer == null) {
            return null;
        }

        User user = dealer.getUser();

        return new DealerMarketplaceDetailsDTO(
                dealer.getId(),
                dealer.getEnterprise(),
                dealer.getReferenceCode(),
                dealer.getLogoUrl(),
                user != null ? user.getFullName() : null,
                dealer.getFullNameEnterprise(),
                dealer.getPhone(),
                dealer.getCnpj(),
                dealer.getObservation(),
                addressMapper.toDTO(dealer.getAddress()),
                availableVehicles
        );
    }
}
