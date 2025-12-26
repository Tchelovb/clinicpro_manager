# 💰 Gestão de Caixa & Contas a Receber (Módulo C)

## 📋 Visão Geral

O **Módulo C** implementa um sistema completo de gestão financeira com foco em **proteção de caixa** e **automação de cobrança**. Ele garante que a clínica não gaste dinheiro antes de receber e automatiza o processo de cobrança para reduzir inadimplência.

---

## 🎯 Funcionalidades Principais

### 1. **Kanban de Parcelas (Jira-Style)**
Visualização em 3 colunas:
- 🔵 **A Vencer** - Parcelas futuras
- 🔴 **Vencidas** - Parcelas em atraso
- 🟢 **Pagas** - Parcelas quitadas

### 2. **Régua de Cobrança Automatizada**
Sistema de lembretes e ações automáticas:
- **D-3:** Lembrete amigável
- **D+1:** Aviso de vencimento
- **D+15:** Bloqueio de agendamento

### 3. **Trava de Laboratório (Lab Lock)**
Proteção financeira que impede envio de pedidos ao lab até que o paciente tenha pago o suficiente para cobrir o custo.

---

## 🛠️ Arquivos Criados

### 1. **`services/receivablesService.ts`**

Serviço principal com:

```typescript
// Get installments with filters
await receivablesService.getInstallments(clinicId, {
    status: 'OVERDUE',
    startDate: '2024-01-01',
    endDate: '2024-12-31'
});

// Get statistics
const stats = await receivablesService.getStats(clinicId);
// Returns: totalPending, totalOverdue, totalPaid, overdueCount, dueThisWeek

// Mark as paid
await receivablesService.markAsPaid(installmentId, 'CREDIT_CARD', new Date().toISOString());

// Check if can send to lab
const { allowed, reason, amountPaid, amountNeeded } = await receivablesService.canSendLabOrder(
    patientId,
    budgetId,
    estimatedLabCost
);

// Run daily collection routine (cron job)
await receivablesService.runDailyCollectionRoutine(clinicId);
```

### 2. **`components/receivables/ReceivablesKanban.tsx`**

Componente visual Kanban com:
- 4 cards de estatísticas no topo
- 3 colunas de parcelas (Pending, Overdue, Paid)
- Ação rápida "Marcar como Pago"
- Indicador de dias em atraso

### 3. **`components/receivables/LabOrderLock.tsx`**

Componente de proteção com:
- Barra de progresso de pagamento
- Cálculo automático de quanto falta receber
- Bloqueio visual do botão "Enviar para Lab"
- Mensagens claras de status

---

## 📊 Régua de Cobrança (Collection Rules)

### Regra 1: Lembrete (D-3)
```typescript
{
    daysBeforeDue: 3,
    action: 'REMINDER',
    message: 'Olá {PATIENT_NAME}! Lembramos que sua parcela de R$ {AMOUNT} vence em {DAYS} dias. 😊'
}
```

### Regra 2: Aviso (D+1)
```typescript
{
    daysAfterDue: 1,
    action: 'WARNING',
    message: 'Olá {PATIENT_NAME}, sua parcela de R$ {AMOUNT} venceu ontem. Regularize para evitar bloqueios. Link: {PAYMENT_LINK}'
}
```

### Regra 3: Bloqueio (D+15)
```typescript
{
    daysAfterDue: 15,
    action: 'BLOCK_SCHEDULE',
    message: 'Sua parcela está em atraso há 15 dias. Agendamento bloqueado até regularização.'
}
```

---

## 🔐 Trava de Laboratório (Lab Lock)

### Como Funciona

```typescript
// Exemplo: Procedimento com custo de lab de R$ 2.000

// Cenário 1: Cliente pagou R$ 1.500
const result = await receivablesService.canSendLabOrder(patientId, budgetId, 2000);
// result.allowed = false
// result.reason = "Cliente precisa pagar mais R$ 500,00 antes de enviar para o laboratório."

// Cenário 2: Cliente pagou R$ 2.500
const result = await receivablesService.canSendLabOrder(patientId, budgetId, 2000);
// result.allowed = true
// Pode enviar com segurança!
```

### Uso no Componente

```tsx
<LabOrderLock
    patientId={patient.id}
    budgetId={budget.id}
    estimatedLabCost={2000}
    onProceed={() => {
        // Só executa se allowed === true
        sendToLab();
    }}
/>
```

---

## 📈 Estatísticas (Dashboard)

O serviço calcula automaticamente:

```typescript
interface ReceivablesStats {
    totalPending: number;      // Total a receber
    totalOverdue: number;      // Total vencido
    totalPaid: number;         // Total recebido
    overdueCount: number;      // Quantidade de parcelas vencidas
    dueThisWeek: number;       // Vence nos próximos 7 dias
    averageTicket: number;     // Ticket médio das parcelas
}
```

---

## 🤖 Automação (Cron Job)

### Setup Recomendado

**Opção 1: Supabase Edge Function (Cron)**
```sql
-- Create cron job to run daily at 9 AM
SELECT cron.schedule(
    'daily-collection-routine',
    '0 9 * * *',
    $$
    SELECT net.http_post(
        url := 'https://your-project.supabase.co/functions/v1/collection-routine',
        headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
    );
    $$
);
```

**Opção 2: Node.js Cron**
```typescript
import cron from 'node-cron';

// Run every day at 9 AM
cron.schedule('0 9 * * *', async () => {
    const clinics = await getAllClinics();
    
    for (const clinic of clinics) {
        await receivablesService.runDailyCollectionRoutine(clinic.id);
    }
});
```

---

## 🎨 Interface Visual

### Kanban Board

```
┌─────────────────────────────────────────────────────────────┐
│  📊 A Receber: R$ 45.000  |  ⚠️ Vencidas: R$ 12.000        │
│  ✅ Recebido: R$ 78.000   |  📅 Esta Semana: R$ 8.000      │
└─────────────────────────────────────────────────────────────┘

┌──────────────┬──────────────┬──────────────┐
│  🔵 A Vencer │  🔴 Vencidas │  🟢 Pagas    │
├──────────────┼──────────────┼──────────────┤
│  João Silva  │  Maria Costa │  Pedro Lima  │
│  R$ 1.200    │  R$ 800      │  R$ 1.500    │
│  Vence 28/12 │  15 dias     │  Pago 20/12  │
│  [Pagar]     │  [Pagar]     │  ✓           │
└──────────────┴──────────────┴──────────────┘
```

### Lab Lock

```
┌─────────────────────────────────────────┐
│  🔒 Aguardando Pagamento                │
├─────────────────────────────────────────┤
│  Progresso: ████████░░░░░░░░ 60%       │
│                                         │
│  Custo Lab:     R$ 2.000,00            │
│  Já Pago:       R$ 1.200,00            │
│  Falta:         R$ 800,00              │
│                                         │
│  ⚠️ Bloqueado                           │
│  Cliente precisa pagar mais R$ 800     │
│                                         │
│  [🔒 Aguardando Pagamento]             │
└─────────────────────────────────────────┘
```

---

## 🧪 Testes Sugeridos

### Teste 1: Marcar como Pago
1. Criar parcela com vencimento passado
2. Verificar que aparece na coluna "Vencidas"
3. Clicar em "Marcar como Pago"
4. Verificar que move para coluna "Pagas"

### Teste 2: Trava de Lab
1. Criar orçamento com `estimated_lab_cost = 2000`
2. Criar parcelas totalizando R$ 10.000
3. Marcar apenas R$ 1.500 como pago
4. Verificar que Lab Lock mostra "Bloqueado"
5. Marcar mais R$ 500 como pago
6. Verificar que Lab Lock mostra "Liberado"

### Teste 3: Régua de Cobrança
1. Criar parcela com vencimento em 3 dias
2. Executar `runDailyCollectionRoutine()`
3. Verificar que enviou lembrete (D-3)
4. Avançar data para D+1
5. Executar novamente
6. Verificar que enviou aviso

---

## 🔗 Integrações Necessárias

### WhatsApp/SMS (Para Régua de Cobrança)
```typescript
// Em receivablesService.ts, substituir:
console.log(`[COLLECTION] Sending message...`);

// Por:
await whatsappService.sendMessage(installment.patient?.phone, message);
```

### Payment Gateway (Para Link de Pagamento)
```typescript
// Gerar link de pagamento
const paymentLink = await paymentGateway.createPaymentLink({
    amount: installment.amount,
    description: `Parcela ${installment.installment_number}/${installment.total_installments}`,
    customer: {
        name: installment.patient?.name,
        phone: installment.patient?.phone
    }
});
```

---

## ✅ Status do Módulo C

**Implementado:**
- ✅ receivablesService (lógica completa)
- ✅ ReceivablesKanban (visualização)
- ✅ LabOrderLock (proteção financeira)
- ✅ Régua de cobrança (lógica)
- ✅ Cálculo de estatísticas
- ✅ Validação de status automática

**Pendente (Integrações):**
- ⏳ WhatsApp/SMS service
- ⏳ Payment gateway
- ⏳ Cron job setup
- ⏳ Bloqueio de agendamento (UI)

**Próximo:** Módulo D - Professional Ledger (Extrato do Profissional)
