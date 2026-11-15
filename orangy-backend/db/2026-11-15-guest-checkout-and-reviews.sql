-- Guest checkout + no-login reviews (gift-card QR).
-- Prod runs with ddl-auto=validate, so apply this BEFORE rolling out the new backend.
-- Idempotent: safe to run more than once.
BEGIN;
ALTER TABLE orders  ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE orders  ADD COLUMN IF NOT EXISTS guest_name  varchar(255);
ALTER TABLE orders  ADD COLUMN IF NOT EXISTS guest_phone varchar(255);
ALTER TABLE orders  ADD COLUMN IF NOT EXISTS guest_email varchar(255);
ALTER TABLE reviews ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS reviewer_name varchar(255);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS reviewer_city varchar(255);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS photo_url     varchar(1000);
COMMIT;
