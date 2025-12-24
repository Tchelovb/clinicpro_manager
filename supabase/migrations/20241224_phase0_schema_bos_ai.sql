-- ============================================
-- MIGRATION 0: Schema Adequação para BOS AI
-- Fase 0: Engenharia Reversa e Adequação
-- ============================================
-- Objetivo: Preparar o banco de dados para suportar:
-- 1. Inteligência Artificial (sentiment analysis)
-- 2. Análise de temperatura de leads
-- 3. Protocolo S16 (margem mínima)
-- 4. Histórico de conversas WhatsApp
-- 5. Flags High-Ticket dinâmicos
-- ============================================

-- ============================================
-- 1. TABELA LEADS: Cérebro do Agente Sniper
-- ============================================
-- Adiciona campos para o agente entender o 'humor' e temperatura do lead

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS ai_sentiment_score NUMERIC CHECK (ai_sentiment_score BETWEEN -1 AND 1),
ADD COLUMN IF NOT EXISTS ai_summary TEXT,
ADD COLUMN IF NOT EXISTS lead_temperature TEXT DEFAULT 'COLD' CHECK (lead_temperature IN ('COLD', 'WARM', 'HOT')),
ADD COLUMN IF NOT EXISTS next_follow_up_suggestion TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_agent_interaction TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN leads.ai_sentiment_score IS 'Score de sentimento da IA: -1 (Raiva) a 1 (Amor)';
COMMENT ON COLUMN leads.ai_summary IS 'Resumo da conversa gerado pela IA';
COMMENT ON COLUMN leads.lead_temperature IS 'Temperatura do lead: COLD, WARM, HOT';
COMMENT ON COLUMN leads.next_follow_up_suggestion IS 'Próximo follow-up sugerido pela IA';
COMMENT ON COLUMN leads.last_agent_interaction IS 'Última interação com agente autônomo';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_leads_temperature ON leads(lead_temperature);
CREATE INDEX IF NOT EXISTS idx_leads_next_followup ON leads(next_follow_up_suggestion) WHERE next_follow_up_suggestion IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_tags ON leads USING gin(tags);

-- ============================================
-- 2. TABELA PROCEDURE: Definição High Ticket
-- ============================================
-- Evita hardcoding de nomes de procedimentos no código

ALTER TABLE procedure
ADD COLUMN IF NOT EXISTS is_high_ticket BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS recovery_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS requires_lab BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS avg_lab_cost NUMERIC DEFAULT 0;

COMMENT ON COLUMN procedure.is_high_ticket IS 'Flag dinâmica: procedimento é High-Ticket?';
COMMENT ON COLUMN procedure.recovery_days IS 'Dias de recuperação (para Agente Caretaker)';
COMMENT ON COLUMN procedure.requires_lab IS 'Requer laboratório?';
COMMENT ON COLUMN procedure.avg_lab_cost IS 'Custo médio de laboratório';

-- Marcar procedimentos High-Ticket existentes
UPDATE procedure SET is_high_ticket = TRUE
WHERE name IN (
  'Cervicoplastia',
  'Lip Lifting',
  'Lifting Temporal Smart',
  'Blefaroplastia',
  'Implantes',
  'Protocolo',
  'Alinhadores',
  'Lipoescultura Cervicofacial',
  'Rinoplastia',
  'Mentoplastia'
);

-- Definir dias de recuperação para procedimentos cirúrgicos
UPDATE procedure SET recovery_days = 7 WHERE name IN ('Cervicoplastia', 'Blefaroplastia');
UPDATE procedure SET recovery_days = 14 WHERE name IN ('Rinoplastia', 'Lipoescultura Cervicofacial');
UPDATE procedure SET recovery_days = 3 WHERE name IN ('Lip Lifting', 'Lifting Temporal Smart');

-- Índice para busca rápida de High-Ticket
CREATE INDEX IF NOT EXISTS idx_procedure_high_ticket ON procedure(is_high_ticket) WHERE is_high_ticket = TRUE;

-- ============================================
-- 3. TABELA BUDGETS: Protocolo S16
-- ============================================
-- Campos para travar margem e registrar quem desbloqueou com PIN

ALTER TABLE budgets
ADD COLUMN IF NOT EXISTS margin_lock_status TEXT DEFAULT 'UNLOCKED' CHECK (margin_lock_status IN ('LOCKED', 'UNLOCKED', 'OVERRIDDEN')),
ADD COLUMN IF NOT EXISTS calculated_margin_percent NUMERIC,
ADD COLUMN IF NOT EXISTS pin_override_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS pin_override_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS pin_override_reason TEXT;

COMMENT ON COLUMN budgets.margin_lock_status IS 'Status do bloqueio de margem (Protocolo S16)';
COMMENT ON COLUMN budgets.calculated_margin_percent IS 'Margem calculada automaticamente';
COMMENT ON COLUMN budgets.pin_override_by IS 'Usuário que desbloqueou com PIN';
COMMENT ON COLUMN budgets.pin_override_at IS 'Timestamp do desbloqueio';
COMMENT ON COLUMN budgets.pin_override_reason IS 'Justificativa do desbloqueio';

-- Índices
CREATE INDEX IF NOT EXISTS idx_budgets_margin_lock ON budgets(margin_lock_status);
CREATE INDEX IF NOT EXISTS idx_budgets_margin_percent ON budgets(calculated_margin_percent);

-- ============================================
-- 4. TABELA FINANCIAL_INSTALLMENTS: Memória do Guardian
-- ============================================
-- Evita que o agente cobre quem já foi cobrado hoje

ALTER TABLE financial_installments
ADD COLUMN IF NOT EXISTS last_collection_attempt_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS collection_agent_status TEXT DEFAULT 'PENDING' CHECK (collection_agent_status IN ('PENDING', 'CONTACTED', 'NEGOTIATING', 'FAILED', 'RESOLVED')),
ADD COLUMN IF NOT EXISTS collection_attempts_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_collection_message TEXT;

COMMENT ON COLUMN financial_installments.last_collection_attempt_at IS 'Última tentativa de cobrança do Guardian';
COMMENT ON COLUMN financial_installments.collection_agent_status IS 'Status da cobrança pelo agente';
COMMENT ON COLUMN financial_installments.collection_attempts_count IS 'Número de tentativas de cobrança';

-- Índice para evitar cobranças duplicadas
CREATE INDEX IF NOT EXISTS idx_installments_collection ON financial_installments(status, last_collection_attempt_at);
CREATE INDEX IF NOT EXISTS idx_installments_overdue ON financial_installments(due_date, status) WHERE status = 'PENDING';

-- ============================================
-- 5. TABELA TREATMENT_ITEMS: Caretaker Tracking
-- ============================================
-- Para o Caretaker saber quando fazer follow-up pós-op

ALTER TABLE treatment_items
ADD COLUMN IF NOT EXISTS completion_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS post_op_followup_status TEXT DEFAULT 'PENDING' CHECK (post_op_followup_status IN ('PENDING', 'CONTACTED_24H', 'CONTACTED_7D', 'CONTACTED_30D', 'COMPLETED')),
ADD COLUMN IF NOT EXISTS last_caretaker_contact TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS patient_satisfaction_score INTEGER CHECK (patient_satisfaction_score BETWEEN 1 AND 10);

COMMENT ON COLUMN treatment_items.completion_date IS 'Data de conclusão do procedimento';
COMMENT ON COLUMN treatment_items.post_op_followup_status IS 'Status do follow-up pós-operatório';
COMMENT ON COLUMN treatment_items.patient_satisfaction_score IS 'NPS do paciente (1-10)';

-- Índice para buscar procedimentos que precisam de follow-up
CREATE INDEX IF NOT EXISTS idx_treatment_followup ON treatment_items(status, completion_date, post_op_followup_status);

-- ============================================
-- 6. NOVA TABELA: WhatsApp Chat History
-- ============================================
-- Diferente dos logs de sistema, aqui guardamos o DIÁLOGO real para contexto da IA

CREATE TABLE IF NOT EXISTS whatsapp_chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id),
    lead_id UUID REFERENCES leads(id),
    patient_id UUID REFERENCES patients(id),
    agent_name TEXT CHECK (agent_name IN ('sniper', 'guardian', 'caretaker', 'human')),
    message_content TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('INBOUND', 'OUTBOUND')),
    sentiment_score NUMERIC CHECK (sentiment_score BETWEEN -1 AND 1),
    message_type TEXT DEFAULT 'TEXT' CHECK (message_type IN ('TEXT', 'IMAGE', 'AUDIO', 'VIDEO', 'DOCUMENT')),
    media_url TEXT,
    waha_message_id TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE whatsapp_chat_history IS 'Histórico completo de conversas WhatsApp para contexto da IA';
COMMENT ON COLUMN whatsapp_chat_history.agent_name IS 'Agente que enviou/recebeu (sniper, guardian, caretaker, human)';
COMMENT ON COLUMN whatsapp_chat_history.direction IS 'INBOUND (recebido) ou OUTBOUND (enviado)';
COMMENT ON COLUMN whatsapp_chat_history.sentiment_score IS 'Score de sentimento da mensagem (-1 a 1)';
COMMENT ON COLUMN whatsapp_chat_history.waha_message_id IS 'ID da mensagem no Waha/Twilio';

-- Índices para busca rápida de contexto
CREATE INDEX idx_whatsapp_history_lead ON whatsapp_chat_history(lead_id, created_at DESC);
CREATE INDEX idx_whatsapp_history_patient ON whatsapp_chat_history(patient_id, created_at DESC);
CREATE INDEX idx_whatsapp_history_agent ON whatsapp_chat_history(agent_name, created_at DESC);
CREATE INDEX idx_whatsapp_history_clinic ON whatsapp_chat_history(clinic_id, created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE whatsapp_chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view chat history for their clinic"
  ON whatsapp_chat_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.clinic_id = whatsapp_chat_history.clinic_id
    )
  );

CREATE POLICY "System can insert chat history"
  ON whatsapp_chat_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.clinic_id = whatsapp_chat_history.clinic_id
    )
  );

-- ============================================
-- 7. NOVA TABELA: Agent Logs (Sistema)
-- ============================================
-- Logs técnicos de execução dos agentes (diferente do chat)

CREATE TABLE IF NOT EXISTS agent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  agent_name TEXT NOT NULL CHECK (agent_name IN ('sniper', 'guardian', 'caretaker')),
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('LEAD', 'PATIENT', 'INSTALLMENT', 'TREATMENT')),
  entity_id UUID NOT NULL,
  action_taken TEXT NOT NULL,
  message_sent TEXT,
  response_received TEXT,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED')),
  error_message TEXT,
  execution_time_ms INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE agent_logs IS 'Logs técnicos de execução dos agentes autônomos';
COMMENT ON COLUMN agent_logs.execution_time_ms IS 'Tempo de execução em milissegundos';

-- Índices
CREATE INDEX idx_agent_logs_agent_name ON agent_logs(agent_name, created_at DESC);
CREATE INDEX idx_agent_logs_entity ON agent_logs(entity_type, entity_id);
CREATE INDEX idx_agent_logs_status ON agent_logs(status) WHERE status IN ('PENDING', 'FAILED');
CREATE INDEX idx_agent_logs_clinic ON agent_logs(clinic_id, created_at DESC);

-- RLS
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view agent logs for their clinic"
  ON agent_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.clinic_id = agent_logs.clinic_id
    )
  );

-- ============================================
-- 8. FUNÇÃO: Calcular Margem de Orçamento
-- ============================================
-- Função para calcular margem automaticamente (Protocolo S16)

CREATE OR REPLACE FUNCTION calculate_budget_margin(
  p_budget_id UUID
) RETURNS NUMERIC AS $$
DECLARE
  v_total_price NUMERIC;
  v_total_cost NUMERIC;
  v_margin_percent NUMERIC;
  v_clinic_tax_rate NUMERIC;
  v_clinic_card_fee NUMERIC;
BEGIN
  -- Buscar configurações da clínica
  SELECT 
    COALESCE(c.tax_rate_percent, 0),
    COALESCE(c.avg_card_fee, 2.5)
  INTO v_clinic_tax_rate, v_clinic_card_fee
  FROM budgets b
  JOIN clinics c ON c.id = b.clinic_id
  WHERE b.id = p_budget_id;
  
  -- Calcular preço total
  SELECT COALESCE(final_value, 0)
  INTO v_total_price
  FROM budgets
  WHERE id = p_budget_id;
  
  -- Calcular custo total (soma dos custos dos procedimentos)
  SELECT COALESCE(SUM(
    COALESCE(pc.total_cost, 0) * bi.quantity
  ), 0)
  INTO v_total_cost
  FROM budget_items bi
  LEFT JOIN procedure p ON p.id = bi.procedure_id
  LEFT JOIN procedure_costs pc ON pc.procedure_id = p.id
  WHERE bi.budget_id = p_budget_id;
  
  -- Calcular margem: (Preço - Custo - Impostos - Taxas) / Preço * 100
  IF v_total_price > 0 THEN
    v_margin_percent := (
      (v_total_price - v_total_cost - (v_total_price * v_clinic_tax_rate / 100) - (v_total_price * v_clinic_card_fee / 100))
      / v_total_price
    ) * 100;
  ELSE
    v_margin_percent := 0;
  END IF;
  
  -- Atualizar budget
  UPDATE budgets
  SET calculated_margin_percent = v_margin_percent
  WHERE id = p_budget_id;
  
  RETURN v_margin_percent;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION calculate_budget_margin IS 'Calcula margem de orçamento considerando custos, impostos e taxas';

-- ============================================
-- 9. TRIGGER: Auto-calcular margem ao criar/atualizar orçamento
-- ============================================

CREATE OR REPLACE FUNCTION trigger_calculate_budget_margin()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcular margem
  PERFORM calculate_budget_margin(NEW.id);
  
  -- Verificar se precisa bloquear (Protocolo S16)
  IF NEW.calculated_margin_percent < 20 THEN
    NEW.margin_lock_status := 'LOCKED';
  ELSE
    NEW.margin_lock_status := 'UNLOCKED';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_budget_margin_check ON budgets;
CREATE TRIGGER trigger_budget_margin_check
  AFTER INSERT OR UPDATE OF final_value, discount
  ON budgets
  FOR EACH ROW
  EXECUTE FUNCTION trigger_calculate_budget_margin();

-- ============================================
-- 10. CONFIGURAÇÕES DO SISTEMA
-- ============================================

-- Criar tabela system_settings se não existir
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE system_settings IS 'Configurações globais do sistema';

-- Adicionar configurações para agentes
INSERT INTO system_settings (key, value, description) VALUES
  ('squad_bos_enabled', 'false', 'Squad BOS (agentes autônomos) ativo'),
  ('sniper_enabled', 'false', 'Agente Sniper ativo'),
  ('guardian_enabled', 'false', 'Agente Guardian ativo'),
  ('caretaker_enabled', 'false', 'Agente Caretaker ativo'),
  ('whatsapp_api_url', '', 'URL da API WhatsApp (Waha/Twilio)'),
  ('whatsapp_api_key', '', 'Chave de API WhatsApp'),
  ('openai_api_key', '', 'Chave de API OpenAI'),
  ('openai_model', 'gpt-4o', 'Modelo OpenAI a usar'),
  ('profit_guardian_min_margin', '20.0', 'Margem mínima Protocolo S16 (%)'),
  ('sniper_prompt_version', 'v1.0', 'Versão do prompt do Sniper'),
  ('guardian_tolerance_days', '3', 'Dias de tolerância antes de cobrar'),
  ('caretaker_followup_24h', 'true', 'Follow-up 24h pós-op ativo'),
  ('caretaker_followup_7d', 'true', 'Follow-up 7 dias pós-op ativo'),
  ('caretaker_followup_30d', 'true', 'Follow-up 30 dias pós-op ativo')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- FIM DA MIGRATION 0
-- ============================================

-- Verificação de integridade
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 0 concluída com sucesso!';
  RAISE NOTICE '📊 Tabelas atualizadas: leads, procedure, budgets, financial_installments, treatment_items';
  RAISE NOTICE '🆕 Novas tabelas: whatsapp_chat_history, agent_logs';
  RAISE NOTICE '⚙️ Funções criadas: calculate_budget_margin';
  RAISE NOTICE '🔧 Triggers criados: trigger_budget_margin_check';
  RAISE NOTICE '🚀 Sistema pronto para Squad BOS!';
END $$;
