-- ============================================
-- SEED DATA - CRM (ORIGENS E ESTÁGIOS)
-- População de Dados CRM Padrão
-- ============================================

-- Função para popular origens de lead
CREATE OR REPLACE FUNCTION seed_lead_sources_for_clinic(p_clinic_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Verificar se já existem origens de lead para esta clínica
  IF NOT EXISTS (SELECT 1 FROM lead_sources WHERE clinic_id = p_clinic_id) THEN
    INSERT INTO lead_sources (clinic_id, name, is_active) VALUES
    (p_clinic_id, 'Instagram', true),
    (p_clinic_id, 'Facebook', true),
    (p_clinic_id, 'Google Ads', true),
    (p_clinic_id, 'Site Oficial', true),
    (p_clinic_id, 'Indicação de Paciente', true),
    (p_clinic_id, 'WhatsApp Business', true),
    (p_clinic_id, 'LinkedIn', true),
    (p_clinic_id, 'TikTok', true),
    (p_clinic_id, 'Evento/Feira', true),
    (p_clinic_id, 'Parcerias', true),
    (p_clinic_id, 'Outdoor/Mídia Física', true),
    (p_clinic_id, 'Outros', true);
    
    RAISE NOTICE 'Origens de Lead criadas para clínica %', p_clinic_id;
  ELSE
    RAISE NOTICE 'Origens de Lead já existem para clínica %', p_clinic_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Função para popular estágios de CRM em um pipeline
CREATE OR REPLACE FUNCTION seed_crm_stages_for_pipeline(p_pipeline_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Verificar se já existem estágios para este pipeline
  IF NOT EXISTS (SELECT 1 FROM crm_stages WHERE pipeline_id = p_pipeline_id) THEN
    INSERT INTO crm_stages (pipeline_id, name, stage_order, color) VALUES
    (p_pipeline_id, 'Novo Lead', 1, '#3b82f6'),
    (p_pipeline_id, 'Contato Inicial', 2, '#8b5cf6'),
    (p_pipeline_id, 'Triagem/Qualificação', 3, '#06b6d4'),
    (p_pipeline_id, 'Avaliação Agendada', 4, '#10b981'),
    (p_pipeline_id, 'Orçamento Enviado', 5, '#f59e0b'),
    (p_pipeline_id, 'Negociação', 6, '#ef4444'),
    (p_pipeline_id, 'Fechado/Ganho', 7, '#22c55e'),
    (p_pipeline_id, 'Perdido', 8, '#64748b');
    
    RAISE NOTICE 'Estágios de CRM criados para pipeline %', p_pipeline_id;
  ELSE
    RAISE NOTICE 'Estágios já existem para pipeline %', p_pipeline_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Função combinada para popular dados CRM completos
CREATE OR REPLACE FUNCTION seed_crm_data_for_clinic(p_clinic_id UUID, p_pipeline_id UUID DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
  -- Popular origens de lead
  PERFORM seed_lead_sources_for_clinic(p_clinic_id);
  
  -- Popular estágios de CRM se pipeline_id fornecido
  IF p_pipeline_id IS NOT NULL THEN
    PERFORM seed_crm_stages_for_pipeline(p_pipeline_id);
  END IF;
  
  RAISE NOTICE 'Seed data CRM completo para clínica %', p_clinic_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION seed_lead_sources_for_clinic(UUID) IS 'Popula 12 origens de lead padrão para uma clínica';
COMMENT ON FUNCTION seed_crm_stages_for_pipeline(UUID) IS 'Popula 8 estágios de CRM padrão para um pipeline';
COMMENT ON FUNCTION seed_crm_data_for_clinic(UUID, UUID) IS 'Popula origens de lead e opcionalmente estágios de CRM';

-- ============================================
-- EXEMPLO DE USO
-- ============================================

-- Para popular apenas origens de lead:
-- SELECT seed_lead_sources_for_clinic('uuid-da-clinica');

-- Para popular origens + estágios de um pipeline:
-- SELECT seed_crm_data_for_clinic('uuid-da-clinica', 'uuid-do-pipeline');

-- Para popular estágios em todos os pipelines de uma clínica:
-- SELECT seed_crm_stages_for_pipeline(id) FROM crm_pipelines WHERE clinic_id = 'uuid-da-clinica';
