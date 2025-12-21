-- 0. Limpeza de Views Antigas (Evitar conflitos de tipo)
DROP VIEW IF EXISTS view_radar_360;
DROP VIEW IF EXISTS view_radar_financeiro;
DROP VIEW IF EXISTS view_radar_comercial;
DROP VIEW IF EXISTS view_radar_producao;
DROP VIEW IF EXISTS view_radar_operacional;

-- 1. Cria colunas de valor na tabela de produção (Treatment Items)
ALTER TABLE public.treatment_items 
ADD COLUMN IF NOT EXISTS unit_value numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_value numeric DEFAULT 0;

-- 2. Migração de Dados: Copia os valores dos orçamentos para os itens de tratamento já existentes
-- Tenta fazer o match pelo ID do orçamento e nome do procedimento
UPDATE public.treatment_items ti
SET 
    total_value = COALESCE(bi.total_value, 0),
    unit_value = COALESCE(bi.unit_value, 0)
FROM public.budget_items bi 
WHERE ti.budget_id = bi.budget_id 
-- Verifica correspondência de nomes usando a coluna correta 'procedure_name' verificada no código
AND ti.procedure_name = bi.procedure_name;

-- 3. Atualiza a View de Produção para usar a nova coluna de alta performance
CREATE OR REPLACE VIEW view_radar_producao AS
SELECT 
    ti.id AS production_id,
    ti.procedure_name,
    ti.status::text AS status_clinico,
    ti.execution_date AS data_referencia,
    p.name AS profissional,
    ti.total_value AS montante_bruto, -- Agora busca direto da tabela, performático e histórico
    pat.name AS paciente,
    pat.balance_due,
    CASE 
        WHEN ti.status::text IN ('CONCLUDED', 'COMPLETED', 'Concluído') AND pat.balance_due <= 0 THEN 'Executado e Pago'
        WHEN ti.status::text IN ('CONCLUDED', 'COMPLETED', 'Concluído') AND pat.balance_due > 0 THEN 'Executado e Inadimplente'
        ELSE 'Em Andamento'
    END AS situacao_financeira
FROM public.treatment_items ti
JOIN public.patients pat ON ti.patient_id = pat.id
LEFT JOIN public.professionals p ON ti.doctor_id = p.id;

-- 4. VIEW FINANCEIRA (Dependência da 360)
CREATE OR REPLACE VIEW view_radar_financeiro AS
SELECT 
    t.id AS transaction_id,
    t.description,
    t.amount,
    t.type::text AS transaction_type, -- Cast for Union compatibility
    t.date AS data_referencia,
    t.category AS unidade_negocio,
    COALESCE(ec.is_variable_cost, false) as custo_variavel
FROM public.transactions t
LEFT JOIN public.expense_category ec ON t.category = ec.name;

-- 5. VIEW COMERCIAL (Dependência da 360)
CREATE OR REPLACE VIEW view_radar_comercial AS
SELECT 
    b.id AS budget_id,
    b.created_at AS data_referencia,
    b.status::text AS kpi_status,
    b.total_value AS montante,
    pat.name AS paciente,
    ls.name AS origem,
    b.rejection_reason AS motivo_perda
FROM public.budgets b
JOIN public.patients pat ON b.patient_id = pat.id
LEFT JOIN public.lead_source ls ON pat.acquisition_source_id = ls.id;

-- 6. VIEW OPERACIONAL (Dependência da 360)
CREATE OR REPLACE VIEW view_radar_operacional AS
SELECT 
    id::text AS appointment_id,
    date AS data_referencia,
    'Operacional' AS departamento,
    ('Agendamento: ' || status)::text AS descricao,
    0 AS valor,
    status::text AS status
FROM public.appointments;

-- 7. Recria a View 360 para garantir que ela pegue a definição atualizada da view de produção
CREATE OR REPLACE VIEW view_radar_360 AS
SELECT data_referencia, 'Comercial' AS departamento, 'Orçamento: ' || paciente AS descricao, montante AS valor, kpi_status AS status FROM view_radar_comercial
UNION ALL
SELECT data_referencia, 'Clínico', procedure_name || ' (' || paciente || ')', montante_bruto, situacao_financeira FROM view_radar_producao
UNION ALL
SELECT data_referencia, 'Financeiro', description, amount, transaction_type FROM view_radar_financeiro
UNION ALL
SELECT data_referencia, 'Operacional', descricao, valor, status FROM view_radar_operacional;
