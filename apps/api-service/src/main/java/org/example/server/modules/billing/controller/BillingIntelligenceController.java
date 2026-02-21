package org.example.server.modules.billing.controller;

import jakarta.validation.Valid;
import org.example.server.modules.billing.dto.BillingAiAnalyzeRequestDTO;
import org.example.server.modules.billing.dto.BillingAiAnalyzeResponseDTO;
import org.example.server.modules.billing.dto.BillingIntelligenceAlertDTO;
import org.example.server.modules.billing.dto.BillingIntelligenceSummaryDTO;
import org.example.server.modules.billing.service.BillingIntelligenceService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/grota-financiamentos/billing")
public class BillingIntelligenceController {

    private final BillingIntelligenceService billingIntelligenceService;

    public BillingIntelligenceController(BillingIntelligenceService billingIntelligenceService) {
        this.billingIntelligenceService = billingIntelligenceService;
    }

    @GetMapping("/intelligence")
    public ResponseEntity<BillingIntelligenceSummaryDTO> getIntelligence(
            @RequestParam(name = "client", required = false) String client,
            @RequestParam(name = "periodFrom", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate periodFrom,
            @RequestParam(name = "periodTo", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate periodTo,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "aging", required = false) String aging,
            @RequestParam(name = "minValue", required = false) BigDecimal minValue,
            @RequestParam(name = "maxValue", required = false) BigDecimal maxValue,
            @RequestParam(name = "risk", required = false) String risk
    ) {
        BillingIntelligenceSummaryDTO payload = billingIntelligenceService.getIntelligence(
                Optional.ofNullable(client),
                Optional.ofNullable(periodFrom),
                Optional.ofNullable(periodTo),
                Optional.ofNullable(status),
                Optional.ofNullable(aging),
                Optional.ofNullable(minValue),
                Optional.ofNullable(maxValue),
                Optional.ofNullable(risk)
        );
        return ResponseEntity.ok(payload);
    }

    @GetMapping("/alerts")
    public ResponseEntity<List<BillingIntelligenceAlertDTO>> getAlerts(
            @RequestParam(name = "limit", required = false) Integer limit
    ) {
        return ResponseEntity.ok(billingIntelligenceService.getAlerts(Optional.ofNullable(limit)));
    }

    @PostMapping("/ia/analisar")
    public ResponseEntity<BillingAiAnalyzeResponseDTO> analyzeTitle(
            @Valid @RequestBody BillingAiAnalyzeRequestDTO request
    ) {
        return ResponseEntity.ok(billingIntelligenceService.analyzeTitle(request));
    }
}
