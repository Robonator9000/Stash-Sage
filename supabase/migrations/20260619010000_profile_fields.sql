-- Add location column to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS location TEXT;

-- Add show_online_status and show_location boolean columns
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS show_online_status BOOLEAN DEFAULT TRUE;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS show_location BOOLEAN DEFAULT FALSE;
