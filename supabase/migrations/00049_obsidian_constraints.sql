-- Migration 00049: unique constraints for obsidian sync upserts
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'obsidian_note_vault_path_unique') THEN
    ALTER TABLE public.obsidian_note ADD CONSTRAINT obsidian_note_vault_path_unique UNIQUE (vault_id, file_path);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'knowledge_link_source_target_unique') THEN
    ALTER TABLE public.knowledge_link ADD CONSTRAINT knowledge_link_source_target_unique UNIQUE (source_type, source_id, target_type, target_id);
  END IF;
END $$;
