-- =====================================================
-- LIMPEZA COMPLETA: Dropar TODAS as versões da função
-- =====================================================

-- Dropar TODAS as versões possíveis da função
DROP FUNCTION IF EXISTS get_card_fee_percent(INT) CASCADE;
DROP FUNCTION IF EXISTS get_card_fee_percent(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_card_fee_percent(NUMERIC) CASCADE;
DROP FUNCTION IF EXISTS get_card_fee_percent(INT, BOOLEAN) CASCADE;
DROP FUNCTION IF EXISTS get_card_fee_percent CASCADE;

-- Verificar se foi removida
SELECT 'Todas as versões da função foram removidas' as status;

-- Agora criar a versão correta
CREATE OR REPLACE FUNCTION get_card_fee_percent(p_installments INT)
RETURNS NUMERIC AS $$
BEGIN
    RETURN CASE 
        WHEN p_installments = 1 THEN 2.49
        WHEN p_installments = 2 THEN 3.19
        WHEN p_installments = 3 THEN 3.49
        WHEN p_installments = 4 THEN 3.69
        WHEN p_installments = 5 THEN 3.89
        WHEN p_installments = 6 THEN 4.09
        WHEN p_installments = 7 THEN 4.19
        WHEN p_installments = 8 THEN 4.29
        WHEN p_installments = 9 THEN 4.39
        WHEN p_installments = 10 THEN 4.49
        WHEN p_installments = 11 THEN 4.59
        WHEN p_installments = 12 THEN 4.69
        ELSE 4.99
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Testar
SELECT get_card_fee_percent(1) as taxa_1x;
SELECT get_card_fee_percent(4) as taxa_4x;
SELECT get_card_fee_percent(12) as taxa_12x;

SELECT 'Função get_card_fee_percent criada com sucesso!' as status;
