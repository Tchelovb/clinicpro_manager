import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const VALID_ROLES = ['MASTER', 'ADMIN', 'PROFESSIONAL', 'SECRETARY'];

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { user_id, email, password, name, role, clinic_id, email_confirm, photo_url } = await req.json()

        if (!user_id) throw new Error('user_id is required')

        if (role && !VALID_ROLES.includes(role)) {
            throw new Error(`Role inválida. Tipos permitidos: ${VALID_ROLES.join(', ')}`);
        }

        // Prepare updates object
        const updates: any = { user_metadata: {} }

        if (email) updates.email = email
        if (password) updates.password = password
        if (email_confirm) updates.email_confirm = true

        // Metadata updates (merged)
        if (name) updates.user_metadata.name = name
        if (role) updates.user_metadata.role = role
        if (clinic_id) updates.user_metadata.clinic_id = clinic_id
        if (photo_url) updates.user_metadata.avatar_url = photo_url

        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
            user_id,
            updates
        )

        if (error) throw error

        // Sync to public.users and handle Professional Promotion
        if (name || role || photo_url) {
            const publicUpdate: any = {}
            if (name) publicUpdate.name = name
            if (role) publicUpdate.role = role
            if (photo_url) publicUpdate.photo_url = photo_url

            // If promoting to PROFESSIONAL, ensure professional record exists
            if (role === 'PROFESSIONAL' || role === 'MASTER') {
                // Check if user already has professional_id
                const { data: currentUser } = await supabaseAdmin
                    .from('users')
                    .select('professional_id')
                    .eq('id', user_id)
                    .single();

                if (currentUser && !currentUser.professional_id) {
                    // Create Professional
                    const { data: newProf } = await supabaseAdmin
                        .from('professionals')
                        .insert({
                            clinic_id: clinic_id || data.user.user_metadata.clinic_id, // fallback to existing meta
                            name: name || data.user.user_metadata.name,
                            is_active: true
                        })
                        .select()
                        .single();

                    if (newProf) {
                        publicUpdate.professional_id = newProf.id;
                        publicUpdate.is_clinical_provider = true;
                    }
                }
            }

            await supabaseAdmin
                .from('users')
                .update(publicUpdate)
                .eq('id', user_id)
        }

        return new Response(JSON.stringify({ user: data.user }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
