-- Migration: Add missing columns to knowledge_rule table
-- The frontend type expects: title, wins, losses, avg_rr, signature
-- These columns were missing from the original schema

ALTER TABLE IF EXISTS public.knowledge_rule
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS wins INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS losses INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_rr DOUBLE PRECISION DEFAULT 0,
  ADD COLUMN IF NOT EXISTS signature TEXT;

-- Backfill title from name for existing records
UPDATE public.knowledge_rule SET title = name WHERE title IS NULL;
