import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const key = Deno.env.get('SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        console.log(`[DEBUG] SERVICE_ROLE_KEY encontrada? ${key ? 'SIM' : 'NÃO'}`);

        if (!key) {
            throw new Error("SERVICE_ROLE_KEY não configurada");
        }

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            key,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        const body = await req.json();
        console.log('[DEBUG] Payload recebido:', JSON.stringify(body));

        const {
            email,
            password,
            name,
            role, // Frontend sends 'role' string (e.g. 'ADMIN')
            roles: rawRoles, // Legacy support
            cpf,
            gender,
            is_clinical_provider,
            is_sales_rep,
            cro,
            specialty,
            agenda_color,
            commission_percent, // for clinical
            sales_commission_percent, // for sales
            collection_percent, // for collection
            payment_release_rule,
            pin,
            photo_url
        } = body

        // Normalize Roles
        let finalRoles: string[] = [];
        if (rawRoles && Array.isArray(rawRoles)) {
            finalRoles = rawRoles;
        } else if (role) {
            // Map single role to array if needed, or just use it. 
            // The system seems to use both 'role' column (enum) and 'roles' column (text[]).
            // We will set 'role' as the primary one and 'roles' as an array containing it.
            finalRoles = [role.toLowerCase()];
            if (is_clinical_provider) finalRoles.push('clinical', 'dentist'); // Legacy tags
            if (is_sales_rep) finalRoles.push('sales');
        }

        // Validação de campos obrigatórios
        if (!email || !password) {
            throw new Error("E-mail e senha são obrigatórios");
        }
        if (!name) {
            throw new Error("Nome é obrigatório");
        }
        if (!body.clinic_id) {
            throw new Error("clinic_id é obrigatório");
        }

        console.log('[DEBUG] Validação OK. Email:', email, 'Nome:', name, 'Clinic:', body.clinic_id);

        // 1. Create Auth User
        console.log('[ACTION] Criando usuário no Auth...');
        const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name, gender }, // Save gender in metadata too
            app_metadata: { provider: 'email', providers: ['email'], clinic_id: body.clinic_id }
        })

        if (authError) {
            if (authError.message?.toLowerCase().includes('already registered')) {
                throw new Error("Este e-mail já está cadastrado no sistema.");
            }
            throw authError;
        }
        if (!authUser.user) throw new Error("Falha ao criar usuário no Auth")

        const userId = authUser.user.id
        let pinHash = null


        // 2. Store PIN (TODO: Add hashing later)
        if (pin) {
            pinHash = pin  // Temporarily storing without hash
        }


        // 3. Insert into public.users
        const userUpdatePayload: any = {
            roles: finalRoles,
            role: role ? role.toUpperCase() : 'PROFESSIONAL', // Enum
            name: name,
            cpf: cpf,
            gender: gender,
            photo_url: photo_url,
            is_clinical_provider: is_clinical_provider || false,
            is_sales_rep: is_sales_rep || false,
            is_orcamentista: body.is_orcamentista || false,
            transaction_pin_hash: pinHash,
            active: true,
            // Demographics & Professional Data in Users table
            cro: cro,
            specialty: specialty,
            agenda_color: agenda_color,
            commission_percent: Number(commission_percent) || 0,
            sales_commission_percent: Number(sales_commission_percent) || 0,
            collection_percent: Number(collection_percent) || 0,
            payment_release_rule: payment_release_rule
        };

        const { error: dbError } = await supabaseClient
            .from('users')
            .update(userUpdatePayload)
            .eq('id', userId)

        if (dbError) {
            console.error('[DB ERROR]', dbError);
            // Rollback: Delete Auth User
            await supabaseClient.auth.admin.deleteUser(userId)
            throw new Error(`Erro ao salvar dados do usuário: ${dbError.message}`)
        }

        // 4. Handle Professional Data (Sync to professionals table)
        // Only if it's a clinical provider or has explicit role
        if (is_clinical_provider || finalRoles.includes('dentist') || finalRoles.includes('clinical') || role === 'DENTIST') {
            const { data: proData, error: proError } = await supabaseClient
                .from('professionals')
                .insert({
                    id: userId, // Same ID as user
                    clinic_id: body.clinic_id,
                    name: name,
                    cro: cro,
                    specialty: specialty,
                    color: agenda_color,
                    commission_percent: Number(commission_percent) || 0,
                    active: true,
                    payment_release_rule: payment_release_rule
                })
                .select()
                .single()

            if (proError) {
                console.error("Erro ao criar profissional na tabela dedicada:", proError)
                // We don't rollback user creation for this, but log it.
            }
        }

        return new Response(
            JSON.stringify({ user: authUser.user, message: "Usuário criado com sucesso" }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        console.error('[ERRO FATAL]', error.message);
        console.error('[ERRO STACK]', error.stack);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
