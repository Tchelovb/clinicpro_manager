-- =====================================================
-- MIGRATION: Business Goals (Metas Estratégicas)
-- Descrição: Tabela para rastreamento de metas da clínica
-- Data: 2025-12-21
-- =====================================================

-- Criar tabela business_goals
CREATE TABLE IF NOT EXISTS public.business_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('REVENUE', 'PATIENTS', 'PROCEDURES', 'CONVERSION')),
    target_value DECIMAL(12, 2) NOT NULL,
    current_value DECIMAL(12, 2) DEFAULT 0,
    deadline DATE NOT NULL,
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'CANCELLED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_business_goals_clinic ON public.business_goals(clinic_id);
CREATE INDEX IF NOT EXISTS idx_business_goals_status ON public.business_goals(status);
CREATE INDEX IF NOT EXISTS idx_business_goals_deadline ON public.business_goals(deadline);

-- RLS (Row Level Security)
ALTER TABLE public.business_goals ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver metas da própria clínica
CREATE POLICY "Users can view goals from their clinic"
    ON public.business_goals
    FOR SELECT
    USING (
        clinic_id IN (
            SELECT clinic_id FROM public.users WHERE id = auth.uid()
        )
    );

-- Policy: Usuários podem criar metas na própria clínica
CREATE POLICY "Users can create goals in their clinic"
    ON public.business_goals
    FOR INSERT
    WITH CHECK (
        clinic_id IN (
            SELECT clinic_id FROM public.users WHERE id = auth.uid()
        )
    );

-- Policy: Usuários podem atualizar metas da própria clínica
CREATE POLICY "Users can update goals from their clinic"
    ON public.business_goals
    FOR UPDATE
    USING (
        clinic_id IN (
            SELECT clinic_id FROM public.users WHERE id = auth.uid()
        )
    );

-- Policy: Usuários podem deletar metas da própria clínica
CREATE POLICY "Users can delete goals from their clinic"
    ON public.business_goals
    FOR DELETE
    USING (
        clinic_id IN (
            SELECT clinic_id FROM public.users WHERE id = auth.uid()
        )
    );

-- Comentários
COMMENT ON TABLE public.business_goals IS 'Metas estratégicas da clínica (faturamento, pacientes, procedimentos, conversão)';
COMMENT ON COLUMN public.business_goals.category IS 'Categoria da meta: REVENUE (faturamento), PATIENTS (pacientes), PROCEDURES (procedimentos), CONVERSION (conversão)';
COMMENT ON COLUMN public.business_goals.target_value IS 'Valor alvo da meta';
COMMENT ON COLUMN public.business_goals.current_value IS 'Valor atual alcançado';
COMMENT ON COLUMN public.business_goals.status IS 'Status: ACTIVE (ativa), COMPLETED (concluída), CANCELLED (cancelada)';
