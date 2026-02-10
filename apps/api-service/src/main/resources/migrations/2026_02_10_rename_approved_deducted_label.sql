-- Rename approved deducted label to the new name used in the apps (run once)
-- Timestamp: 2026-02-10

-- Update notification titles that reference the old wording
UPDATE tb_notification
SET title = regexp_replace(title, '(?i)aprovad[ao]s? deduzid[ao]s?', 'Proposta aprovada Reduzido')
WHERE lower(title) LIKE '%aprovad% deduzid%';

-- Update notification descriptions if they happen to carry the old label
UPDATE tb_notification
SET description = regexp_replace(description, '(?i)aprovad[ao]s? deduzid[ao]s?', 'aprovada Reduzido')
WHERE description IS NOT NULL
  AND lower(description) LIKE '%aprovad% deduzid%';
