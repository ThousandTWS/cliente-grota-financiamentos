package org.example.server.modules.billing.controller;

import jakarta.validation.Valid;
import org.example.server.modules.billing.dto.*;
import org.example.server.modules.billing.model.BillingStatus;
import org.example.server.modules.billing.service.BillingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/grota-financiamentos/billing")
public class BillingController {

    private final BillingService billingService;

    public BillingController(BillingService billingService) {
        this.billingService = billingService;
    }

    @PostMapping("/contracts")
    public ResponseEntity<BillingContractDetailsDTO> createContract(
            @Valid @RequestBody BillingContractCreateDTO dto) {
        return ResponseEntity.ok(billingService.createContract(dto));
    }

    @GetMapping("/contracts")
    public ResponseEntity<List<BillingContractSummaryDTO>> listContracts(
            @RequestParam(name = "name", required = false) String name,
            @RequestParam(name = "document", required = false) String document,
            @RequestParam(name = "contractNumber", required = false) String contractNumber,
            @RequestParam(name = "status", required = false) BillingStatus status) {
        return ResponseEntity.ok(
                billingService.listContracts(
                        Optional.ofNullable(name),
                        Optional.ofNullable(document),
                        Optional.ofNullable(contractNumber),
                        Optional.ofNullable(status)));
    }

    @GetMapping("/contracts/{id}")
    public ResponseEntity<BillingContractDetailsDTO> getContract(@PathVariable Long id) {
        return ResponseEntity.ok(billingService.getContractDetailsById(id));
    }

    @PatchMapping("/contracts/{id}")
    public ResponseEntity<BillingContractDetailsDTO> updateContract(
            @PathVariable Long id,
            @Valid @RequestBody BillingContractUpdateDTO dto) {
        return ResponseEntity.ok(billingService.updateContractById(id, dto));
    }

    @DeleteMapping("/contracts/{id}")
    public ResponseEntity<Void> deleteContract(@PathVariable Long id) {
        billingService.deleteContractById(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/contracts/{id}/installments/{installmentNumber}/due-date")
    public ResponseEntity<BillingInstallmentDTO> updateInstallmentDueDate(
            @PathVariable Long id,
            @PathVariable Integer installmentNumber,
            @Valid @RequestBody BillingInstallmentDueDateUpdateDTO dto) {
        return ResponseEntity.ok(
                billingService.updateInstallmentDueDateById(id, installmentNumber, dto));
    }

    @PatchMapping("/contracts/{id}/installments/{installmentNumber}")
    public ResponseEntity<BillingInstallmentDTO> updateInstallment(
            @PathVariable Long id,
            @PathVariable Integer installmentNumber,
            @Valid @RequestBody BillingInstallmentUpdateDTO dto) {
        return ResponseEntity.ok(
                billingService.updateInstallmentById(id, installmentNumber, dto));
    }

    @PatchMapping("/contracts/{id}/contract-number")
    public ResponseEntity<BillingContractDetailsDTO> updateContractNumber(
            @PathVariable Long id,
            @Valid @RequestBody BillingContractNumberUpdateDTO dto) {
        return ResponseEntity.ok(billingService.updateContractNumberById(id, dto));
    }

    @PatchMapping("/contracts/{id}/vehicle")
    public ResponseEntity<BillingContractDetailsDTO> updateVehicle(
            @PathVariable Long id,
            @Valid @RequestBody BillingVehicleUpdateDTO dto) {
        return ResponseEntity.ok(billingService.updateVehicleById(id, dto));
    }

    @PostMapping("/contracts/{id}/occurrences")
    public ResponseEntity<BillingOccurrenceDTO> createOccurrence(
            @PathVariable Long id,
            @Valid @RequestBody BillingOccurrenceRequestDTO dto) {
        return ResponseEntity.ok(billingService.addOccurrenceById(id, dto));
    }

    @PostMapping("/contracts/sync-status")
    public ResponseEntity<java.util.Map<String, Object>> syncAllContractsStatus() {
        int updatedCount = billingService.syncAllContractsStatus();
        return ResponseEntity.ok(java.util.Map.of(
                "message", "Status dos contratos sincronizados com sucesso",
                "updatedCount", updatedCount));
    }
}
