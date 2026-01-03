import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // 1. Verificar quem está chamando (O usuário logado)
        const {
            data: { user },
        } = await supabaseClient.auth.getUser()

        if (!user) {
            throw new Error('Usuário não autenticado')
        }

        // 2. Verificar se o usuário logado é ADMIN ou MASTER
        // Precisamos buscar a role publica na tabela users
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { data: requestUser, error: roleError } = await supabaseAdmin
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (roleError || !['ADMIN', 'MASTER'].includes(requestUser?.role || '')) {
            const foundRole = requestUser?.role || 'Nenhum';
            const errorMsg = roleError?.message || 'Nenhum erro de banco';
            throw new Error(`Permissão negada. Role encontrada: ${foundRole}. Erro DB: ${errorMsg}`);
        }

        // 3. Ler dados do corpo da requisição
        const { user_id, password } = await req.json()

        if (!user_id || !password) {
            throw new Error('ID do usuário e senha são obrigatórios')
        }

        if (password.length < 6) {
            throw new Error('A senha deve ter no mínimo 6 caracteres')
        }

        // 4. Atualizar a senha (usando cliente Admin)
        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
            user_id,
            { password: password }
        )

        if (error) throw error

        return new Response(
            JSON.stringify(data),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
