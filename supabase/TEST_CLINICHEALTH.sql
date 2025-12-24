-- ============================================================================
-- TESTE DA FUNÇÃO calculate_pillar_scores
-- ============================================================================

-- PASSO 1: Descobrir o clinic_id
-- Execute esta query para ver todas as clínicas:
SELECT id, name, code FROM clinics;

-- PASSO 2: Testar a função
-- Copie o 'id' da clínica acima e substitua abaixo:
SELECT calculate_pillar_scores('COLE-O-CLINIC-ID-AQUI');

-- Exemplo (substitua pelo ID real):
-- SELECT calculate_pillar_scores('123e4567-e89b-12d3-a456-426614174000');

-- ============================================================================
-- O resultado deve ser um JSON com os scores dos 10 pilares
-- ============================================================================
