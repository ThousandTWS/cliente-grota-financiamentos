package com.grota.backend.service.dto;

import com.grota.backend.domain.dealer.Dealer;
import com.grota.backend.domain.dealer.DealerStatus;
import java.io.Serial;
import java.io.Serializable;
import java.time.Instant;

public class DealerAdminRegisterResponseDTO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    private Long id;
    private String fullName;
    private String razaoSocial;
    private String cnpj;
    private String referenceCode;
    private String phone;
    private String enterprise;
    private String logoUrl;
    private DealerStatus status;
    private Instant createdAt;

    public DealerAdminRegisterResponseDTO() {}

    public DealerAdminRegisterResponseDTO(Dealer dealer) {
        this.id = dealer.getId();
        this.fullName = dealer.getFullName();
        this.razaoSocial = dealer.getRazaoSocial();
        this.cnpj = dealer.getCnpj();
        this.referenceCode = dealer.getReferenceCode();
        this.phone = dealer.getPhone();
        this.enterprise = dealer.getEnterprise();
        this.logoUrl = dealer.getLogoUrl();
        this.status = dealer.getStatus();
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

    public String getRazaoSocial() {
        return razaoSocial;
    }

    public void setRazaoSocial(String razaoSocial) {
        this.razaoSocial = razaoSocial;
    }

    public String getCnpj() {
        return cnpj;
    }

    public void setCnpj(String cnpj) {
        this.cnpj = cnpj;
    }

    public String getReferenceCode() {
        return referenceCode;
    }

    public void setReferenceCode(String referenceCode) {
        this.referenceCode = referenceCode;
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

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
