import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const requestUrl = new URL(req.url);
        const code = requestUrl.searchParams.get('code');
        const userIdParam = requestUrl.searchParams.get('user_id');
        const error = requestUrl.searchParams.get('error');

        // Variáveis de Ambiente (Segredos)
        const CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
        const CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        // URL desta função (HARDCODED para garantir match exato com Google Console)
        const REDIRECT_URI = 'https://huturwlbouvucjnwaoze.supabase.co/functions/v1/google-auth';

        // URL do Frontend para sucesso (ajuste conforme produção)
        // Em produção real, você pode passar isso como 'state' ou criar uma env var
        const FRONTEND_SUCCESS_URL = 'http://localhost:3000/settings/team?google_connected=true';
        const FRONTEND_ERROR_URL = 'http://localhost:3000/settings/team?google_error=true';

        if (!CLIENT_ID || !CLIENT_SECRET) {
            throw new Error('Google Credentials not configured on Supabase Secrets');
        }

        // 1. Início do Fluxo: Redirecionar para o Google
        if (!code && userIdParam) {
            console.log(` Iniciando Auth para User: ${userIdParam}`);

            const scopes = [
                'https://www.googleapis.com/auth/calendar.events',
                'https://www.googleapis.com/auth/calendar.readonly'
            ];

            const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${scopes.join(' ')}&access_type=offline&prompt=consent&state=${userIdParam}`;

            return Response.redirect(authUrl, 303);
        }

        // 2. Callback do Google: Recebendo o Code
        if (code) {
            const stateUserId = requestUrl.searchParams.get('state'); // UserID vem no state
            console.log(` Código recebido para User: ${stateUserId}`);

            // Trocar code por tokens
            const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    code,
                    client_id: CLIENT_ID,
                    client_secret: CLIENT_SECRET,
                    redirect_uri: REDIRECT_URI,
                    grant_type: 'authorization_code',
                }),
            });

            const tokens = await tokenResponse.json();

            if (tokens.error) {
                throw new Error(`Google Token Error: ${tokens.error_description}`);
            }

            // Salvar no Supabase
            const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

            // Upsert na tabela user_integrations
            const { error: dbError } = await supabase
                .from('user_integrations')
                .upsert({
                    user_id: stateUserId,
                    provider: 'google_calendar',
                    access_token: tokens.access_token,
                    refresh_token: tokens.refresh_token, // Importante: access_type=offline garante isso na 1a vez
                    expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
                    metadata: {
                        scope: tokens.scope,
                        token_type: tokens.token_type
                    },
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id, provider' });

            if (dbError) {
                console.error('Erro ao salvar no banco:', dbError);
                return Response.redirect(FRONTEND_ERROR_URL, 303);
            }

            // Sucesso! Redireciona para o App
            return Response.redirect(FRONTEND_SUCCESS_URL, 303);
        }

        if (error) {
            console.error('Erro retornado pelo Google:', error);
            return Response.redirect(FRONTEND_ERROR_URL, 303);
        }

        return new Response(JSON.stringify({ error: 'Invalid Request' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });

    } catch (error: any) {
        console.error(error);
        return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
    }
});
