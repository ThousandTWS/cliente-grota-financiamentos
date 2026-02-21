package org.example.server.modules.billing.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

public final class BillingIntelligenceRules {

    private BillingIntelligenceRules() {
    }

    public static int calculateDaysLate(LocalDate dueDate, LocalDate referenceDate) {
        if (dueDate == null || referenceDate == null) {
            return 0;
        }
        long rawDays = ChronoUnit.DAYS.between(dueDate, referenceDate);
        return rawDays > 0 ? (int) rawDays : 0;
    }

    public static String resolveAgingBucket(int daysLate) {
        if (daysLate <= 7) {
            return "0-7";
        }
        if (daysLate <= 15) {
            return "8-15";
        }
        if (daysLate <= 30) {
            return "16-30";
        }
        if (daysLate <= 60) {
            return "31-60";
        }
        return "61+";
    }

    public static int calculateFallbackRiskScore(
            int daysLate,
            BigDecimal amount,
            int recurrence90Days,
            int remindersCount,
            BigDecimal highValueThreshold
    ) {
        int score = 0;

        if (daysLate >= 1) score += 10;
        if (daysLate >= 3) score += 20;
        if (daysLate >= 10) score += 25;
        if (daysLate >= 30) score += 20;
        if (daysLate >= 61) score += 10;

        BigDecimal safeAmount = amount != null ? amount : BigDecimal.ZERO;
        BigDecimal threshold = highValueThreshold != null ? highValueThreshold : BigDecimal.valueOf(5000);

        if (safeAmount.compareTo(threshold) >= 0) {
            score += 15;
        }

        if (recurrence90Days >= 2) {
            score += 20;
        }

        if (remindersCount >= 3) {
            score += 10;
        } else if (remindersCount >= 1) {
            score += 5;
        }

        return Math.min(score, 100);
    }

    public static String resolveRiskLevel(int riskScore) {
        if (riskScore >= 70) {
            return "alto";
        }
        if (riskScore >= 40) {
            return "medio";
        }
        return "baixo";
    }

    public static String resolveSeverity(
            int daysLate,
            BigDecimal amount,
            int recurrence90Days,
            String riskLevel,
            BigDecimal attentionAmountThreshold
    ) {
        String normalizedRisk = riskLevel == null ? "" : riskLevel.trim().toLowerCase();
        BigDecimal threshold = attentionAmountThreshold != null
                ? attentionAmountThreshold
                : BigDecimal.valueOf(5000);
        BigDecimal safeAmount = amount != null ? amount : BigDecimal.ZERO;

        if (daysLate >= 10 || recurrence90Days >= 2 || "alto".equals(normalizedRisk)) {
            return "critico";
        }

        if (daysLate >= 3 || safeAmount.compareTo(threshold) >= 0) {
            return "atencao";
        }

        return "info";
    }

    public static BigDecimal recoveryRateByRiskLevel(String riskLevel) {
        String normalized = riskLevel == null ? "" : riskLevel.trim().toLowerCase();
        if ("alto".equals(normalized)) {
            return BigDecimal.valueOf(0.25);
        }
        if ("medio".equals(normalized)) {
            return BigDecimal.valueOf(0.55);
        }
        return BigDecimal.valueOf(0.85);
    }

    public static BigDecimal percentage(long part, long total) {
        if (total <= 0) {
            return BigDecimal.ZERO;
        }
        return BigDecimal.valueOf(part)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP);
    }
}
