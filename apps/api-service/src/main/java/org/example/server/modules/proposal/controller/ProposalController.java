package org.example.server.modules.proposal.controller;

import jakarta.validation.Valid;
import org.example.server.modules.proposal.dto.ProposalRequestDTO;
import org.example.server.modules.proposal.dto.ProposalEventResponseDTO;
import org.example.server.modules.proposal.dto.ProposalResponseDTO;
import org.example.server.modules.proposal.dto.ProposalStatusUpdateDTO;
import org.example.server.modules.proposal.model.ProposalStatus;
import org.example.server.modules.proposal.service.ProposalService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/grota-financiamentos/proposals")
public class ProposalController {

    private final ProposalService proposalService;

    public ProposalController(ProposalService proposalService) {
        this.proposalService = proposalService;
    }

    @PostMapping
    public ResponseEntity<ProposalResponseDTO> create(
            @RequestHeader(value = "X-Actor", required = false) String actor,
            @Valid @RequestBody ProposalRequestDTO dto,
            jakarta.servlet.http.HttpServletRequest request
    ) {
        return ResponseEntity.ok(
                proposalService.createProposal(dto, request.getRemoteAddr(), actor)
        );
    }

    @GetMapping
    public ResponseEntity<List<ProposalResponseDTO>> list(
            @RequestParam(name = "dealerId", required = false) Long dealerId,
            @RequestParam(name = "status", required = false) ProposalStatus status
    ) {
        return ResponseEntity.ok(proposalService.listProposals(Optional.ofNullable(dealerId), Optional.ofNullable(status)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProposalResponseDTO> update(
            @PathVariable Long id,
            @RequestHeader(value = "X-Actor", required = false) String actor,
            @Valid @RequestBody ProposalRequestDTO dto,
            jakarta.servlet.http.HttpServletRequest request
    ) {
        return ResponseEntity.ok(
                proposalService.updateProposal(id, dto, request.getRemoteAddr(), actor)
        );
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ProposalResponseDTO> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody ProposalStatusUpdateDTO dto,
            jakarta.servlet.http.HttpServletRequest request
    ) {
        return ResponseEntity.ok(proposalService.updateStatus(id, dto, request.getRemoteAddr()));
    }

    @GetMapping("/{id}/events")
    public ResponseEntity<List<ProposalEventResponseDTO>> timeline(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(proposalService.listEvents(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        proposalService.deleteProposal(id);
        return ResponseEntity.noContent().build();
    }
}

