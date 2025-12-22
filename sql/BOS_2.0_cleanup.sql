-- =====================================================
-- LIMPEZA: Remover funções antigas do BOS 2.0
-- Execute ANTES dos scripts principais
-- =====================================================

-- Dropar todas as versões da função get_card_fee_percent
DROP FUNCTION IF EXISTS get_card_fee_percent(INT);
DROP FUNCTION IF EXISTS get_card_fee_percent(INT, BOOLEAN);
DROP FUNCTION IF EXISTS get_card_fee_percent CASCADE;

-- Dropar outras funções que podem ter conflito
DROP FUNCTION IF EXISTS calculate_budget_net_margin CASCADE;
DROP FUNCTION IF EXISTS simulate_installment_plan CASCADE;
DROP FUNCTION IF EXISTS simulate_installment_with_anticipation CASCADE;
DROP FUNCTION IF EXISTS compare_payment_scenarios CASCADE;

-- Dropar views que dependem das funções
DROP VIEW IF EXISTS v_budgets_with_margin CASCADE;
DROP VIEW IF EXISTS v_budgets_cash_flow_analysis CASCADE;

-- Mensagem de sucesso
SELECT 'Limpeza concluída! Agora execute BOS_2.0_financial_engine.sql' as status;
