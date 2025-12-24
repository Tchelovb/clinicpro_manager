# 🤖 Arquitetura de Agentes Autônomos BOS (Squad de Inteligência)

**Conceito:** 3 Agentes de IA operando 24/7 integrados ao Supabase  
**Versão:** 1.0  
**Status:** Planejamento → Implementação

---

## 🏛️ O Squad BOS

### Agente 01: The Sniper (Comercial)
**Codinome:** SNIPER-01  
**Missão:** Converter leads High-Ticket com precisão cirúrgica

#### Responsabilidades
- **Qualificação Inteligente** - Analisar perfil do lead (procedimento, orçamento, urgência)
- **Abordagem Personalizada** - Script adaptado ao procedimento (Cervicoplastia vs Implantes)
- **Agendamento Automático** - Criar appointment em horário ideal
- **Follow-up Persistente** - Sequência de 7 dias até conversão ou descarte

#### Gatilhos de Ativação
```sql
-- Trigger: Novo lead High-Ticket
CREATE TRIGGER activate_sniper
AFTER INSERT ON leads
FOR EACH ROW
WHEN (NEW.procedure IN ('Cervicoplastia', 'Lip Lifting', 'Lifting Temporal', 'Blefaroplastia', 'Implantes', 'Protocolo'))
EXECUTE FUNCTION notify_sniper_agent();
```

#### Fluxo de Trabalho
1. **Detecção:** Lead High-Ticket entra no sistema
2. **Análise:** Extrai dados (nome, procedimento, telefone, origem)
3. **Qualificação:** Envia mensagem WhatsApp inicial (template aprovado)
4. **Engajamento:** Responde dúvidas e qualifica interesse
5. **Agendamento:** Propõe data/hora para consulta
6. **Confirmação:** Cria registro em `appointments` e notifica equipe

#### Contexto de IA
```
Você é o Sniper, especialista em conversão High-Ticket da HarmonyFace.
Seu objetivo: Agendar consulta com Dr. Marcelo para {procedimento}.
Tom: Profissional, empático, consultivo (não vendedor).
Referências: Casos de sucesso, diferenciais técnicos, garantias.
```

---

### Agente 02: The Guardian (Financeiro)
**Codinome:** GUARDIAN-02  
**Missão:** Recuperar inadimplência e proteger receita

#### Responsabilidades
- **Monitoramento Proativo** - Detectar parcelas vencidas em 24h
- **Comunicação Elegante** - Lembrete cordial antes de cobrança
- **Negociação Inteligente** - Propor renegociação baseada em histórico
- **Escalação Estratégica** - Acionar equipe humana em casos críticos

#### Gatilhos de Ativação
```sql
-- Cronjob: Diário às 09:00
SELECT * FROM financial_installments
WHERE due_date < CURRENT_DATE
  AND status = 'PENDING'
  AND last_reminder_sent < (CURRENT_DATE - INTERVAL '3 days');
```

#### Fluxo de Trabalho
1. **Detecção:** Parcela vencida há 1 dia
2. **Análise:** Verifica histórico (bom pagador vs inadimplente crônico)
3. **Lembrete:** Envia WhatsApp cordial (Dia 1)
4. **Follow-up:** Segunda mensagem (Dia 3)
5. **Negociação:** Propõe parcelamento (Dia 7)
6. **Escalação:** Notifica equipe financeira (Dia 10)

#### Contexto de IA
```
Você é o Guardian, gestor financeiro da HarmonyFace.
Seu objetivo: Recuperar R$ {valor} de {paciente} com empatia.
Tom: Cordial, compreensivo, mas firme.
Estratégia: Entender situação, propor solução, manter relacionamento.
```

---

### Agente 03: The Caretaker (Retenção)
**Codinome:** CARETAKER-03  
**Missão:** Pós-venda e maximização de LTV

#### Responsabilidades
- **Acompanhamento Pós-Op** - Check-in 24h, 7 dias, 30 dias após procedimento
- **Detecção de Insatisfação** - Identificar sinais de problema (sentiment analysis)
- **Upsell Inteligente** - Sugerir procedimentos complementares no timing certo
- **Recall Automático** - Lembrar retornos e manutenções

#### Gatilhos de Ativação
```sql
-- Trigger: Procedimento concluído
CREATE TRIGGER activate_caretaker
AFTER UPDATE ON treatment_items
FOR EACH ROW
WHEN (NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED')
EXECUTE FUNCTION notify_caretaker_agent();

-- Cronjob: Recalls vencidos
SELECT * FROM patient_recalls
WHERE recall_date <= CURRENT_DATE
  AND status = 'PENDING';
```

#### Fluxo de Trabalho
1. **Pós-Op Imediato:** Mensagem 24h após procedimento
2. **Acompanhamento:** Check-in semanal (primeiras 4 semanas)
3. **Satisfação:** NPS após 30 dias
4. **Upsell:** Sugestão de complementar (ex: Botox após Cervicoplastia)
5. **Recall:** Lembrete de retorno/manutenção

#### Contexto de IA
```
Você é o Caretaker, gestor de relacionamento da HarmonyFace.
Seu objetivo: Garantir satisfação e fidelização de {paciente}.
Tom: Carinhoso, atencioso, proativo.
Estratégia: Cuidar da experiência, antecipar necessidades, construir LTV.
```

---

## 🛠️ Integração Técnica

### Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    Supabase Database                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  leads   │  │financial │  │treatment │              │
│  │          │  │installm. │  │  items   │              │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
│       │             │              │                     │
│       ▼             ▼              ▼                     │
│  ┌─────────────────────────────────────┐                │
│  │        Database Triggers             │                │
│  │  - notify_sniper_agent()            │                │
│  │  - notify_guardian_agent()          │                │
│  │  - notify_caretaker_agent()         │                │
│  └─────────────┬───────────────────────┘                │
└────────────────┼───────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│              Supabase Edge Functions                     │
│  ┌──────────────────────────────────────────────────┐   │
│  │  agent-orchestrator.ts                           │   │
│  │  - Recebe webhook do trigger                     │   │
│  │  - Identifica agente correto                     │   │
│  │  - Prepara contexto                              │   │
│  │  - Chama OpenAI API                              │   │
│  │  - Envia WhatsApp via Waha/Twilio                │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│                    OpenAI API (GPT-4o)                   │
│  - Contexto: master_reference.md                        │
│  - Persona: Sniper/Guardian/Caretaker                   │
│  - Output: Mensagem personalizada                       │
└─────────────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│              WhatsApp API (Waha/Twilio)                  │
│  - Envia mensagem para paciente                         │
│  - Recebe respostas                                     │
│  - Webhook de volta para Edge Function                  │
└─────────────────────────────────────────────────────────┘
```

### Componentes

#### 1. Database Triggers (SQL)
```sql
-- Exemplo: Trigger para Sniper
CREATE OR REPLACE FUNCTION notify_sniper_agent()
RETURNS TRIGGER AS $$
BEGIN
  -- Chamar Edge Function via HTTP
  PERFORM net.http_post(
    url := 'https://[project].supabase.co/functions/v1/agent-orchestrator',
    headers := '{"Authorization": "Bearer [anon-key]"}',
    body := json_build_object(
      'agent', 'sniper',
      'lead_id', NEW.id,
      'procedure', NEW.procedure,
      'phone', NEW.phone,
      'name', NEW.name
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### 2. Edge Function (TypeScript)
```typescript
// agent-orchestrator.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { agent, lead_id, procedure, phone, name } = await req.json();
  
  // 1. Buscar contexto do master_reference.md
  const context = await loadMasterReference();
  
  // 2. Preparar prompt para OpenAI
  const prompt = buildAgentPrompt(agent, { procedure, name }, context);
  
  // 3. Chamar OpenAI
  const message = await callOpenAI(prompt);
  
  // 4. Enviar WhatsApp
  await sendWhatsApp(phone, message);
  
  // 5. Registrar log
  await logAgentAction(agent, lead_id, message);
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

#### 3. OpenAI Integration
```typescript
async function callOpenAI(prompt: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: 'Inicie o contato com o lead.' }
      ],
      temperature: 0.7,
      max_tokens: 500,
    }),
  });
  
  const data = await response.json();
  return data.choices[0].message.content;
}
```

#### 4. WhatsApp Integration
```typescript
async function sendWhatsApp(phone: string, message: string): Promise<void> {
  // Usando Waha (WhatsApp HTTP API)
  await fetch('https://waha.example.com/api/sendText', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chatId: `${phone}@c.us`,
      text: message,
    }),
  });
}
```

---

## 🚀 Roadmap de Implementação

### Fase 1: MVP Sniper (Sprint 1-2)
- [ ] Criar trigger `notify_sniper_agent` em `leads`
- [ ] Desenvolver Edge Function `agent-orchestrator`
- [ ] Integrar OpenAI API com contexto básico
- [ ] Conectar WhatsApp (Waha ou Twilio)
- [ ] Testar com 10 leads reais

### Fase 2: Guardian (Sprint 3-4)
- [ ] Criar cronjob para parcelas vencidas
- [ ] Implementar lógica de negociação
- [ ] Adicionar templates de mensagem
- [ ] Testar recuperação de inadimplência

### Fase 3: Caretaker (Sprint 5-6)
- [ ] Criar trigger pós-procedimento
- [ ] Implementar sequência de follow-up
- [ ] Adicionar NPS automático
- [ ] Testar upsell inteligente

### Fase 4: Orquestração Avançada (Sprint 7-8)
- [ ] Dashboard de monitoramento de agentes
- [ ] Métricas de performance (conversão, recuperação, LTV)
- [ ] A/B testing de mensagens
- [ ] Aprendizado contínuo (feedback loop)

---

**Versão:** 1.0  
**Data:** 24/12/2025  
**Autor:** BOS AI Architecture Team  
**Status:** Planejamento Concluído - Pronto para Implementação
