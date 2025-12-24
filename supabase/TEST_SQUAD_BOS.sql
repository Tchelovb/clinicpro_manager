-- ============================================
-- TESTE COMPLETO DO SQUAD BOS
-- ============================================
-- Execute este script após configurar as chaves
-- e fazer deploy da Edge Function
-- ============================================

-- PASSO 1: VERIFICAR CONFIGURAÇÃO
-- ============================================

SELECT 
  key,
  CASE 
    WHEN key = 'edge_function_url' THEN 
      CASE 
        WHEN value LIKE 'https://%.supabase.co/functions/v1' THEN '✅ Configurado: ' || value
        WHEN value LIKE '%[SEU-PROJECT-ID]%' THEN '❌ ERRO: Substitua [SEU-PROJECT-ID]'
        ELSE '❌ ERRO: Formato inválido'
      END
    WHEN key = 'service_role_key' THEN
      CASE 
        WHEN length(value) > 100 THEN '✅ Configurado (' || length(value) || ' chars)'
        WHEN value LIKE '%[SUA-SERVICE-ROLE-KEY%' THEN '❌ ERRO: Substitua [SUA-SERVICE-ROLE-KEY-AQUI]'
        ELSE '❌ ERRO: Key inválida'
      END
  END as status
FROM system_settings
WHERE key IN ('edge_function_url', 'service_role_key');

-- Se aparecer ❌, pare aqui e configure primeiro!

-- ============================================
-- PASSO 2: INSERIR LEAD HIGH-TICKET (TESTE)
-- ============================================

DO $$
DECLARE
  v_clinic_id UUID;
  v_lead_id UUID;
BEGIN
  -- Pega o ID da sua clínica automaticamente
  SELECT id INTO v_clinic_id FROM clinics LIMIT 1;
  
  IF v_clinic_id IS NULL THEN
    RAISE EXCEPTION 'Nenhuma clínica encontrada! Crie uma clínica primeiro.';
  END IF;

  -- Insere o Lead VIP
  INSERT INTO leads (
    clinic_id, 
    name, 
    phone, 
    email, 
    source, 
    desired_treatment, 
    status,
    tags
  )
  VALUES (
    v_clinic_id, 
    'Paciente Teste - VIP Cervico', 
    '11999998888', 
    'teste.vip@clinicpro.com', 
    'Instagram Ads', 
    'Cervicoplastia', -- HIGH TICKET - deve acionar Sniper
    'NEW',
    '["TESTE"]'::jsonb
  )
  RETURNING id INTO v_lead_id;
  
  RAISE NOTICE '✅ Lead HIGH-TICKET criado com sucesso!';
  RAISE NOTICE '📋 Lead ID: %', v_lead_id;
  RAISE NOTICE '🎯 Sniper deve ter sido acionado automaticamente';
  RAISE NOTICE '💡 Verifique os logs abaixo...';
END $$;

-- ============================================
-- PASSO 3: VERIFICAR SE O SNIPER DISPAROU
-- ============================================

-- Aguarde 2-3 segundos e execute:

SELECT 
  agent_name as "Agente",
  event_type as "Evento",
  status as "Status",
  action_taken as "Ação",
  metadata->>'priority' as "Prioridade",
  metadata->>'procedure' as "Procedimento",
  created_at as "Criado em"
FROM agent_logs 
WHERE agent_name = 'sniper'
ORDER BY created_at DESC 
LIMIT 5;

-- ============================================
-- PASSO 4: VERIFICAR O LEAD CRIADO
-- ============================================

SELECT 
  name as "Nome",
  desired_treatment as "Procedimento",
  lead_temperature as "Temperatura",
  tags as "Tags",
  created_at as "Criado em"
FROM leads
WHERE name LIKE '%Teste%'
ORDER BY created_at DESC
LIMIT 3;

-- ============================================
-- RESULTADO ESPERADO
-- ============================================

-- ✅ SUCESSO se você ver:
-- 1. Log do Sniper com status 'PENDING' ou 'DELIVERED'
-- 2. Lead com temperatura 'HOT'
-- 3. Tags contendo ["DIAMOND", "HIGH_TICKET"]

-- ❌ FALHA se:
-- 1. Nenhum log aparece = Trigger não disparou
-- 2. Status 'FAILED' = Edge Function com erro
-- 3. Lead sem tags = Trigger não executou

-- ============================================
-- LIMPEZA (OPCIONAL)
-- ============================================

-- Para remover o lead de teste:
-- DELETE FROM leads WHERE name LIKE '%Teste%';
-- DELETE FROM agent_logs WHERE metadata->>'procedure' = 'Cervicoplastia';
