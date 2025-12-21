-- ============================================
-- SCRIPT DE TESTE: INSIGHTS ESTRATÉGICOS
-- Gera exemplos de Insights (Medium/Low) para validar BOS Intelligence
-- ============================================

-- Limpar insights de teste anteriores (opcional)
-- DELETE FROM ai_insights WHERE title LIKE '%[TESTE]%';

-- 1. INSIGHT: Upsell Cirúrgico (HOF → Face)
INSERT INTO ai_insights (
    clinic_id,
    title,
    explanation,
    priority,
    category,
    status,
    action_label,
    related_entity_type,
    created_at
) VALUES (
    (SELECT id FROM clinics LIMIT 1), -- Pega a primeira clínica
    '[TESTE] Oportunidade de Upsell Cirúrgico',
    'Paciente Ana Silva realizou Harmonização Facial (R$ 3.500) há 3 meses. Perfil ideal para Cervicoplastia (R$ 18.000). LTV estimado: R$ 25.000.',
    'medium',
    'Clínico',
    'open',
    'Agendar Consulta de Avaliação',
    'patient',
    NOW()
);

-- 2. INSIGHT: Reativação de Paciente VIP
INSERT INTO ai_insights (
    clinic_id,
    title,
    explanation,
    priority,
    category,
    status,
    action_label,
    related_entity_type,
    created_at
) VALUES (
    (SELECT id FROM clinics LIMIT 1),
    '[TESTE] Paciente VIP Inativo - João Costa',
    'Paciente VIP com LTV de R$ 12.000 sem retorno há 8 meses. Última visita: Lip Lifting (R$ 15.000). Potencial de reativação alto.',
    'medium',
    'Comercial',
    'open',
    'Enviar Campanha de Reativação',
    'patient',
    NOW()
);

-- 3. INSIGHT: Canal de Marketing com ROI Explosivo
INSERT INTO ai_insights (
    clinic_id,
    title,
    explanation,
    priority,
    category,
    status,
    action_label,
    related_entity_type,
    created_at
) VALUES (
    (SELECT id FROM clinics LIMIT 1),
    '[TESTE] Instagram Stories - ROI de 450%',
    'Canal Instagram Stories gerou 12 leads em 7 dias com investimento de R$ 500. Conversão: 33%. ROI: 450%. Recomendação: aumentar budget para R$ 2.000/mês.',
    'low',
    'Marketing',
    'open',
    'Aumentar Investimento',
    'marketing',
    NOW()
);

-- 4. INSIGHT: Análise de Breakeven
INSERT INTO ai_insights (
    clinic_id,
    title,
    explanation,
    priority,
    category,
    status,
    action_label,
    related_entity_type,
    created_at
) VALUES (
    (SELECT id FROM clinics LIMIT 1),
    '[TESTE] Ponto de Equilíbrio Atingido',
    'Clínica atingiu R$ 85.000 de faturamento este mês. Breakeven: R$ 60.000. Margem de segurança: 42%. Recomendação: focar em procedimentos high-ticket para maximizar lucro.',
    'low',
    'Financeiro',
    'open',
    'Ver Análise Completa',
    'financial',
    NOW()
);

-- 5. INSIGHT: Oportunidade de Pacote Premium
INSERT INTO ai_insights (
    clinic_id,
    title,
    explanation,
    priority,
    category,
    status,
    action_label,
    related_entity_type,
    created_at
) VALUES (
    (SELECT id FROM clinics LIMIT 1),
    '[TESTE] Pacote Premium - 5 Pacientes Qualificados',
    '5 pacientes realizaram Harmonização Facial nos últimos 2 meses. Perfil ideal para Pacote Premium: HOF + Cervicoplastia + Lip Lifting (R$ 45.000). Potencial: R$ 225.000.',
    'medium',
    'Clínico',
    'open',
    'Criar Proposta de Pacote',
    'patient',
    NOW()
);

-- 6. INSIGHT: Otimização de Agenda
INSERT INTO ai_insights (
    clinic_id,
    title,
    explanation,
    priority,
    category,
    status,
    action_label,
    related_entity_type,
    created_at
) VALUES (
    (SELECT id FROM clinics LIMIT 1),
    '[TESTE] Horários Ociosos - Terças 14h-17h',
    'Análise de ocupação mostra 3 horários vazios toda terça-feira entre 14h-17h. Oportunidade: agendar consultas de avaliação ou procedimentos rápidos. Potencial: +R$ 12.000/mês.',
    'low',
    'Operacional',
    'open',
    'Otimizar Agenda',
    'operational',
    NOW()
);

-- Verificar insights criados
SELECT 
    title,
    priority,
    category,
    explanation,
    action_label,
    created_at
FROM ai_insights
WHERE title LIKE '%[TESTE]%'
ORDER BY 
    CASE priority
        WHEN 'critico' THEN 0
        WHEN 'high' THEN 1
        WHEN 'medium' THEN 2
        WHEN 'low' THEN 3
    END,
    created_at DESC;

-- ============================================
-- RESULTADO ESPERADO NO BOS INTELLIGENCE:
-- ============================================
-- 
-- 🔴 Críticos: 0
-- 🟠 Alta Prioridade: 0  
-- 🟡 Média Prioridade: 3 (Upsell, Reativação VIP, Pacote Premium)
-- 🔵 Baixa Prioridade: 3 (ROI Marketing, Breakeven, Otimização Agenda)
--
-- TOTAL: 6 Insights Estratégicos
-- ============================================

-- Para remover os testes depois:
-- DELETE FROM ai_insights WHERE title LIKE '%[TESTE]%';
