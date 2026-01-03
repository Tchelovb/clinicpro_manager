import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    try {
        const body = await req.json();

        // Suporte para chamada direta (teste) ou Webhook do Database
        const record = body.record || body;
        const isDelete = body.type === 'DELETE';
        const oldRecord = body.old_record;

        if (!record && !oldRecord) throw new Error('No record found in payload');

        const appointment = record || oldRecord;
        const professionalId = appointment.professional_id;

        if (!professionalId) return new Response('No professional_id', { status: 200 });

        // --- 1. Buscar Credenciais do Profissional ---
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        const { data: integration } = await supabase
            .from('user_integrations')
            .select('*')
            .eq('user_id', professionalId)
            .eq('provider', 'google_calendar')
            .single();

        if (!integration) {
            console.log(`Sem integração Google para prof: ${professionalId}`);
            return new Response('Skipped: No Integration', { status: 200 });
        }

        // --- 2. Verificar Expiração e Renovar Token ---
        let accessToken = integration.access_token;
        const expiresAt = new Date(integration.expires_at);

        // Se expirar em menos de 5 min, renova
        if (expiresAt.getTime() - Date.now() < 5 * 60 * 1000) {
            console.log('Renovando Access Token...');
            const CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
            const CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');

            if (integration.refresh_token) {
                const refreshReq = await fetch('https://oauth2.googleapis.com/token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({
                        client_id: CLIENT_ID!,
                        client_secret: CLIENT_SECRET!,
                        refresh_token: integration.refresh_token,
                        grant_type: 'refresh_token'
                    })
                });
                const refreshData = await refreshReq.json();

                if (refreshData.access_token) {
                    accessToken = refreshData.access_token;
                    // Atualizar no banco
                    await supabase.from('user_integrations').update({
                        access_token: accessToken,
                        expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString()
                    }).eq('id', integration.id);
                } else {
                    console.error('Falha ao renovar token:', refreshData);
                    // Pode ser que o usuário revogou.
                    return new Response('Token Refresh Failed', { status: 400 });
                }
            }
        }

        // --- 3. Sincronizar com Google Calendar ---

        // Se for DELETE, remover evento
        if (isDelete) {
            // Precisaríamos ter salvo o google_event_id no appointment. 
            // Vamos supor que existe uma coluna 'external_reference_id' ou metadata.
            // Por simplicidade, este exemplo foca no INSERT/UPDATE.
            return new Response('Delete Logic TODO', { status: 200 });
        }

        // Buscar dados do Paciente para o título
        const { data: patient } = await supabase.from('patients').select('name').eq('id', appointment.patient_id).single();
        const patientName = patient?.name || 'Paciente';

        const eventBody = {
            summary: `🩺 ${patientName} - Consulta`,
            description: `Procedimento: ${appointment.notes || 'Sem observações'}\nStatus: ${appointment.status}`,
            start: {
                dateTime: `${appointment.date}T${appointment.start_time}`, // Formato ISO deve estar correto
                timeZone: 'America/Sao_Paulo'
            },
            end: {
                dateTime: `${appointment.date}T${appointment.end_time}`,
                timeZone: 'America/Sao_Paulo'
            }
        };

        // Aqui podemos decidir se é Insert ou Update.
        // Idealmente, a tabela appointments teria uma coluna `google_event_id`.
        // Se tiver, fazemos PATCH. Se não, fazemos POST e salvamos o ID.

        // CHECK if we have event ID loaded (supondo que salvamos no metadata do appointment ou coluna separada)
        // Para simplificar: Sempre cria novo por enquanto ou precisaria alterar tabela appointments.

        const createRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventBody)
        });

        const googleEvent = await createRes.json();
        console.log('Evento criado Google:', googleEvent.id);

        // TODO: Salvar googleEvent.id no appointment para permitir updates futuros
        // await supabase.from('appointments').update({ google_event_id: googleEvent.id }).eq('id', appointment.id);

        return new Response(JSON.stringify(googleEvent), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } catch (error: any) {
        console.error(error);
        return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
    }
});
