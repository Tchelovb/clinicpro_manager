-- ----------------------------------------------------
-- SCRIPT DE CORREÇÃO: SCHEMA INCOMPATÍVEL
-- ----------------------------------------------------
-- Este script ajusta as tabelas existentes para suportar
-- a integração com Google Calendar e a Agenda Avançada.

-- 1. Corrige a restrição de PROVEDOR na tabela user_integrations
-- O erro 'google_error=true' ocorre porque o banco rejeita 'google_calendar'.
ALTER TABLE public.user_integrations 
DROP CONSTRAINT IF EXISTS user_integrations_provider_check;

-- (Opcional) Recria a constraint aceitando 'google_calendar'
ALTER TABLE public.user_integrations 
ADD CONSTRAINT user_integrations_provider_check 
CHECK (provider IN ('GOOGLE', 'ZOOM', 'MEET', 'google_calendar'));


-- 2. Recria a tabela professional_schedules com a estrutura correta
-- A tabela atual usa 'text' para dias e não suporta bloqueios/datas específicas.
DROP TABLE IF EXISTS public.professional_schedules;

CREATE TABLE public.professional_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    professional_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE, -- Opcional
    
    -- Estrutura compatível com o código Frontend
    day_of_week INT, -- 0=Domingo, 1=Segunda, etc.
    start_time TIME WITHOUT TIME ZONE,
    end_time TIME WITHOUT TIME ZONE,
    is_working_day BOOLEAN DEFAULT true,
    
    -- Funcionalidades Avançadas (Bloqueios, Feriados)
    date_specific DATE,
    is_blocked BOOLEAN DEFAULT false,
    external_event_id TEXT,
    description TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilita RLS (Segurança)
ALTER TABLE public.professional_schedules ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas se existirem
DROP POLICY IF EXISTS "Professionals can manage their own schedule" ON public.professional_schedules;
DROP POLICY IF EXISTS "Public view schedules" ON public.professional_schedules;

-- Cria novas políticas
CREATE POLICY "Professionals can manage their own schedule" ON public.professional_schedules
    FOR ALL USING (auth.uid() = professional_id);

CREATE POLICY "Public view schedules" ON public.professional_schedules
    FOR SELECT USING (true);
