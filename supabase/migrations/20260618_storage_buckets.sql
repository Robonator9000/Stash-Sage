-- Migration: Create storage buckets and RLS policies for image uploads

-- Helper: create bucket if not exists
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES
    ('avatars', 'avatars', true, 2097152, ARRAY['image/webp', 'image/jpeg', 'image/png']::text[]),
    ('listing-images', 'listing-images', true, 10485760, ARRAY['image/webp', 'image/jpeg', 'image/png']::text[]),
    ('post-images', 'post-images', true, 10485760, ARRAY['image/webp', 'image/jpeg', 'image/png']::text[]),
    ('message-images', 'message-images', true, 10485760, ARRAY['image/webp', 'image/jpeg', 'image/png']::text[])
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Helper function to create policy only if it doesn't exist
CREATE OR REPLACE FUNCTION create_storage_policy(p_name text, p_table text, p_definition text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = p_table AND policyname = p_name) THEN
    EXECUTE p_definition;
  END IF;
END
$$;

SELECT create_storage_policy('avatars_select_anyone', 'objects',
  'CREATE POLICY "avatars_select_anyone" ON storage.objects FOR SELECT USING (bucket_id = ''avatars'' AND auth.role() IS NOT NULL)');

SELECT create_storage_policy('avatars_insert_own', 'objects',
  'CREATE POLICY "avatars_insert_own" ON storage.objects FOR INSERT WITH CHECK (bucket_id = ''avatars'' AND auth.uid() = (storage.foldername(name))[1]::uuid)');

SELECT create_storage_policy('avatars_update_own', 'objects',
  'CREATE POLICY "avatars_update_own" ON storage.objects FOR UPDATE USING (bucket_id = ''avatars'' AND auth.uid() = (storage.foldername(name))[1]::uuid)');

SELECT create_storage_policy('avatars_delete_own', 'objects',
  'CREATE POLICY "avatars_delete_own" ON storage.objects FOR DELETE USING (bucket_id = ''avatars'' AND auth.uid() = (storage.foldername(name))[1]::uuid)');

SELECT create_storage_policy('listings_select_anyone', 'objects',
  'CREATE POLICY "listings_select_anyone" ON storage.objects FOR SELECT USING (bucket_id = ''listing-images'' AND auth.role() IS NOT NULL)');

SELECT create_storage_policy('listings_insert_own', 'objects',
  'CREATE POLICY "listings_insert_own" ON storage.objects FOR INSERT WITH CHECK (bucket_id = ''listing-images'' AND auth.uid() = (storage.foldername(name))[1]::uuid)');

SELECT create_storage_policy('listings_update_own', 'objects',
  'CREATE POLICY "listings_update_own" ON storage.objects FOR UPDATE USING (bucket_id = ''listing-images'' AND auth.uid() = (storage.foldername(name))[1]::uuid)');

SELECT create_storage_policy('listings_delete_own', 'objects',
  'CREATE POLICY "listings_delete_own" ON storage.objects FOR DELETE USING (bucket_id = ''listing-images'' AND auth.uid() = (storage.foldername(name))[1]::uuid)');

SELECT create_storage_policy('posts_select_anyone', 'objects',
  'CREATE POLICY "posts_select_anyone" ON storage.objects FOR SELECT USING (bucket_id = ''post-images'' AND auth.role() IS NOT NULL)');

SELECT create_storage_policy('posts_insert_own', 'objects',
  'CREATE POLICY "posts_insert_own" ON storage.objects FOR INSERT WITH CHECK (bucket_id = ''post-images'' AND auth.uid() = (storage.foldername(name))[1]::uuid)');

SELECT create_storage_policy('posts_update_own', 'objects',
  'CREATE POLICY "posts_update_own" ON storage.objects FOR UPDATE USING (bucket_id = ''post-images'' AND auth.uid() = (storage.foldername(name))[1]::uuid)');

SELECT create_storage_policy('posts_delete_own', 'objects',
  'CREATE POLICY "posts_delete_own" ON storage.objects FOR DELETE USING (bucket_id = ''post-images'' AND auth.uid() = (storage.foldername(name))[1]::uuid)');

SELECT create_storage_policy('messages_select_anyone', 'objects',
  'CREATE POLICY "messages_select_anyone" ON storage.objects FOR SELECT USING (bucket_id = ''message-images'' AND auth.role() IS NOT NULL)');

SELECT create_storage_policy('messages_insert_own', 'objects',
  'CREATE POLICY "messages_insert_own" ON storage.objects FOR INSERT WITH CHECK (bucket_id = ''message-images'' AND auth.uid() = (storage.foldername(name))[1]::uuid)');

SELECT create_storage_policy('messages_update_own', 'objects',
  'CREATE POLICY "messages_update_own" ON storage.objects FOR UPDATE USING (bucket_id = ''message-images'' AND auth.uid() = (storage.foldername(name))[1]::uuid)');

SELECT create_storage_policy('messages_delete_own', 'objects',
  'CREATE POLICY "messages_delete_own" ON storage.objects FOR DELETE USING (bucket_id = ''message-images'' AND auth.uid() = (storage.foldername(name))[1]::uuid)');

DROP FUNCTION IF EXISTS create_storage_policy;
