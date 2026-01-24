package org.example.server.modules.user.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import org.example.server.modules.user.model.UserRole;
import org.example.server.modules.user.model.UserStatus;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Objects;

@Entity
@Table(name = "tb_user")
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fullName;

    @Column(nullable = true, unique = true, length = 150)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    private UserRole role;

    @Enumerated(EnumType.STRING)
    private UserStatus status = UserStatus.PENDENTE;

    private String verificationCode;

    private LocalDateTime codeExpiration;

    private String resetCode;

    private LocalDateTime resetCodeExpiration;

    @Column(updatable = false, nullable = false)
    @JsonFormat(pattern = "dd/MM/yyyy HH:mm:ss")
    private LocalDateTime createdAt;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Dealer dealer;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Seller seller;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Manager manager;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Operator operator;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public User() {
    }

    public User(String email, String password) {
        this.email = email;
        this.password = password;
    }

    public void markAsVerified() {
        this.status = UserStatus.ATIVO;
        clearVerificationCode();
    }

    public void generateVerificationCode(String code, Duration validity) {
        this.verificationCode = code;
        this.codeExpiration = LocalDateTime.now().plus(validity);
        this.status = UserStatus.PENDENTE;
    }

    public boolean isVerificationCodeExpired() {
        return this.verificationCode != null && LocalDateTime.now().isAfter(this.codeExpiration);
    }

    public boolean doesVerificationCodeMatch(String code) {
        return this.verificationCode != null && this.verificationCode.equalsIgnoreCase(code);
    }

    public void clearVerificationCode() {
        this.verificationCode = null;
        this.codeExpiration = null;
    }

    public void clearResetCode() {
        this.resetCode = null;
        this.resetCodeExpiration = null;
    }

    public void generateResetCode(String code, Duration validity) {
        this.resetCode = code;
        this.resetCodeExpiration = LocalDateTime.now().plus(validity);
    }

    public boolean isResetCodeExpired() {
        return this.resetCode != null && LocalDateTime.now().isAfter(this.resetCodeExpiration);
    }

    public boolean doesResetCodeMatch(String code) {
        return this.resetCode != null && this.resetCode.equalsIgnoreCase(code);
    }

    public Long getId() {
        return id;
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

    public String getPassword() {
        return this.password;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public UserStatus getVerificationStatus() {
        return status;
    }

    public void setStatus(UserStatus status) {
        this.status = status;
    }

    public String getVerificationCode() {
        return verificationCode;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
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

    public Manager getManager() {
        return manager;
    }

    public void setManager(Manager manager) {
        this.manager = manager;
    }

    public Operator getOperator() {
        return operator;
    }

    public void setOperator(Operator operator) {
        this.operator = operator;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(this.role);
    }

    @Override
    public String getUsername() {
        if (this.email != null && !this.email.isBlank()) {
            return this.email;
        }
        if (this.dealer != null && this.dealer.getEnterprise() != null && !this.dealer.getEnterprise().isBlank()) {
            return this.dealer.getEnterprise();
        }
        return "";
    }

    @Override
    public boolean isAccountNonExpired() {
        return UserDetails.super.isAccountNonExpired();
    }

    @Override
    public boolean isAccountNonLocked() {
        return UserDetails.super.isAccountNonLocked();
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return UserDetails.super.isCredentialsNonExpired();
    }

    @Override
    public boolean isEnabled() {
        return UserDetails.super.isEnabled();
    }

    @Override
    public boolean equals(Object object) {
        if (this == object) return true;
        if (object == null || getClass() != object.getClass()) return false;
        User user = (User) object;
        return Objects.equals(id, user.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}


