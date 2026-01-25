package org.example.server.modules.manager.model;

import jakarta.persistence.*;
import org.example.server.modules.dealer.model.Dealer;
import org.example.server.modules.user.model.User;
import org.example.server.shared.address.model.Address;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Objects;


@Entity
@Table(name = "tb_manager")
public class Manager {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String phone;

    @Column(nullable = false, unique = true, length = 20)
    private String CPF;

    private LocalDate birthData;

    @Embedded
    private Address address;

    @OneToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @Column(nullable = false, columnDefinition = "boolean default true")
    private Boolean canView = true;

    @Column(nullable = false, columnDefinition = "boolean default true")
    private Boolean canCreate = true;

    @Column(nullable = false, columnDefinition = "boolean default true")
    private Boolean canUpdate = true;

    @Column(nullable = false, columnDefinition = "boolean default true")
    private Boolean canDelete = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dealer_id", nullable = true)
    private Dealer dealer;

    public Manager() {
    }

    public Manager(String phone, String CPF, LocalDate birthData, Address address) {
        this.phone = phone;
        this.CPF = CPF;
        this.birthData = birthData;
        this.address = address;
    }

    public Long getId() {
        return id;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getCPF() {
        return CPF;
    }

    public void setCPF(String CPF) {
        this.CPF = CPF;
    }

    public LocalDate getBirthData() {
        return birthData;
    }

    public void setBirthData(LocalDate birthData) {
        this.birthData = birthData;
    }

    public Address getAddress() {
        return address;
    }

    public void setAddress(Address address) {
        this.address = address;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
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

    public Dealer getDealer() {
        return dealer;
    }

    public void setDealer(Dealer dealer) {
        this.dealer = dealer;
    }

    @Override
    public boolean equals(Object object) {
        if (this == object) return true;
        if (object == null || getClass() != object.getClass()) return false;
        Manager manager = (Manager) object;
        return Objects.equals(id, manager.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}


