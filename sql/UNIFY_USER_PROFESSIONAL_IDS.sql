-- ============================================
-- UNIFICAÇÃO DE IDENTIDADE: users ↔ professionals
-- ============================================
-- Objetivo: Garantir que users.id = professionals.id (MESMO UUID)
-- Problema: Google Calendar busca user_id, Agenda busca professional_id
-- Solução: ID ÚNICO para a mesma pessoa física
-- ============================================

-- ⚠️ IMPORTANTE: Fazer backup antes de executar!
-- pg_dump -U postgres -d clinicpro -t users -t professionals > backup_before_unify.sql

BEGIN;

-- ============================================
-- FASE 1: ANÁLISE DE DADOS EXISTENTES
-- ============================================

-- 1.1 Identificar profissionais com ID diferente do user
DO $$
DECLARE
    duplicados_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO duplicados_count
    FROM professionals p
    LEFT JOIN users u ON p.id = u.id
    WHERE u.id IS NULL;
    
    RAISE NOTICE '🔍 Profissionais com ID diferente de users: %', duplicados_count;
END $$;

-- 1.2 Identificar users que são profissionais mas não têm registro em professionals
DO $$
DECLARE
    faltantes_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO faltantes_count
    FROM users u
    WHERE u.is_clinical_provider = true
      AND NOT EXISTS (SELECT 1 FROM professionals p WHERE p.id = u.id);
    
    RAISE NOTICE '🔍 Users clínicos sem registro em professionals: %', faltantes_count;
END $$;

-- ============================================
-- FASE 2: BACKUP DE SEGURANÇA (Tabela Temporária)
-- ============================================

-- 2.1 Criar tabela de backup dos profissionais
DROP TABLE IF EXISTS professionals_backup_unify;
CREATE TABLE professionals_backup_unify AS 
SELECT * FROM professionals;

RAISE NOTICE '✅ Backup criado: professionals_backup_unify';

-- 2.2 Criar tabela de mapeamento (ID antigo → ID novo)
DROP TABLE IF EXISTS professional_id_mapping;
CREATE TABLE professional_id_mapping (
    old_professional_id UUID,
    new_professional_id UUID,  -- Será o users.id correspondente
    professional_name TEXT,
    user_name TEXT,
    matched_by TEXT,  -- 'EMAIL', 'NAME', 'CRO', 'MANUAL'
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- FASE 3: MAPEAMENTO INTELIGENTE
-- ============================================

-- 3.1 Mapear por EMAIL (mais confiável)
INSERT INTO professional_id_mapping (old_professional_id, new_professional_id, professional_name, user_name, matched_by)
SELECT 
    p.id as old_professional_id,
    u.id as new_professional_id,
    p.name as professional_name,
    u.name as user_name,
    'EMAIL' as matched_by
FROM professionals p
INNER JOIN users u ON LOWER(TRIM(p.name)) = LOWER(TRIM(u.email))
WHERE p.id != u.id;

-- 3.2 Mapear por NOME EXATO (segunda opção)
INSERT INTO professional_id_mapping (old_professional_id, new_professional_id, professional_name, user_name, matched_by)
SELECT 
    p.id as old_professional_id,
    u.id as new_professional_id,
    p.name as professional_name,
    u.name as user_name,
    'NAME' as matched_by
FROM professionals p
INNER JOIN users u ON LOWER(TRIM(p.name)) = LOWER(TRIM(u.name))
WHERE p.id != u.id
  AND NOT EXISTS (
      SELECT 1 FROM professional_id_mapping m 
      WHERE m.old_professional_id = p.id
  );

-- 3.3 Mapear por CRO/CRC (terceira opção)
INSERT INTO professional_id_mapping (old_professional_id, new_professional_id, professional_name, user_name, matched_by)
SELECT 
    p.id as old_professional_id,
    u.id as new_professional_id,
    p.name as professional_name,
    u.name as user_name,
    'CRO' as matched_by
FROM professionals p
INNER JOIN users u ON p.crc = u.cro AND p.crc IS NOT NULL AND u.cro IS NOT NULL
WHERE p.id != u.id
  AND NOT EXISTS (
      SELECT 1 FROM professional_id_mapping m 
      WHERE m.old_professional_id = p.id
  );

-- 3.4 Relatório de mapeamento
DO $$
DECLARE
    mapped_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO mapped_count FROM professional_id_mapping;
    RAISE NOTICE '📊 Total de profissionais mapeados: %', mapped_count;
    
    RAISE NOTICE '📊 Detalhamento:';
    RAISE NOTICE '   - Por EMAIL: %', (SELECT COUNT(*) FROM professional_id_mapping WHERE matched_by = 'EMAIL');
    RAISE NOTICE '   - Por NOME: %', (SELECT COUNT(*) FROM professional_id_mapping WHERE matched_by = 'NAME');
    RAISE NOTICE '   - Por CRO: %', (SELECT COUNT(*) FROM professional_id_mapping WHERE matched_by = 'CRO');
END $$;

-- ============================================
-- FASE 4: ATUALIZAÇÃO DE REFERÊNCIAS
-- ============================================

-- 4.1 Atualizar appointments.doctor_id (CRÍTICO para agenda)
UPDATE appointments a
SET doctor_id = m.new_professional_id
FROM professional_id_mapping m
WHERE a.doctor_id = m.old_professional_id;

RAISE NOTICE '✅ appointments.doctor_id atualizado';

-- 4.2 Atualizar attendance_queue.professional_id
UPDATE attendance_queue aq
SET professional_id = m.new_professional_id
FROM professional_id_mapping m
WHERE aq.professional_id = m.old_professional_id;

RAISE NOTICE '✅ attendance_queue.professional_id atualizado';

-- 4.3 Atualizar budgets.doctor_id
UPDATE budgets b
SET doctor_id = m.new_professional_id
FROM professional_id_mapping m
WHERE b.doctor_id = m.old_professional_id;

RAISE NOTICE '✅ budgets.doctor_id atualizado';

-- 4.4 Atualizar treatment_items.doctor_id
UPDATE treatment_items ti
SET doctor_id = m.new_professional_id
FROM professional_id_mapping m
WHERE ti.doctor_id = m.old_professional_id;

RAISE NOTICE '✅ treatment_items.doctor_id atualizado';

-- 4.5 Atualizar professional_schedules.professional_id
UPDATE professional_schedules ps
SET professional_id = m.new_professional_id
FROM professional_id_mapping m
WHERE ps.professional_id = m.old_professional_id;

RAISE NOTICE '✅ professional_schedules.professional_id atualizado';

-- 4.6 Atualizar users.professional_id (auto-referência)
UPDATE users u
SET professional_id = m.new_professional_id
FROM professional_id_mapping m
WHERE u.professional_id = m.old_professional_id;

RAISE NOTICE '✅ users.professional_id atualizado';

-- ============================================
-- FASE 5: CONSOLIDAÇÃO DE DADOS
-- ============================================

-- 5.1 Mover dados de professionals para users (centralização)
UPDATE users u
SET 
    cro = COALESCE(u.cro, p.crc),
    specialty = COALESCE(u.specialty, p.specialty),
    council = COALESCE(u.council, p.council),
    agenda_color = COALESCE(u.agenda_color, p.color),
    photo_url = COALESCE(u.photo_url, p.photo_url),
    payment_release_rule = COALESCE(u.payment_release_rule, p.payment_release_rule),
    is_clinical_provider = true
FROM professionals p
WHERE u.id = p.id
  AND p.id NOT IN (SELECT old_professional_id FROM professional_id_mapping);

RAISE NOTICE '✅ Dados consolidados em users';

-- 5.2 Deletar profissionais duplicados (com ID diferente)
DELETE FROM professionals
WHERE id IN (SELECT old_professional_id FROM professional_id_mapping);

RAISE NOTICE '✅ Profissionais duplicados removidos';

-- ============================================
-- FASE 6: CRIAR PROFISSIONAIS FALTANTES
-- ============================================

-- 6.1 Inserir em professionals os users clínicos que não têm registro
INSERT INTO professionals (
    id,
    clinic_id,
    name,
    crc,
    specialty,
    council,
    color,
    photo_url,
    is_active,
    active,
    payment_release_rule,
    created_at,
    updated_at
)
SELECT 
    u.id,
    u.clinic_id,
    u.name,
    u.cro,
    u.specialty,
    u.council,
    u.agenda_color,
    u.photo_url,
    u.is_active,
    u.active,
    u.payment_release_rule,
    u.created_at,
    u.updated_at
FROM users u
WHERE u.is_clinical_provider = true
  AND NOT EXISTS (SELECT 1 FROM professionals p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;

RAISE NOTICE '✅ Profissionais faltantes criados';

-- ============================================
-- FASE 7: GARANTIR SINCRONIZAÇÃO (Constraints)
-- ============================================

-- 7.1 Remover constraint antiga se existir
ALTER TABLE professionals DROP CONSTRAINT IF EXISTS professionals_pkey CASCADE;

-- 7.2 Adicionar FK que garante ID único
ALTER TABLE professionals 
DROP CONSTRAINT IF EXISTS professionals_id_fkey;

ALTER TABLE professionals 
ADD CONSTRAINT professionals_id_fkey 
FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE;

-- 7.3 Recriar PK
ALTER TABLE professionals ADD PRIMARY KEY (id);

RAISE NOTICE '✅ Constraints de integridade criadas';

-- 7.4 Atualizar users.professional_id para auto-referência
UPDATE users u
SET professional_id = u.id
WHERE u.is_clinical_provider = true
  AND EXISTS (SELECT 1 FROM professionals p WHERE p.id = u.id);

RAISE NOTICE '✅ users.professional_id sincronizado (auto-referência)';

-- ============================================
-- FASE 8: CRIAR TRIGGER DE SINCRONIZAÇÃO AUTOMÁTICA
-- ============================================

-- 8.1 Função de sincronização
CREATE OR REPLACE FUNCTION sync_user_professional_unified()
RETURNS TRIGGER AS $$
BEGIN
    -- Quando inserir em professionals, garantir que user existe
    IF (TG_OP = 'INSERT') THEN
        -- Verificar se user existe
        IF NOT EXISTS (SELECT 1 FROM users WHERE id = NEW.id) THEN
            RAISE EXCEPTION 'User com ID % não existe. Crie o user primeiro.', NEW.id;
        END IF;
        
        -- Atualizar users.professional_id
        UPDATE users 
        SET professional_id = NEW.id,
            is_clinical_provider = true
        WHERE id = NEW.id;
        
        RETURN NEW;
    END IF;
    
    -- Quando deletar professional, limpar professional_id
    IF (TG_OP = 'DELETE') THEN
        UPDATE users 
        SET professional_id = NULL,
            is_clinical_provider = false
        WHERE id = OLD.id;
        
        RETURN OLD;
    END IF;
    
    -- Quando atualizar professional, sincronizar dados em users
    IF (TG_OP = 'UPDATE') THEN
        UPDATE users
        SET 
            cro = NEW.crc,
            specialty = NEW.specialty,
            council = NEW.council,
            agenda_color = NEW.color,
            photo_url = COALESCE(users.photo_url, NEW.photo_url),
            payment_release_rule = NEW.payment_release_rule
        WHERE id = NEW.id;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 8.2 Criar trigger
DROP TRIGGER IF EXISTS trigger_sync_user_professional_unified ON professionals;
CREATE TRIGGER trigger_sync_user_professional_unified
AFTER INSERT OR UPDATE OR DELETE ON professionals
FOR EACH ROW
EXECUTE FUNCTION sync_user_professional_unified();

RAISE NOTICE '✅ Trigger de sincronização criado';

-- ============================================
-- FASE 9: VALIDAÇÃO FINAL
-- ============================================

-- 9.1 Verificar integridade
DO $$
DECLARE
    orphan_professionals INTEGER;
    orphan_appointments INTEGER;
    users_without_prof_id INTEGER;
BEGIN
    -- Profissionais órfãos (sem user)
    SELECT COUNT(*) INTO orphan_professionals
    FROM professionals p
    LEFT JOIN users u ON p.id = u.id
    WHERE u.id IS NULL;
    
    -- Appointments órfãos (doctor_id inválido)
    SELECT COUNT(*) INTO orphan_appointments
    FROM appointments a
    LEFT JOIN users u ON a.doctor_id = u.id
    WHERE u.id IS NULL;
    
    -- Users clínicos sem professional_id
    SELECT COUNT(*) INTO users_without_prof_id
    FROM users u
    WHERE u.is_clinical_provider = true
      AND u.professional_id IS NULL;
    
    RAISE NOTICE '🔍 VALIDAÇÃO FINAL:';
    RAISE NOTICE '   - Profissionais órfãos: % (deve ser 0)', orphan_professionals;
    RAISE NOTICE '   - Appointments órfãos: % (deve ser 0)', orphan_appointments;
    RAISE NOTICE '   - Users clínicos sem professional_id: % (deve ser 0)', users_without_prof_id;
    
    IF orphan_professionals > 0 OR orphan_appointments > 0 OR users_without_prof_id > 0 THEN
        RAISE WARNING '⚠️ Ainda existem inconsistências! Revisar dados.';
    ELSE
        RAISE NOTICE '✅ SUCESSO TOTAL! Banco unificado.';
    END IF;
END $$;

-- ============================================
-- FASE 10: RELATÓRIO FINAL
-- ============================================

-- 10.1 Estatísticas finais
DO $$
DECLARE
    total_users INTEGER;
    total_professionals INTEGER;
    total_clinical_users INTEGER;
    total_appointments INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_users FROM users;
    SELECT COUNT(*) INTO total_professionals FROM professionals;
    SELECT COUNT(*) INTO total_clinical_users FROM users WHERE is_clinical_provider = true;
    SELECT COUNT(*) INTO total_appointments FROM appointments;
    
    RAISE NOTICE '📊 ESTATÍSTICAS FINAIS:';
    RAISE NOTICE '   - Total de usuários: %', total_users;
    RAISE NOTICE '   - Total de profissionais: %', total_professionals;
    RAISE NOTICE '   - Usuários clínicos: %', total_clinical_users;
    RAISE NOTICE '   - Total de agendamentos: %', total_appointments;
    RAISE NOTICE '';
    RAISE NOTICE '🎯 RESULTADO: users.id = professionals.id (ID ÚNICO)';
    RAISE NOTICE '🎯 Google Calendar e Agenda Clínica agora usam o MESMO ID';
    RAISE NOTICE '🎯 Fim dos fantasmas no banco de dados!';
END $$;

COMMIT;

-- ============================================
-- INSTRUÇÕES PÓS-EXECUÇÃO
-- ============================================

-- 1. Verificar logs acima para garantir 0 órfãos
-- 2. Testar criação de novo profissional
-- 3. Testar sincronização Google Calendar
-- 4. Testar agendamento na agenda
-- 5. Se tudo OK, deletar tabela de backup:
--    DROP TABLE professionals_backup_unify;
--    DROP TABLE professional_id_mapping;

-- ============================================
-- ROLLBACK (Se necessário)
-- ============================================

-- Em caso de erro, restaurar backup:
-- DELETE FROM professionals;
-- INSERT INTO professionals SELECT * FROM professionals_backup_unify;
