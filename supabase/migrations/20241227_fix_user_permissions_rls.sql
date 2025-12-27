-- Fix Infinite Recursion on user_permissions RLS
-- The previous policy selected from user_permissions within user_permissions policy, causing a loop.
-- We switch to checking public.users for the admin role.

DROP POLICY IF EXISTS "Admins can manage all permissions" ON public.user_permissions;

CREATE POLICY "Admins can manage all permissions"
    ON public.user_permissions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND (role = 'ADMIN' OR role = 'MASTER')
        )
    );
