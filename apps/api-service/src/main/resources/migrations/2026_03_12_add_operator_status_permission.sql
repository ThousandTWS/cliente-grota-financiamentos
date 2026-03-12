-- Add operator permission to change proposal status
-- Run date: 2026-03-12

BEGIN;

ALTER TABLE tb_operator
  ADD COLUMN IF NOT EXISTS can_change_proposal_status BOOLEAN NOT NULL DEFAULT TRUE;

COMMIT;
