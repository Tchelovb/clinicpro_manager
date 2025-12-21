-- =====================================================
-- MIGRATION 006: PACIENTES HIGH-TICKET (DOSSIÊ INTELIGENTE)
-- Prioridade: P0+ (CRÍTICO PARA VENDAS)
-- Impacto: Transformação de Cadastro em CRM de Luxo
-- Data: 21/12/2025
-- =====================================================

-- =====================================================
-- 1. DOSSIÊ SOCIAL E CRM DE LUXO
-- =====================================================

-- Campos para criar Rapport e Conexão Emocional
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS nickname text, -- Como prefere ser chamado (Rapport)
ADD COLUMN IF NOT EXISTS occupation text, -- Profissão (Indica poder aquisitivo)
ADD COLUMN IF NOT EXISTS instagram_handle text, -- Para análise de perfil lifestyle
ADD COLUMN IF NOT EXISTS marital_status text CHECK (marital_status IN ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'OTHER')),
ADD COLUMN IF NOT EXISTS wedding_anniversary date, -- Para enviar presentes/mensagens
ADD COLUMN IF NOT EXISTS indication_patient_id uuid REFERENCES public.patients(id), -- Paciente que indicou (Programa de Indicação)
ADD COLUMN IF NOT EXISTS vip_notes text; -- Notas VIP (Ex: "Gosta de café sem açúcar", "Ar condicionado fraco")

COMMENT ON COLUMN public.patients.nickname IS 'Apelido/Como prefere ser chamado - Rapport';
COMMENT ON COLUMN public.patients.occupation IS 'Profissão - Indica poder aquisitivo e lifestyle';
COMMENT ON COLUMN public.patients.instagram_handle IS 'Instagram para análise de perfil e lifestyle';
COMMENT ON COLUMN public.patients.vip_notes IS 'Notas VIP sobre preferências e detalhes pessoais';

-- =====================================================
-- 2. RESPONSÁVEL FINANCEIRO (GUARANTOR)
-- =====================================================

-- Permite que um paciente seja dependente financeiro de outro
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS responsible_party_id uuid REFERENCES public.patients(id), 
ADD COLUMN IF NOT EXISTS relationship_type text CHECK (relationship_type IN ('SELF', 'PARENT', 'SPOUSE', 'CHILD', 'GUARDIAN', 'OTHER'));

COMMENT ON COLUMN public.patients.responsible_party_id IS 'Quem paga as contas (Guarantor) - Pode ser outro paciente';
COMMENT ON COLUMN public.patients.relationship_type IS 'Relação com o responsável financeiro';

-- =====================================================
-- 3. CLASSIFICAÇÃO ABC (CURVA DE VALOR)
-- =====================================================

-- Score automático baseado em comportamento de compra e pagamento
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS patient_score text DEFAULT 'STANDARD' CHECK (patient_score IN ('DIAMOND', 'GOLD', 'STANDARD', 'RISK', 'BLACKLIST')),
ADD COLUMN IF NOT EXISTS bad_debtor boolean DEFAULT false, -- Devedor problemático (Bloqueia agendamento)
ADD COLUMN IF NOT EXISTS sentiment_status text DEFAULT 'NEUTRAL' CHECK (sentiment_status IN ('VERY_HAPPY', 'HAPPY', 'NEUTRAL', 'UNHAPPY', 'COMPLAINING'));

COMMENT ON COLUMN public.patients.patient_score IS 'Classificação ABC: DIAMOND (High-Ticket), GOLD (Bom), STANDARD (Normal), RISK (Inadimplente), BLACKLIST (Bloqueado)';
COMMENT ON COLUMN public.patients.bad_debtor IS 'Devedor problemático - Sistema bloqueia agendamento sem pré-pagamento';
COMMENT ON COLUMN public.patients.sentiment_status IS 'Status de satisfação do cliente';

-- =====================================================
-- 4. GALERIA RÁPIDA (FOTOS PARA VENDAS)
-- =====================================================

-- Fotos estratégicas para venda visual (diferente de exames)
ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS photo_profile_url text, -- Rosto (Avatar)
ADD COLUMN IF NOT EXISTS photo_smile_url text,   -- Sorriso Close-up
ADD COLUMN IF NOT EXISTS photo_frontal_url text, -- Rosto frontal (Análise simetria)
ADD COLUMN IF NOT EXISTS photo_profile_side_url text, -- Perfil (Análise queixo/papada)
ADD COLUMN IF NOT EXISTS photo_document_front_url text, -- Documento frente
ADD COLUMN IF NOT EXISTS photo_document_back_url text; -- Documento verso

COMMENT ON COLUMN public.patients.photo_profile_url IS 'Foto de perfil (Avatar) para identificação rápida';
COMMENT ON COLUMN public.patients.photo_smile_url IS 'Foto do sorriso close-up para vendas';
COMMENT ON COLUMN public.patients.photo_frontal_url IS 'Foto frontal para análise de simetria';
COMMENT ON COLUMN public.patients.photo_profile_side_url IS 'Foto de perfil lateral para análise cervical/papada';

-- =====================================================
-- 5. ALERTAS MÉDICOS CRÍTICOS
-- =====================================================

-- NOTA: A tabela medical_alerts já foi criada na migration 004_ALL_P1_P2_MODULES.sql
-- Aqui apenas adicionamos campos faltantes se necessário

-- Verificar se campos críticos existem (já devem existir da migration 004)
-- ALTER TABLE public.medical_alerts ADD COLUMN IF NOT EXISTS is_critical boolean DEFAULT false;

COMMENT ON TABLE public.medical_alerts IS 'Alertas médicos críticos - Pop-up visual ao abrir ficha do paciente';
COMMENT ON COLUMN public.medical_alerts.is_critical IS 'Se true, exibe pop-up bloqueante ao abrir prontuário';

-- =====================================================
-- 6. TRIGGER: ATUALIZAR SCORE AUTOMATICAMENTE
-- =====================================================

CREATE OR REPLACE FUNCTION auto_update_patient_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Lógica simplificada de scoring
  -- DIAMOND: LTV > R$ 50.000 e sem débitos
  -- GOLD: LTV > R$ 20.000 e bom pagador
  -- RISK: Débitos > R$ 5.000 ou bad_debtor = true
  -- BLACKLIST: bad_debtor = true e débitos > R$ 10.000
  
  IF NEW.bad_debtor = true AND NEW.balance_due > 10000 THEN
    NEW.patient_score := 'BLACKLIST';
  ELSIF NEW.bad_debtor = true OR NEW.balance_due > 5000 THEN
    NEW.patient_score := 'RISK';
  ELSIF NEW.total_approved > 50000 AND NEW.balance_due = 0 THEN
    NEW.patient_score := 'DIAMOND';
  ELSIF NEW.total_approved > 20000 AND NEW.balance_due < 1000 THEN
    NEW.patient_score := 'GOLD';
  ELSE
    NEW.patient_score := 'STANDARD';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_update_patient_score
BEFORE INSERT OR UPDATE OF total_approved, balance_due, bad_debtor ON public.patients
FOR EACH ROW
EXECUTE FUNCTION auto_update_patient_score();

-- =====================================================
-- 7. VIEW: PACIENTES COM ALERTAS CRÍTICOS
-- =====================================================

CREATE OR REPLACE VIEW patients_with_critical_alerts AS
SELECT 
  p.id as patient_id,
  p.name as patient_name,
  p.phone,
  p.patient_score,
  COUNT(ma.id) as critical_alerts_count,
  ARRAY_AGG(ma.description) as alert_descriptions,
  ARRAY_AGG(ma.severity) as alert_severities
FROM public.patients p
JOIN public.medical_alerts ma ON p.id = ma.patient_id
WHERE ma.is_active = true AND ma.is_critical = true
GROUP BY p.id, p.name, p.phone, p.patient_score;

COMMENT ON VIEW patients_with_critical_alerts IS 'Pacientes com alertas críticos ativos - Para dashboard de segurança';

-- =====================================================
-- 8. VIEW: PROGRAMA DE INDICAÇÃO (REFERRAL PROGRAM)
-- =====================================================

CREATE OR REPLACE VIEW patient_referral_stats AS
SELECT 
  p.id as referrer_patient_id,
  p.name as referrer_name,
  COUNT(referred.id) as total_referrals,
  SUM(referred.total_approved) as total_revenue_from_referrals,
  ARRAY_AGG(referred.name) as referred_patients
FROM public.patients p
LEFT JOIN public.patients referred ON p.id = referred.indication_patient_id
GROUP BY p.id, p.name
HAVING COUNT(referred.id) > 0
ORDER BY total_referrals DESC;

COMMENT ON VIEW patient_referral_stats IS 'Estatísticas de programa de indicação - Quem mais indica pacientes';

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
