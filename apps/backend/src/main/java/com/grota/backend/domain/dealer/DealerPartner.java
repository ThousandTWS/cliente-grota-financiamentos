package com.grota.backend.domain.dealer;

import java.io.Serial;
import java.io.Serializable;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

@Table("dealer_partner")
public class DealerPartner implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Id
    @Column("id")
    private Long id;

    @Column("dealer_id")
    private Long dealerId;

    @Column("cpf")
    private String cpf;

    @Column("name")
    private String name;

    @Column("type")
    private DealerPartnerType type;

    @Column("signatory")
    private Boolean signatory;

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

    public String getCpf() {
        return cpf;
    }

    public void setCpf(String cpf) {
        this.cpf = cpf;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public DealerPartnerType getType() {
        return type;
    }

    public void setType(DealerPartnerType type) {
        this.type = type;
    }

    public Boolean getSignatory() {
        return signatory;
    }

    public void setSignatory(Boolean signatory) {
        this.signatory = signatory;
    }
}
