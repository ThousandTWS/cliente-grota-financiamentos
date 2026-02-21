package org.example.server.modules.billing.service;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class BillingIntelligenceRulesTest {

    @Test
    void calculateDaysLateUsesMaxZero() {
        LocalDate today = LocalDate.of(2026, 2, 21);
        assertEquals(0, BillingIntelligenceRules.calculateDaysLate(today.plusDays(3), today));
        assertEquals(5, BillingIntelligenceRules.calculateDaysLate(today.minusDays(5), today));
    }

    @Test
    void resolveAgingBucketMapsBoundaries() {
        assertEquals("0-7", BillingIntelligenceRules.resolveAgingBucket(0));
        assertEquals("0-7", BillingIntelligenceRules.resolveAgingBucket(7));
        assertEquals("8-15", BillingIntelligenceRules.resolveAgingBucket(8));
        assertEquals("16-30", BillingIntelligenceRules.resolveAgingBucket(16));
        assertEquals("31-60", BillingIntelligenceRules.resolveAgingBucket(31));
        assertEquals("61+", BillingIntelligenceRules.resolveAgingBucket(90));
    }

    @Test
    void severityRulesFollowBaseline() {
        BigDecimal threshold = BigDecimal.valueOf(5000);

        assertEquals(
                "atencao",
                BillingIntelligenceRules.resolveSeverity(3, BigDecimal.valueOf(100), 0, "baixo", threshold)
        );
        assertEquals(
                "atencao",
                BillingIntelligenceRules.resolveSeverity(0, BigDecimal.valueOf(6000), 0, "baixo", threshold)
        );
        assertEquals(
                "critico",
                BillingIntelligenceRules.resolveSeverity(10, BigDecimal.valueOf(100), 0, "baixo", threshold)
        );
        assertEquals(
                "critico",
                BillingIntelligenceRules.resolveSeverity(0, BigDecimal.valueOf(100), 2, "baixo", threshold)
        );
        assertEquals(
                "critico",
                BillingIntelligenceRules.resolveSeverity(0, BigDecimal.valueOf(100), 0, "alto", threshold)
        );
    }

    @Test
    void fallbackScoreReflectsDelayAmountAndHistory() {
        int low = BillingIntelligenceRules.calculateFallbackRiskScore(
                0,
                BigDecimal.valueOf(300),
                0,
                0,
                BigDecimal.valueOf(5000)
        );
        int high = BillingIntelligenceRules.calculateFallbackRiskScore(
                45,
                BigDecimal.valueOf(15000),
                3,
                4,
                BigDecimal.valueOf(5000)
        );

        assertTrue(high > low);
        assertEquals("alto", BillingIntelligenceRules.resolveRiskLevel(high));
    }
}
