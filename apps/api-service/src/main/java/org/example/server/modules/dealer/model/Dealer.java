package org.example.server.modules.dealer.model;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "tb_dealer")
public class Dealer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate birthData;

    @Column(nullable = false, unique = true, length = 50)
    private String phone;

    @Column(length = 150, nullable = false, unique = true)
    private String enterprise;

    private String fullNameEnterprise;

    private String cnpj;

    @Column(unique = true, length = 30)
    private String referenceCode;

    @Column(length = 500)
    private String logoUrl;

    @Column(length = 255)
    private String logoPublicId;

    @Embedded
    private Address address;

    private String observation;

    @OneToOne(cascade = CascadeType.ALL, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @OneToMany(mappedBy = "dealer", fetch = FetchType.LAZY)
    private List<Vehicle> vehicles;

    @OneToMany(mappedBy = "dealer", fetch = FetchType.LAZY)
    private List<Document> documents;

    @OneToMany(mappedBy = "dealer", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Partner> partners;

    @OneToMany(mappedBy = "dealer", fetch = FetchType.LAZY)
    private List<Seller> sellers;

    @OneToMany(mappedBy = "dealer", fetch = FetchType.LAZY)
    private List<Manager> managers;

    @OneToMany(mappedBy = "dealer", fetch = FetchType.LAZY)
    private List<Operator> operators;

    public Dealer() {
    }

    public Dealer(LocalDate birthData, String phone, String enterprise, String fullNameEnterprise, String cnpj, Address address, User user) {
        this.birthData = birthData;
        this.phone = phone;
        this.enterprise = enterprise;
        this.fullNameEnterprise = fullNameEnterprise;
        this.cnpj = cnpj;
        this.address = address;
        this.user = user;
    }

    public void addVehicle(Vehicle vehicle) {
        this.vehicles.add(vehicle);
    }

    public Long getId() {
        return id;
    }

    public LocalDate getBirthData() {
        return birthData;
    }

    public void setBirthData(LocalDate birthData) {
        this.birthData = birthData;
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

    public String getFullNameEnterprise() {
        return fullNameEnterprise;
    }

    public void setFullNameEnterprise(String fullNameEnterprise) {
        this.fullNameEnterprise = fullNameEnterprise;
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

    public String getLogoUrl() {
        return logoUrl;
    }

    public void setLogoUrl(String logoUrl) {
        this.logoUrl = logoUrl;
    }

    public String getLogoPublicId() {
        return logoPublicId;
    }

    public void setLogoPublicId(String logoPublicId) {
        this.logoPublicId = logoPublicId;
    }

    public Address getAddress() {
        return address;
    }

    public void setAddress(Address address) {
        this.address = address;
    }

    public String getObservation() {
        return observation;
    }

    public void setObservation(String observation) {
        this.observation = observation;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public List<Partner> getPartners() {
        return partners;
    }

    public void setPartners(List<Partner> partners) {
        this.partners = partners;
    }

    public List<Seller> getSellers() {
        return sellers;
    }

    public void setSellers(List<Seller> sellers) {
        this.sellers = sellers;
    }

    public List<Manager> getManagers() {
        return managers;
    }

    public void setManagers(List<Manager> managers) {
        this.managers = managers;
    }

    public List<Operator> getOperators() {
        return operators;
    }

    public void setOperators(List<Operator> operators) {
        this.operators = operators;
    }

}


