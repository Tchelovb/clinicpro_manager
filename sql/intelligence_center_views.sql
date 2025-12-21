-- =====================================================
-- INTELLIGENCE CENTER 7.0 - ENHANCED SQL VIEWS
-- High-Density Cockpit - 6 Cards per Pilar
-- =====================================================

-- =====================================================
-- PILAR 1: MARKETING (ATRAÇÃO)
-- =====================================================

-- View: Marketing Metrics
CREATE OR REPLACE VIEW view_marketing_metrics AS
SELECT
    clinic_id,
    -- Total de Leads
    COUNT(*) as total_leads,
    
    -- Canais de Origem (JSON aggregation)
    json_object_agg(
        COALESCE(source, 'Não informado'),
        COUNT(*)
    ) FILTER (WHERE source IS NOT NULL) as origem_distribution,
    
    -- Taxa de Qualificação (leads com score > 70)
    ROUND(
        (COUNT(*) FILTER (WHERE lead_score > 70)::numeric / NULLIF(COUNT(*), 0)) * 100,
        2
    ) as taxa_qualificacao,
    
    -- Leads por prioridade
    COUNT(*) FILTER (WHERE priority = 'HIGH') as leads_alta_prioridade,
    COUNT(*) FILTER (WHERE priority = 'MEDIUM') as leads_media_prioridade,
    COUNT(*) FILTER (WHERE priority = 'LOW') as leads_baixa_prioridade
    
FROM public.leads
GROUP BY clinic_id;

-- View: Marketing Campaigns (if table exists)
CREATE OR REPLACE VIEW view_marketing_campaigns AS
SELECT
    clinic_id,
    SUM(budget) as investimento_total,
    COUNT(*) as total_campanhas,
    AVG(budget) as investimento_medio
FROM public.marketing_campaigns
WHERE status = 'ACTIVE'
GROUP BY clinic_id;

-- =====================================================
-- PILAR 2: VENDAS & RELACIONAMENTO
-- =====================================================

-- View: Sales Metrics Enhanced
CREATE OR REPLACE VIEW view_sales_metrics AS
SELECT
    b.clinic_id,
    
    -- Valor em Pipeline
    SUM(b.final_value) FILTER (WHERE b.status IN ('DRAFT', 'PENDING')) as valor_pipeline,
    
    -- Ticket Médio (apenas aprovados)
    ROUND(AVG(b.final_value) FILTER (WHERE b.status = 'APPROVED'), 2) as ticket_medio,
    
    -- Perda de Oportunidade
    SUM(b.final_value) FILTER (WHERE b.status IN ('REJECTED', 'LOST')) as perda_oportunidade,
    
    -- Contagem por status
    COUNT(*) FILTER (WHERE b.status = 'APPROVED') as orcamentos_aprovados,
    COUNT(*) FILTER (WHERE b.status = 'REJECTED') as orcamentos_rejeitados,
    COUNT(*) FILTER (WHERE b.status IN ('DRAFT', 'PENDING')) as orcamentos_pendentes,
    
    -- Taxa de Conversão
    ROUND(
        (COUNT(*) FILTER (WHERE b.status = 'APPROVED')::numeric / NULLIF(COUNT(*), 0)) * 100,
        2
    ) as taxa_conversao_orcamentos
    
FROM public.budgets b
GROUP BY b.clinic_id;

-- View: Customer Lifetime Value (LTV)
CREATE OR REPLACE VIEW view_customer_ltv AS
SELECT
    p.clinic_id,
    
    -- LTV Médio
    ROUND(AVG(p.total_paid), 2) as ltv_medio,
    
    -- Fidelização (pacientes com múltiplos orçamentos)
    COUNT(DISTINCT p.id) FILTER (
        WHERE (
            SELECT COUNT(*) 
            FROM public.budgets b 
            WHERE b.patient_id = p.id AND b.status = 'APPROVED'
        ) > 1
    ) as pacientes_recorrentes,
    
    -- Total de pacientes
    COUNT(DISTINCT p.id) as total_pacientes,
    
    -- Taxa de Fidelização
    ROUND(
        (COUNT(DISTINCT p.id) FILTER (
            WHERE (
                SELECT COUNT(*) 
                FROM public.budgets b 
                WHERE b.patient_id = p.id AND b.status = 'APPROVED'
            ) > 1
        )::numeric / NULLIF(COUNT(DISTINCT p.id), 0)) * 100,
        2
    ) as taxa_fidelizacao
    
FROM public.patients p
GROUP BY p.clinic_id;

-- =====================================================
-- PILAR 3: CLÍNICO (PRODUÇÃO)
-- =====================================================

-- View: Clinical Production Enhanced
CREATE OR REPLACE VIEW view_clinical_production_enhanced AS
SELECT
    ti.clinic_id,
    
    -- Faturamento por Doutor
    json_object_agg(
        COALESCE(u.name, 'Não atribuído'),
        json_build_object(
            'valor', SUM(ti.total_value),
            'procedimentos', COUNT(*),
            'media', ROUND(AVG(ti.total_value), 2)
        )
    ) FILTER (WHERE u.name IS NOT NULL) as faturamento_por_doutor,
    
    -- Procedimentos Realizados
    COUNT(*) FILTER (WHERE ti.status = 'CONCLUDED') as procedimentos_concluidos,
    COUNT(*) FILTER (WHERE ti.status = 'IN_PROGRESS') as procedimentos_em_andamento,
    COUNT(*) FILTER (WHERE ti.status = 'PENDING') as procedimentos_pendentes,
    
    -- Valor Total de Produção
    SUM(ti.total_value) FILTER (WHERE ti.status = 'CONCLUDED') as valor_producao_total,
    
    -- Margem Média (se houver custo cadastrado)
    ROUND(
        AVG(
            CASE 
                WHEN ti.cost > 0 THEN ((ti.total_value - ti.cost) / ti.total_value) * 100
                ELSE NULL
            END
        ),
        2
    ) as margem_media_procedimento
    
FROM public.treatment_items ti
LEFT JOIN public.users u ON ti.doctor_id = u.id
GROUP BY ti.clinic_id;

-- View: Procedimentos High-Ticket
CREATE OR REPLACE VIEW view_high_ticket_procedures AS
SELECT
    ti.clinic_id,
    ti.procedure_name,
    COUNT(*) as quantidade,
    SUM(ti.total_value) as valor_total,
    ROUND(AVG(ti.total_value), 2) as valor_medio
FROM public.treatment_items ti
WHERE ti.total_value > 5000 -- Considera high-ticket acima de R$ 5.000
  AND ti.status = 'CONCLUDED'
GROUP BY ti.clinic_id, ti.procedure_name
ORDER BY valor_total DESC;

-- =====================================================
-- PILAR 4: OPERACIONAL (EFICIÊNCIA)
-- =====================================================

-- View: Operational Efficiency Enhanced
CREATE OR REPLACE VIEW view_operational_efficiency AS
SELECT
    a.clinic_id,
    
    -- Total de Agendamentos
    COUNT(*) as total_agendamentos,
    
    -- Agendamentos por Status
    COUNT(*) FILTER (WHERE a.status = 'SCHEDULED') as agendados,
    COUNT(*) FILTER (WHERE a.status = 'CONFIRMED') as confirmados,
    COUNT(*) FILTER (WHERE a.status = 'COMPLETED') as concluidos,
    COUNT(*) FILTER (WHERE a.status = 'CANCELLED') as cancelados,
    COUNT(*) FILTER (WHERE a.status = 'MISSED') as faltas,
    
    -- Taxa de No-Show
    ROUND(
        (COUNT(*) FILTER (WHERE a.status = 'MISSED')::numeric / NULLIF(COUNT(*), 0)) * 100,
        2
    ) as taxa_no_show,
    
    -- Taxa de Cancelamento
    ROUND(
        (COUNT(*) FILTER (WHERE a.status = 'CANCELLED')::numeric / NULLIF(COUNT(*), 0)) * 100,
        2
    ) as taxa_cancelamento,
    
    -- Taxa de Conclusão
    ROUND(
        (COUNT(*) FILTER (WHERE a.status = 'COMPLETED')::numeric / NULLIF(COUNT(*), 0)) * 100,
        2
    ) as taxa_conclusao
    
FROM public.appointments a
GROUP BY a.clinic_id;

-- View: Produtividade da Equipe
CREATE OR REPLACE VIEW view_team_productivity AS
SELECT
    li.clinic_id,
    li.user_id,
    u.name as usuario_nome,
    COUNT(*) as total_interacoes,
    COUNT(DISTINCT li.lead_id) as leads_atendidos,
    ROUND(AVG(
        CASE 
            WHEN li.interaction_type = 'CALL' THEN 1
            WHEN li.interaction_type = 'EMAIL' THEN 0.5
            WHEN li.interaction_type = 'WHATSAPP' THEN 0.7
            ELSE 0.3
        END
    ) * 100, 2) as score_produtividade
FROM public.lead_interactions li
LEFT JOIN public.users u ON li.user_id = u.id
GROUP BY li.clinic_id, li.user_id, u.name;

-- =====================================================
-- PILAR 5: FINANCEIRO (EBITDA)
-- =====================================================

-- View: Financial Metrics Enhanced
CREATE OR REPLACE VIEW view_financial_metrics_enhanced AS
SELECT
    t.clinic_id,
    
    -- Faturamento Realizado
    SUM(t.amount) FILTER (WHERE t.type = 'INCOME') as faturamento_realizado,
    
    -- Despesas Totais
    SUM(t.amount) FILTER (WHERE t.type = 'EXPENSE') as despesas_totais,
    
    -- Resultado Líquido
    SUM(t.amount) FILTER (WHERE t.type = 'INCOME') - 
    SUM(t.amount) FILTER (WHERE t.type = 'EXPENSE') as resultado_liquido,
    
    -- Margem EBITDA
    ROUND(
        ((SUM(t.amount) FILTER (WHERE t.type = 'INCOME') - 
          SUM(t.amount) FILTER (WHERE t.type = 'EXPENSE')) / 
         NULLIF(SUM(t.amount) FILTER (WHERE t.type = 'INCOME'), 0)) * 100,
        2
    ) as margem_ebitda,
    
    -- Transações por Categoria
    json_object_agg(
        COALESCE(t.category, 'Não categorizado'),
        SUM(t.amount)
    ) FILTER (WHERE t.category IS NOT NULL) as transacoes_por_categoria
    
FROM public.transactions t
GROUP BY t.clinic_id;

-- View: Inadimplência
CREATE OR REPLACE VIEW view_receivables AS
SELECT
    p.clinic_id,
    
    -- Inadimplência Total
    SUM(p.balance_due) as inadimplencia_total,
    
    -- Pacientes com Saldo Devedor
    COUNT(*) FILTER (WHERE p.balance_due > 0) as pacientes_inadimplentes,
    
    -- Ticket Médio de Inadimplência
    ROUND(AVG(p.balance_due) FILTER (WHERE p.balance_due > 0), 2) as ticket_medio_inadimplencia,
    
    -- Total Pago
    SUM(p.total_paid) as total_recebido
    
FROM public.patients p
GROUP BY p.clinic_id;

-- =====================================================
-- VIEW CONSOLIDADA: INTELLIGENCE 360
-- =====================================================

CREATE OR REPLACE VIEW view_intelligence_360 AS
SELECT
    c.id as clinic_id,
    c.name as clinic_name,
    
    -- Marketing
    mm.total_leads,
    mm.taxa_qualificacao,
    
    -- Vendas
    sm.valor_pipeline,
    sm.ticket_medio,
    sm.taxa_conversao_orcamentos,
    ltv.ltv_medio,
    ltv.taxa_fidelizacao,
    
    -- Clínico
    cp.procedimentos_concluidos,
    cp.valor_producao_total,
    cp.margem_media_procedimento,
    
    -- Operacional
    oe.total_agendamentos,
    oe.taxa_no_show,
    oe.taxa_conclusao,
    
    -- Financeiro
    fm.faturamento_realizado,
    fm.despesas_totais,
    fm.resultado_liquido,
    fm.margem_ebitda,
    r.inadimplencia_total
    
FROM public.clinics c
LEFT JOIN view_marketing_metrics mm ON c.id = mm.clinic_id
LEFT JOIN view_sales_metrics sm ON c.id = sm.clinic_id
LEFT JOIN view_customer_ltv ltv ON c.id = ltv.clinic_id
LEFT JOIN view_clinical_production_enhanced cp ON c.id = cp.clinic_id
LEFT JOIN view_operational_efficiency oe ON c.id = oe.clinic_id
LEFT JOIN view_financial_metrics_enhanced fm ON c.id = fm.clinic_id
LEFT JOIN view_receivables r ON c.id = r.clinic_id;

-- =====================================================
-- GRANTS (Permissões)
-- =====================================================

GRANT SELECT ON view_marketing_metrics TO authenticated;
GRANT SELECT ON view_sales_metrics TO authenticated;
GRANT SELECT ON view_customer_ltv TO authenticated;
GRANT SELECT ON view_clinical_production_enhanced TO authenticated;
GRANT SELECT ON view_high_ticket_procedures TO authenticated;
GRANT SELECT ON view_operational_efficiency TO authenticated;
GRANT SELECT ON view_team_productivity TO authenticated;
GRANT SELECT ON view_financial_metrics_enhanced TO authenticated;
GRANT SELECT ON view_receivables TO authenticated;
GRANT SELECT ON view_intelligence_360 TO authenticated;

-- =====================================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON VIEW view_marketing_metrics IS 'Métricas de marketing: leads, qualificação, origem';
COMMENT ON VIEW view_sales_metrics IS 'Métricas de vendas: pipeline, ticket médio, conversão';
COMMENT ON VIEW view_customer_ltv IS 'Lifetime Value e fidelização de clientes';
COMMENT ON VIEW view_clinical_production_enhanced IS 'Produção clínica detalhada por profissional';
COMMENT ON VIEW view_operational_efficiency IS 'Eficiência operacional: agendamentos, no-show';
COMMENT ON VIEW view_financial_metrics_enhanced IS 'Métricas financeiras: EBITDA, margem, resultado';
COMMENT ON VIEW view_receivables IS 'Inadimplência e valores a receber';
COMMENT ON VIEW view_intelligence_360 IS 'Visão consolidada de todos os pilares';
