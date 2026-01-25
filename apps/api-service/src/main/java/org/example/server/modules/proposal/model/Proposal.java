package org.example.server.modules.proposal.model;

import jakarta.persistence.*;
import org.example.server.modules.dealer.model.Dealer;
import org.example.server.modules.proposal.model.ProposalStatus;
import org.example.server.modules.seller.model.Seller;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "tb_proposal")
public class Proposal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dealer_id")
    private Dealer dealer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id")
    private Seller seller;

    @Column(nullable = false, length = 120)
    private String customerName;

    @Column(nullable = false, length = 20)
    private String customerCpf;

    private LocalDate customerBirthDate;

    @Column(length = 140)
    private String customerEmail;

    @Column(length = 30)
    private String customerPhone;

    @Column(length = 5)
    private String cnhCategory;

    private boolean hasCnh;

    @Column(length = 10)
    private String vehiclePlate;

    @Column(length = 40)
    private String fipeCode;

    private BigDecimal fipeValue;

    @Column(length = 80)
    private String vehicleBrand;

    @Column(length = 80)
    private String vehicleModel;

    private Integer vehicleYear;

    private BigDecimal downPaymentValue;

    private BigDecimal financedValue;

    private Integer termMonths;

    private Boolean vehicle0km = false;

    @Enumerated(EnumType.STRING)
    private ProposalStatus status = ProposalStatus.SUBMITTED;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(length = 40)
    private String maritalStatus;

    @Column(length = 12)
    private String cep;

    @Column(length = 160)
    private String address;

    @Column(length = 20)
    private String addressNumber;

    @Column(length = 120)
    private String addressComplement;

    @Column(length = 120)
    private String neighborhood;

    @Column(length = 4)
    private String uf;

    @Column(length = 120)
    private String city;

    private BigDecimal income;

    private BigDecimal otherIncomes;

    @Column(columnDefinition = "TEXT")
    private String metadata;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public Proposal() {
    }

    public Long getId() {
        return id;
    }

    public Dealer getDealer() {
        return dealer;
    }

    public void setDealer(Dealer dealer) {
        this.dealer = dealer;
    }

    public Seller getSeller() {
        return seller;
    }

    public void setSeller(Seller seller) {
        this.seller = seller;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getCustomerCpf() {
        return customerCpf;
    }

    public void setCustomerCpf(String customerCpf) {
        this.customerCpf = customerCpf;
    }

    public LocalDate getCustomerBirthDate() {
        return customerBirthDate;
    }

    public void setCustomerBirthDate(LocalDate customerBirthDate) {
        this.customerBirthDate = customerBirthDate;
    }

    public String getCustomerEmail() {
        return customerEmail;
    }

    public void setCustomerEmail(String customerEmail) {
        this.customerEmail = customerEmail;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public void setCustomerPhone(String customerPhone) {
        this.customerPhone = customerPhone;
    }

    public String getCnhCategory() {
        return cnhCategory;
    }

    public void setCnhCategory(String cnhCategory) {
        this.cnhCategory = cnhCategory;
    }

    public boolean isHasCnh() {
        return hasCnh;
    }

    public void setHasCnh(boolean hasCnh) {
        this.hasCnh = hasCnh;
    }

    public String getVehiclePlate() {
        return vehiclePlate;
    }

    public void setVehiclePlate(String vehiclePlate) {
        this.vehiclePlate = vehiclePlate;
    }

    public String getFipeCode() {
        return fipeCode;
    }

    public void setFipeCode(String fipeCode) {
        this.fipeCode = fipeCode;
    }

    public BigDecimal getFipeValue() {
        return fipeValue;
    }

    public void setFipeValue(BigDecimal fipeValue) {
        this.fipeValue = fipeValue;
    }

    public String getVehicleBrand() {
        return vehicleBrand;
    }

    public void setVehicleBrand(String vehicleBrand) {
        this.vehicleBrand = vehicleBrand;
    }

    public String getVehicleModel() {
        return vehicleModel;
    }

    public void setVehicleModel(String vehicleModel) {
        this.vehicleModel = vehicleModel;
    }

    public Integer getVehicleYear() {
        return vehicleYear;
    }

    public void setVehicleYear(Integer vehicleYear) {
        this.vehicleYear = vehicleYear;
    }

    public BigDecimal getDownPaymentValue() {
        return downPaymentValue;
    }

    public void setDownPaymentValue(BigDecimal downPaymentValue) {
        this.downPaymentValue = downPaymentValue;
    }

    public BigDecimal getFinancedValue() {
        return financedValue;
    }

    public void setFinancedValue(BigDecimal financedValue) {
        this.financedValue = financedValue;
    }

    public Integer getTermMonths() {
        return termMonths;
    }

    public void setTermMonths(Integer termMonths) {
        this.termMonths = termMonths;
    }

    public Boolean getVehicle0km() {
        return vehicle0km;
    }

    public void setVehicle0km(Boolean vehicle0km) {
        this.vehicle0km = vehicle0km;
    }

    public ProposalStatus getStatus() {
        return status;
    }

    public void setStatus(ProposalStatus status) {
        this.status = status;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getMaritalStatus() {
        return maritalStatus;
    }

    public void setMaritalStatus(String maritalStatus) {
        this.maritalStatus = maritalStatus;
    }

    public String getCep() {
        return cep;
    }

    public void setCep(String cep) {
        this.cep = cep;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getAddressNumber() {
        return addressNumber;
    }

    public void setAddressNumber(String addressNumber) {
        this.addressNumber = addressNumber;
    }

    public String getAddressComplement() {
        return addressComplement;
    }

    public void setAddressComplement(String addressComplement) {
        this.addressComplement = addressComplement;
    }

    public String getNeighborhood() {
        return neighborhood;
    }

    public void setNeighborhood(String neighborhood) {
        this.neighborhood = neighborhood;
    }

    public String getUf() {
        return uf;
    }

    public void setUf(String uf) {
        this.uf = uf;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public BigDecimal getIncome() {
        return income;
    }

    public void setIncome(BigDecimal income) {
        this.income = income;
    }

    public BigDecimal getOtherIncomes() {
        return otherIncomes;
    }

    public void setOtherIncomes(BigDecimal otherIncomes) {
        this.otherIncomes = otherIncomes;
    }

    public String getMetadata() {
        return metadata;
    }

    public void setMetadata(String metadata) {
        this.metadata = metadata;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Proposal proposal = (Proposal) o;
        return Objects.equals(id, proposal.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}


