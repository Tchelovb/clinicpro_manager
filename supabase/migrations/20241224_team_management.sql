-- ============================================
-- TEAM MANAGEMENT - USER PERMISSIONS
-- ============================================
-- This script creates the infrastructure for managing
-- team members and their permissions
-- ============================================

-- 1. User Permissions Table
CREATE TABLE IF NOT EXISTS public.user_permissions (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    role TEXT DEFAULT 'secretary', -- 'admin', 'dentist', 'secretary'
    can_view_financial BOOLEAN DEFAULT false,
    can_edit_calendar BOOLEAN DEFAULT true,
    can_manage_settings BOOLEAN DEFAULT false,
    can_delete_patient BOOLEAN DEFAULT false,
    can_give_discount BOOLEAN DEFAULT false,
    max_discount_percent NUMERIC(5,2) DEFAULT 5.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Secure View for Team Members
-- This view combines auth.users with user_permissions
-- Only authenticated users can access this
-- Drop existing view first to avoid column conflicts
DROP VIEW IF EXISTS public.view_team_members;

CREATE VIEW public.view_team_members AS
SELECT 
    au.id as user_id,
    au.email,
    au.created_at as registered_at,
    au.last_sign_in_at,
    COALESCE(up.role, 'secretary') as role,
    COALESCE(up.can_view_financial, false) as can_view_financial,
    COALESCE(up.can_edit_calendar, true) as can_edit_calendar,
    COALESCE(up.can_manage_settings, false) as can_manage_settings,
    COALESCE(up.can_delete_patient, false) as can_delete_patient,
    COALESCE(up.can_give_discount, false) as can_give_discount,
    COALESCE(up.max_discount_percent, 5.00) as max_discount_percent
FROM auth.users au
LEFT JOIN public.user_permissions up ON au.id = up.user_id
ORDER BY au.created_at DESC;

-- 3. Function to Update User Permissions
CREATE OR REPLACE FUNCTION public.update_user_permission(
    target_user_id UUID,
    new_role TEXT,
    view_financial BOOLEAN,
    edit_calendar BOOLEAN,
    manage_settings BOOLEAN,
    delete_patient BOOLEAN DEFAULT false,
    give_discount BOOLEAN DEFAULT false,
    max_discount NUMERIC DEFAULT 5.00
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert or update permissions
    INSERT INTO public.user_permissions (
        user_id, 
        role, 
        can_view_financial, 
        can_edit_calendar, 
        can_manage_settings,
        can_delete_patient,
        can_give_discount,
        max_discount_percent,
        updated_at
    )
    VALUES (
        target_user_id, 
        new_role, 
        view_financial, 
        edit_calendar, 
        manage_settings,
        delete_patient,
        give_discount,
        max_discount,
        now()
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        role = EXCLUDED.role,
        can_view_financial = EXCLUDED.can_view_financial,
        can_edit_calendar = EXCLUDED.can_edit_calendar,
        can_manage_settings = EXCLUDED.can_manage_settings,
        can_delete_patient = EXCLUDED.can_delete_patient,
        can_give_discount = EXCLUDED.can_give_discount,
        max_discount_percent = EXCLUDED.max_discount_percent,
        updated_at = now();
END;
$$;

-- 4. Grant Permissions
GRANT SELECT ON public.view_team_members TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_permission TO authenticated;

-- 5. Enable RLS on user_permissions
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policy: Users can view their own permissions
CREATE POLICY "Users can view own permissions"
    ON public.user_permissions
    FOR SELECT
    USING (auth.uid() = user_id);

-- 7. RLS Policy: Admins can manage all permissions
CREATE POLICY "Admins can manage all permissions"
    ON public.user_permissions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_permissions
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- 8. Verification
DO $$
BEGIN
    RAISE NOTICE '✅ Team Management infrastructure created successfully!';
    RAISE NOTICE '📋 Tables created:';
    RAISE NOTICE '   - user_permissions';
    RAISE NOTICE '📊 Views created:';
    RAISE NOTICE '   - view_team_members';
    RAISE NOTICE '⚙️ Functions created:';
    RAISE NOTICE '   - update_user_permission()';
END $$;
