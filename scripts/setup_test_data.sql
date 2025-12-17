-- Setup test data for ClinicPro
-- Run this after applying the main schema

-- Insert test clinic
INSERT INTO clinics (id, name, code, cnpj, address, phone, email)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  'Clínica Demo',
  'CLINICPRO',
  '12.345.678/0001-90',
  'Rua Exemplo, 123',
  '(11) 99999-9999',
  'contato@clinicpro.com'
) ON CONFLICT (code) DO NOTHING;

-- Note: Users must be created via Supabase Auth admin API
-- The user profile in the users table will be created by triggers or manually

-- Example user creation (requires auth.users.id):
-- INSERT INTO users (id, clinic_id, email, name, role, active)
-- VALUES ('auth_user_id_here', '550e8400-e29b-41d4-a716-446655440001'::uuid, 'admin@clinicpro.com', 'Administrador', 'ADMIN', true);