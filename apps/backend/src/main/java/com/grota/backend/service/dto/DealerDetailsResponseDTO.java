package com.grota.backend.service.dto;

import com.grota.backend.domain.dealer.Dealer;
import com.grota.backend.domain.dealer.DealerStatus;
import java.io.Serial;
import java.io.Serializable;
import java.time.Instant;
import java.time.LocalDate;

public class DealerDetailsResponseDTO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private String enterprise;
    private String referenceCode;
    private String logoUrl;
    private DealerStatus status;
    private String fullNameEnterprise;
    private LocalDate birthData;
    private String cnpj;
    private AddressDTO address;
    private Instant createdAt;

    public DealerDetailsResponseDTO() {}

    public DealerDetailsResponseDTO(Dealer dealer) {
        this.id = dealer.getId();
        this.fullName = dealer.getFullName();
        this.email = null;
        this.phone = dealer.getPhone();
        this.enterprise = dealer.getEnterprise();
        this.referenceCode = dealer.getReferenceCode();
        this.logoUrl = dealer.getLogoUrl();
        this.status = dealer.getStatus();
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
        this.createdAt = dealer.getCreatedAt();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEnterprise() {
        return enterprise;
    }

    public void setEnterprise(String enterprise) {
        this.enterprise = enterprise;
    }

    public String getReferenceCode() {
        return referenceCode;
    }

    public void setReferenceCode(String referenceCode) {
        this.referenceCode = referenceCode;
    }

    public String getLogoUrl() {
        return logoUrl;
    }

    public void setLogoUrl(String logoUrl) {
        this.logoUrl = logoUrl;
    }

    public DealerStatus getStatus() {
        return status;
    }

    public void setStatus(DealerStatus status) {
        this.status = status;
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

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
