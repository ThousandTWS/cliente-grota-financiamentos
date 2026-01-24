package org.example.server.modules.operator.model;

import jakarta.persistence.*;

@Entity
@Table(name = "tb_operator_dealer_links", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"operator_id", "dealer_id"})
})
public class OperatorDealerLink {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "operator_id", nullable = false)
    private Operator operator;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "dealer_id", nullable = false)
    private Dealer dealer;

    public OperatorDealerLink() {
    }

    public OperatorDealerLink(Operator operator, Dealer dealer) {
        this.operator = operator;
        this.dealer = dealer;
    }

    public Long getId() {
        return id;
    }

    public Operator getOperator() {
        return operator;
    }

    public void setOperator(Operator operator) {
        this.operator = operator;
    }

    public Dealer getDealer() {
        return dealer;
    }

    public void setDealer(Dealer dealer) {
        this.dealer = dealer;
    }
}


