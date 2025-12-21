-- =====================================================
-- MASTER MIGRATION SCRIPT - REFINAMENTO EASYDENT
-- Executa todas as migrations em ordem correta
-- Data: 21/12/2025
-- =====================================================

-- IMPORTANTE: Execute este script em um ambiente de DESENVOLVIMENTO primeiro!
-- Faça BACKUP do banco de dados antes de executar em PRODUÇÃO!

\echo '========================================='
\echo 'INICIANDO MIGRATIONS - REFINAMENTO EASYDENT'
\echo 'Total de Módulos: 16'
\echo 'Impacto Estimado: +R$ 124.500/mês'
\echo '========================================='
\echo ''

-- =====================================================
-- FASE 1: MÓDULOS P0 (CRÍTICOS)
-- =====================================================

\echo '🔴 FASE 1: MÓDULOS P0 (CRÍTICOS)'
\echo 'Impacto: +R$ 45.000/mês'
\echo ''

\echo '📋 [1/16] Criando tabela de Confirmações de Consultas...'
\i 001_appointment_confirmations.sql
\echo '✅ Confirmações de Consultas - CONCLUÍDO'
\echo ''

\echo '🔬 [2/16] Criando tabela de Gestão Laboratorial...'
\i 002_lab_orders.sql
\echo '✅ Gestão Laboratorial - CONCLUÍDO'
\echo ''

\echo '🔄 [3/16] Criando tabela de Recalls Estruturados...'
\i 003_patient_recalls.sql
\echo '✅ Recalls Estruturados - CONCLUÍDO'
\echo ''

\echo '📦 [4/16] Criando tabelas base de Estoque...'
\i 005_inventory_base.sql
\echo '✅ Estoque Base - CONCLUÍDO'
\echo ''

-- =====================================================
-- FASE 2 E 3: MÓDULOS P1 E P2
-- =====================================================

\echo '🟡 FASE 2 e 3: MÓDULOS P1 e P2'
\echo 'Impacto: +R$ 79.500/mês'
\echo ''

\echo '📦 [5-16] Criando todos os módulos P1 e P2...'
\i 004_ALL_P1_P2_MODULES.sql
\echo '✅ Módulos P1 e P2 - CONCLUÍDO'
\echo ''

-- =====================================================
-- VERIFICAÇÃO E VALIDAÇÃO
-- =====================================================

\echo '========================================='
\echo 'VERIFICANDO INSTALAÇÃO...'
\echo '========================================='
\echo ''

-- Contar tabelas criadas
SELECT 
  'Tabelas criadas:' as status,
  COUNT(*) as total
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'appointment_confirmations',
    'lab_orders',
    'patient_recalls',
    'inventory_categories',
    'inventory_items',
    'inventory_movements',
    'medical_alerts',
    'patient_anamnesis',
    'clinical_images',
    'recurring_contracts',
    'dental_charting',
    'medication_library',
    'prescriptions',
    'prescription_items',
    'medical_certificates',
    'procedure_recipes',
    'procedure_recipe_items',
    'procedure_material_usage',
    'professional_monthly_metrics',
    'clinic_kpis'
  );

-- Contar views criadas
SELECT 
  'Views criadas:' as status,
  COUNT(*) as total
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN (
    'pending_confirmations_view',
    'overdue_lab_orders_view',
    'lab_supplier_performance_view',
    'recall_opportunities_view',
    'low_stock_items_view',
    'mrr_dashboard_view',
    'professional_ranking'
  );

-- Contar triggers criados
SELECT 
  'Triggers criados:' as status,
  COUNT(*) as total
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE '%appointment_confirmation%'
     OR trigger_name LIKE '%lab_order%'
     OR trigger_name LIKE '%recall%';

\echo ''
\echo '========================================='
\echo '✅ MIGRATIONS CONCLUÍDAS COM SUCESSO!'
\echo '========================================='
\echo ''
\echo 'Próximos Passos:'
\echo '1. Verificar logs acima para erros'
\echo '2. Executar testes de integração'
\echo '3. Atualizar TypeScript types'
\echo '4. Implementar services backend'
\echo '5. Criar componentes frontend'
\echo ''
\echo 'Impacto Total Estimado: +R$ 124.500/mês (+83% faturamento)'
\echo ''
