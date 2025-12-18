-- ============================================================
-- Financial Fort Knox - Migration Script
-- Fase 1: Database Schema
-- Data: 18/12/2025
-- ============================================================

-- ============================================================
-- 1. CRIAR TABELA: clinic_financial_settings
-- Configurações de segurança financeira por clínica
-- ============================================================

CREATE TABLE IF NOT EXISTS public.clinic_financial_settings (
  clinic_id UUID PRIMARY KEY REFERENCES public.clinics(id) ON DELETE CASCADE,
  
  -- Regras de Abertura/Fechamento
  force_cash_opening BOOLEAN DEFAULT TRUE,      -- Obriga abrir caixa ao logar?
  force_daily_closing BOOLEAN DEFAULT TRUE,     -- Obriga fechar para abrir outro?
  allow_negative_balance BOOLEAN DEFAULT FALSE, -- Permite caixa negativo?
  blind_closing BOOLEAN DEFAULT TRUE,           -- Fechamento cego (não mostra saldo)?
  
  -- Valores Padrão
  default_change_fund NUMERIC(10,2) DEFAULT 100.00, -- Fundo de troco padrão
  
  -- Limites de Alerta
  max_difference_without_approval NUMERIC(10,2) DEFAULT 50.00, -- Quebra > R$50 = Auditoria
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar registro padrão para clínicas existentes
INSERT INTO public.clinic_financial_settings (clinic_id)
SELECT id FROM public.clinics
ON CONFLICT (clinic_id) DO NOTHING;

-- Comentário
COMMENT ON TABLE public.clinic_financial_settings IS 'Configurações de segurança financeira - Fort Knox';

-- ============================================================
-- 2. ALTERAR TABELA: cash_registers
-- Adicionar colunas para fechamento cego e auditoria
-- ============================================================

-- Adicionar novas colunas
ALTER TABLE public.cash_registers
ADD COLUMN IF NOT EXISTS declared_balance NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS difference_amount NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS difference_reason TEXT;

-- Adicionar constraint para status
ALTER TABLE public.cash_registers
DROP CONSTRAINT IF EXISTS cash_registers_status_check;

ALTER TABLE public.cash_registers
ADD CONSTRAINT cash_registers_status_check 
CHECK (status IN ('OPEN', 'CLOSED', 'AUDIT_PENDING'));

-- Atualizar comentário
COMMENT ON TABLE public.cash_registers IS 'Sessões de caixa - controla abertura/fechamento e movimentações financeiras (Fort Knox)';
COMMENT ON COLUMN public.cash_registers.declared_balance IS 'Valor declarado pelo usuário no fechamento (fechamento cego)';
COMMENT ON COLUMN public.cash_registers.difference_amount IS 'Diferença entre calculado e declarado (quebra de caixa)';
COMMENT ON COLUMN public.cash_registers.difference_reason IS 'Justificativa da diferença/quebra de caixa';

-- ============================================================
-- 3. CRIAR TRIGGER: Segurança Financeira
-- Impede transações sem caixa aberto
-- ============================================================

-- Função que valida sessão aberta
CREATE OR REPLACE FUNCTION check_open_session_before_transaction()
RETURNS TRIGGER AS $$
DECLARE
    open_session_id UUID;
    settings RECORD;
BEGIN
    -- 1. Buscar configurações da clínica
    SELECT * INTO settings
    FROM clinic_financial_settings
    WHERE clinic_id = NEW.clinic_id;
    
    -- 2. Se não forçar abertura, libera (modo legado/compatibilidade)
    IF settings IS NULL OR settings.force_cash_opening = FALSE THEN
        RETURN NEW;
    END IF;
    
    -- 3. Buscar sessão ABERTA do usuário atual
    SELECT id INTO open_session_id
    FROM cash_registers
    WHERE user_id = auth.uid() 
      AND clinic_id = NEW.clinic_id
      AND status = 'OPEN'
      AND closed_at IS NULL
    ORDER BY opened_at DESC
    LIMIT 1;

    -- 4. Se não tiver sessão aberta, BLOQUEIA
    IF open_session_id IS NULL THEN
        RAISE EXCEPTION 'BLOQUEIO FINANCEIRO: Você precisa abrir o caixa antes de realizar movimentações financeiras. Vá em Financeiro > Abrir Caixa.';
    END IF;

    -- 5. Vincula transação à sessão automaticamente
    NEW.cash_register_id := open_session_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger
DROP TRIGGER IF EXISTS trg_financial_security ON public.transactions;
CREATE TRIGGER trg_financial_security
BEFORE INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION check_open_session_before_transaction();

COMMENT ON FUNCTION check_open_session_before_transaction() IS 'Fort Knox: Valida sessão de caixa aberta antes de permitir transações';

-- ============================================================
-- 4. CRIAR VIEW: user_active_session
-- Mostra sessão ativa do usuário em tempo real
-- ============================================================

CREATE OR REPLACE VIEW user_active_session AS
SELECT 
  cr.id as session_id,
  cr.user_id,
  cr.clinic_id,
  cr.opened_at,
  cr.opening_balance,
  cr.status,
  u.name as user_name,
  u.email as user_email,
  -- Calcular saldo atual em tempo real
  cr.opening_balance + COALESCE(
    (SELECT SUM(CASE WHEN type = 'INCOME' THEN amount ELSE -amount END)
     FROM transactions
     WHERE cash_register_id = cr.id),
    0
  ) as current_balance,
  -- Contar transações
  (SELECT COUNT(*) FROM transactions WHERE cash_register_id = cr.id) as transaction_count,
  -- Tempo aberto (em horas)
  EXTRACT(EPOCH FROM (NOW() - cr.opened_at))/3600 as hours_open
FROM cash_registers cr
JOIN users u ON cr.user_id = u.id
WHERE cr.status = 'OPEN'
  AND cr.closed_at IS NULL;

COMMENT ON VIEW user_active_session IS 'Fort Knox: Sessões de caixa ativas com saldo em tempo real';

-- ============================================================
-- 5. CRIAR VIEW: cash_closing_history
-- Histórico de fechamentos com análise de quebras
-- ============================================================

CREATE OR REPLACE VIEW cash_closing_history AS
SELECT 
  cr.id,
  cr.clinic_id,
  c.name as clinic_name,
  u.name as user_name,
  u.email as user_email,
  cr.opened_at,
  cr.closed_at,
  cr.opening_balance,
  cr.calculated_balance,
  cr.declared_balance,
  cr.difference_amount,
  cr.difference_reason,
  cr.status,
  -- Duração da sessão (em horas)
  EXTRACT(EPOCH FROM (cr.closed_at - cr.opened_at))/3600 as hours_open,
  -- Total de transações
  (SELECT COUNT(*) FROM transactions WHERE cash_register_id = cr.id) as total_transactions,
  -- Total de entradas
  (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE cash_register_id = cr.id AND type = 'INCOME') as total_income,
  -- Total de saídas
  (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE cash_register_id = cr.id AND type = 'EXPENSE') as total_expense,
  -- Classificação da diferença
  CASE 
    WHEN ABS(COALESCE(cr.difference_amount, 0)) = 0 THEN 'PERFEITO'
    WHEN ABS(COALESCE(cr.difference_amount, 0)) < 5 THEN 'ACEITÁVEL'
    WHEN ABS(COALESCE(cr.difference_amount, 0)) < 50 THEN 'ATENÇÃO'
    ELSE 'CRÍTICO'
  END as difference_classification
FROM cash_registers cr
JOIN users u ON cr.user_id = u.id
JOIN clinics c ON cr.clinic_id = c.id
WHERE cr.status IN ('CLOSED', 'AUDIT_PENDING')
ORDER BY cr.closed_at DESC;

COMMENT ON VIEW cash_closing_history IS 'Fort Knox: Histórico de fechamentos de caixa com análise de quebras';

-- ============================================================
-- 6. CRIAR ÍNDICE: Performance para sessões ativas
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_cash_registers_active_session 
ON cash_registers(user_id, clinic_id, status) 
WHERE status = 'OPEN';

COMMENT ON INDEX idx_cash_registers_active_session IS 'Fort Knox: Otimiza busca de sessões ativas';

-- ============================================================
-- 7. MIGRAÇÃO DE DADOS LEGADOS
-- Criar sessão legado para transações antigas
-- ============================================================

-- Criar sessão legado para cada clínica (se houver transações sem session)
DO $$
DECLARE
    clinic_record RECORD;
    legacy_session_id UUID;
BEGIN
    FOR clinic_record IN SELECT id, name FROM clinics LOOP
        -- Verificar se há transações sem cash_register_id
        IF EXISTS (
            SELECT 1 FROM transactions 
            WHERE clinic_id = clinic_record.id 
              AND cash_register_id IS NULL
        ) THEN
            -- Criar sessão legado
            INSERT INTO cash_registers (
                clinic_id, 
                user_id, 
                opened_at, 
                closed_at, 
                opening_balance, 
                calculated_balance, 
                status, 
                observations
            )
            VALUES (
                clinic_record.id,
                (SELECT id FROM users WHERE clinic_id = clinic_record.id LIMIT 1),
                '2024-01-01 00:00:00',
                '2024-12-31 23:59:59',
                0,
                0,
                'CLOSED',
                'Sessão Legado - Dados Anteriores ao Fort Knox - Criada automaticamente em ' || NOW()
            )
            RETURNING id INTO legacy_session_id;
            
            -- Vincular transações antigas
            UPDATE transactions
            SET cash_register_id = legacy_session_id
            WHERE clinic_id = clinic_record.id 
              AND cash_register_id IS NULL;
              
            RAISE NOTICE 'Sessão legado criada para clínica: % (% transações vinculadas)', 
                clinic_record.name, 
                (SELECT COUNT(*) FROM transactions WHERE cash_register_id = legacy_session_id);
        END IF;
    END LOOP;
END $$;

-- ============================================================
-- 8. HABILITAR RLS nas novas tabelas
-- ============================================================

ALTER TABLE public.clinic_financial_settings ENABLE ROW LEVEL SECURITY;

-- Política RLS para clinic_financial_settings
DROP POLICY IF EXISTS "clinic_isolation" ON public.clinic_financial_settings;
CREATE POLICY "clinic_isolation" ON public.clinic_financial_settings 
  FOR ALL USING (clinic_id = (SELECT clinic_id FROM public.users WHERE id = auth.uid()));

-- ============================================================
-- FIM DA MIGRAÇÃO - FASE 1
-- ============================================================

-- Verificação final
SELECT 
    'clinic_financial_settings' as tabela,
    COUNT(*) as registros
FROM clinic_financial_settings
UNION ALL
SELECT 
    'cash_registers (com novas colunas)' as tabela,
    COUNT(*) as registros
FROM cash_registers
WHERE declared_balance IS NOT NULL OR difference_amount IS NOT NULL
UNION ALL
SELECT 
    'transactions (vinculadas a sessões)' as tabela,
    COUNT(*) as registros
FROM transactions
WHERE cash_register_id IS NOT NULL;
