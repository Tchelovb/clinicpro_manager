# Agent Orchestrator Edge Function

**Versão:** MVP 1.0 (Phase 2)  
**Status:** Pronto para Deploy

## Descrição

Edge Function que recebe eventos dos triggers do banco de dados e roteia para os agentes apropriados (Sniper, Guardian, Caretaker).

## Funcionalidades (MVP)

### ✅ Implementado
- Roteamento de eventos para 3 agentes
- Logging detalhado no console
- Atualização de `agent_logs` com status DELIVERED
- Classificação de prioridade (HIGH/STANDARD)
- Abordagem diferenciada por dias de atraso (Guardian)
- Sequência de follow-up definida (Caretaker)

### 🔜 Próxima Fase (Phase 3)
- Integração OpenAI para geração de mensagens
- Integração WhatsApp API (Waha/Twilio)
- Notificações push para Dr. Marcelo (leads VIP)
- Agendamento automático de follow-ups
- Coleta de NPS
- Sugestões de upsell inteligentes

## Deploy

### Pré-requisitos
1. Supabase CLI instalado
2. Projeto Supabase configurado

### Comandos

```bash
# Login no Supabase
supabase login

# Link ao projeto
supabase link --project-ref [seu-project-id]

# Deploy da função
supabase functions deploy agent-orchestrator

# Verificar logs
supabase functions logs agent-orchestrator
```

### Variáveis de Ambiente

As seguintes variáveis são automaticamente injetadas pelo Supabase:
- `SUPABASE_URL` - URL do projeto
- `SUPABASE_SERVICE_ROLE_KEY` - Chave service role

## Configuração do Banco de Dados

Execute no SQL Editor do Supabase:

```sql
-- Configurar URL da Edge Function
ALTER DATABASE postgres SET app.edge_function_url = 'https://[seu-project-id].supabase.co/functions/v1';

-- Configurar Service Role Key
ALTER DATABASE postgres SET app.service_role_key = '[sua-service-role-key]';
```

## Testando

### Teste Manual (SQL)

```sql
-- Inserir lead High-Ticket para testar Sniper
INSERT INTO leads (clinic_id, name, phone, email, source, desired_treatment, status)
VALUES (
  '[seu-clinic-id]',
  'João Silva',
  '11999999999',
  'joao@test.com',
  'Instagram',
  'Cervicoplastia',
  'NEW'
);

-- Verificar logs
SELECT * FROM agent_logs 
WHERE agent_name = 'sniper' 
ORDER BY created_at DESC 
LIMIT 5;
```

### Verificar Logs da Edge Function

```bash
# Logs em tempo real
supabase functions logs agent-orchestrator --tail

# Logs recentes
supabase functions logs agent-orchestrator
```

## Estrutura de Resposta

### Sucesso
```json
{
  "success": true,
  "result": {
    "agent": "sniper",
    "action": "logged",
    "priority": "HIGH",
    "next_steps": "VIP approach + Dr. Marcelo notification (Phase 3)"
  }
}
```

### Erro
```json
{
  "success": false,
  "error": "Error message"
}
```

## Logs do Console

### Sniper (High-Ticket)
```
🎯 ========== SNIPER AGENT ACTIVATED ==========
📋 Lead ID: abc-123
👤 Name: João Silva
💉 Procedure: Cervicoplastia
⚡ Priority: HIGH
💎 High-Ticket: YES
📱 Phone: 11999999999

🔥 [SNIPER ALERT] LEAD VIP DETECTADO: João Silva
   Procedimento: Cervicoplastia
   Ação: Notificar Dr. Marcelo + Abordagem VIP

✅ [SNIPER] Processamento concluído
```

### Guardian
```
🛡️ ========== GUARDIAN AGENT ACTIVATED ==========
📋 Installment ID: xyz-456
👤 Patient: Maria Santos
💰 Amount: R$ 500
📅 Days Overdue: 3
🔄 Attempt #1
📱 Phone: 11988888888

💬 [GUARDIAN] Abordagem: friendly_reminder
   Mensagem: "Olá Maria Santos, identificamos pendência de R$ 500..."

✅ [GUARDIAN] Processamento concluído
```

### Caretaker
```
💚 ========== CARETAKER AGENT ACTIVATED ==========
📋 Treatment ID: def-789
👤 Patient: Pedro Costa
💉 Procedure: Blefaroplastia
🏥 Category: HOF
⏱️ Recovery Days: 7
📱 Phone: 11977777777

💬 [CARETAKER] Sequência de Follow-up:
   24h: Como está se sentindo após o procedimento?
   7d: Acompanhamento semanal - tudo bem?
   30d: Satisfação + NPS + Upsell

✅ [CARETAKER] Processamento concluído
```

## Troubleshooting

### Erro: "relation agent_logs does not exist"
Execute a Migration 0 (Phase 0) primeiro.

### Erro: "could not connect to server"
Verifique se as variáveis de ambiente estão configuradas no banco.

### Trigger não dispara
Verifique se a Migration 1 (Phase 1) foi aplicada e se `pg_net` está habilitado.

## Próximos Passos

1. ✅ Deploy da função
2. ✅ Configurar variáveis de ambiente no banco
3. ✅ Testar com lead fake
4. 🔜 Phase 3: Integrar OpenAI
5. 🔜 Phase 3: Integrar WhatsApp
6. 🔜 Phase 3: Implementar notificações push
