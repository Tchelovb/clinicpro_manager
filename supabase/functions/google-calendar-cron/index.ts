import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GOOGLE_PATIENT_ID = '00000000-0000-0000-0000-000000000000';

serve(async (req) => {
    try {
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // 1. Buscar integrações ativas e seus clinic_ids
        const { data: integrations, error: intError } = await supabase
            .from('user_integrations')
            .select('*, users!inner(clinic_id)')
            .eq('provider', 'google_calendar');

        if (intError) throw intError;
        if (!integrations || integrations.length === 0) return new Response(JSON.stringify({ message: 'No integrations found' }), { headers: { 'Content-Type': 'application/json' } });

        const results: any[] = [];

        // 2. Processar cada integração
        for (const integration of integrations) {
            console.log(`Syncing user ${integration.user_id}...`);
            let accessToken = integration.access_token;

            // Check expire & Refresh if needed
            // (Simplificado: Se faltam menos de 5 min ou já expirou)
            if (new Date(integration.expires_at).getTime() < Date.now() + 5 * 60 * 1000) {
                console.log('Refreshing token...');
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
                        await supabase.from('user_integrations').update({
                            access_token: accessToken,
                            expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString()
                        }).eq('id', integration.id);
                    } else {
                        console.error('Failed to refresh token', refreshData);
                        continue; // Pula este usuário se falhar auth
                    }
                }
            }

            // 3. Buscar Eventos do Google (Hoje -> +30 dias)
            const timeMin = new Date().toISOString();
            const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

            const eventsRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            if (!eventsRes.ok) {
                console.error('Error fetching google events', await eventsRes.text());
                continue;
            }

            const eventsData = await eventsRes.json();
            const events = eventsData.items || [];
            let syncedCount = 0;

            // 4. Sync com Banco de Dados
            for (const evt of events) {
                // Ignora eventos sem hora marcada (dia inteiro) por simplificação inicial
                if (!evt.start.dateTime) continue;

                const startTime = new Date(evt.start.dateTime);
                const endTime = new Date(evt.end.dateTime);
                const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60); // minutos

                // Check se já existe pelo ID externo
                const { data: existing } = await supabase
                    .from('appointments')
                    .select('id')
                    .eq('external_id', evt.id)
                    .single();

                const payload = {
                    clinic_id: integration.users.clinic_id,
                    patient_id: GOOGLE_PATIENT_ID,
                    doctor_id: integration.user_id,
                    date: startTime.toISOString(),
                    duration: duration,
                    type: 'TREATMENT',
                    status: 'CONFIRMED',
                    notes: `[Google] ${evt.summary || 'Ocupado'}`,
                    external_id: evt.id,
                    external_source: 'GOOGLE'
                };

                if (existing) {
                    // Update apenas se mudou algo relevante? Por enquanto update cego para garantir sync
                    await supabase.from('appointments').update(payload).eq('id', existing.id);
                } else {
                    await supabase.from('appointments').insert(payload);
                }
                syncedCount++;
            }
            results.push({ user: integration.user_id, events_found: events.length, synced: syncedCount });
        }

        return new Response(JSON.stringify({ success: true, details: results }), { headers: { 'Content-Type': 'application/json' } });

    } catch (err: any) {
        console.error(err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
});
