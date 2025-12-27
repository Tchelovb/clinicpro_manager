-- MIGRATION: Fix Auth vs Public Users Sync
-- DATE: 2024-12-27
-- DESCRIPTION: Enforces that public.users.id matches auth.users.id and automates creation via trigger.

-- 1. Alter users table to stop auto-generating random IDs. 
-- The ID must come from the Auth system.
ALTER TABLE public.users 
  ALTER COLUMN id DROP DEFAULT;

-- 2. Create/Update the function to handle new user insertion
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, clinic_id)
  VALUES (
    new.id, 
    new.email, 
    -- Name fallback
    COALESCE(new.raw_user_meta_data->>'name', 'Novo Usuário'), 
    -- Role fallback (Assumes 'role' enum exists, casting explicitly)
    COALESCE((new.raw_user_meta_data->>'role')::role, 'PROFESSIONAL'::role),
    -- Clinic ID fallback (Critical for NOT NULL constraint)
    -- Tries metadata first, then falls back to the first available clinic or a zero-UUID placeholder
    COALESCE(
      (new.raw_user_meta_data->>'clinic_id')::uuid, 
      (SELECT id FROM public.clinics LIMIT 1), 
      '00000000-0000-0000-0000-000000000001'::uuid
    )
  );
  RETURN new;
END;
$$;

-- 3. Re-create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. (Optional) Run this manually if you have existing users in Auth that are not in Public
-- INSERT INTO public.users (id, email, name, role, clinic_id)
-- SELECT 
--   id, 
--   email, 
--   COALESCE(raw_user_meta_data->>'name', 'User ' || substr(id::text, 1, 8)),
--   COALESCE((raw_user_meta_data->>'role')::role, 'PROFESSIONAL'::role),
--   (SELECT id FROM public.clinics LIMIT 1)
-- FROM auth.users
-- WHERE id NOT IN (SELECT id FROM public.users);
