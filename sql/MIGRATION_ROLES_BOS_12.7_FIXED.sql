-- ============================================================================
-- MIGRAÇÃO ESTRUTURAL DE ROLES - BOS 12.7 (VERSÃO CORRIGIDA)
-- Resolve conflito com políticas RLS
-- ============================================================================

-- ============================================================================
-- PASSO 1: BACKUP E PREPARAÇÃO
-- ============================================================================

-- Criar tabela de backup
CREATE TABLE IF NOT EXISTS users_backup_roles AS
SELECT id, email, name, role, clinic_id, created_at, active, phone, color, professional_id, updated_at
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
-- PASSO 2: SALVAR E REMOVER POLÍTICAS RLS
-- ============================================================================

-- Criar tabela para salvar políticas
CREATE TABLE IF NOT EXISTS rls_policies_backup AS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE qual LIKE '%role%' OR with_check LIKE '%role%';

-- Listar políticas que serão removidas
DO $$
DECLARE
  v_policy RECORD;
  v_count INTEGER := 0;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'REMOVENDO POLÍTICAS RLS:';
  RAISE NOTICE '========================================';
  
  FOR v_policy IN 
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE qual LIKE '%role%' OR with_check LIKE '%role%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
      v_policy.policyname, v_policy.schemaname, v_policy.tablename);
    
    RAISE NOTICE 'Removida: %.% - %', v_policy.schemaname, v_policy.tablename, v_policy.policyname;
    v_count := v_count + 1;
  END LOOP;
  
  RAISE NOTICE 'Total de políticas removidas: %', v_count;
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- PASSO 3: ADICIONAR COLUNA TEMPORÁRIA
-- ============================================================================

-- Adicionar coluna temporária
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_temp TEXT;

-- Mapear roles atuais para temporários
UPDATE users SET role_temp = 
  CASE 
    WHEN role::text = 'ADMIN' THEN 'ADMIN'
    WHEN role::text = 'DENTIST' THEN 'PROFESSIONAL'  -- Dentista vira PROFESSIONAL
    WHEN role::text = 'RECEPTIONIST' THEN 'RECEPTIONIST'
    WHEN role::text = 'PROFESSIONAL' THEN 'CRC'  -- Vendedor vira CRC
    ELSE 'PROFESSIONAL'  -- Fallback
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
-- PASSO 4: REMOVER CONSTRAINTS E ALTERAR TIPO
-- ============================================================================

-- Remover default
ALTER TABLE users ALTER COLUMN role DROP DEFAULT;

-- Converter para TEXT
ALTER TABLE users ALTER COLUMN role TYPE TEXT USING role::TEXT;

-- ============================================================================
-- PASSO 5: RECRIAR ENUM
-- ============================================================================

-- Dropar enum antigo
DROP TYPE IF EXISTS role CASCADE;

-- Criar novo enum
CREATE TYPE role AS ENUM ('ADMIN', 'PROFESSIONAL', 'RECEPTIONIST', 'CRC');

-- ============================================================================
-- PASSO 6: APLICAR NOVO ENUM
-- ============================================================================

-- Converter coluna role
ALTER TABLE users ALTER COLUMN role TYPE role USING role_temp::role;

-- Restaurar default
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'PROFESSIONAL'::role;

-- Remover coluna temporária
ALTER TABLE users DROP COLUMN role_temp;

-- ============================================================================
-- PASSO 7: RECRIAR POLÍTICAS RLS
-- ============================================================================

-- Recriar políticas comuns (ajustadas para novos roles)

-- Users table
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can manage all users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role::text = 'ADMIN'
    )
  );

-- Clinical form templates
CREATE POLICY "Admins can manage templates" ON clinical_form_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role::text = 'ADMIN'
    )
  );

CREATE POLICY "Users can view templates" ON clinical_form_templates
  FOR SELECT USING (clinic_id IN (
    SELECT clinic_id FROM users WHERE id = auth.uid()
  ));

-- Document templates
CREATE POLICY "Admins can manage document templates" ON document_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role::text = 'ADMIN'
    )
  );

-- Notification templates
CREATE POLICY "Admins can manage notification templates" ON notification_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role::text = 'ADMIN'
    )
  );

-- User permissions
CREATE POLICY "Users can view own permissions" ON user_permissions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage permissions" ON user_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role::text = 'ADMIN'
    )
  );


-- Políticas RLS recriadas com sucesso


-- ============================================================================
-- PASSO 8: VALIDAÇÃO FINAL
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
  SELECT COUNT(*) INTO v_total_users FROM users;
  SELECT COUNT(*) INTO v_admin_count FROM users WHERE role::text = 'ADMIN';
  SELECT COUNT(*) INTO v_professional_count FROM users WHERE role::text = 'PROFESSIONAL';
  SELECT COUNT(*) INTO v_receptionist_count FROM users WHERE role::text = 'RECEPTIONIST';
  SELECT COUNT(*) INTO v_crc_count FROM users WHERE role::text = 'CRC';
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
  
  IF v_total_users != v_backup_count THEN
    RAISE EXCEPTION 'ERRO: Número de usuários não confere!';
  END IF;
  
  RAISE NOTICE '✅ VALIDAÇÃO: Nenhum usuário foi perdido!';
  RAISE NOTICE '========================================';
END $$;

-- Verificar enum final
SELECT enumlabel as role_value
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
