# 🚀 Guia de Deploy Manual - Agent Orchestrator

**Situação:** Supabase CLI não instalado  
**Solução:** Deploy via Dashboard do Supabase

---

## ⚡ DEPLOY RÁPIDO (5 minutos)

### Passo 1: Acessar Edge Functions no Dashboard

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. No menu lateral: **Edge Functions**
4. Clique em **"Create a new function"**

### Passo 2: Configurar a Função

**Nome da função:** `agent-orchestrator`

**Código:** Copie TODO o conteúdo do arquivo:
```
supabase/functions/agent-orchestrator/index.ts
```

### Passo 3: Deploy

1. Cole o código no editor
2. Clique em **"Deploy function"**
3. Aguarde a mensagem: **"Function deployed successfully"**

### Passo 4: Obter a URL

Após o deploy, a URL será:
```
https://[seu-project-id].supabase.co/functions/v1/agent-orchestrator
```

---

## ⚙️ CONFIGURAR CHAVES (CRÍTICO)

Execute no **SQL Editor** do Supabase:

```sql
-- Substitua [SEU-PROJECT-ID] pelo ID real do seu projeto
INSERT INTO system_settings (key, value, description)
VALUES ('edge_function_url', 'https://[SEU-PROJECT-ID].supabase.co/functions/v1', 'URL base das Edge Functions')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Substitua [SUA-SERVICE-ROLE-KEY] pela chave em Settings > API > service_role
INSERT INTO system_settings (key, value, description)
VALUES ('service_role_key', '[SUA-SERVICE-ROLE-KEY]', 'Chave Service Role')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

**Onde encontrar:**
- **Project ID**: Na URL do dashboard (ex: `abcdefgh.supabase.co`)
- **Service Role Key**: Settings → API → `service_role` (secret key)

---

## 🧪 TESTAR

Execute o arquivo: `supabase/TEST_SQUAD_BOS.sql`

**Resultado esperado:**
- ✅ Lead criado com temperatura "HOT"
- ✅ Tags: ["DIAMOND", "HIGH_TICKET", "TESTE"]
- ✅ Log do Sniper em `agent_logs`

---

## 🐛 Troubleshooting

### Erro: "Function not found"
- Verifique se o nome é exatamente `agent-orchestrator`
- Aguarde 30 segundos após deploy

### Erro: "Unauthorized"
- Verifique se a `service_role_key` está correta
- Confirme que não tem espaços extras

### Nenhum log aparece
- Verifique se os triggers foram aplicados (Migration 1 e 1.1)
- Confirme que `pg_net` está habilitado

---

## 📋 Checklist

- [ ] Edge Function deployada no Dashboard
- [ ] `edge_function_url` configurada em `system_settings`
- [ ] `service_role_key` configurada em `system_settings`
- [ ] Teste executado com sucesso
- [ ] Log do Sniper aparece em `agent_logs`

---

**Próximo passo:** Após deploy bem-sucedido, execute `TEST_SQUAD_BOS.sql`
