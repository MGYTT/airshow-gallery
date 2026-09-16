-- One-time data correction for events created with the old datetime-local handling.
-- The old editor treated a value such as 2026-09-19 08:15 as UTC instead of
-- as the event's local wall-clock time. This migration reinterprets the stored
-- instant as a wall-clock value in each event's configured timezone.
--
-- IMPORTANT: Run once after verifying the affected rows. Do not run twice.

BEGIN;

UPDATE public.airshow_events
SET
  start_date = ((start_date AT TIME ZONE 'UTC') AT TIME ZONE timezone),
  end_date = CASE
    WHEN end_date IS NULL THEN NULL
    ELSE ((end_date AT TIME ZONE 'UTC') AT TIME ZONE timezone)
  END,
  updated_at = timezone('utc', now())
WHERE timezone IS NOT NULL
  AND timezone <> '';

COMMIT;
