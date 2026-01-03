-- Create a SECURITY DEFINER function to get the current user's role
-- This avoids RLS infinite recursion when policies need to check the user's role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS public.role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$;

-- Drop the recursive policy
DROP POLICY IF EXISTS "Users: admin manage" ON users;

-- Re-create the policy using the safe functions
CREATE POLICY "Users: admin manage"
ON users
FOR ALL
TO authenticated
USING (
  -- Check clinic match using safe function
  clinic_id = get_my_clinic_id() 
  AND 
  -- Check role using safe function
  get_my_role() IN ('ADMIN'::role, 'MASTER'::role)
);
