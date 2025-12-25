# 🚀 Instruções de Deploy - Agent Orchestrator

## Passo a Passo Visual

### 1️⃣ Acessar o Dashboard do Supabase

1. Abra seu navegador
2. Vá para: **https://supabase.com/dashboard**
3. Faça login (se necessário)
4. Selecione o projeto: **huturwlbouvucjnwaoze**

---

### 2️⃣ Navegar até Edge Functions

1. No **menu lateral esquerdo**, procure por: **Edge Functions**
2. Clique em **Edge Functions**
3. Você verá uma tela com título "Edge Functions"

---

### 3️⃣ Criar Nova Função

1. Clique no botão **"Create a new function"** (ou "+ New Function")
2. Uma tela de criação aparecerá

---

### 4️⃣ Configurar a Função

**Nome da função:**
```
agent-orchestrator
```

**Importante:** Digite exatamente `agent-orchestrator` (tudo minúsculo, com hífen)

---

### 5️⃣ Colar o Código

1. No editor de código que aparece, **DELETE TODO** o código de exemplo
2. Abra o arquivo: `EDGE_FUNCTION_CODE.txt` (está na mesma pasta)
3. **Copie TODO** o conteúdo do arquivo (Ctrl+A, Ctrl+C)
4. **Cole** no editor do Supabase (Ctrl+V)

---

### 6️⃣ Deploy

1. Clique no botão **"Deploy function"** (ou "Save")
2. Aguarde a mensagem de confirmação: **"Function deployed successfully"**
3. A função estará ativa!

---

### 7️⃣ Verificar Deploy

Após o deploy, você deve ver:
- ✅ Status: **Active** ou **Deployed**
- ✅ URL: `https://huturwlbouvucjnwaoze.supabase.co/functions/v1/agent-orchestrator`

---

## 🧪 Testar Após Deploy

Volte ao **SQL Editor** e execute:

```sql
-- Inserir novo lead de teste
DO $$
DECLARE
  v_clinic_id UUID;
BEGIN
  SELECT id INTO v_clinic_id FROM clinics LIMIT 1;

  INSERT INTO leads (
    clinic_id, name, phone, email, source, 
    desired_treatment, status, tags
  )
  VALUES (
    v_clinic_id, 
    'Teste Deploy - VIP', 
    '11988887777', 
    'deploy@test.com', 
    'Instagram', 
    'Cervicoplastia', 
    'NEW',
    '["TESTE_DEPLOY"]'::jsonb
  );
END $$;

-- Aguarde 3 segundos e verifique os logs
SELECT 
  agent_name, status, message_sent, 
  metadata->>'priority' as priority,
  created_at
FROM agent_logs 
WHERE agent_name = 'sniper'
ORDER BY created_at DESC 
LIMIT 3;
```

**Resultado esperado:**
- ✅ Status mudou de `PENDING` para `DELIVERED`
- ✅ `message_sent` contém "Sniper acionado para..."

---

## 📊 Ver Logs da Edge Function (Opcional)

1. No Dashboard do Supabase
2. Vá em **Edge Functions** → **agent-orchestrator**
3. Clique na aba **Logs**
4. Você verá as mensagens do console:
   - 🎯 SNIPER AGENT ACTIVATED
   - 🔥 LEAD VIP DETECTADO
   - etc.

---

## ❓ Problemas Comuns

### "Function not found"
- Aguarde 30 segundos após deploy
- Verifique se o nome é exatamente `agent-orchestrator`

### "Unauthorized"
- Verifique se as chaves em `system_settings` estão corretas

### Nenhum log aparece
- Confirme que os triggers foram aplicados
- Verifique se `pg_net` está habilitado

---

## ✅ Checklist Final

- [ ] Edge Function criada com nome `agent-orchestrator`
- [ ] Código colado completamente (259 linhas)
- [ ] Deploy realizado com sucesso
- [ ] Teste executado
- [ ] Status mudou para `DELIVERED`
- [ ] Logs aparecem no Dashboard

---

**Após completar, o Squad BOS estará 100% operacional!** 🎉
