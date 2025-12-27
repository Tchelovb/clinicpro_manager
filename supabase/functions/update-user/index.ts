import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { user_id, email, full_name, role, permissions } = await req.json()

        if (!user_id) {
            throw new Error('user_id é obrigatório')
        }

        // Update user metadata if email or full_name changed
        if (email || full_name || role) {
            const updateData: any = {}
            if (email) updateData.email = email
            if (full_name || role) {
                updateData.user_metadata = {}
                if (full_name) updateData.user_metadata.full_name = full_name
                if (role) updateData.user_metadata.role = role
            }

            const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
                user_id,
                updateData
            )

            if (authError) throw authError
        }

        // Update public.users if email or name changed
        if (email || full_name || role) {
            const updateFields: any = {}
            if (email) updateFields.email = email
            if (full_name) updateFields.name = full_name
            if (role) updateFields.role = role

            const { error: usersError } = await supabaseAdmin
                .from('users')
                .update(updateFields)
                .eq('id', user_id)

            if (usersError) throw usersError
        }

        // Update permissions if provided
        if (permissions) {
            const { error: permError } = await supabaseAdmin.rpc('update_user_permission', {
                target_user_id: user_id,
                new_role: role || permissions.role,
                view_financial: permissions.can_view_financial,
                edit_calendar: permissions.can_edit_calendar,
                manage_settings: permissions.can_manage_settings,
                delete_patient: permissions.can_delete_patient,
                give_discount: permissions.can_give_discount,
                max_discount: permissions.max_discount_percent
            })

            if (permError) {
                console.warn('Failed to update permissions:', permError)
            }
        }

        return new Response(JSON.stringify({
            message: "Usuário atualizado com sucesso!"
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        console.error('Error updating user:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
