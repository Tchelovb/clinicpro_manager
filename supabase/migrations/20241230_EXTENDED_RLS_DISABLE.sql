-- DISABLE RLS FOR REMAINING CRITICAL TABLES (EXTENSION)
-- Ensuring Zero Guest Protocol works without hidden blockers

ALTER TABLE clinic_kpis DISABLE ROW LEVEL SECURITY;
ALTER TABLE business_goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles_lookup DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_queue DISABLE ROW LEVEL SECURITY;
ALTER TABLE professional_schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_chat_history DISABLE ROW LEVEL SECURITY;

-- Confirming status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY rowsecurity DESC;
