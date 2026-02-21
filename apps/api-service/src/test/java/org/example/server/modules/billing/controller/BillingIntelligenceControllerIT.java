package org.example.server.modules.billing.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.server.modules.billing.dto.*;
import org.example.server.modules.billing.service.BillingIntelligenceService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(BillingIntelligenceController.class)
@AutoConfigureMockMvc(addFilters = false)
class BillingIntelligenceControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private BillingIntelligenceService billingIntelligenceService;

    @Test
    void shouldReturnIntelligenceDashboard() throws Exception {
        BillingIntelligenceSummaryDTO payload = new BillingIntelligenceSummaryDTO(
                LocalDateTime.of(2026, 2, 21, 10, 30),
                new BillingIntelligenceKpisDTO(
                        BigDecimal.valueOf(12000),
                        4,
                        BigDecimal.valueOf(50),
                        BigDecimal.valueOf(7800),
                        BigDecimal.valueOf(65)
                ),
                new BillingIntelligenceAgingDTO(1, 1, 1, 1, 0),
                List.of(
                        new BillingIntelligenceTitleDTO(
                                10L,
                                "14-555555/25",
                                3,
                                LocalDate.of(2026, 2, 10),
                                BigDecimal.valueOf(3200),
                                11,
                                "EM_ATRASO",
                                "Cliente Teste",
                                "abc123",
                                "123***45",
                                "varejo",
                                LocalDate.of(2026, 2, 18),
                                2,
                                2,
                                "alto",
                                82,
                                "Contato imediato",
                                "whatsapp",
                                "Atraso relevante",
                                "Podemos negociar hoje?",
                                "critico"
                        )
                )
        );

        when(billingIntelligenceService.getIntelligence(any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(payload);

        mockMvc.perform(get("/api/v1/grota-financiamentos/billing/intelligence"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.kpis.totalTitles").value(4))
                .andExpect(jsonPath("$.titles[0].riskLevel").value("alto"))
                .andExpect(jsonPath("$.titles[0].severity").value("critico"));
    }

    @Test
    void shouldReturnAlerts() throws Exception {
        List<BillingIntelligenceAlertDTO> alerts = List.of(
                new BillingIntelligenceAlertDTO(
                        1L,
                        "abc123",
                        "Cliente Teste",
                        "atencao",
                        "Atraso inicial",
                        "Registrar contato",
                        "email",
                        10L,
                        2,
                        BigDecimal.valueOf(2100),
                        4,
                        LocalDateTime.of(2026, 2, 21, 11, 0)
                )
        );

        when(billingIntelligenceService.getAlerts(any())).thenReturn(alerts);

        mockMvc.perform(get("/api/v1/grota-financiamentos/billing/alerts?limit=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].severity").value("atencao"))
                .andExpect(jsonPath("$[0].contractId").value(10));
    }

    @Test
    void shouldAnalyzeTitleWithIaEndpoint() throws Exception {
        BillingAiAnalyzeResponseDTO response = new BillingAiAnalyzeResponseDTO(
                10L,
                3,
                "medio",
                58,
                "Registrar contato ativo",
                "telefone",
                "Risco moderado",
                "Temos uma pendencia em aberto.",
                "gemini",
                LocalDateTime.of(2026, 2, 21, 11, 15)
        );

        when(billingIntelligenceService.analyzeTitle(any())).thenReturn(response);

        BillingAiAnalyzeRequestDTO request = new BillingAiAnalyzeRequestDTO(10L, 3, true);

        mockMvc.perform(post("/api/v1/grota-financiamentos/billing/ia/analisar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.riskScore").value(58))
                .andExpect(jsonPath("$.source").value("gemini"));
    }
}
