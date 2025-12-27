-- ============================================
-- AUTH SYNC - Automatic User Synchronization
-- ============================================
-- This migration creates the infrastructure to automatically
-- sync users from auth.users to public.users
-- ============================================

-- 1. Create the trigger function
-- This function runs automatically when a new user is created in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Insert the new user into public.users
  INSERT INTO public.users (id, email, name, role, clinic_id, active)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email), -- Use email as fallback
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'secretary'), -- Default: secretary
    (NEW.raw_user_meta_data ->> 'clinic_id')::uuid, -- Link to clinic
    true -- Active by default
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent duplicates
  
  RETURN NEW;
END;
$$;

-- 2. Create the trigger
-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger that fires after insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON FUNCTION public.handle_new_user() TO postgres, service_role;

-- 4. Verification
DO $$
BEGIN
    RAISE NOTICE '✅ Auth Sync infrastructure created successfully!';
    RAISE NOTICE '🔄 Trigger: on_auth_user_created';
    RAISE NOTICE '⚙️ Function: handle_new_user()';
    RAISE NOTICE '📋 Sync: auth.users → public.users (automatic)';
END $$;
