package org.example.server.modules.proposal.model;

import jakarta.persistence.*;
import org.example.server.modules.proposal.model.ProposalStatus;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "tb_proposal_event")
public class ProposalEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "proposal_id")
    private Proposal proposal;

    @Column(length = 60, nullable = false)
    private String type;

    @Enumerated(EnumType.STRING)
    private ProposalStatus statusFrom;

    @Enumerated(EnumType.STRING)
    private ProposalStatus statusTo;

    @Column(length = 180)
    private String actor;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(columnDefinition = "TEXT")
    private String payload;

    @CreationTimestamp
    private LocalDateTime createdAt;

    public ProposalEvent() {
    }

    public Long getId() {
        return id;
    }

    public Proposal getProposal() {
        return proposal;
    }

    public void setProposal(Proposal proposal) {
        this.proposal = proposal;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public ProposalStatus getStatusFrom() {
        return statusFrom;
    }

    public void setStatusFrom(ProposalStatus statusFrom) {
        this.statusFrom = statusFrom;
    }

    public ProposalStatus getStatusTo() {
        return statusTo;
    }

    public void setStatusTo(ProposalStatus statusTo) {
        this.statusTo = statusTo;
    }

    public String getActor() {
        return actor;
    }

    public void setActor(String actor) {
        this.actor = actor;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public String getPayload() {
        return payload;
    }

    public void setPayload(String payload) {
        this.payload = payload;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ProposalEvent that = (ProposalEvent) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}


