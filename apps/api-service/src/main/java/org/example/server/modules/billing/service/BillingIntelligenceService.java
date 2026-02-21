package org.example.server.modules.billing.service;

import org.example.server.core.exception.generic.RecordNotFoundException;
import org.example.server.modules.billing.dto.*;
import org.example.server.modules.billing.model.BillingAiInsight;
import org.example.server.modules.billing.model.BillingContract;
import org.example.server.modules.billing.model.BillingInstallment;
import org.example.server.modules.billing.model.BillingIntelligenceAlert;
import org.example.server.modules.billing.repository.BillingAiInsightRepository;
import org.example.server.modules.billing.repository.BillingContractRepository;
import org.example.server.modules.billing.repository.BillingInstallmentRepository;
import org.example.server.modules.billing.repository.BillingIntelligenceAlertRepository;
import org.example.server.modules.billing.repository.BillingOccurrenceRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class BillingIntelligenceService {

    private final BillingContractRepository contractRepository;
    private final BillingInstallmentRepository installmentRepository;
    private final BillingOccurrenceRepository occurrenceRepository;
    private final BillingAiInsightRepository insightRepository;
    private final BillingIntelligenceAlertRepository alertRepository;
    private final GeminiBillingIntelligenceService geminiBillingIntelligenceService;

    @Value("${billing.intelligence.cache-ttl-hours:6}")
    private long cacheTtlHours;

    @Value("${billing.intelligence.alert-cooldown-hours:6}")
    private long alertCooldownHours;

    @Value("${billing.intelligence.high-value-threshold:5000}")
    private BigDecimal highValueThreshold;

    public BillingIntelligenceService(
            BillingContractRepository contractRepository,
            BillingInstallmentRepository installmentRepository,
            BillingOccurrenceRepository occurrenceRepository,
            BillingAiInsightRepository insightRepository,
            BillingIntelligenceAlertRepository alertRepository,
            GeminiBillingIntelligenceService geminiBillingIntelligenceService
    ) {
        this.contractRepository = contractRepository;
        this.installmentRepository = installmentRepository;
        this.occurrenceRepository = occurrenceRepository;
        this.insightRepository = insightRepository;
        this.alertRepository = alertRepository;
        this.geminiBillingIntelligenceService = geminiBillingIntelligenceService;
    }

    @Transactional
    public BillingIntelligenceSummaryDTO getIntelligence(
            Optional<String> client,
            Optional<LocalDate> periodFrom,
            Optional<LocalDate> periodTo,
            Optional<String> status,
            Optional<String> aging,
            Optional<BigDecimal> minValue,
            Optional<BigDecimal> maxValue,
            Optional<String> risk
    ) {
        LocalDate today = LocalDate.now();
        List<TitleContext> contexts = buildTitleContexts(today);

        List<BillingIntelligenceTitleDTO> titles = contexts.stream()
                .filter(ctx -> matchesFilters(ctx, client, periodFrom, periodTo, status, aging, minValue, maxValue))
                .map(ctx -> toTitleDto(ctx, resolveInsight(ctx, false)))
                .filter(dto -> matchesRisk(dto, risk))
                .sorted(priorityComparator())
                .toList();

        refreshAlerts(titles);

        BillingIntelligenceKpisDTO kpis = buildKpis(titles);
        BillingIntelligenceAgingDTO agingDto = buildAging(titles);

        return new BillingIntelligenceSummaryDTO(
                LocalDateTime.now(),
                kpis,
                agingDto,
                titles
        );
    }

    @Transactional
    public List<BillingIntelligenceAlertDTO> getAlerts(Optional<Integer> limit) {
        // Garante que o painel de alertas reflita a carteira atual, respeitando anti-spam.
        List<TitleContext> contexts = buildTitleContexts(LocalDate.now());
        List<BillingIntelligenceTitleDTO> titles = contexts.stream()
                .filter(ctx -> !"PAGO".equalsIgnoreCase(ctx.titleStatus()))
                .map(ctx -> toTitleDto(ctx, resolveInsight(ctx, false)))
                .sorted(priorityComparator())
                .toList();
        refreshAlerts(titles);

        int targetLimit = limit.orElse(50);
        if (targetLimit <= 0) targetLimit = 50;

        return alertRepository.findTop200ByOrderByCreatedAtDesc().stream()
                .limit(targetLimit)
                .map(this::toAlertDto)
                .toList();
    }

    @Transactional
    public BillingAiAnalyzeResponseDTO analyzeTitle(BillingAiAnalyzeRequestDTO request) {
        BillingContract contract = contractRepository.findById(request.contractId())
                .orElseThrow(() -> new RecordNotFoundException("Contrato nao encontrado"));

        BillingInstallment installment = installmentRepository
                .findByContractAndNumber(contract, request.installmentNumber())
                .orElseThrow(() -> new RecordNotFoundException("Parcela nao encontrada"));

        TitleContext context = buildContext(contract, installment, LocalDate.now(), new HashMap<>(), new HashMap<>());
        ResolvedInsight insight = resolveInsight(context, Boolean.TRUE.equals(request.forceRefresh()));

        return new BillingAiAnalyzeResponseDTO(
                request.contractId(),
                request.installmentNumber(),
                insight.riskLevel(),
                insight.riskScore(),
                insight.recommendedAction(),
                insight.recommendedChannel(),
                insight.reason(),
                insight.suggestedMessage(),
                insight.provider(),
                insight.createdAt()
        );
    }

    private List<TitleContext> buildTitleContexts(LocalDate today) {
        List<BillingInstallment> installments = installmentRepository.findAllWithContract();
        Map<Long, ContractActivity> contractActivityCache = new HashMap<>();
        Map<String, Integer> recurrenceCache = new HashMap<>();

        return installments.stream()
                .filter(installment -> installment.getContract() != null)
                .map(installment -> buildContext(
                        installment.getContract(),
                        installment,
                        today,
                        contractActivityCache,
                        recurrenceCache
                ))
                .toList();
    }

    private TitleContext buildContext(
            BillingContract contract,
            BillingInstallment installment,
            LocalDate today,
            Map<Long, ContractActivity> contractActivityCache,
            Map<String, Integer> recurrenceCache
    ) {
        int daysLate = calculateInstallmentDaysLate(installment, today);
        String titleStatus = resolveTitleStatus(installment, daysLate);

        String rawCustomerDocument = Optional.ofNullable(contract.getCustomerDocument()).orElse("");
        String customerDocumentDigits = digitsOnly(rawCustomerDocument);
        String customerId = generateCustomerKey(customerDocumentDigits, contract.getCustomerName());
        String titleId = generateTitleKey(contract.getId(), installment.getNumber());

        ContractActivity activity = contractActivityCache.computeIfAbsent(
                contract.getId(),
                ignored -> loadContractActivity(contract)
        );

        String recurrenceCacheKey = !customerDocumentDigits.isBlank() ? customerDocumentDigits : rawCustomerDocument;
        int recurrence90Days = recurrenceCache.computeIfAbsent(
                recurrenceCacheKey,
                ignored -> calculateRecurrence90Days(rawCustomerDocument, customerDocumentDigits, today)
        );

        String customerSegment = contract.getProfessionalEnterprise() != null
                && !contract.getProfessionalEnterprise().isBlank()
                ? "empresarial"
                : "varejo";

        return new TitleContext(
                contract,
                installment,
                titleId,
                customerId,
                maskDocument(contract.getCustomerDocument()),
                daysLate,
                titleStatus,
                activity.lastContactDate(),
                activity.remindersCount(),
                recurrence90Days,
                customerSegment
        );
    }

    private ContractActivity loadContractActivity(BillingContract contract) {
        var occurrences = occurrenceRepository.findByContractOrderByDateDesc(contract);
        LocalDate lastContact = occurrences.stream()
                .findFirst()
                .map(item -> item.getDate())
                .orElse(null);

        int reminders = (int) occurrences.stream()
                .filter(item -> item.getNote() != null)
                .map(item -> item.getNote().toLowerCase(Locale.ROOT))
                .filter(note -> note.contains("lembrete") || note.contains("cobranca"))
                .count();

        return new ContractActivity(lastContact, reminders);
    }

    private int calculateRecurrence90Days(
            String rawCustomerDocument,
            String customerDocumentDigits,
            LocalDate today
    ) {
        String raw = rawCustomerDocument == null ? "" : rawCustomerDocument.trim();
        String digits = customerDocumentDigits == null ? "" : customerDocumentDigits.trim();
        if (raw.isBlank() && digits.isBlank()) {
            return 0;
        }

        LocalDate fromDate = today.minusDays(90);
        List<BillingInstallment> recent = new ArrayList<>();

        if (!raw.isBlank()) {
            recent.addAll(installmentRepository.findRecentByCustomerDocument(raw, fromDate));
        }
        // Fallback para cenarios em que documentos foram salvos em formatos diferentes (com/sem mascara).
        if (recent.isEmpty() && !digits.isBlank() && !digits.equals(raw)) {
            recent.addAll(installmentRepository.findRecentByCustomerDocument(digits, fromDate));
        }

        return (int) recent.stream()
                .mapToInt(item -> calculateInstallmentDaysLate(item, today))
                .filter(delay -> delay > 0)
                .count();
    }

    private boolean matchesFilters(
            TitleContext ctx,
            Optional<String> client,
            Optional<LocalDate> periodFrom,
            Optional<LocalDate> periodTo,
            Optional<String> status,
            Optional<String> aging,
            Optional<BigDecimal> minValue,
            Optional<BigDecimal> maxValue
    ) {
        if (client.isPresent()) {
            String query = client.get().trim().toLowerCase(Locale.ROOT);
            String name = Optional.ofNullable(ctx.contract().getCustomerName()).orElse("").toLowerCase(Locale.ROOT);
            String document = digitsOnly(ctx.contract().getCustomerDocument());
            String queryDigits = digitsOnly(query);
            boolean matches = name.contains(query) || (!queryDigits.isBlank() && document.contains(queryDigits));
            if (!matches) {
                return false;
            }
        }

        LocalDate dueDate = ctx.installment().getDueDate();
        if (periodFrom.isPresent() && (dueDate == null || dueDate.isBefore(periodFrom.get()))) {
            return false;
        }
        if (periodTo.isPresent() && (dueDate == null || dueDate.isAfter(periodTo.get()))) {
            return false;
        }

        String requestedStatus = status.map(value -> value.trim().toUpperCase(Locale.ROOT)).orElse(null);
        if (requestedStatus != null && !requestedStatus.isBlank()) {
            if (!requestedStatus.equalsIgnoreCase(ctx.titleStatus())) {
                return false;
            }
        } else {
            // Sem filtro explicito, foco da carteira inteligente eh titulos em aberto/atraso.
            if ("PAGO".equalsIgnoreCase(ctx.titleStatus())) {
                return false;
            }
        }

        if (aging.isPresent()) {
            String requestedAging = aging.get().trim();
            String bucket = BillingIntelligenceRules.resolveAgingBucket(ctx.daysLate());
            if (!requestedAging.equalsIgnoreCase(bucket)) {
                return false;
            }
        }

        BigDecimal amount = ctx.installment().getAmount() != null ? ctx.installment().getAmount() : BigDecimal.ZERO;
        if (minValue.isPresent() && amount.compareTo(minValue.get()) < 0) {
            return false;
        }
        if (maxValue.isPresent() && amount.compareTo(maxValue.get()) > 0) {
            return false;
        }

        return true;
    }

    private boolean matchesRisk(BillingIntelligenceTitleDTO dto, Optional<String> risk) {
        if (risk.isEmpty()) return true;
        String requested = risk.get().trim().toLowerCase(Locale.ROOT);
        return requested.equals(dto.riskLevel());
    }

    private BillingIntelligenceTitleDTO toTitleDto(TitleContext ctx, ResolvedInsight insight) {
        String severity = BillingIntelligenceRules.resolveSeverity(
                ctx.daysLate(),
                ctx.installment().getAmount(),
                ctx.recurrence90Days(),
                insight.riskLevel(),
                highValueThreshold
        );

        return new BillingIntelligenceTitleDTO(
                ctx.contract().getId(),
                ctx.contract().getContractNumber(),
                ctx.installment().getNumber(),
                ctx.installment().getDueDate(),
                ctx.installment().getAmount(),
                ctx.daysLate(),
                ctx.titleStatus(),
                ctx.contract().getCustomerName(),
                ctx.customerId(),
                ctx.maskedDocument(),
                ctx.customerSegment(),
                ctx.lastContactDate(),
                ctx.remindersCount(),
                ctx.recurrence90Days(),
                insight.riskLevel(),
                insight.riskScore(),
                insight.recommendedAction(),
                insight.recommendedChannel(),
                insight.reason(),
                insight.suggestedMessage(),
                severity
        );
    }

    private ResolvedInsight resolveInsight(TitleContext context, boolean forceGemini) {
        LocalDateTime ttlBoundary = LocalDateTime.now().minusHours(Math.max(1, cacheTtlHours));
        if (!forceGemini) {
            Optional<BillingAiInsight> cached = insightRepository
                    .findFirstByTitleIdAndCustomerIdAndCreatedAtAfterOrderByCreatedAtDesc(
                            context.titleId(),
                            context.customerId(),
                            ttlBoundary
                    );
            if (cached.isPresent()) {
                return toResolvedInsight(cached.get());
            }
        }

        GeminiBillingIntelligenceService.BillingGeminiInput geminiInput =
                new GeminiBillingIntelligenceService.BillingGeminiInput(
                        context.installment().getAmount(),
                        context.installment().getDueDate(),
                        context.daysLate(),
                        context.recurrence90Days(),
                        context.lastContactDate(),
                        context.remindersCount(),
                        context.customerSegment(),
                        BillingIntelligenceRules.calculateFallbackRiskScore(
                                context.daysLate(),
                                context.installment().getAmount(),
                                context.recurrence90Days(),
                                context.remindersCount(),
                                highValueThreshold
                        ),
                        context.maskedDocument()
                );

        Optional<GeminiBillingIntelligenceService.GeminiRiskOutput> aiOutput =
                geminiBillingIntelligenceService.analyze(geminiInput);

        if (aiOutput.isPresent()) {
            BillingAiInsight saved = persistInsight(context, aiOutput.get());
            return toResolvedInsight(saved);
        }

        GeminiBillingIntelligenceService.GeminiRiskOutput fallback = buildFallbackInsight(context);
        BillingAiInsight savedFallback = persistInsight(context, fallback);
        return toResolvedInsight(savedFallback);
    }

    private BillingAiInsight persistInsight(
            TitleContext context,
            GeminiBillingIntelligenceService.GeminiRiskOutput output
    ) {
        BillingAiInsight entity = new BillingAiInsight();
        entity.setTitleId(context.titleId());
        entity.setCustomerId(context.customerId());
        entity.setRiskScore(output.riskScore());
        entity.setRiskLevel(output.riskLevel());
        entity.setReason(output.alertReason());
        entity.setAction(output.recommendedNextAction());
        entity.setChannel(output.recommendedChannel());
        entity.setMessage(output.suggestedMessage());
        entity.setProvider(output.provider());
        return insightRepository.save(entity);
    }

    private GeminiBillingIntelligenceService.GeminiRiskOutput buildFallbackInsight(TitleContext context) {
        int score = BillingIntelligenceRules.calculateFallbackRiskScore(
                context.daysLate(),
                context.installment().getAmount(),
                context.recurrence90Days(),
                context.remindersCount(),
                highValueThreshold
        );
        String level = BillingIntelligenceRules.resolveRiskLevel(score);
        String channel = context.contract().getCustomerPhone() != null && !context.contract().getCustomerPhone().isBlank()
                ? "whatsapp"
                : "email";
        String action = switch (level) {
            case "alto" -> "Contato imediato e proposta de negociacao com prazo curto.";
            case "medio" -> "Registrar contato ativo e reforcar compromisso de pagamento.";
            default -> "Enviar lembrete preventivo e monitorar retorno.";
        };
        String reason = switch (level) {
            case "alto" -> "Atraso relevante e indicios de reincidencia.";
            case "medio" -> "Risco moderado por atraso inicial e valor exposto.";
            default -> "Baixo risco atual, manter acompanhamento preventivo.";
        };
        String message = switch (level) {
            case "alto" -> "Identificamos atraso no seu titulo. Podemos negociar hoje para evitar agravamento.";
            case "medio" -> "Notamos pendencia em aberto. Podemos apoiar na regularizacao com melhor condicao.";
            default -> "Lembrete: seu titulo esta em aberto. Se precisar, nossa equipe pode ajudar.";
        };

        return new GeminiBillingIntelligenceService.GeminiRiskOutput(
                level,
                score,
                action,
                channel,
                reason,
                message,
                "fallback"
        );
    }

    private ResolvedInsight toResolvedInsight(BillingAiInsight entity) {
        return new ResolvedInsight(
                Optional.ofNullable(entity.getRiskLevel()).orElse("medio"),
                Optional.ofNullable(entity.getRiskScore()).orElse(0),
                Optional.ofNullable(entity.getAction()).orElse("Registrar contato com o cliente."),
                Optional.ofNullable(entity.getChannel()).orElse("telefone"),
                Optional.ofNullable(entity.getReason()).orElse("Titulo com necessidade de acompanhamento."),
                Optional.ofNullable(entity.getMessage()).orElse("Ha uma pendencia em aberto. Podemos apoiar na regularizacao?"),
                Optional.ofNullable(entity.getProvider()).orElse("fallback"),
                entity.getCreatedAt()
        );
    }

    private Comparator<BillingIntelligenceTitleDTO> priorityComparator() {
        return Comparator
                .comparingInt(BillingIntelligenceTitleDTO::riskScore).reversed()
                .thenComparing(
                        BillingIntelligenceTitleDTO::amount,
                        Comparator.nullsLast(BigDecimal::compareTo).reversed()
                )
                .thenComparing(
                        BillingIntelligenceTitleDTO::daysLate,
                        Comparator.nullsLast(Integer::compareTo).reversed()
                );
    }

    private BillingIntelligenceKpisDTO buildKpis(List<BillingIntelligenceTitleDTO> titles) {
        List<BillingIntelligenceTitleDTO> openTitles = titles.stream()
                .filter(item -> !"PAGO".equalsIgnoreCase(item.status()))
                .toList();

        BigDecimal totalOpen = openTitles.stream()
                .map(item -> item.amount() != null ? item.amount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long totalTitles = openTitles.size();
        long overdueCount = openTitles.stream()
                .filter(item -> "EM_ATRASO".equalsIgnoreCase(item.status()) || (item.daysLate() != null && item.daysLate() > 0))
                .count();

        BigDecimal forecastRecovery = openTitles.stream()
                .map(item -> {
                    BigDecimal amount = item.amount() != null ? item.amount() : BigDecimal.ZERO;
                    BigDecimal rate = BillingIntelligenceRules.recoveryRateByRiskLevel(item.riskLevel());
                    return amount.multiply(rate);
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal overduePercentage = BillingIntelligenceRules.percentage(overdueCount, totalTitles);
        BigDecimal recoveryPercentage = totalOpen.compareTo(BigDecimal.ZERO) > 0
                ? forecastRecovery
                .multiply(BigDecimal.valueOf(100))
                .divide(totalOpen, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return new BillingIntelligenceKpisDTO(
                totalOpen.setScale(2, RoundingMode.HALF_UP),
                totalTitles,
                overduePercentage,
                forecastRecovery,
                recoveryPercentage
        );
    }

    private BillingIntelligenceAgingDTO buildAging(List<BillingIntelligenceTitleDTO> titles) {
        Map<String, Long> grouped = titles.stream()
                .collect(Collectors.groupingBy(
                        item -> BillingIntelligenceRules.resolveAgingBucket(item.daysLate() == null ? 0 : item.daysLate()),
                        Collectors.counting()
                ));

        return new BillingIntelligenceAgingDTO(
                grouped.getOrDefault("0-7", 0L),
                grouped.getOrDefault("8-15", 0L),
                grouped.getOrDefault("16-30", 0L),
                grouped.getOrDefault("31-60", 0L),
                grouped.getOrDefault("61+", 0L)
        );
    }

    private void refreshAlerts(List<BillingIntelligenceTitleDTO> titles) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime cooldownBoundary = now.minusHours(Math.max(1, alertCooldownHours));

        for (BillingIntelligenceTitleDTO title : titles) {
            String customerId = title.customerId();
            Optional<BillingIntelligenceAlert> latest = alertRepository
                    .findTopByCustomerIdOrderByCreatedAtDesc(customerId);

            if (latest.isPresent() && latest.get().getCreatedAt() != null
                    && latest.get().getCreatedAt().isAfter(cooldownBoundary)) {
                continue;
            }

            BillingIntelligenceAlert alert = new BillingIntelligenceAlert();
            alert.setContractId(title.contractId());
            alert.setInstallmentNumber(title.installmentNumber());
            alert.setCustomerId(customerId);
            alert.setCustomerName(title.customerName());
            alert.setSeverity(title.severity());
            alert.setReason(title.alertReason());
            alert.setRecommendedAction(title.recommendedNextAction());
            alert.setRecommendedChannel(title.recommendedChannel());
            alert.setAmount(title.amount());
            alert.setDaysLate(title.daysLate());

            alertRepository.save(alert);
        }
    }

    private BillingIntelligenceAlertDTO toAlertDto(BillingIntelligenceAlert alert) {
        return new BillingIntelligenceAlertDTO(
                alert.getId(),
                alert.getCustomerId(),
                alert.getCustomerName(),
                alert.getSeverity(),
                alert.getReason(),
                alert.getRecommendedAction(),
                alert.getRecommendedChannel(),
                alert.getContractId(),
                alert.getInstallmentNumber(),
                alert.getAmount(),
                alert.getDaysLate(),
                alert.getCreatedAt()
        );
    }

    private int calculateInstallmentDaysLate(BillingInstallment installment, LocalDate today) {
        if (installment == null) return 0;
        LocalDate referenceDate = installment.isPaid()
                ? (installment.getPaidAt() != null ? installment.getPaidAt() : today)
                : today;
        return BillingIntelligenceRules.calculateDaysLate(installment.getDueDate(), referenceDate);
    }

    private String resolveTitleStatus(BillingInstallment installment, int daysLate) {
        if (installment.isPaid()) {
            return "PAGO";
        }
        if (daysLate > 0) {
            return "EM_ATRASO";
        }
        return "EM_ABERTO";
    }

    private String maskDocument(String rawDocument) {
        String digits = digitsOnly(rawDocument);
        if (digits.length() <= 4) {
            return "****";
        }
        String prefix = digits.substring(0, Math.min(3, digits.length()));
        String suffix = digits.substring(digits.length() - 2);
        return prefix + "***" + suffix;
    }

    private String digitsOnly(String value) {
        if (value == null) return "";
        return value.replaceAll("\\D", "");
    }

    private String generateTitleKey(Long contractId, Integer installmentNumber) {
        return (contractId != null ? contractId : 0) + ":" + (installmentNumber != null ? installmentNumber : 0);
    }

    private String generateCustomerKey(String customerDocumentDigits, String customerName) {
        String base = (customerDocumentDigits == null ? "" : customerDocumentDigits)
                + "|" + (customerName == null ? "" : customerName.trim().toLowerCase(Locale.ROOT));
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(base.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.substring(0, 24);
        } catch (Exception exception) {
            return Integer.toHexString(base.hashCode());
        }
    }

    private record TitleContext(
            BillingContract contract,
            BillingInstallment installment,
            String titleId,
            String customerId,
            String maskedDocument,
            int daysLate,
            String titleStatus,
            LocalDate lastContactDate,
            int remindersCount,
            int recurrence90Days,
            String customerSegment
    ) {
    }

    private record ContractActivity(
            LocalDate lastContactDate,
            int remindersCount
    ) {
    }

    private record ResolvedInsight(
            String riskLevel,
            int riskScore,
            String recommendedAction,
            String recommendedChannel,
            String reason,
            String suggestedMessage,
            String provider,
            LocalDateTime createdAt
    ) {
    }
}
