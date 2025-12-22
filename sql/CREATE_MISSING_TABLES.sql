-- =====================================================
-- CRIAR TABELAS FALTANTES - ClinicPro
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- 1. AI INSIGHTS (Insights da Inteligência Artificial)
CREATE TABLE IF NOT EXISTS public.ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    explanation TEXT,
    category TEXT CHECK (category IN ('financial', 'operational', 'commercial', 'strategic', 'clinical')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('critico', 'high', 'medium', 'low')),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
    action_label TEXT,
    action_url TEXT,
    related_entity_type TEXT,
    related_entity_id UUID,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    is_read BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_insights_clinic ON public.ai_insights(clinic_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_status ON public.ai_insights(status);
CREATE INDEX IF NOT EXISTS idx_ai_insights_priority ON public.ai_insights(priority);

-- RLS para ai_insights
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view insights from their clinic" ON public.ai_insights;
CREATE POLICY "Users can view insights from their clinic"
    ON public.ai_insights FOR SELECT
    USING (clinic_id IN (SELECT clinic_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update insights from their clinic" ON public.ai_insights;
CREATE POLICY "Users can update insights from their clinic"
    ON public.ai_insights FOR UPDATE
    USING (clinic_id IN (SELECT clinic_id FROM public.users WHERE id = auth.uid()));

-- 2. CLINIC KPIS (Indicadores de Performance)
CREATE TABLE IF NOT EXISTS public.clinic_kpis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    revenue DECIMAL(12, 2) DEFAULT 0,
    expenses DECIMAL(12, 2) DEFAULT 0,
    profit DECIMAL(12, 2) DEFAULT 0,
    new_patients INTEGER DEFAULT 0,
    total_appointments INTEGER DEFAULT 0,
    completed_appointments INTEGER DEFAULT 0,
    cancelled_appointments INTEGER DEFAULT 0,
    no_show_appointments INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5, 2) DEFAULT 0,
    avg_ticket DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinic_kpis_clinic ON public.clinic_kpis(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_kpis_period ON public.clinic_kpis(period_start, period_end);

-- RLS para clinic_kpis
ALTER TABLE public.clinic_kpis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view KPIs from their clinic" ON public.clinic_kpis;
CREATE POLICY "Users can view KPIs from their clinic"
    ON public.clinic_kpis FOR SELECT
    USING (clinic_id IN (SELECT clinic_id FROM public.users WHERE id = auth.uid()));

-- 3. GAMIFICATION RULES (Regras de Gamificação)
CREATE TABLE IF NOT EXISTS public.gamification_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    xp_appointment_completed INTEGER DEFAULT 10,
    xp_budget_approved INTEGER DEFAULT 50,
    xp_patient_referral INTEGER DEFAULT 100,
    xp_review_received INTEGER DEFAULT 25,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(clinic_id)
);

CREATE INDEX IF NOT EXISTS idx_gamification_rules_clinic ON public.gamification_rules(clinic_id);

-- RLS para gamification_rules
ALTER TABLE public.gamification_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view gamification rules from their clinic" ON public.gamification_rules;
CREATE POLICY "Users can view gamification rules from their clinic"
    ON public.gamification_rules FOR SELECT
    USING (clinic_id IN (SELECT clinic_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update gamification rules from their clinic" ON public.gamification_rules;
CREATE POLICY "Users can update gamification rules from their clinic"
    ON public.gamification_rules FOR ALL
    USING (clinic_id IN (SELECT clinic_id FROM public.users WHERE id = auth.uid()));

-- 4. ADICIONAR COLUNAS FALTANTES EM TABELAS EXISTENTES

-- budget_items: adicionar amount_paid e payment_date
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'budget_items' 
                   AND column_name = 'amount_paid') THEN
        ALTER TABLE public.budget_items ADD COLUMN amount_paid DECIMAL(12, 2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'budget_items' 
                   AND column_name = 'payment_date') THEN
        ALTER TABLE public.budget_items ADD COLUMN payment_date DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'budget_items' 
                   AND column_name = 'payment_method') THEN
        ALTER TABLE public.budget_items ADD COLUMN payment_method TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'budget_items' 
                   AND column_name = 'payment_notes') THEN
        ALTER TABLE public.budget_items ADD COLUMN payment_notes TEXT;
    END IF;
END $$;

-- expenses: adicionar payment_date
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'expenses' 
                   AND column_name = 'payment_date') THEN
        ALTER TABLE public.expenses ADD COLUMN payment_date DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'expenses' 
                   AND column_name = 'payment_method') THEN
        ALTER TABLE public.expenses ADD COLUMN payment_method TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'expenses' 
                   AND column_name = 'payment_notes') THEN
        ALTER TABLE public.expenses ADD COLUMN payment_notes TEXT;
    END IF;
END $$;

-- users: adicionar is_active
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'users' 
                   AND column_name = 'is_active') THEN
        ALTER TABLE public.users ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

SELECT 
    '✅ TABELAS CRIADAS COM SUCESSO!' as status,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_insights') as ai_insights,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clinic_kpis') as clinic_kpis,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gamification_rules') as gamification_rules,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'business_goals') as business_goals;
