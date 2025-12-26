# 💼 Professional Ledger - Extrato do Profissional (Módulo D)

## 📋 Visão Geral

O **Professional Ledger** é o sistema de controle financeiro individual de cada profissional. Ele garante que **comissões só sejam pagas quando o dinheiro realmente entrar no caixa**, protegendo a clínica de pagar antecipadamente e depois não receber do paciente.

---

## 🎯 Princípio Fundamental

### ❌ **Modelo Tradicional (Perigoso)**
```
Procedimento executado → Comissão paga imediatamente
Problema: E se o paciente não pagar?
```

### ✅ **Modelo Clinic Pro (Seguro)**
```
Parcela recebida → Comissão proporcional creditada
Proteção: Só paga comissão sobre dinheiro que entrou
```

---

## 🛠️ Arquivos Criados

### 1. **`services/professionalLedgerService.ts`**

Serviço completo com:

```typescript
// Get ledger entries
const entries = await professionalLedgerService.getLedgerEntries(professionalId, {
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    entryType: 'CREDIT',
    category: 'COMMISSION'
});

// Get balance
const balance = await professionalLedgerService.getProfessionalBalance(professionalId);
// Returns: total_credits, total_debits, current_balance, available_for_withdrawal

// Calculate commission on payment
const calculation = await professionalLedgerService.calculateCommissionOnPayment(
    installmentId,
    professionalId,
    clinicId
);

// Credit commission
await professionalLedgerService.creditCommission(calculation);

// Debit costs
await professionalLedgerService.debitCost(
    professionalId,
    clinicId,
    'LAB_COST',
    500,
    'Custo de laboratório - Coroa Cerâmica'
);

// Process withdrawal
await professionalLedgerService.processWithdrawal(
    professionalId,
    clinicId,
    1500,
    'Saque mensal'
);
```

### 2. **`components/professional/ProfessionalLedger.tsx`**

Componente visual com:
- 4 cards de saldo (Créditos, Débitos, Saldo Atual, Disponível)
- Filtros por tipo (Todos, Créditos, Débitos)
- Lista detalhada de movimentações
- Indicadores visuais por categoria

### 3. **`supabase/migrations/20241225_professional_ledger.sql`**

Migration que:
- Adiciona colunas necessárias à tabela existente
- Atualiza constraints de categoria
- Cria view `professional_balances`
- Configura RLS policies

---

## 💰 Como Funciona na Prática

### Cenário: Procedimento de R$ 10.000 em 10x

**Setup:**
- Procedimento: Implante (R$ 10.000)
- Parcelamento: 10x de R$ 1.000
- Comissão do Dentista: 30%
- Comissão Total Potencial: R$ 3.000

**Fluxo:**

```
Mês 1: Cliente paga parcela 1 (R$ 1.000)
→ Sistema credita: R$ 300 (30% de R$ 1.000)
→ Saldo do Dentista: R$ 300

Mês 2: Cliente paga parcela 2 (R$ 1.000)
→ Sistema credita: R$ 300
→ Saldo do Dentista: R$ 600

Mês 3: Cliente NÃO paga (inadimplente)
→ Sistema NÃO credita nada
→ Saldo do Dentista: R$ 600 (mantém)

Mês 4: Cliente regulariza e paga 2 parcelas (R$ 2.000)
→ Sistema credita: R$ 600 (30% de R$ 2.000)
→ Saldo do Dentista: R$ 1.200
```

**Resultado:**
- Cliente pagou: R$ 4.000 (4 parcelas)
- Dentista recebeu: R$ 1.200 (30% do que entrou)
- Clínica protegida: Não pagou R$ 3.000 antecipadamente

---

## 📊 Tipos de Lançamentos

### Créditos (CREDIT)

| Categoria | Descrição | Exemplo |
|-----------|-----------|---------|
| **COMMISSION** | Comissão sobre procedimento | R$ 300 (30% de R$ 1.000) |
| **ADJUSTMENT** | Ajuste manual de crédito | Bonificação de R$ 500 |

### Débitos (DEBIT)

| Categoria | Descrição | Exemplo |
|-----------|-----------|---------|
| **LAB_COST** | Custo de laboratório compartilhado | R$ 200 (coroa cerâmica) |
| **MATERIAL_COST** | Custo de material compartilhado | R$ 50 (anestésico) |
| **WITHDRAWAL** | Saque do profissional | R$ 1.500 (pagamento mensal) |
| **ADJUSTMENT** | Ajuste manual de débito | Desconto de R$ 100 |

---

## 🔗 Integração com Receivables

O Professional Ledger se integra automaticamente com o módulo de Contas a Receber:

```typescript
// Em receivablesService.ts
async markAsPaid(installmentId: string, paymentMethod: string) {
    // 1. Marca parcela como paga
    await supabase.from('installments').update({ status: 'PAID' })...
    
    // 2. Dispara cálculo de comissão
    await professionalLedgerService.onInstallmentPaid(
        installmentId,
        professionalId,
        clinicId
    );
}
```

---

## 📈 Cálculo de Comissão

### Fórmula Base

```typescript
// Exemplo: Parcela de R$ 1.000, comissão 30%
const gross_value = 1000;
const commission_percent = 30;

// Se a clínica deduz impostos primeiro
const tax_rate = 6; // Simples Nacional
const taxable_value = gross_value * (1 - tax_rate / 100); // R$ 940
const commission = taxable_value * (commission_percent / 100); // R$ 282

// Se não deduz impostos
const commission = gross_value * (commission_percent / 100); // R$ 300
```

### Configuração por Clínica

```sql
-- Em clinics table
commission_calculation_base: 'NET_RECEIPT' | 'GROSS_SALE'
tax_rate_percent: 6.00
commission_trigger: 'RECEIPT' | 'ISSUANCE'
```

---

## 🎨 Interface Visual

### Extrato do Profissional

```
┌─────────────────────────────────────────────────────────────┐
│  💰 Créditos: R$ 12.500  |  💸 Débitos: R$ 3.200           │
│  📊 Saldo Atual: R$ 9.300 |  ✅ Disponível: R$ 9.300       │
└─────────────────────────────────────────────────────────────┘

Filtros: [Todos] [Créditos] [Débitos]

┌──────────────────────────────────────────────────────────────┐
│  ✅ CRÉDITO - Comissão                                       │
│  Comissão sobre parcela paga - R$ 1.000,00 (30%)            │
│  📅 25/12/2024 10:30                                         │
│  + R$ 300,00                                                 │
├──────────────────────────────────────────────────────────────┤
│  ❌ DÉBITO - Custo Lab                                       │
│  Custo de laboratório - Coroa Cerâmica                       │
│  📅 20/12/2024 14:15                                         │
│  - R$ 200,00                                                 │
└──────────────────────────────────────────────────────────────┘
```

---

## 🧪 Testes Sugeridos

### Teste 1: Comissão Proporcional
1. Criar orçamento de R$ 10.000 em 10x
2. Marcar 3 parcelas como pagas (R$ 3.000)
3. Verificar que dentista recebeu R$ 900 (30% de R$ 3.000)
4. Marcar mais 2 parcelas como pagas (R$ 2.000)
5. Verificar que dentista recebeu mais R$ 600
6. Total: R$ 1.500 (30% de R$ 5.000 recebidos)

### Teste 2: Débito de Laboratório
1. Criar lançamento de custo de lab (R$ 500)
2. Verificar que saldo diminuiu
3. Tentar sacar valor maior que disponível
4. Verificar que sistema bloqueia

### Teste 3: Saque
1. Profissional com saldo de R$ 2.000
2. Solicitar saque de R$ 1.500
3. Verificar que saldo ficou R$ 500
4. Tentar sacar R$ 1.000
5. Verificar erro de saldo insuficiente

---

## 🔐 Proteções Implementadas

1. ✅ **Comissão Proporcional**: Só paga sobre dinheiro recebido
2. ✅ **Validação de Saldo**: Não permite saque maior que disponível
3. ✅ **Auditoria Completa**: Todo lançamento é registrado
4. ✅ **Rastreabilidade**: Cada entrada tem referência ao documento original

---

## 📊 Relatórios Disponíveis

### Extrato Mensal
```typescript
const summary = await professionalLedgerService.getCommissionSummary(
    professionalId,
    '2024-12-01',
    '2024-12-31'
);

// Returns:
// - total_commissions: R$ 4.500
// - entries_count: 15
// - total_net: R$ 4.500
```

### Balanço Geral
```typescript
const balance = await professionalLedgerService.getProfessionalBalance(professionalId);

// Returns:
// - total_credits: R$ 12.500
// - total_debits: R$ 3.200
// - current_balance: R$ 9.300
// - available_for_withdrawal: R$ 9.300
```

---

## ✅ Status do Módulo D

**Implementado:**
- ✅ professionalLedgerService (lógica completa)
- ✅ Cálculo de comissão proporcional
- ✅ Débitos de lab/material
- ✅ Sistema de saque
- ✅ ProfessionalLedger component (UI)
- ✅ Migration compatível com schema existente
- ✅ View de balanços

**Pendente (Integrações):**
- ⏳ Integração com receivablesService (trigger automático)
- ⏳ Relatório de fechamento mensal
- ⏳ Exportação de extratos (PDF)
- ⏳ Dashboard de performance por profissional

**Próximo:** Módulo E - Financial Health Dashboard (DRE, PDD, Fluxo de Caixa)

---

## 🎯 Resumo da Fintech Completa

| Módulo | Status | Proteção |
|--------|--------|----------|
| **A - Credit Engine** | ✅ | Markup de boleto cobre risco |
| **B - Payment Simulator** | ✅ | Subsídio cruzado, cláusula legal |
| **C - Receivables** | ✅ | Régua de cobrança, trava de lab |
| **D - Professional Ledger** | ✅ | Comissão só sobre recebimento |
| **E - CFO Dashboard** | ⏳ | DRE, PDD, fluxo de caixa |

**Sistema Completo de Proteção Financeira Implementado!** 🛡️💰
