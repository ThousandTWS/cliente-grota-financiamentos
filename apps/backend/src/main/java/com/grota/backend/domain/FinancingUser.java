package com.grota.backend.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.io.Serial;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

@Table("financing_user")
public class FinancingUser extends AbstractAuditingEntity<Long> implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Id
    @Column("id")
    private Long id;

    @NotNull
    @Size(min = 2, max = 100)
    @Column("full_name")
    private String fullName;

    @NotNull
    @Email
    @Size(min = 5, max = 254)
    @Column("email")
    private String email;

    @JsonIgnore
    @NotNull
    @Size(min = 60, max = 60)
    @Column("password_hash")
    private String passwordHash;

    @NotNull
    @Column("role")
    private FinancingUserRole role = FinancingUserRole.ADMIN;

    @NotNull
    @Column("can_view")
    private Boolean canView = true;

    @NotNull
    @Column("can_create")
    private Boolean canCreate = true;

    @NotNull
    @Column("can_update")
    private Boolean canUpdate = true;

    @NotNull
    @Column("can_delete")
    private Boolean canDelete = true;

    @NotNull
    @Column("can_change_proposal_status")
    private Boolean canChangeProposalStatus = true;

    @Column("dealer_id")
    private Long dealerId;

    @NotNull
    @Column("allowed_dealers_count")
    private Integer allowedDealersCount = 0;

    @Transient
    private List<Long> allowedDealerIds = new ArrayList<>();

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

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public FinancingUserRole getRole() {
        return role;
    }

    public void setRole(FinancingUserRole role) {
        this.role = role;
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

    public Boolean getCanChangeProposalStatus() {
        return canChangeProposalStatus;
    }

    public void setCanChangeProposalStatus(Boolean canChangeProposalStatus) {
        this.canChangeProposalStatus = canChangeProposalStatus;
    }

    public Long getDealerId() {
        return dealerId;
    }

    public void setDealerId(Long dealerId) {
        this.dealerId = dealerId;
    }

    public List<Long> getAllowedDealerIds() {
        return allowedDealerIds;
    }

    public void setAllowedDealerIds(List<Long> allowedDealerIds) {
        this.allowedDealerIds = allowedDealerIds;
    }

    public Integer getAllowedDealersCount() {
        return allowedDealersCount;
    }

    public void setAllowedDealersCount(Integer allowedDealersCount) {
        this.allowedDealersCount = allowedDealersCount;
    }
}
