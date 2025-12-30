-- ============================================
-- SEED DATA - TIPOS DE AGENDAMENTO
-- População de Tipos de Agendamento Padrão
-- ============================================

CREATE OR REPLACE FUNCTION seed_appointment_types_for_clinic(p_clinic_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Verificar se já existem tipos de agendamento para esta clínica
  IF NOT EXISTS (SELECT 1 FROM appointment_types WHERE clinic_id = p_clinic_id) THEN
    INSERT INTO appointment_types (clinic_id, name, duration_minutes, color, is_active) VALUES
    (p_clinic_id, 'Avaliação', 60, '#3b82f6', true),
    (p_clinic_id, 'Procedimento', 60, '#a855f7', true),
    (p_clinic_id, 'Retorno', 30, '#10b981', true),
    (p_clinic_id, 'Urgência', 30, '#ef4444', true);
    
    RAISE NOTICE 'Tipos de Agendamento criados para clínica %', p_clinic_id;
  ELSE
    RAISE NOTICE 'Tipos de Agendamento já existem para clínica %', p_clinic_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION seed_appointment_types_for_clinic(UUID) IS 'Popula 10 tipos de agendamento padrão para uma clínica odontológica';

-- ============================================
-- EXEMPLO DE USO
-- ============================================

-- Para popular dados de uma clínica específica:
-- SELECT seed_appointment_types_for_clinic('uuid-da-clinica-aqui');

-- Para popular dados de TODAS as clínicas que ainda não têm tipos de agendamento:
-- SELECT seed_appointment_types_for_clinic(id) FROM clinics WHERE id NOT IN (SELECT DISTINCT clinic_id FROM appointment_types);
