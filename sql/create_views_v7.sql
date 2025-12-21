-- 1. VIEW DE PRODUÇÃO (Lógica Elite + Correção de ENUM)
CREATE OR REPLACE VIEW view_radar_producao AS
SELECT 
    ti.id AS production_id,
    ti.procedure_name,
    ti.status::text AS status_clinico, -- Correção do erro 22P02 (ENUM)
    ti.execution_date AS data_referencia,
    p.name AS profissional,
    ti.total_value AS montante_bruto,
    pat.name AS paciente,
    pat.balance_due,
    -- Cruzamento de Adimplência que o senhor pediu
    CASE 
        WHEN ti.status::text IN ('CONCLUDED', 'COMPLETED', 'Concluído') AND pat.balance_due <= 0 THEN 'Executado e Pago'
        WHEN ti.status::text IN ('CONCLUDED', 'COMPLETED', 'Concluído') AND pat.balance_due > 0 THEN 'Executado e Inadimplente'
        ELSE 'Em Andamento'
    END AS situacao_financeira
FROM public.treatment_items ti
JOIN public.patients pat ON ti.patient_id = pat.id
LEFT JOIN public.professionals p ON ti.doctor_id = p.id;

-- 2. VIEW FINANCEIRA (Foco em Lucro Real)
CREATE OR REPLACE VIEW view_radar_financeiro AS
SELECT 
    t.id AS transaction_id,
    t.description,
    t.amount,
    t.type AS transaction_type,
    t.date AS data_referencia,
    t.category AS unidade_negocio,
    COALESCE(ec.is_variable_cost, false) as custo_variavel
FROM public.transactions t
LEFT JOIN public.expense_category ec ON t.category = ec.name;

-- 3. VIEW COMERCIAL (Funil High-Ticket)
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

-- 4. VISÃO EXECUTIVA 360 (Timeline Unificada sem erros de tipo)
CREATE OR REPLACE VIEW view_radar_360 AS
SELECT data_referencia, 'Comercial' AS departamento, 'Orçamento: ' || paciente AS descricao, montante AS valor, kpi_status AS status FROM view_radar_comercial
UNION ALL
SELECT data_referencia, 'Clínico', procedure_name || ' (' || paciente || ')', montante_bruto, situacao_financeira FROM view_radar_producao
UNION ALL
SELECT data_referencia, 'Financeiro', description, amount, transaction_type FROM view_radar_financeiro;