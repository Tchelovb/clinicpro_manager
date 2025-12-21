-- ============================================================================
-- SCRIPT DE VALIDAÇÃO PÓS-MIGRAÇÃO - BOS 12.7
-- Execute após a migração para garantir integridade dos dados
-- ============================================================================

-- ============================================================================
-- 1. VALIDAÇÃO DE ENUM
-- ============================================================================

-- Verificar se enum tem exatamente 4 valores
DO $$
DECLARE
  v_enum_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_enum_count
  FROM pg_enum
  WHERE enumtypid = 'role'::regtype;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '1. VALIDAÇÃO DE ENUM';
  RAISE NOTICE '========================================';
  
  IF v_enum_count = 4 THEN
    RAISE NOTICE '✅ Enum tem exatamente 4 valores';
  ELSE
    RAISE WARNING '❌ Enum tem % valores (esperado: 4)', v_enum_count;
  END IF;
END $$;

-- Listar valores do enum
SELECT 
  '✅ Enum Values:' as status,
  enumlabel as role_value,
  enumsortorder as position
FROM pg_enum
WHERE enumtypid = 'role'::regtype
ORDER BY enumsortorder;

-- ============================================================================
-- 2. VALIDAÇÃO DE USUÁRIOS
-- ============================================================================

DO $$
DECLARE
  v_total_atual INTEGER;
  v_total_backup INTEGER;
  v_admin INTEGER;
  v_professional INTEGER;
  v_receptionist INTEGER;
  v_crc INTEGER;
BEGIN
  -- Contar usuários
  SELECT COUNT(*) INTO v_total_atual FROM users;
  SELECT COUNT(*) INTO v_total_backup FROM users_backup_roles;
  SELECT COUNT(*) INTO v_admin FROM users WHERE role = 'ADMIN';
  SELECT COUNT(*) INTO v_professional FROM users WHERE role = 'PROFESSIONAL';
  SELECT COUNT(*) INTO v_receptionist FROM users WHERE role = 'RECEPTIONIST';
  SELECT COUNT(*) INTO v_crc FROM users WHERE role = 'CRC';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '2. VALIDAÇÃO DE USUÁRIOS';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total Atual: %', v_total_atual;
  RAISE NOTICE 'Total Backup: %', v_total_backup;
  RAISE NOTICE '';
  
  IF v_total_atual = v_total_backup THEN
    RAISE NOTICE '✅ Nenhum usuário foi perdido';
  ELSE
    RAISE WARNING '❌ ATENÇÃO: % usuários perdidos!', (v_total_backup - v_total_atual);
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Distribuição por Role:';
  RAISE NOTICE '  ADMIN: %', v_admin;
  RAISE NOTICE '  PROFESSIONAL (Clínico): %', v_professional;
  RAISE NOTICE '  RECEPTIONIST: %', v_receptionist;
  RAISE NOTICE '  CRC (Vendedor): %', v_crc;
  RAISE NOTICE '';
  
  IF (v_admin + v_professional + v_receptionist + v_crc) = v_total_atual THEN
    RAISE NOTICE '✅ Todos os usuários têm role válido';
  ELSE
    RAISE WARNING '❌ Há usuários sem role válido!';
  END IF;
END $$;

-- ============================================================================
-- 3. COMPARAÇÃO ANTES/DEPOIS
-- ============================================================================

SELECT 
  '========================================' as separator
UNION ALL
SELECT '3. COMPARAÇÃO ANTES/DEPOIS'
UNION ALL
SELECT '========================================'
UNION ALL
SELECT 
  CONCAT(
    'ANTES: ',
    CASE backup.role::text
      WHEN 'ADMIN' THEN 'ADMIN'
      WHEN 'DENTIST' THEN 'DENTIST'
      WHEN 'RECEPTIONIST' THEN 'RECEPTIONIST'
      WHEN 'PROFESSIONAL' THEN 'PROFESSIONAL'
    END,
    ' → DEPOIS: ',
    u.role::text,
    ' | ',
    u.name
  ) as migracao
FROM users u
JOIN users_backup_roles backup ON backup.id = u.id
ORDER BY u.role, u.name;

-- ============================================================================
-- 4. VALIDAÇÃO DE MAPEAMENTO
-- ============================================================================

DO $$
DECLARE
  v_dentist_to_professional INTEGER;
  v_old_professional_to_crc INTEGER;
BEGIN
  -- Contar conversões DENTIST → PROFESSIONAL
  SELECT COUNT(*) INTO v_dentist_to_professional
  FROM users u
  JOIN users_backup_roles b ON b.id = u.id
  WHERE b.role::text = 'DENTIST' AND u.role = 'PROFESSIONAL';
  
  -- Contar conversões PROFESSIONAL → CRC
  SELECT COUNT(*) INTO v_old_professional_to_crc
  FROM users u
  JOIN users_backup_roles b ON b.id = u.id
  WHERE b.role::text = 'PROFESSIONAL' AND u.role = 'CRC';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '4. VALIDAÇÃO DE MAPEAMENTO';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DENTIST → PROFESSIONAL: %', v_dentist_to_professional;
  RAISE NOTICE 'PROFESSIONAL → CRC: %', v_old_professional_to_crc;
  RAISE NOTICE '';
  
  IF v_dentist_to_professional > 0 THEN
    RAISE NOTICE '✅ Dentistas migrados para PROFESSIONAL';
  END IF;
  
  IF v_old_professional_to_crc > 0 THEN
    RAISE NOTICE '✅ Vendedores migrados para CRC';
  END IF;
END $$;

-- ============================================================================
-- 5. LISTAR USUÁRIOS POR ROLE
-- ============================================================================

SELECT '========================================' as separator
UNION ALL
SELECT '5. USUÁRIOS POR ROLE'
UNION ALL
SELECT '========================================';

-- ADMIN
SELECT 
  '👑 ADMIN' as role_label,
  name,
  email
FROM users
WHERE role = 'ADMIN'
ORDER BY name;

-- PROFESSIONAL (Clínico)
SELECT 
  '🩺 PROFESSIONAL (Clínico)' as role_label,
  name,
  email
FROM users
WHERE role = 'PROFESSIONAL'
ORDER BY name;

-- RECEPTIONIST
SELECT 
  '📋 RECEPTIONIST' as role_label,
  name,
  email
FROM users
WHERE role = 'RECEPTIONIST'
ORDER BY name;

-- CRC (Vendedor)
SELECT 
  '💰 CRC (Vendedor)' as role_label,
  name,
  email
FROM users
WHERE role = 'CRC'
ORDER BY name;

-- ============================================================================
-- 6. VALIDAÇÃO DE INTEGRIDADE REFERENCIAL
-- ============================================================================

DO $$
DECLARE
  v_orphan_progressions INTEGER;
  v_orphan_operations INTEGER;
BEGIN
  -- Verificar user_progression órfãos
  SELECT COUNT(*) INTO v_orphan_progressions
  FROM user_progression up
  LEFT JOIN users u ON u.id = up.user_id
  WHERE u.id IS NULL;
  
  -- Verificar tactical_operations órfãos
  SELECT COUNT(*) INTO v_orphan_operations
  FROM tactical_operations tac
  LEFT JOIN users u ON u.id = tac.assigned_to
  WHERE tac.assigned_to IS NOT NULL AND u.id IS NULL;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '6. INTEGRIDADE REFERENCIAL';
  RAISE NOTICE '========================================';
  
  IF v_orphan_progressions = 0 THEN
    RAISE NOTICE '✅ Nenhum user_progression órfão';
  ELSE
    RAISE WARNING '❌ % user_progression órfãos encontrados!', v_orphan_progressions;
  END IF;
  
  IF v_orphan_operations = 0 THEN
    RAISE NOTICE '✅ Nenhuma tactical_operation órfã';
  ELSE
    RAISE WARNING '❌ % tactical_operations órfãs encontradas!', v_orphan_operations;
  END IF;
END $$;

-- ============================================================================
-- 7. RESUMO FINAL
-- ============================================================================

DO $$
DECLARE
  v_total INTEGER;
  v_admin INTEGER;
  v_professional INTEGER;
  v_receptionist INTEGER;
  v_crc INTEGER;
  v_all_valid BOOLEAN;
BEGIN
  SELECT COUNT(*) INTO v_total FROM users;
  SELECT COUNT(*) INTO v_admin FROM users WHERE role = 'ADMIN';
  SELECT COUNT(*) INTO v_professional FROM users WHERE role = 'PROFESSIONAL';
  SELECT COUNT(*) INTO v_receptionist FROM users WHERE role = 'RECEPTIONIST';
  SELECT COUNT(*) INTO v_crc FROM users WHERE role = 'CRC';
  
  v_all_valid := (v_admin + v_professional + v_receptionist + v_crc) = v_total;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '7. RESUMO FINAL DA MIGRAÇÃO';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Total de Usuários: %', v_total;
  RAISE NOTICE '';
  RAISE NOTICE 'Distribuição:';
  RAISE NOTICE '  👑 ADMIN: % (%.1f%%)', v_admin, (v_admin::float / v_total * 100);
  RAISE NOTICE '  🩺 PROFESSIONAL: % (%.1f%%)', v_professional, (v_professional::float / v_total * 100);
  RAISE NOTICE '  📋 RECEPTIONIST: % (%.1f%%)', v_receptionist, (v_receptionist::float / v_total * 100);
  RAISE NOTICE '  💰 CRC: % (%.1f%%)', v_crc, (v_crc::float / v_total * 100);
  RAISE NOTICE '';
  
  IF v_all_valid THEN
    RAISE NOTICE '✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!';
    RAISE NOTICE '';
    RAISE NOTICE 'Próximos Passos:';
    RAISE NOTICE '1. Atualizar types.ts (UserRole)';
    RAISE NOTICE '2. Atualizar componentes (DENTIST → PROFESSIONAL)';
    RAISE NOTICE '3. Atualizar ChatBOS (system prompts)';
    RAISE NOTICE '4. Testar login com cada role';
    RAISE NOTICE '5. Remover tabela de backup (após validação)';
  ELSE
    RAISE WARNING '❌ ATENÇÃO: Há inconsistências nos dados!';
    RAISE WARNING 'Revise os logs acima antes de prosseguir.';
  END IF;
  
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- 8. COMANDO PARA REMOVER BACKUP (APÓS VALIDAÇÃO)
-- ============================================================================

-- ATENÇÃO: Execute APENAS após confirmar que tudo está OK
-- Descomente para remover tabela de backup

/*
DROP TABLE IF EXISTS users_backup_roles;
SELECT 'Tabela de backup removida.' as status;
*/
