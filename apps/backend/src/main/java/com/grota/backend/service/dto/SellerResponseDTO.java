package com.grota.backend.service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.grota.backend.domain.seller.Seller;
import com.grota.backend.enums.SellerStatus;
import java.io.Serial;
import java.io.Serializable;
import java.time.Instant;
import java.time.LocalDate;

public class SellerResponseDTO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    private Long id;
    private Long dealerId;
    private String fullName;
    private String email;
    private String phone;
    private String cpf;
    private LocalDate birthData;
    private SellerStatus status;
    private Instant createdAt;
    private Boolean canView;
    private Boolean canCreate;
    private Boolean canUpdate;
    private Boolean canDelete;

    public SellerResponseDTO() {}

    public SellerResponseDTO(Seller seller) {
        this.id = seller.getId();
        this.dealerId = seller.getDealerId();
        this.fullName = seller.getFullName();
        this.email = seller.getEmail();
        this.phone = seller.getPhone();
        this.cpf = seller.getCpf();
        this.birthData = seller.getBirthData();
        this.status = seller.getStatus();
        this.createdAt = seller.getCreatedAt();
        this.canView = seller.getCanView();
        this.canCreate = seller.getCanCreate();
        this.canUpdate = seller.getCanUpdate();
        this.canDelete = seller.getCanDelete();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getDealerId() {
        return dealerId;
    }

    public void setDealerId(Long dealerId) {
        this.dealerId = dealerId;
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

    @JsonProperty("CPF")
    public String getCpf() {
        return cpf;
    }

    @JsonProperty("CPF")
    public void setCpf(String cpf) {
        this.cpf = cpf;
    }

    public LocalDate getBirthData() {
        return birthData;
    }

    public void setBirthData(LocalDate birthData) {
        this.birthData = birthData;
    }

    public SellerStatus getStatus() {
        return status;
    }

    public void setStatus(SellerStatus status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Boolean getCanView() {
        return canView;
    }

    public void setCanView(Boolean canView) {
        this.canView = canView;
    }

    public Boolean getCanCreate() {
        return canCreate;
    }

    public void setCanCreate(Boolean canCreate) {
        this.canCreate = canCreate;
    }

    public Boolean getCanUpdate() {
        return canUpdate;
    }

    public void setCanUpdate(Boolean canUpdate) {
        this.canUpdate = canUpdate;
    }

    public Boolean getCanDelete() {
        return canDelete;
    }

    public void setCanDelete(Boolean canDelete) {
        this.canDelete = canDelete;
    }
}
