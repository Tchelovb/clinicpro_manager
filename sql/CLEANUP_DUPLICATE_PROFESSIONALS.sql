-- ============================================
-- LIMPEZA DE PROFISSIONAIS DUPLICADOS
-- ============================================
-- Objetivo: Remover profissionais com IDs diferentes dos users
-- Executar APÓS o script UNIFY_USER_PROFESSIONAL_IDS.sql
-- ============================================

BEGIN;

-- ============================================
-- FASE 1: IDENTIFICAR DUPLICADOS
-- ============================================

-- 1.1 Listar profissionais duplicados (para revisão manual)
SELECT 
    p.id as professional_id,
    p.name as professional_name,
    p.crc,
    p.specialty,
    u.id as user_id,
    u.name as user_name,
    u.email,
    CASE 
        WHEN u.id IS NULL THEN '❌ SEM USER CORRESPONDENTE'
        WHEN p.id != u.id THEN '⚠️ ID DIFERENTE DO USER'
        ELSE '✅ ID CORRETO'
    END as status
FROM professionals p
LEFT JOIN users u ON LOWER(TRIM(p.name)) = LOWER(TRIM(u.name))
ORDER BY status DESC, p.name;

-- 1.2 Contar duplicados
DO $$
DECLARE
    duplicados INTEGER;
    orfaos INTEGER;
BEGIN
    -- Profissionais com ID diferente do user correspondente
    SELECT COUNT(*) INTO duplicados
    FROM professionals p
    INNER JOIN users u ON LOWER(TRIM(p.name)) = LOWER(TRIM(u.name))
    WHERE p.id != u.id;
    
    -- Profissionais sem user correspondente
    SELECT COUNT(*) INTO orfaos
    FROM professionals p
    WHERE NOT EXISTS (
        SELECT 1 FROM users u 
        WHERE u.id = p.id
    );
    
    RAISE NOTICE '🔍 Profissionais com ID diferente: %', duplicados;
    RAISE NOTICE '🔍 Profissionais órfãos (sem user): %', orfaos;
END $$;

-- ============================================
-- FASE 2: BACKUP DE SEGURANÇA
-- ============================================

-- 2.1 Criar tabela de profissionais que serão deletados
DROP TABLE IF EXISTS professionals_deleted_backup;
CREATE TABLE professionals_deleted_backup AS
SELECT 
    p.*,
    NOW() as deleted_at,
    'ID diferente do user' as deletion_reason
FROM professionals p
WHERE NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = p.id
);

RAISE NOTICE '✅ Backup de profissionais a deletar criado';

-- ============================================
-- FASE 3: VERIFICAR REFERÊNCIAS
-- ============================================

-- 3.1 Verificar se profissionais duplicados têm appointments
DO $$
DECLARE
    appts_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO appts_count
    FROM appointments a
    WHERE a.doctor_id IN (
        SELECT p.id FROM professionals p
        WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = p.id)
    );
    
    IF appts_count > 0 THEN
        RAISE WARNING '⚠️ Existem % appointments vinculados a profissionais duplicados!', appts_count;
        RAISE WARNING '⚠️ Execute UNIFY_USER_PROFESSIONAL_IDS.sql primeiro!';
        RAISE EXCEPTION 'Abortando limpeza. Corrija referências primeiro.';
    ELSE
        RAISE NOTICE '✅ Nenhum appointment vinculado a profissionais duplicados';
    END IF;
END $$;

-- 3.2 Verificar outras referências
DO $$
DECLARE
    budgets_count INTEGER;
    treatments_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO budgets_count
    FROM budgets b
    WHERE b.doctor_id IN (
        SELECT p.id FROM professionals p
        WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = p.id)
    );
    
    SELECT COUNT(*) INTO treatments_count
    FROM treatment_items ti
    WHERE ti.doctor_id IN (
        SELECT p.id FROM professionals p
        WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = p.id)
    );
    
    IF budgets_count > 0 OR treatments_count > 0 THEN
        RAISE WARNING '⚠️ Existem % budgets e % treatments vinculados!', budgets_count, treatments_count;
        RAISE EXCEPTION 'Abortando limpeza. Corrija referências primeiro.';
    ELSE
        RAISE NOTICE '✅ Nenhuma referência encontrada';
    END IF;
END $$;

-- ============================================
-- FASE 4: DELETAR DUPLICADOS
-- ============================================

-- 4.1 Deletar profissionais órfãos (sem user correspondente)
DELETE FROM professionals
WHERE NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = professionals.id
);

RAISE NOTICE '✅ Profissionais órfãos deletados';

-- ============================================
-- FASE 5: VALIDAÇÃO FINAL
-- ============================================

-- 5.1 Verificar que todos os profissionais têm user correspondente
DO $$
DECLARE
    remaining_orphans INTEGER;
BEGIN
    SELECT COUNT(*) INTO remaining_orphans
    FROM professionals p
    WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = p.id);
    
    IF remaining_orphans > 0 THEN
        RAISE WARNING '⚠️ Ainda existem % profissionais órfãos!', remaining_orphans;
    ELSE
        RAISE NOTICE '✅ SUCESSO! Todos os profissionais têm user correspondente';
    END IF;
END $$;

-- 5.2 Verificar que todos os users clínicos têm professional
DO $$
DECLARE
    missing_professionals INTEGER;
BEGIN
    SELECT COUNT(*) INTO missing_professionals
    FROM users u
    WHERE u.is_clinical_provider = true
      AND NOT EXISTS (SELECT 1 FROM professionals p WHERE p.id = u.id);
    
    IF missing_professionals > 0 THEN
        RAISE WARNING '⚠️ Existem % users clínicos sem registro em professionals!', missing_professionals;
        RAISE NOTICE 'Execute o script de criação de profissionais faltantes.';
    ELSE
        RAISE NOTICE '✅ Todos os users clínicos têm professional';
    END IF;
END $$;

-- ============================================
-- FASE 6: RELATÓRIO FINAL
-- ============================================

SELECT 
    '📊 RELATÓRIO DE LIMPEZA' as titulo,
    (SELECT COUNT(*) FROM professionals_deleted_backup) as profissionais_deletados,
    (SELECT COUNT(*) FROM professionals) as profissionais_restantes,
    (SELECT COUNT(*) FROM users WHERE is_clinical_provider = true) as users_clinicos,
    CASE 
        WHEN (SELECT COUNT(*) FROM professionals) = (SELECT COUNT(*) FROM users WHERE is_clinical_provider = true)
        THEN '✅ SINCRONIZADO'
        ELSE '⚠️ VERIFICAR'
    END as status_sincronizacao;

COMMIT;

-- ============================================
-- INSTRUÇÕES PÓS-LIMPEZA
-- ============================================

-- 1. Revisar professionals_deleted_backup
-- 2. Se tudo OK, deletar backup:
--    DROP TABLE professionals_deleted_backup;
-- 3. Testar criação de novo profissional
-- 4. Testar agenda e Google Calendar

-- ============================================
-- ROLLBACK (Se necessário)
-- ============================================

-- Em caso de erro, restaurar profissionais deletados:
-- INSERT INTO professionals 
-- SELECT id, clinic_id, name, crc, specialty, council, is_active, 
--        photo_url, color, created_at, updated_at, payment_release_rule, active
-- FROM professionals_deleted_backup;
