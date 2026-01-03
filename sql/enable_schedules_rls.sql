-- 1. Habilita RLS na tabela de horários (Segurança Nível Linha)
ALTER TABLE public.professional_schedules ENABLE ROW LEVEL SECURITY;

-- 2. POLÍTICA DE VISUALIZAÇÃO:
-- "Todo mundo da mesma clínica pode ver os horários de todo mundo"
-- (Necessário para a secretária ver a agenda do dentista)
DROP POLICY IF EXISTS "Ver horários da clínica" ON public.professional_schedules;
CREATE POLICY "Ver horários da clínica" 
ON public.professional_schedules FOR SELECT 
USING (
  exists (
    select 1 from public.users
    where id = auth.uid() 
    and clinic_id = professional_schedules.clinic_id
  )
);

-- 3. POLÍTICA DE EDIÇÃO:
-- "Apenas o próprio dentista OU um Administrador/Master pode mudar os horários"
DROP POLICY IF EXISTS "Gerenciar horários" ON public.professional_schedules;
CREATE POLICY "Gerenciar horários" 
ON public.professional_schedules FOR ALL 
USING (
    -- Regra 1: É o próprio usuário
    auth.uid() = professional_id  
    OR 
    -- Regra 2: É um Admin ou Master
    EXISTS ( 
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND role IN ('ADMIN', 'MASTER')
    )
);
