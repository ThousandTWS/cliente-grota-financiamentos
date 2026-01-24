package org.example.server.modules.billing.model;

import jakarta.persistence.*;
import org.example.server.modules.billing.model.BillingStatus;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Entity
@Table(name = "tb_billing_contract")
public class BillingContract {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String contractNumber;

    private Long proposalId;

    @Enumerated(EnumType.STRING)
    private BillingStatus status = BillingStatus.EM_ABERTO;

    private LocalDate paidAt;

    private LocalDate startDate;

    private BigDecimal financedValue;

    private BigDecimal installmentValue;

    private Integer installmentsTotal;

    @Column(nullable = false, length = 120)
    private String customerName;

    @Column(nullable = false, length = 20)
    private String customerDocument;

    private LocalDate customerBirthDate;

    @Column(length = 140)
    private String customerEmail;

    @Column(length = 30)
    private String customerPhone;

    @Column(length = 160)
    private String customerAddress;

    @Column(length = 120)
    private String customerCity;

    @Column(length = 4)
    private String customerState;

    @Column(length = 120)
    private String professionalEnterprise;

    @Column(length = 80)
    private String professionalFunction;

    private LocalDate professionalAdmissionDate;

    private BigDecimal professionalIncome;

    private BigDecimal professionalOtherIncomes;

    @Column(length = 40)
    private String professionalMaritalStatus;

    @Column(length = 80)
    private String vehicleBrand;

    @Column(length = 80)
    private String vehicleModel;

    private Integer vehicleYear;

    @Column(length = 12)
    private String vehiclePlate;

    @Column(length = 20)
    private String vehicleRenavam;

    private Boolean dutIssued;

    private Boolean dutPaid;

    private LocalDate dutPaidDate;

    @OneToMany(mappedBy = "contract", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BillingInstallment> installments = new ArrayList<>();

    @OneToMany(mappedBy = "contract", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BillingOccurrence> occurrences = new ArrayList<>();

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public BillingContract() {
    }

    public Long getId() {
        return id;
    }

    public String getContractNumber() {
        return contractNumber;
    }

    public void setContractNumber(String contractNumber) {
        this.contractNumber = contractNumber;
    }

    public Long getProposalId() {
        return proposalId;
    }

    public void setProposalId(Long proposalId) {
        this.proposalId = proposalId;
    }

    public BillingStatus getStatus() {
        return status;
    }

    public void setStatus(BillingStatus status) {
        this.status = status;
    }

    public LocalDate getPaidAt() {
        return paidAt;
    }

    public void setPaidAt(LocalDate paidAt) {
        this.paidAt = paidAt;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public BigDecimal getFinancedValue() {
        return financedValue;
    }

    public void setFinancedValue(BigDecimal financedValue) {
        this.financedValue = financedValue;
    }

    public BigDecimal getInstallmentValue() {
        return installmentValue;
    }

    public void setInstallmentValue(BigDecimal installmentValue) {
        this.installmentValue = installmentValue;
    }

    public Integer getInstallmentsTotal() {
        return installmentsTotal;
    }

    public void setInstallmentsTotal(Integer installmentsTotal) {
        this.installmentsTotal = installmentsTotal;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getCustomerDocument() {
        return customerDocument;
    }

    public void setCustomerDocument(String customerDocument) {
        this.customerDocument = customerDocument;
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

    public String getCustomerAddress() {
        return customerAddress;
    }

    public void setCustomerAddress(String customerAddress) {
        this.customerAddress = customerAddress;
    }

    public String getCustomerCity() {
        return customerCity;
    }

    public void setCustomerCity(String customerCity) {
        this.customerCity = customerCity;
    }

    public String getCustomerState() {
        return customerState;
    }

    public void setCustomerState(String customerState) {
        this.customerState = customerState;
    }

    public String getProfessionalEnterprise() {
        return professionalEnterprise;
    }

    public void setProfessionalEnterprise(String professionalEnterprise) {
        this.professionalEnterprise = professionalEnterprise;
    }

    public String getProfessionalFunction() {
        return professionalFunction;
    }

    public void setProfessionalFunction(String professionalFunction) {
        this.professionalFunction = professionalFunction;
    }

    public LocalDate getProfessionalAdmissionDate() {
        return professionalAdmissionDate;
    }

    public void setProfessionalAdmissionDate(LocalDate professionalAdmissionDate) {
        this.professionalAdmissionDate = professionalAdmissionDate;
    }

    public BigDecimal getProfessionalIncome() {
        return professionalIncome;
    }

    public void setProfessionalIncome(BigDecimal professionalIncome) {
        this.professionalIncome = professionalIncome;
    }

    public BigDecimal getProfessionalOtherIncomes() {
        return professionalOtherIncomes;
    }

    public void setProfessionalOtherIncomes(BigDecimal professionalOtherIncomes) {
        this.professionalOtherIncomes = professionalOtherIncomes;
    }

    public String getProfessionalMaritalStatus() {
        return professionalMaritalStatus;
    }

    public void setProfessionalMaritalStatus(String professionalMaritalStatus) {
        this.professionalMaritalStatus = professionalMaritalStatus;
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

    public String getVehiclePlate() {
        return vehiclePlate;
    }

    public void setVehiclePlate(String vehiclePlate) {
        this.vehiclePlate = vehiclePlate;
    }

    public String getVehicleRenavam() {
        return vehicleRenavam;
    }

    public void setVehicleRenavam(String vehicleRenavam) {
        this.vehicleRenavam = vehicleRenavam;
    }

    public Boolean getDutIssued() {
        return dutIssued;
    }

    public void setDutIssued(Boolean dutIssued) {
        this.dutIssued = dutIssued;
    }

    public Boolean getDutPaid() {
        return dutPaid;
    }

    public void setDutPaid(Boolean dutPaid) {
        this.dutPaid = dutPaid;
    }

    public LocalDate getDutPaidDate() {
        return dutPaidDate;
    }

    public void setDutPaidDate(LocalDate dutPaidDate) {
        this.dutPaidDate = dutPaidDate;
    }

    public List<BillingInstallment> getInstallments() {
        return installments;
    }

    public void setInstallments(List<BillingInstallment> installments) {
        this.installments = installments;
    }

    public List<BillingOccurrence> getOccurrences() {
        return occurrences;
    }

    public void setOccurrences(List<BillingOccurrence> occurrences) {
        this.occurrences = occurrences;
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
        BillingContract that = (BillingContract) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}


