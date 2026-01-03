-- ----------------------------------------------------
-- SCRIPT DE AJUSTE DE PERMISSÕES (RLS)
-- ----------------------------------------------------
-- Execute este script para permitir que o painel mostre
-- corretamente o status "Vinculado" da agenda Google.

-- 1. Libera visualização de integrações para o painel administrativo
-- (Antes, apenas o próprio médico conseguia ver se estava vinculado)
ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own integrations" ON public.user_integrations;
DROP POLICY IF EXISTS "Authenticated users view integrations" ON public.user_integrations;

-- Permite que qualquer usuário logado (ex: Admin/Recepcionista) VEJA se existe integração
CREATE POLICY "Authenticated users view integrations" ON public.user_integrations
    FOR SELECT USING (auth.role() = 'authenticated');

-- Permite que o usuário delete sua própria integração (Desvincular)
CREATE POLICY "Users delete own integrations" ON public.user_integrations
    FOR DELETE USING (auth.uid() = user_id);


-- 2. Garante permissões na tabela de Agendas (Schedules)
ALTER TABLE public.professional_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Professionals can manage their own schedule" ON public.professional_schedules;
DROP POLICY IF EXISTS "Anyone can view schedules" ON public.professional_schedules;

-- Profissional edita sua agenda
CREATE POLICY "Professionals can manage their own schedule" ON public.professional_schedules
    FOR ALL USING (auth.uid() = professional_id);

-- Todos veem a agenda (necessário para o calendário funcionar)
CREATE POLICY "Anyone can view schedules" ON public.professional_schedules
    FOR SELECT USING (true);
