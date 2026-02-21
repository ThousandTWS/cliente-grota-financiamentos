-- Billing Intelligence: AI insights + alerts
-- Run date: 2026-02-21

BEGIN;

CREATE TABLE IF NOT EXISTS billing_ai_insights (
  id BIGSERIAL PRIMARY KEY,
  id_titulo VARCHAR(120) NOT NULL,
  id_cliente VARCHAR(120) NOT NULL,
  risk_score INTEGER NOT NULL,
  risk_level VARCHAR(16) NOT NULL,
  reason TEXT,
  action TEXT,
  channel VARCHAR(40),
  message TEXT,
  provider VARCHAR(40),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_ai_insights_title_customer
  ON billing_ai_insights (id_titulo, id_cliente);

CREATE INDEX IF NOT EXISTS idx_billing_ai_insights_created_at
  ON billing_ai_insights (created_at DESC);

CREATE TABLE IF NOT EXISTS tb_billing_intelligence_alert (
  id BIGSERIAL PRIMARY KEY,
  contract_id BIGINT NOT NULL,
  installment_number INTEGER NOT NULL,
  id_cliente VARCHAR(120) NOT NULL,
  customer_name VARCHAR(160) NOT NULL,
  severity VARCHAR(16) NOT NULL,
  reason TEXT,
  recommended_action TEXT,
  recommended_channel VARCHAR(40),
  amount NUMERIC(14,2),
  days_late INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_alert_customer_created
  ON tb_billing_intelligence_alert (id_cliente, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_billing_alert_created
  ON tb_billing_intelligence_alert (created_at DESC);

COMMIT;
