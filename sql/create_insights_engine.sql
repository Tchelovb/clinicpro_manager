-- Tabela para armazenar os Insights gerados pelo BOS
CREATE TABLE ai_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW')),
    category TEXT CHECK (category IN ('Financeiro', 'Comercial', 'Produção', 'Operacional', 'Marketing')),
    action_label TEXT,
    action_link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_read BOOLEAN DEFAULT FALSE,
    clinic_id UUID -- Para multi-tenant
);

-- Função (Engine) para gerar insights automáticos baseados nas VIEWs
CREATE OR REPLACE FUNCTION generate_bos_insights() RETURNS void AS $$
BEGIN
    -- 1. LIMPEZA: Remove insights antigos não lidos para evitar poluição (opcional, ou manter histórico)
    DELETE FROM ai_insights WHERE created_at < NOW() - INTERVAL '7 days' AND is_read = TRUE;

    -- 2. INSIGHT DE INADIMPLÊNCIA (ALERTA VERMELHO / HIGH)
    -- Verifica view_production_adherence para identificar 'Executado e Inadimplente'
    INSERT INTO ai_insights (title, description, priority, category, action_label, action_link)
    SELECT 
        'R$ ' || p.balance_due || ' em Risco - ' || p.procedure_name,
        p.patient_name || ' concluiu o procedimento em ' || TO_CHAR(p.execution_date, 'DD/MM') || ' mas possui saldo devedor.',
        'HIGH',
        'Financeiro',
        'Cobrar Agora',
        '/patients/' || p.patient_id || '/financial'
    FROM view_production_adherence p
    WHERE p.financial_context_status = 'Executado e Inadimplente'
    AND NOT EXISTS (
        SELECT 1 FROM ai_insights 
        WHERE description LIKE '%' || p.patient_name || '%' AND category = 'Financeiro' AND is_read = FALSE
    );

    -- 3. INSIGHT DE FOLLOW-UP (HIGH-TICKET ESFRIANDO / MEDIUM)
    -- Verifica view_commercial_pipeline para orçamentos > 5000 parados há > 3 dias
    INSERT INTO ai_insights (title, description, priority, category, action_label, action_link)
    SELECT 
        'Oportunidade Quente Parada',
        'Orçamento de R$ ' || b.total_value || ' para ' || b.patient_name || ' está sem resposta há ' || TRUNC(EXTRACT(EPOCH FROM (NOW() - b.created_at))/86400) || ' dias.',
        'MEDIUM',
        'Comercial',
        'Enviar Follow-up',
        '/budgets/' || b.budget_id
    FROM view_commercial_pipeline b
    WHERE b.total_value >= 5000 
    AND b.status IN ('Em Análise', 'Enviado', 'Pendente') -- Ajustar status conforme sistema real
    AND b.created_at < NOW() - INTERVAL '3 days'
    AND NOT EXISTS (
        SELECT 1 FROM ai_insights 
        WHERE description LIKE '%' || b.patient_name || '%' AND category = 'Comercial' AND is_read = FALSE
    );
    
    -- 4. INSIGHT DE RISCO DE NO-SHOW (OPERACIONAL / MEDIUM)
    -- (Lógica simplificada: se a View de Agenda existisse com histórico, usaria aqui. 
    --  Placeholder para lógica futura de No-Show)
    
END;
$$ LANGUAGE plpgsql;

-- O Cron Job seria configurado no Supabase Dashboard (pg_cron) para chamar essa função:
-- SELECT cron.schedule('0 8 * * *', 'SELECT generate_bos_insights()');
