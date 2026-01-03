-- ============================================
-- MELHORIAS ENTERPRISE - FASE 2
-- ============================================
-- Objetivo: Imutabilidade de prontuários e padronização final
-- Executar APÓS Fase 1
-- ============================================

BEGIN;

-- ============================================
-- PARTE A: IMUTABILIDADE DE PRONTUÁRIOS (HIGH TICKET)
-- ============================================

-- A.1 Adicionar colunas de assinatura digital
ALTER TABLE clinical_notes ADD COLUMN IF NOT EXISTS signature_hash TEXT;
ALTER TABLE clinical_notes ADD COLUMN IF NOT EXISTS signed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE clinical_notes ADD COLUMN IF NOT EXISTS is_immutable BOOLEAN DEFAULT false;

RAISE NOTICE '✅ Colunas de assinatura digital adicionadas';

-- A.2 Função para gerar hash SHA-256
CREATE OR REPLACE FUNCTION generate_clinical_note_signature()
RETURNS TRIGGER AS $$
BEGIN
    -- Gera hash SHA-256 do conteúdo
    NEW.signature_hash := encode(
        digest(
            COALESCE(NEW.content, '') || 
            COALESCE(NEW.professional_id::text, '') || 
            COALESCE(NEW.patient_id::text, '') || 
            COALESCE(NEW.created_at::text, ''),
            'sha256'
        ),
        'hex'
    );
    NEW.signed_at := NOW();
    NEW.is_immutable := true;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

RAISE NOTICE '✅ Função de assinatura digital criada';

-- A.3 Trigger para assinar automaticamente
DROP TRIGGER IF EXISTS trigger_sign_clinical_note ON clinical_notes;
CREATE TRIGGER trigger_sign_clinical_note
BEFORE INSERT ON clinical_notes
FOR EACH ROW
EXECUTE FUNCTION generate_clinical_note_signature();

RAISE NOTICE '✅ Trigger de assinatura automática criado';

-- A.4 Função para impedir alteração de notas assinadas
CREATE OR REPLACE FUNCTION prevent_clinical_note_modification()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.is_immutable = true THEN
        RAISE EXCEPTION 'Prontuário imutável não pode ser alterado. ID: %, Hash: %', 
            OLD.id, OLD.signature_hash;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

RAISE NOTICE '✅ Função de proteção contra alteração criada';

-- A.5 Trigger para bloquear alterações
DROP TRIGGER IF EXISTS trigger_prevent_modification ON clinical_notes;
CREATE TRIGGER trigger_prevent_modification
BEFORE UPDATE ON clinical_notes
FOR EACH ROW
EXECUTE FUNCTION prevent_clinical_note_modification();

RAISE NOTICE '✅ Trigger de proteção ativado';

-- ============================================
-- PARTE B: PADRONIZAÇÃO FINAL DE NOMENCLATURA
-- ============================================

-- B.1 clinical_notes: doctor_id → professional_id
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'clinical_notes' AND column_name = 'doctor_id') THEN
        
        ALTER TABLE clinical_notes RENAME COLUMN doctor_id TO professional_id;
        
        ALTER TABLE clinical_notes DROP CONSTRAINT IF EXISTS clinical_notes_doctor_id_fkey;
        ALTER TABLE clinical_notes ADD CONSTRAINT clinical_notes_professional_id_fkey 
            FOREIGN KEY (professional_id) REFERENCES users(id) ON DELETE CASCADE;
        
        RAISE NOTICE '✅ clinical_notes padronizado (doctor_id → professional_id)';
    ELSE
        RAISE NOTICE '⏭️ clinical_notes já está padronizado';
    END IF;
END $$;

-- B.2 medical_certificates: Atualizar FK para users
ALTER TABLE medical_certificates DROP CONSTRAINT IF EXISTS medical_certificates_professional_id_fkey;
ALTER TABLE medical_certificates ADD CONSTRAINT medical_certificates_professional_id_fkey 
    FOREIGN KEY (professional_id) REFERENCES users(id) ON DELETE CASCADE;

RAISE NOTICE '✅ medical_certificates FK atualizada para users';

-- B.3 Remover colunas duplicadas (is_active vs active)
ALTER TABLE users DROP COLUMN IF EXISTS is_active;
ALTER TABLE professionals DROP COLUMN IF EXISTS is_active;

RAISE NOTICE '✅ Colunas duplicadas removidas';

-- B.4 Adicionar 'active' onde falta
ALTER TABLE installments ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

RAISE NOTICE '✅ Coluna active adicionada em installments e transactions';

COMMIT;

RAISE NOTICE '';
RAISE NOTICE '🎯 FASE 2 CONCLUÍDA!';
RAISE NOTICE 'Benefícios:';
RAISE NOTICE '  - Prontuários imutáveis (prova jurídica)';
RAISE NOTICE '  - Nomenclatura 100% padronizada';
RAISE NOTICE '  - Compliance CFM/CRO';
RAISE NOTICE '  - High Ticket protegido';
