package com.grota.backend.service.dto;

import com.grota.backend.domain.dealer.Dealer;
import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDate;

public class DealerProfileUpdateResponseDTO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    private String fullNameEnterprise;
    private LocalDate birthData;
    private String cnpj;
    private AddressDTO address;

    public DealerProfileUpdateResponseDTO() {}

    public DealerProfileUpdateResponseDTO(Dealer dealer) {
        this.fullNameEnterprise = dealer.getEnterprise();
        this.birthData = dealer.getBirthData();
        this.cnpj = dealer.getCnpj();
        this.address =
            new AddressDTO(
                dealer.getStreet(),
                dealer.getNumber(),
                dealer.getComplement(),
                dealer.getNeighborhood(),
                dealer.getCity(),
                dealer.getState(),
                dealer.getZipCode()
            );
    }

    public String getFullNameEnterprise() {
        return fullNameEnterprise;
    }

    public void setFullNameEnterprise(String fullNameEnterprise) {
        this.fullNameEnterprise = fullNameEnterprise;
    }

    public LocalDate getBirthData() {
        return birthData;
    }

    public void setBirthData(LocalDate birthData) {
        this.birthData = birthData;
    }

    public String getCnpj() {
        return cnpj;
    }

    public void setCnpj(String cnpj) {
        this.cnpj = cnpj;
    }

    public AddressDTO getAddress() {
        return address;
    }

    public void setAddress(AddressDTO address) {
        this.address = address;
    }
}
