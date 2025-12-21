-- =====================================================
-- EXECUTAR MIGRATIONS - VERSÃO SUPABASE
-- Execute cada seção separadamente no SQL Editor
-- Data: 21/12/2025
-- =====================================================

-- =====================================================
-- SEÇÃO 1: CONFIRMAÇÕES DE CONSULTAS (P0)
-- Copie e cole o conteúdo do arquivo:
-- 001_appointment_confirmations.sql
-- =====================================================

-- =====================================================
-- SEÇÃO 2: GESTÃO LABORATORIAL (P0)
-- Copie e cole o conteúdo do arquivo:
-- 002_lab_orders.sql
-- =====================================================

-- =====================================================
-- SEÇÃO 3: RECALLS ESTRUTURADOS (P0)
-- Copie e cole o conteúdo do arquivo:
-- 003_patient_recalls.sql
-- =====================================================

-- =====================================================
-- SEÇÃO 4: ESTOQUE BASE (P2)
-- ⚠️ IMPORTANTE: Execute ANTES da Seção 5!
-- Copie e cole o conteúdo do arquivo:
-- 005_inventory_base.sql
-- =====================================================

-- =====================================================
-- SEÇÃO 5: MÓDULOS P1 E P2
-- Copie e cole o conteúdo do arquivo:
-- 004_ALL_P1_P2_MODULES.sql
-- =====================================================

-- =====================================================
-- VERIFICAÇÃO FINAL
-- Execute após todas as seções acima
-- =====================================================

-- Verificar tabelas criadas
SELECT 
  'Tabelas criadas' as status,
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

-- Verificar views criadas
SELECT 
  'Views criadas' as status,
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

-- Listar todas as tabelas criadas
SELECT table_name, 
       pg_size_pretty(pg_total_relation_size(quote_ident(table_name)::regclass)) as size
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
  )
ORDER BY table_name;

-- =====================================================
-- ✅ MIGRATIONS CONCLUÍDAS!
-- Próximos passos:
-- 1. Verificar se todas as 20 tabelas foram criadas
-- 2. Verificar se todas as 7 views foram criadas
-- 3. Testar triggers (ver GUIA_RAPIDO.md)
-- =====================================================
