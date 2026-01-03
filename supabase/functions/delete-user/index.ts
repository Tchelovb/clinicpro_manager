import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const key = Deno.env.get('SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        if (!key) throw new Error("Service Role Key missing.");

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            key,
            { auth: { autoRefreshToken: false, persistSession: false } }
        )

        const { user_id } = await req.json();
        if (!user_id) throw new Error("User ID missing.");

        console.log(`[ACTION] Tentando deletar: ${user_id}`);

        // 1. Tenta deletar do Auth (Login)
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(user_id);

        if (authError) {
            // SE O ERRO FOR "NÃO ENCONTRADO", NÃO É UM ERRO REAL! É SUCESSO.
            if (authError.status === 404 || authError.code === 'user_not_found') {
                console.log("✅ Usuário já não existia no Auth (Zumbi). Continuando para limpeza...");
            } else {
                throw authError; // Outros erros (ex: banco fora do ar) a gente relata.
            }
        }

        // 2. Garante a limpeza na tabela visual (Public Users)
        // Mesmo que o Auth já tenha ido, garantimos que o registro visual suma.
        const { error: dbError } = await supabaseAdmin
            .from('users')
            .delete()
            .eq('id', user_id);

        if (dbError) {
            console.error("⚠️ Erro ao limpar tabela users:", dbError);
        }

        console.log("✅ [SUCESSO] Limpeza concluída.");

        return new Response(
            JSON.stringify({ success: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error("❌ [ERRO FATAL]", error.message);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
