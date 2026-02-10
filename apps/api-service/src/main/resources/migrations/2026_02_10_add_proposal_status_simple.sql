-- Add new proposal status APPROVED_DEDUCTED to table constraints
-- Run date: 2026-02-10

BEGIN;

-- tb_proposal.status
ALTER TABLE tb_proposal DROP CONSTRAINT IF EXISTS tb_proposal_status_check;
ALTER TABLE tb_proposal
  ADD CONSTRAINT tb_proposal_status_check CHECK (
    status IN (
      'SUBMITTED',
      'PENDING',
      'ANALYSIS',
      'APPROVED',
      'APPROVED_DEDUCTED',
      'CONTRACT_ISSUED',
      'PAID',
      'REJECTED',
      'WITHDRAWN'
    )
  );

-- tb_proposal_event.status_from
ALTER TABLE tb_proposal_event DROP CONSTRAINT IF EXISTS tb_proposal_event_status_from_check;
ALTER TABLE tb_proposal_event
  ADD CONSTRAINT tb_proposal_event_status_from_check CHECK (
    status_from IS NULL OR status_from IN (
      'SUBMITTED',
      'PENDING',
      'ANALYSIS',
      'APPROVED',
      'APPROVED_DEDUCTED',
      'CONTRACT_ISSUED',
      'PAID',
      'REJECTED',
      'WITHDRAWN'
    )
  );

-- tb_proposal_event.status_to
ALTER TABLE tb_proposal_event DROP CONSTRAINT IF EXISTS tb_proposal_event_status_to_check;
ALTER TABLE tb_proposal_event
  ADD CONSTRAINT tb_proposal_event_status_to_check CHECK (
    status_to IN (
      'SUBMITTED',
      'PENDING',
      'ANALYSIS',
      'APPROVED',
      'APPROVED_DEDUCTED',
      'CONTRACT_ISSUED',
      'PAID',
      'REJECTED',
      'WITHDRAWN'
    )
  );

COMMIT;
