-- Migration 00030: Storage bucket policies for source files
-- Ensures authenticated users can upload and manage their own source files.

-- Policy: authenticated users can view source files they uploaded
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can view own source files'
  ) THEN
    CREATE POLICY "Users can view own source files"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'sources' AND
      (storage.foldername(name))[1] IN (
        SELECT id::text FROM public.project WHERE user_id = auth.uid()
      )
    );
  END IF;
END;
$$;

-- Policy: authenticated users can upload source files to their project folder
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can upload source files'
  ) THEN
    CREATE POLICY "Users can upload source files"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'sources' AND
      (storage.foldername(name))[1] IN (
        SELECT id::text FROM public.project WHERE user_id = auth.uid()
      )
    );
  END IF;
END;
$$;

-- Policy: authenticated users can delete their own source files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can delete own source files'
  ) THEN
    CREATE POLICY "Users can delete own source files"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'sources' AND
      (storage.foldername(name))[1] IN (
        SELECT id::text FROM public.project WHERE user_id = auth.uid()
      )
    );
  END IF;
END;
$$;
