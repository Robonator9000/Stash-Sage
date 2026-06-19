-- Migration: Create storage buckets and RLS policies for image uploads

-- Helper: create bucket if not exists
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES
    ('avatars', 'avatars', true, 2097152, ARRAY['image/webp', 'image/jpeg', 'image/png']::text[]),
    ('listing-images', 'listing-images', true, 10485760, ARRAY['image/webp', 'image/jpeg', 'image/png']::text[]),
    ('post-images', 'post-images', true, 10485760, ARRAY['image/webp', 'image/jpeg', 'image/png']::text[])
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Avatars: public read, authenticated insert/update/delete own
CREATE POLICY "avatars_select_anyone"
  ON storage.objects FOR SELECT USING (bucket_id = 'avatars' AND auth.role() IS NOT NULL);

CREATE POLICY "avatars_insert_own"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND auth.uid() = (storage.foldername(name))[1]::uuid
  );

CREATE POLICY "avatars_update_own"
  ON storage.objects FOR UPDATE USING (
    bucket_id = 'avatars' AND auth.uid() = (storage.foldername(name))[1]::uuid
  );

CREATE POLICY "avatars_delete_own"
  ON storage.objects FOR DELETE USING (
    bucket_id = 'avatars' AND auth.uid() = (storage.foldername(name))[1]::uuid
  );

-- Listing images: public read, authenticated insert/update/delete own
CREATE POLICY "listings_select_anyone"
  ON storage.objects FOR SELECT USING (bucket_id = 'listing-images' AND auth.role() IS NOT NULL);

CREATE POLICY "listings_insert_own"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'listing-images' AND auth.uid() = (storage.foldername(name))[1]::uuid
  );

CREATE POLICY "listings_update_own"
  ON storage.objects FOR UPDATE USING (
    bucket_id = 'listing-images' AND auth.uid() = (storage.foldername(name))[1]::uuid
  );

CREATE POLICY "listings_delete_own"
  ON storage.objects FOR DELETE USING (
    bucket_id = 'listing-images' AND auth.uid() = (storage.foldername(name))[1]::uuid
  );

-- Post images: public read, authenticated insert/update/delete own
CREATE POLICY "posts_select_anyone"
  ON storage.objects FOR SELECT USING (bucket_id = 'post-images' AND auth.role() IS NOT NULL);

CREATE POLICY "posts_insert_own"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'post-images' AND auth.uid() = (storage.foldername(name))[1]::uuid
  );

CREATE POLICY "posts_update_own"
  ON storage.objects FOR UPDATE USING (
    bucket_id = 'post-images' AND auth.uid() = (storage.foldername(name))[1]::uuid
  );

CREATE POLICY "posts_delete_own"
  ON storage.objects FOR DELETE USING (
    bucket_id = 'post-images' AND auth.uid() = (storage.foldername(name))[1]::uuid
  );
