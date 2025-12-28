-- ============================================
-- Insert Default Pipeline and Stages
-- Based on actual crm_pipelines schema
-- ============================================

-- Insert default pipeline
INSERT INTO crm_pipelines (clinic_id, name, is_default, active)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000', -- ⚠️ REPLACE with your clinic_id
    'Funil High Ticket',
    true,
    true
)
ON CONFLICT DO NOTHING
RETURNING id;

-- Insert stages
INSERT INTO crm_stages (pipeline_id, name, color, stage_order)
VALUES
    ((SELECT id FROM crm_pipelines WHERE name = 'Funil High Ticket' AND clinic_id = '550e8400-e29b-41d4-a716-446655440000' LIMIT 1), 'Novo Lead', '#3b82f6', 1),
    ((SELECT id FROM crm_pipelines WHERE name = 'Funil High Ticket' AND clinic_id = '550e8400-e29b-41d4-a716-446655440000' LIMIT 1), 'Em Contato', '#f59e0b', 2),
    ((SELECT id FROM crm_pipelines WHERE name = 'Funil High Ticket' AND clinic_id = '550e8400-e29b-41d4-a716-446655440000' LIMIT 1), 'Agendado', '#8b5cf6', 3),
    ((SELECT id FROM crm_pipelines WHERE name = 'Funil High Ticket' AND clinic_id = '550e8400-e29b-41d4-a716-446655440000' LIMIT 1), 'Orçamento Enviado', '#ec4899', 4),
    ((SELECT id FROM crm_pipelines WHERE name = 'Funil High Ticket' AND clinic_id = '550e8400-e29b-41d4-a716-446655440000' LIMIT 1), 'Negociação', '#f97316', 5),
    ((SELECT id FROM crm_pipelines WHERE name = 'Funil High Ticket' AND clinic_id = '550e8400-e29b-41d4-a716-446655440000' LIMIT 1), 'Fechado', '#10b981', 6),
    ((SELECT id FROM crm_pipelines WHERE name = 'Funil High Ticket' AND clinic_id = '550e8400-e29b-41d4-a716-446655440000' LIMIT 1), 'Perdido', '#ef4444', 7)
ON CONFLICT DO NOTHING;

-- Verify
SELECT * FROM crm_pipelines WHERE clinic_id = '550e8400-e29b-41d4-a716-446655440000';
SELECT s.* FROM crm_stages s 
JOIN crm_pipelines p ON s.pipeline_id = p.id 
WHERE p.clinic_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY s.stage_order;

