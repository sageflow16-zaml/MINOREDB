-- Migration 00047: trade_screenshots bucket -> private
-- No frontend code reads this bucket (replay screenshots live in the
-- replay_screenshot table). Making it private removes world-readable
-- trade screenshots; future consumers must use signed URLs.
UPDATE storage.buckets SET public = false WHERE id = 'trade_screenshots';
