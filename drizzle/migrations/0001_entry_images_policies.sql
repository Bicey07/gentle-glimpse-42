CREATE POLICY "entry-images: upload to own folder" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'entry-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "entry-images: owner or allowed friend reads" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'entry-images' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.can_view_entry_image(name)));
CREATE POLICY "entry-images: owner updates" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'entry-images' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'entry-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "entry-images: owner deletes" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'entry-images' AND (storage.foldername(name))[1] = auth.uid()::text);