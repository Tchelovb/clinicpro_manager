-- Remove "Zombie Photo" from Auth Metadata
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data - 'photo_url' - 'avatar_url'
WHERE email = 'admin@clinicpro.com';
