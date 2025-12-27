import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const VALID_ROLES = ['MASTER', 'ADMIN', 'PROFESSIONAL', 'SECRETARY'];

serve(async (req) => {
    // 1. CORS Pre-flight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 2. Initialize Admin Client
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 3. Parse Request Body
        const { email, name, role, clinic_id, password, photo_url } = await req.json()

        // Validation
        if (!email || !clinic_id) {
            throw new Error('Email e Clinic ID são obrigatórios.')
        }

        if (role && !VALID_ROLES.includes(role)) {
            throw new Error(`Role inválida. Tipos permitidos: ${VALID_ROLES.join(', ')}`);
        }

        // 4. Create User in Auth
        const tempPassword = password || "Mudar@123"

        const { data: { user }, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
                name: name || email.split('@')[0],
                role: role || 'PROFESSIONAL',
                clinic_id: clinic_id,
                avatar_url: photo_url
            }
        })

        if (createError) throw createError
        if (!user) throw new Error('Falha ao criar usuário (sem dados retornados).');

        // 5. Update Photo URL in Public Users
        if (photo_url) {
            const { error: photoErr } = await supabaseAdmin
                .from('users')
                .update({ photo_url: photo_url })
                .eq('id', user.id);
            if (photoErr) console.error('Error updating photo_url:', photoErr);
        }

        // 6. Handle Professional Record Creation
        // If the role implies a clinical provider, we ensure a record exists in 'professionals'
        if (role === 'PROFESSIONAL' || role === 'MASTER') {
            // We wait a brief moment for the Trigger to fire and create public.users
            // Alternatively, we safely upsert into public.professionals

            // Create Professional Entity
            const { data: professional, error: profError } = await supabaseAdmin
                .from('professionals')
                .insert({
                    clinic_id: clinic_id,
                    name: name || email.split('@')[0],
                    is_active: true
                })
                .select()
                .single();

            if (profError) {
                console.error('Error creating professional record:', profError);
                // We don't block the response but log it
            } else if (professional) {
                // Link to User
                // We need to ensure public.users row exists. The trigger usually does this.
                // We'll update the public.users row with professional_id
                // Delaying slightly might be needed if trigger is slow, but usually it's robust enough or we retry?
                // Supabase triggers are synchronous-ish within the same transaction but this is API.
                // We'll update public.users
                const { error: linkError } = await supabaseAdmin
                    .from('users')
                    .update({
                        professional_id: professional.id,
                        is_clinical_provider: true
                    })
                    .eq('id', user.id);

                if (linkError) console.error('Error linking professional to user:', linkError);
            }
        }

        return new Response(JSON.stringify({
            user: user,
            message: "Usuário criado com sucesso!"
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error: any) {
        console.error('Error in create-user:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
