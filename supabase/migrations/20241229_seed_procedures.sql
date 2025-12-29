-- ============================================
-- SEED DATA - PROCEDIMENTOS HIGH TICKET
-- População de Procedimentos Padrão para Clínicas
-- ============================================

CREATE OR REPLACE FUNCTION seed_procedures_for_clinic(p_clinic_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Verificar se já existem procedimentos para esta clínica
  IF NOT EXISTS (SELECT 1 FROM procedures WHERE clinic_id = p_clinic_id) THEN
    INSERT INTO procedures (clinic_id, name, category, estimated_duration, base_price, is_active) VALUES
    -- Cirurgia Plástica Facial
    (p_clinic_id, 'Cervicoplastia (Lifting de Pescoço)', 'CIRURGIA', 180, 15000, true),
    (p_clinic_id, 'Lip Lifting (Elevação de Lábio)', 'CIRURGIA', 90, 8000, true),
    (p_clinic_id, 'Temporal Smart (Preenchimento Temporal)', 'HOF', 60, 3500, true),
    (p_clinic_id, 'Blefaroplastia (Cirurgia de Pálpebras)', 'CIRURGIA', 120, 12000, true),
    
    -- Harmonização Orofacial (HOF)
    (p_clinic_id, 'Harmonização Facial Completa', 'HOF', 120, 12000, true),
    (p_clinic_id, 'Preenchimento Labial', 'HOF', 45, 2500, true),
    (p_clinic_id, 'Toxina Botulínica (Botox)', 'HOF', 30, 1800, true),
    (p_clinic_id, 'Bichectomia', 'HOF', 60, 4500, true),
    (p_clinic_id, 'Preenchimento de Bigode Chinês', 'HOF', 45, 2800, true),
    
    -- Implantodontia
    (p_clinic_id, 'Implante Unitário', 'IMPLANTE', 90, 3500, true),
    (p_clinic_id, 'Protocolo Branemark (Arcada Completa)', 'IMPLANTE', 240, 45000, true),
    (p_clinic_id, 'All-on-4', 'IMPLANTE', 180, 35000, true),
    (p_clinic_id, 'All-on-6', 'IMPLANTE', 210, 40000, true),
    (p_clinic_id, 'Enxerto Ósseo', 'IMPLANTE', 120, 5000, true),
    (p_clinic_id, 'Levantamento de Seio Maxilar', 'IMPLANTE', 150, 6500, true),
    
    -- Estética Dental
    (p_clinic_id, 'Facetas de Porcelana (por dente)', 'ESTETICA', 60, 2500, true),
    (p_clinic_id, 'Lentes de Contato Dental (por dente)', 'ESTETICA', 60, 3000, true),
    (p_clinic_id, 'Clareamento a Laser', 'ESTETICA', 90, 1500, true),
    (p_clinic_id, 'Design de Sorriso Completo (20 dentes)', 'ESTETICA', 120, 25000, true),
    
    -- Ortodontia
    (p_clinic_id, 'Aparelho Ortodôntico Fixo Metálico', 'ORTODONTIA', 60, 8000, true),
    (p_clinic_id, 'Aparelho Ortodôntico Estético (Safira)', 'ORTODONTIA', 60, 12000, true),
    (p_clinic_id, 'Invisalign (Alinhadores Invisíveis)', 'ORTODONTIA', 60, 18000, true),
    
    -- Prótese
    (p_clinic_id, 'Prótese Total (Dentadura)', 'PROTESE', 120, 6000, true),
    (p_clinic_id, 'Prótese Protocolo sobre Implante', 'PROTESE', 180, 28000, true),
    (p_clinic_id, 'Coroa de Porcelana', 'PROTESE', 60, 1800, true),
    (p_clinic_id, 'Coroa de Zircônia', 'PROTESE', 60, 2500, true);
    
    RAISE NOTICE 'Procedimentos High Ticket criados para clínica %', p_clinic_id;
  ELSE
    RAISE NOTICE 'Procedimentos já existem para clínica %', p_clinic_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION seed_procedures_for_clinic(UUID) IS 'Popula 26 procedimentos High Ticket padrão para uma clínica odontológica';

-- ============================================
-- EXEMPLO DE USO
-- ============================================

-- Para popular dados de uma clínica específica:
-- SELECT seed_procedures_for_clinic('uuid-da-clinica-aqui');

-- Para popular dados de TODAS as clínicas que ainda não têm procedimentos:
-- SELECT seed_procedures_for_clinic(id) FROM clinics WHERE id NOT IN (SELECT DISTINCT clinic_id FROM procedures);
