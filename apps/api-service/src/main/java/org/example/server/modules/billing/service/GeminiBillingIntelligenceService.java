package org.example.server.modules.billing.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDate;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@Service
public class GeminiBillingIntelligenceService {

    private static final Logger logger = LoggerFactory.getLogger(GeminiBillingIntelligenceService.class);

    private static final String RATE_LIMIT_LUA = """
            local max = tonumber(ARGV[1])
            local window = tonumber(ARGV[2])
            local current = redis.call('INCR', KEYS[1])
            if current == 1 then
              redis.call('EXPIRE', KEYS[1], window)
            end
            local ttl = redis.call('TTL', KEYS[1])
            if ttl < 0 then
              ttl = window
            end
            local remaining = max - current
            if remaining < 0 then
              remaining = 0
            end
            if current > max then
              return {0, max, remaining, ttl}
            end
            return {1, max, remaining, ttl}
            """;

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final StringRedisTemplate redisTemplate;
    private final DefaultRedisScript<List> rateLimitScript;

    private volatile boolean redisLimiterAvailable = true;

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.billing.endpoint:https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-2.5-flash-lite:streamGenerateContent}")
    private String endpoint;

    @Value("${billing.intelligence.gemini-timeout-seconds:20}")
    private long timeoutSeconds;

    @Value("${billing.intelligence.gemini-rate-limit.enabled:true}")
    private boolean redisRateLimitEnabled;

    @Value("${billing.intelligence.gemini-rate-limit.redis-prefix:rl:gemini}")
    private String redisRateLimitPrefix;

    @Value("${billing.intelligence.gemini-rate-limit.global-max:50}")
    private int redisRateLimitGlobalMax;

    @Value("${billing.intelligence.gemini-rate-limit.per-customer-max:5}")
    private int redisRateLimitPerCustomerMax;

    @Value("${billing.intelligence.gemini-rate-limit.window-seconds:60}")
    private int redisRateLimitWindowSeconds;

    public GeminiBillingIntelligenceService(
            ObjectMapper objectMapper,
            @Autowired(required = false) StringRedisTemplate redisTemplate
    ) {
        this.objectMapper = objectMapper;
        this.redisTemplate = redisTemplate;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
        this.rateLimitScript = new DefaultRedisScript<>();
        this.rateLimitScript.setScriptText(RATE_LIMIT_LUA);
        this.rateLimitScript.setResultType(List.class);
    }

    public Optional<GeminiRiskOutput> analyze(BillingGeminiInput input) {
        if (apiKey == null || apiKey.isBlank() || input == null) {
            return Optional.empty();
        }
        if (isRedisRateLimited(input)) {
            return Optional.empty();
        }

        try {
            String prompt = buildPrompt(input);

            Map<String, Object> userContent = Map.of(
                    "role", "user",
                    "parts", List.of(Map.of("text", prompt))
            );

            Map<String, Object> payload = new HashMap<>();
            payload.put("contents", List.of(userContent));
            payload.put("generationConfig", Map.of(
                    "temperature", 0.15,
                    "topP", 0.8,
                    "maxOutputTokens", 600
            ));

            String body = objectMapper.writeValueAsString(payload);
            String queryKey = URLEncoder.encode(apiKey, StandardCharsets.UTF_8);
            URI uri = URI.create(endpoint + "?key=" + queryKey);

            HttpRequest request = HttpRequest.newBuilder(uri)
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(Math.max(5, timeoutSeconds)))
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                if (isProviderRateLimitResponse(response.statusCode(), response.body())) {
                    logger.warn("[Billing Gemini] Rate limit retornado pelo provedor Gemini.");
                }
                return Optional.empty();
            }

            String rawModelText = extractModelText(response.body());
            if (rawModelText == null || rawModelText.isBlank()) {
                return Optional.empty();
            }

            String json = extractJsonObject(rawModelText);
            if (json == null || json.isBlank()) {
                return Optional.empty();
            }

            GeminiRawOutput parsed = objectMapper.readValue(json, GeminiRawOutput.class);
            if (parsed == null) {
                return Optional.empty();
            }

            int score = parsed.risk_score() != null ? Math.max(0, Math.min(100, parsed.risk_score())) : 0;
            String level = normalizeRiskLevel(parsed.risk_level());

            GeminiRiskOutput output = new GeminiRiskOutput(
                    level,
                    score,
                    safeText(parsed.recommended_next_action(), "Registrar contato ativo com o cliente."),
                    normalizeChannel(parsed.recommended_channel()),
                    safeText(parsed.alert_reason(), "Titulo com risco de inadimplencia."),
                    safeText(parsed.suggested_message(), "Identificamos pendencia em aberto. Podemos apoiar na regularizacao?"),
                    "gemini"
            );
            return Optional.of(output);
        } catch (Exception exception) {
            return Optional.empty();
        }
    }

    private boolean isRedisRateLimited(BillingGeminiInput input) {
        if (!redisRateLimitEnabled || redisTemplate == null || !redisLimiterAvailable) {
            return false;
        }

        int safeWindowSeconds = Math.max(1, redisRateLimitWindowSeconds);

        if (redisRateLimitGlobalMax > 0) {
            RateLimitDecision global = consumeRateLimit(
                    buildRateLimitKey("global"),
                    redisRateLimitGlobalMax,
                    safeWindowSeconds
            );
            if (global.enforced() && !global.allowed()) {
                logger.warn(
                        "[Billing Gemini] Limite global Redis atingido (remaining={}, reset={}s).",
                        global.remaining(),
                        global.resetSeconds()
                );
                return true;
            }
        }

        if (redisRateLimitPerCustomerMax > 0) {
            String customerKey = normalizeKeySegment(input.customerKey());
            if (!customerKey.isBlank()) {
                RateLimitDecision customer = consumeRateLimit(
                        buildRateLimitKey("customer:" + customerKey),
                        redisRateLimitPerCustomerMax,
                        safeWindowSeconds
                );
                if (customer.enforced() && !customer.allowed()) {
                    logger.warn(
                            "[Billing Gemini] Limite por cliente Redis atingido para {} (remaining={}, reset={}s).",
                            customerKey,
                            customer.remaining(),
                            customer.resetSeconds()
                    );
                    return true;
                }
            }
        }

        return false;
    }

    private RateLimitDecision consumeRateLimit(String key, int max, int windowSeconds) {
        try {
            @SuppressWarnings("unchecked")
            List<Object> raw = (List<Object>) redisTemplate.execute(
                    rateLimitScript,
                    Collections.singletonList(key),
                    String.valueOf(max),
                    String.valueOf(windowSeconds)
            );

            if (raw == null || raw.size() < 4) {
                return new RateLimitDecision(true, max, max, windowSeconds, true);
            }

            int allowedFlag = asInt(raw.get(0), 1);
            int responseMax = asInt(raw.get(1), max);
            int responseRemaining = asInt(raw.get(2), max);
            int responseTtl = asInt(raw.get(3), windowSeconds);
            int safeTtl = Math.max(0, responseTtl);

            return new RateLimitDecision(
                    allowedFlag == 1,
                    responseMax,
                    Math.max(0, responseRemaining),
                    safeTtl,
                    true
            );
        } catch (Exception exception) {
            redisLimiterAvailable = false;
            logger.warn(
                    "[Billing Gemini] Redis indisponivel para rate limit. Modo fail-open habilitado.",
                    exception
            );
            return new RateLimitDecision(true, max, max, windowSeconds, false);
        }
    }

    private int asInt(Object value, int fallback) {
        if (value == null) return fallback;
        if (value instanceof Number number) {
            return number.intValue();
        }
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (NumberFormatException ignored) {
            return fallback;
        }
    }

    private String buildRateLimitKey(String scope) {
        String prefix = redisRateLimitPrefix == null || redisRateLimitPrefix.isBlank()
                ? "rl:gemini"
                : redisRateLimitPrefix.trim();
        return prefix + ":" + scope;
    }

    private String normalizeKeySegment(String raw) {
        if (raw == null) return "";
        return raw.trim().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9:_-]", "");
    }

    private boolean isProviderRateLimitResponse(int statusCode, String body) {
        if (statusCode == 429) return true;
        if (statusCode == 403 && body != null) {
            String normalized = body.toUpperCase(Locale.ROOT);
            return normalized.contains("RATE_LIMIT");
        }
        return false;
    }

    private String buildPrompt(BillingGeminiInput input) {
        return """
                Voce e um analista de cobranca especialista.
                Retorne APENAS JSON valido (sem markdown) no formato:
                {
                  "risk_level": "baixo|medio|alto",
                  "risk_score": 0-100,
                  "recommended_next_action": "texto curto",
                  "recommended_channel": "email|whatsapp|telefone",
                  "alert_reason": "motivo objetivo",
                  "suggested_message": "mensagem curta e profissional em pt-BR"
                }

                Regras:
                - Nao inclua dados pessoais sensiveis.
                - Considere dias em atraso, historico de inadimplencia e ultimo contato.
                - Se risco >= 70, priorize acao imediata.

                Dados do titulo:
                valor=%s
                vencimento=%s
                dias_atraso=%s
                recorrencia_90_dias=%s
                ultimo_contato=%s
                numero_lembretes=%s

                Dados do cliente:
                segmento=%s
                score_interno=%s
                documento_mascarado=%s
                """.formatted(
                input.amount() == null ? "0" : input.amount().toPlainString(),
                input.dueDate(),
                input.daysLate(),
                input.recurrence90Days(),
                input.lastContactDate(),
                input.remindersCount(),
                input.customerSegment(),
                input.internalScore(),
                input.maskedDocument()
        );
    }

    private String extractModelText(String body) {
        try {
            JsonNode root = objectMapper.readTree(body);
            if (root == null) return null;

            StringBuilder combined = new StringBuilder();
            if (root.isArray()) {
                for (JsonNode chunk : root) {
                    JsonNode text = chunk.path("candidates")
                            .path(0)
                            .path("content")
                            .path("parts")
                            .path(0)
                            .path("text");
                    if (!text.isMissingNode()) {
                        combined.append(text.asText(""));
                    }
                }
                return combined.toString();
            }

            JsonNode text = root.path("candidates")
                    .path(0)
                    .path("content")
                    .path("parts")
                    .path(0)
                    .path("text");
            return text.isMissingNode() ? null : text.asText(null);
        } catch (Exception exception) {
            return null;
        }
    }

    private String extractJsonObject(String text) {
        if (text == null) return null;
        String cleaned = text.trim();

        if (cleaned.startsWith("```")) {
            cleaned = cleaned.replace("```json", "").replace("```", "").trim();
        }

        int firstBrace = cleaned.indexOf('{');
        int lastBrace = cleaned.lastIndexOf('}');
        if (firstBrace < 0 || lastBrace <= firstBrace) {
            return null;
        }
        return cleaned.substring(firstBrace, lastBrace + 1);
    }

    private String normalizeRiskLevel(String value) {
        if (value == null) return "medio";
        String normalized = value.trim().toLowerCase(Locale.ROOT);
        if (normalized.contains("alto")) return "alto";
        if (normalized.contains("baix")) return "baixo";
        return "medio";
    }

    private String normalizeChannel(String value) {
        if (value == null || value.isBlank()) {
            return "telefone";
        }
        String normalized = value.trim().toLowerCase(Locale.ROOT);
        if (normalized.contains("whats")) return "whatsapp";
        if (normalized.contains("mail")) return "email";
        if (normalized.contains("tel")) return "telefone";
        return normalized;
    }

    private String safeText(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        return value.trim();
    }

    public record BillingGeminiInput(
            BigDecimal amount,
            LocalDate dueDate,
            Integer daysLate,
            Integer recurrence90Days,
            LocalDate lastContactDate,
            Integer remindersCount,
            String customerSegment,
            Integer internalScore,
            String customerKey,
            String maskedDocument
    ) {
    }

    public record GeminiRiskOutput(
            String riskLevel,
            Integer riskScore,
            String recommendedNextAction,
            String recommendedChannel,
            String alertReason,
            String suggestedMessage,
            String provider
    ) {
    }

    private record GeminiRawOutput(
            String risk_level,
            Integer risk_score,
            String recommended_next_action,
            String recommended_channel,
            String alert_reason,
            String suggested_message
    ) {
    }

    private record RateLimitDecision(
            boolean allowed,
            int max,
            int remaining,
            int resetSeconds,
            boolean enforced
    ) {
    }
}
