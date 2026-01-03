-- Tabela para armazenar Tokens de Integração (Google, etc)
CREATE TABLE IF NOT EXISTS public.user_integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL, -- 'google_calendar'
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb, -- Para guardar email do calendario, nome, sync_token
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, provider)
);

-- RLS para user_integrations
ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own integrations"
    ON public.user_integrations
    FOR ALL
    USING (auth.uid() = user_id);

-- Tabela para Horários de Trabalho e Bloqueios Externos
CREATE TABLE IF NOT EXISTS public.professional_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    professional_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    day_of_week INT, -- 0=Domingo, 1=Segunda, etc (Para horário padrão)
    start_time TIME,
    end_time TIME,
    is_working_day BOOLEAN DEFAULT true,
    
    -- Para bloqueios específicos (ex: Consulta Médica Pessoal na agenda Google)
    date_specific DATE, -- Se preenchido, sobrepõe o dia da semana
    is_blocked BOOLEAN DEFAULT false,
    external_event_id TEXT, -- ID do evento no Google Calendar que gerou este bloqueio
    description TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS para professional_schedules
ALTER TABLE public.professional_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals can manage their own schedule"
    ON public.professional_schedules
    FOR ALL
    USING (auth.uid() = professional_id);

CREATE POLICY "Receptionists/Admins can view schedules"
    ON public.professional_schedules
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('ADMIN', 'RECEPTIONIST')
        )
    );
