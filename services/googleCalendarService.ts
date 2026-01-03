import { supabase } from '../src/lib/supabase';

/**
 * ✅ PADRONIZAÇÃO: Serviço de sincronização com Google Calendar
 * Segue Clean Architecture: professional_id = auth.uid() = users.id
 */

interface GoogleCalendarEvent {
    id: string;
    summary: string;
    description?: string;
    start: {
        dateTime: string;
        timeZone?: string;
    };
    end: {
        dateTime: string;
        timeZone?: string;
    };
    status: string;
}

/**
 * Busca eventos do Google Calendar
 */
const fetchGoogleEvents = async (accessToken: string): Promise<GoogleCalendarEvent[]> => {
    try {
        const response = await fetch(
            'https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=' + new Date().toISOString(),
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Google API error: ${response.status}`);
        }

        const data = await response.json();
        return data.items || [];
    } catch (error) {
        console.error('Erro ao buscar eventos do Google:', error);
        throw error;
    }
};

/**
 * Calcula duração do evento em minutos
 */
const calculateDuration = (event: GoogleCalendarEvent): number => {
    const start = new Date(event.start.dateTime);
    const end = new Date(event.end.dateTime);
    return Math.round((end.getTime() - start.getTime()) / 60000); // minutos
};

/**
 * Sincroniza eventos do Google Calendar com a agenda local
 * ✅ PADRONIZAÇÃO: Usa user.id (auth.uid()) como professional_id
 */
export const syncGoogleCalendar = async (userId: string, clinicId: string) => {
    try {
        // 1. Buscar integração do usuário
        // ✅ PADRONIZAÇÃO: user_integrations.user_id = auth.uid()
        const { data: integration, error: integrationError } = await supabase
            .from('user_integrations')
            .select('*')
            .eq('user_id', userId)  // ✅ Mesmo ID do auth
            .eq('provider', 'google_calendar')
            .maybeSingle();

        if (integrationError) throw integrationError;

        if (!integration) {
            throw new Error('Google Calendar não vinculado. Vincule sua conta primeiro.');
        }

        if (!integration.access_token) {
            throw new Error('Token de acesso não encontrado. Reautorize o Google Calendar.');
        }

        // 2. Buscar eventos do Google
        const googleEvents = await fetchGoogleEvents(integration.access_token);

        console.log(`📅 Encontrados ${googleEvents.length} eventos no Google Calendar`);

        // 3. Sincronizar com banco local
        let created = 0;
        let updated = 0;
        let skipped = 0;

        for (const event of googleEvents) {
            // Ignorar eventos cancelados
            if (event.status === 'cancelled') {
                skipped++;
                continue;
            }

            // Verificar se evento já existe
            const { data: existing } = await supabase
                .from('appointments')
                .select('id, date, duration, notes')
                .eq('google_event_id', event.id)
                .maybeSingle();

            const eventData = {
                date: event.start.dateTime,
                duration: calculateDuration(event),
                notes: event.summary + (event.description ? `\n\n${event.description}` : '')
            };

            if (existing) {
                // Atualizar evento existente se houver mudanças
                const hasChanges =
                    existing.date !== eventData.date ||
                    existing.duration !== eventData.duration ||
                    existing.notes !== eventData.notes;

                if (hasChanges) {
                    await supabase
                        .from('appointments')
                        .update(eventData)
                        .eq('id', existing.id);
                    updated++;
                } else {
                    skipped++;
                }
            } else {
                // Criar novo bloqueio
                // ✅ PADRONIZAÇÃO: professional_id = userId (mesmo ID do auth)
                await supabase
                    .from('appointments')
                    .insert({
                        clinic_id: clinicId,
                        professional_id: userId,  // ✅ PADRONIZAÇÃO
                        patient_id: null,  // Bloqueio sem paciente
                        date: eventData.date,
                        duration: eventData.duration,
                        type: 'BLOCKED',
                        status: 'CONFIRMED',
                        notes: eventData.notes,
                        google_event_id: event.id
                    });
                created++;
            }
        }

        return {
            success: true,
            stats: {
                total: googleEvents.length,
                created,
                updated,
                skipped
            }
        };

    } catch (error: any) {
        console.error('Erro ao sincronizar Google Calendar:', error);
        return {
            success: false,
            error: error.message || 'Erro desconhecido ao sincronizar'
        };
    }
};

/**
 * Verifica se usuário tem Google Calendar vinculado
 * ✅ PADRONIZAÇÃO: Usa user.id (auth.uid())
 */
export const hasGoogleCalendarLinked = async (userId: string): Promise<boolean> => {
    try {
        const { data, error } = await supabase
            .from('user_integrations')
            .select('id')
            .eq('user_id', userId)  // ✅ Mesmo ID do auth
            .eq('provider', 'google_calendar')
            .maybeSingle();

        if (error) throw error;
        return !!data;
    } catch (error) {
        console.error('Erro ao verificar Google Calendar:', error);
        return false;
    }
};

/**
 * Remove vinculação com Google Calendar
 * ✅ PADRONIZAÇÃO: Usa user.id (auth.uid())
 */
export const unlinkGoogleCalendar = async (userId: string) => {
    try {
        const { error } = await supabase
            .from('user_integrations')
            .delete()
            .eq('user_id', userId)  // ✅ Mesmo ID do auth
            .eq('provider', 'google_calendar');

        if (error) throw error;

        // Remover bloqueios do Google Calendar
        await supabase
            .from('appointments')
            .delete()
            .eq('professional_id', userId)  // ✅ PADRONIZAÇÃO
            .eq('type', 'BLOCKED')
            .not('google_event_id', 'is', null);

        return { success: true };
    } catch (error: any) {
        console.error('Erro ao desvincular Google Calendar:', error);
        return {
            success: false,
            error: error.message || 'Erro ao desvincular'
        };
    }
};

/**
 * Atualiza token de acesso do Google Calendar
 * ✅ PADRONIZAÇÃO: Usa user.id (auth.uid())
 */
export const updateGoogleCalendarToken = async (
    userId: string,
    accessToken: string,
    refreshToken?: string,
    expiresAt?: string
) => {
    try {
        const { error } = await supabase
            .from('user_integrations')
            .update({
                access_token: accessToken,
                refresh_token: refreshToken,
                expires_at: expiresAt,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)  // ✅ Mesmo ID do auth
            .eq('provider', 'google_calendar');

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        console.error('Erro ao atualizar token:', error);
        return {
            success: false,
            error: error.message || 'Erro ao atualizar token'
        };
    }
};
