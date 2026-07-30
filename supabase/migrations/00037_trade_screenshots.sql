-- Create storage bucket for trade screenshots
INSERT INTO storage.buckets (id, name, public) 
VALUES ('trade_screenshots', 'trade_screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload screenshots
CREATE POLICY "trade_screenshots_insert"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'trade_screenshots' AND auth.role() = 'authenticated');

-- Allow authenticated users to view screenshots
CREATE POLICY "trade_screenshots_select"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'trade_screenshots' AND auth.role() = 'authenticated');

-- Allow users to delete their own screenshots
CREATE POLICY "trade_screenshots_delete"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'trade_screenshots' AND auth.role() = 'authenticated');
