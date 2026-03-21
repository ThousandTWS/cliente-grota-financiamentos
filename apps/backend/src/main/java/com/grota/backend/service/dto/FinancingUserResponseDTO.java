package com.grota.backend.service.dto;

import com.grota.backend.domain.FinancingUser;
import com.grota.backend.domain.FinancingUserRole;
import java.io.Serial;
import java.io.Serializable;
import java.util.List;

public class FinancingUserResponseDTO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    private Long id;
    private String email;
    private String fullName;
    private FinancingUserRole role;
    private Boolean canView;
    private Boolean canCreate;
    private Boolean canUpdate;
    private Boolean canDelete;
    private Boolean canChangeProposalStatus;
    private Long dealerId;
    private List<Long> allowedDealerIds;
    private Integer allowedDealersCount;

    public FinancingUserResponseDTO() {}

    public FinancingUserResponseDTO(FinancingUser user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.fullName = user.getFullName();
        this.role = user.getRole();
        this.canView = user.getCanView();
        this.canCreate = user.getCanCreate();
        this.canUpdate = user.getCanUpdate();
        this.canDelete = user.getCanDelete();
        this.canChangeProposalStatus = user.getCanChangeProposalStatus();
        this.dealerId = user.getDealerId();
        this.allowedDealerIds = user.getAllowedDealerIds();
        this.allowedDealersCount = user.getAllowedDealersCount();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
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
