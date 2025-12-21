-- ============================================================================
-- MIGRAÇÃO ESTRUTURAL DE ROLES - BOS 12.7
-- OPÇÃO B: Reconstrução completa do enum role
-- ============================================================================
-- ATENÇÃO: Este script faz alterações estruturais no banco de dados
-- Execute em horário de baixo tráfego
-- Faça backup completo antes de executar
-- ============================================================================

-- ============================================================================
-- PASSO 1: BACKUP E PREPARAÇÃO
-- ============================================================================

-- Criar tabela de backup
CREATE TABLE IF NOT EXISTS users_backup_roles AS
SELECT id, email, name, role, clinic_id, created_at
FROM users;

-- Verificar dados antes da migração
DO $$
DECLARE
  v_total_users INTEGER;
  v_admin_count INTEGER;
  v_dentist_count INTEGER;
  v_receptionist_count INTEGER;
  v_professional_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_users FROM users;
  SELECT COUNT(*) INTO v_admin_count FROM users WHERE role::text = 'ADMIN';
  SELECT COUNT(*) INTO v_dentist_count FROM users WHERE role::text = 'DENTIST';
  SELECT COUNT(*) INTO v_receptionist_count FROM users WHERE role::text = 'RECEPTIONIST';
  SELECT COUNT(*) INTO v_professional_count FROM users WHERE role::text = 'PROFESSIONAL';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'BACKUP CRIADO - ESTADO ATUAL:';
  RAISE NOTICE 'Total de usuários: %', v_total_users;
  RAISE NOTICE 'ADMIN: %', v_admin_count;
  RAISE NOTICE 'DENTIST: %', v_dentist_count;
  RAISE NOTICE 'RECEPTIONIST: %', v_receptionist_count;
  RAISE NOTICE 'PROFESSIONAL: %', v_professional_count;
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- PASSO 2: ADICIONAR COLUNA TEMPORÁRIA
-- ============================================================================

-- Adicionar coluna temporária para armazenar novo role
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_temp TEXT;

-- Mapear roles atuais para temporários
UPDATE users SET role_temp = 
  CASE 
    WHEN role::text = 'ADMIN' THEN 'ADMIN'
    WHEN role::text = 'DENTIST' THEN 'PROFESSIONAL'  -- Dentista vira PROFESSIONAL
    WHEN role::text = 'RECEPTIONIST' THEN 'RECEPTIONIST'
    WHEN role::text = 'PROFESSIONAL' THEN 'CRC'  -- Vendedor vira CRC
    ELSE 'PROFESSIONAL'  -- Fallback para PROFESSIONAL
  END;

-- Verificar mapeamento
DO $$
DECLARE
  v_admin_count INTEGER;
  v_professional_count INTEGER;
  v_receptionist_count INTEGER;
  v_crc_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_admin_count FROM users WHERE role_temp = 'ADMIN';
  SELECT COUNT(*) INTO v_professional_count FROM users WHERE role_temp = 'PROFESSIONAL';
  SELECT COUNT(*) INTO v_receptionist_count FROM users WHERE role_temp = 'RECEPTIONIST';
  SELECT COUNT(*) INTO v_crc_count FROM users WHERE role_temp = 'CRC';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MAPEAMENTO TEMPORÁRIO:';
  RAISE NOTICE 'ADMIN: %', v_admin_count;
  RAISE NOTICE 'PROFESSIONAL (Clínico): %', v_professional_count;
  RAISE NOTICE 'RECEPTIONIST: %', v_receptionist_count;
  RAISE NOTICE 'CRC (Vendedor): %', v_crc_count;
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- PASSO 3: REMOVER CONSTRAINTS E DEPENDÊNCIAS
-- ============================================================================

-- Remover constraints que dependem do enum role
ALTER TABLE users ALTER COLUMN role DROP DEFAULT;

-- Alterar coluna role para text temporariamente
ALTER TABLE users ALTER COLUMN role TYPE TEXT USING role::TEXT;

-- ============================================================================
-- PASSO 4: RECRIAR ENUM ROLE
-- ============================================================================

-- Dropar enum antigo (se existir)
DROP TYPE IF EXISTS role CASCADE;

-- Criar novo enum com 4 valores oficiais
CREATE TYPE role AS ENUM ('ADMIN', 'PROFESSIONAL', 'RECEPTIONIST', 'CRC');

-- ============================================================================
-- PASSO 5: APLICAR NOVO ENUM
-- ============================================================================

-- Converter coluna role de TEXT para novo ENUM
ALTER TABLE users ALTER COLUMN role TYPE role USING role_temp::role;

-- Restaurar default
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'PROFESSIONAL'::role;

-- Remover coluna temporária
ALTER TABLE users DROP COLUMN role_temp;

-- ============================================================================
-- PASSO 6: ATUALIZAR TABELAS RELACIONADAS
-- ============================================================================

-- Atualizar user_roles_lookup se existir
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles_lookup') THEN
    ALTER TABLE user_roles_lookup ALTER COLUMN role TYPE role USING 
      CASE 
        WHEN role::text = 'DENTIST' THEN 'PROFESSIONAL'::role
        WHEN role::text = 'PROFESSIONAL' THEN 'CRC'::role
        ELSE role::text::role
      END;
  END IF;
END $$;

-- ============================================================================
-- PASSO 7: VALIDAÇÃO FINAL
-- ============================================================================

DO $$
DECLARE
  v_total_users INTEGER;
  v_admin_count INTEGER;
  v_professional_count INTEGER;
  v_receptionist_count INTEGER;
  v_crc_count INTEGER;
  v_backup_count INTEGER;
BEGIN
  -- Contar usuários atuais
  SELECT COUNT(*) INTO v_total_users FROM users;
  SELECT COUNT(*) INTO v_admin_count FROM users WHERE role = 'ADMIN';
  SELECT COUNT(*) INTO v_professional_count FROM users WHERE role = 'PROFESSIONAL';
  SELECT COUNT(*) INTO v_receptionist_count FROM users WHERE role = 'RECEPTIONIST';
  SELECT COUNT(*) INTO v_crc_count FROM users WHERE role = 'CRC';
  
  -- Contar backup
  SELECT COUNT(*) INTO v_backup_count FROM users_backup_roles;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRAÇÃO CONCLUÍDA!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ESTADO FINAL:';
  RAISE NOTICE 'Total de usuários: % (Backup: %)', v_total_users, v_backup_count;
  RAISE NOTICE 'ADMIN: %', v_admin_count;
  RAISE NOTICE 'PROFESSIONAL (Clínico): %', v_professional_count;
  RAISE NOTICE 'RECEPTIONIST: %', v_receptionist_count;
  RAISE NOTICE 'CRC (Vendedor): %', v_crc_count;
  RAISE NOTICE '========================================';
  
  -- Validar que nenhum usuário foi perdido
  IF v_total_users != v_backup_count THEN
    RAISE EXCEPTION 'ERRO: Número de usuários não confere! Atual: %, Backup: %', v_total_users, v_backup_count;
  END IF;
  
  RAISE NOTICE '✅ VALIDAÇÃO: Nenhum usuário foi perdido!';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- PASSO 8: SCRIPT DE ROLLBACK (SE NECESSÁRIO)
-- ============================================================================

-- ATENÇÃO: Execute este bloco APENAS se algo der errado
-- Descomente e execute para reverter a migração

/*
DO $$
BEGIN
  RAISE NOTICE 'INICIANDO ROLLBACK...';
  
  -- Restaurar dados do backup
  TRUNCATE users;
  
  INSERT INTO users (id, email, name, role, clinic_id, created_at)
  SELECT id, email, name, role::text::role, clinic_id, created_at
  FROM users_backup_roles;
  
  RAISE NOTICE 'ROLLBACK CONCLUÍDO!';
END $$;
*/

-- ============================================================================
-- PASSO 9: LIMPEZA (EXECUTAR APÓS VALIDAÇÃO)
-- ============================================================================

-- ATENÇÃO: Execute este bloco APENAS após confirmar que tudo está OK
-- Descomente para remover tabela de backup

/*
DROP TABLE IF EXISTS users_backup_roles;
RAISE NOTICE 'Tabela de backup removida.';
*/

-- ============================================================================
-- FIM DA MIGRAÇÃO
-- ============================================================================

-- Verificar estrutura final
SELECT 
  enumlabel as role_value,
  enumsortorder as order_position
FROM pg_enum
WHERE enumtypid = 'role'::regtype
ORDER BY enumsortorder;

-- Listar usuários por role
SELECT 
  role,
  COUNT(*) as total,
  string_agg(name, ', ') as usuarios
FROM users
GROUP BY role
ORDER BY role;

-- ============================================================================
-- RESULTADO ESPERADO
-- ============================================================================

/*
ENUM ROLE (4 valores):
1. ADMIN
2. PROFESSIONAL (Clínico - ex-DENTIST)
3. RECEPTIONIST
4. CRC (Vendedor - ex-PROFESSIONAL)

MAPEAMENTO:
- Dr. Marcelo → ADMIN
- Dentistas → PROFESSIONAL
- Secretária → RECEPTIONIST
- Vendedor/CRC → CRC

PRÓXIMO PASSO:
1. Atualizar frontend (TypeScript types)
2. Atualizar componentes (substituir DENTIST por PROFESSIONAL)
3. Atualizar ChatBOS (system prompts)
4. Testar login com cada role
*/
