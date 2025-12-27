import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // 1. Handle CORS pre-flight request
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 2. Create Supabase Admin client with Service Role privileges
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 3. Get data from frontend
        const { email, password, full_name, role, clinic_id } = await req.json()

        // Basic validation
        if (!email || !password || !clinic_id) {
            throw new Error('Dados incompletos: email, password e clinic_id são obrigatórios.')
        }

        // 4. Create user in Auth (without logging in)
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true, // Create already confirmed
            user_metadata: {
                full_name: full_name || email,
                role: role || 'secretary',
                clinic_id: clinic_id
            }
        })

        if (error) throw error

        // The database trigger (Step 1) will automatically run here and create the public.users record

        // 5. Create initial permissions
        if (data.user) {
            await supabaseAdmin.rpc('update_user_permission', {
                target_user_id: data.user.id,
                new_role: role || 'secretary',
                view_financial: role === 'admin',
                edit_calendar: true,
                manage_settings: role === 'admin',
                delete_patient: role === 'admin',
                give_discount: role === 'admin' || role === 'dentist',
                max_discount: role === 'admin' ? 100.00 : 10.00
            }).catch(err => {
                console.warn('Failed to set permissions:', err)
                // Don't fail the whole operation if permissions fail
            })
        }

        return new Response(JSON.stringify({
            user: data.user,
            message: "Usuário criado com sucesso!"
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        console.error('Error creating user:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
