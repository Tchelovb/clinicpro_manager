-- ----------------------------------------------------
-- SCRIPT DE CORREÇÃO: TABELAS GOOGLE CALENDAR
-- ----------------------------------------------------
-- Execute este script no SQL Editor do Supabase para
-- corrigir o erro "google_error=true" ao vincular conta.

-- 1. Tabela de Integrações (Tokens)
CREATE TABLE IF NOT EXISTS public.user_integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL, -- ex: 'google_calendar'
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, provider)
);

-- RLS
ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own integrations" ON public.user_integrations;
CREATE POLICY "Users can manage their own integrations" ON public.user_integrations
    FOR ALL USING (auth.uid() = user_id);


-- 2. Tabela de Agendas e Bloqueios
CREATE TABLE IF NOT EXISTS public.professional_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    professional_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Dias de Semana Recorrentes
    day_of_week INT, -- 0=Dom, 1=Seg...
    start_time TIME,
    end_time TIME,
    is_working_day BOOLEAN DEFAULT true,
    
    -- Bloqueios Específicos
    date_specific DATE,
    is_blocked BOOLEAN DEFAULT false,
    external_event_id TEXT,
    description TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.professional_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Professionals can manage their own schedule" ON public.professional_schedules;
CREATE POLICY "Professionals can manage their own schedule" ON public.professional_schedules
    FOR ALL USING (auth.uid() = professional_id);

DROP POLICY IF EXISTS "Public view schedules" ON public.professional_schedules;
CREATE POLICY "Public view schedules" ON public.professional_schedules
    FOR SELECT USING (true); -- Permite leitura pública (necessário para Agenda ver disponibilidade)
