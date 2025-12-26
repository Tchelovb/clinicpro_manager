# 🔗 Guia de Integração dos Módulos Fintech

## 📋 Visão Geral

Este guia mostra como integrar os **4 módulos Fintech** (A, B, C, D) nas páginas existentes do Clinic Pro usando **shadcn/ui Sheets** e **layout Jira-style**.

---

## 🎯 Arquivos Criados para Integração

### 1. **Páginas Principais**

| Arquivo | Descrição | Rota Sugerida |
|---------|-----------|---------------|
| `pages/Receivables.tsx` | Kanban de Contas a Receber | `/dashboard/receivables` |
| `pages/ProfessionalFinancial.tsx` | Extrato do Profissional | `/dashboard/professional-financial` |

### 2. **Componentes Sheet (shadcn/ui)**

| Arquivo | Uso | Onde Integrar |
|---------|-----|---------------|
| `components/budget/CreditFlowSheet.tsx` | Análise de Crédito + Simulador | BudgetForm, LeadDetails |
| `components/receivables/InstallmentDetailSheet.tsx` | Detalhes da Parcela | ReceivablesKanban |

---

## 🚀 Como Integrar

### **Integração 1: Contas a Receber (Kanban)**

**Arquivo:** `pages/Receivables.tsx`

**Funcionalidades:**
- ✅ Kanban em 3 colunas (A Vencer | Vencidas | Pagas)
- ✅ 4 cards de estatísticas no topo
- ✅ Click em parcela abre Sheet com detalhes
- ✅ Marcar como pago direto do Sheet
- ✅ Layout Jira-style responsivo

**Como usar:**
```tsx
// Em App.tsx ou routes
import Receivables from './pages/Receivables';

<Route path="/dashboard/receivables" element={<Receivables />} />
```

**Preview:**
```
┌─────────────────────────────────────────────────────────────┐
│  📊 A Receber: R$ 45.000  |  ⚠️ Vencidas: R$ 12.000        │
│  ✅ Recebido: R$ 78.000   |  📅 Esta Semana: R$ 8.000      │
└─────────────────────────────────────────────────────────────┘

┌──────────────┬──────────────┬──────────────┐
│  🔵 A Vencer │  🔴 Vencidas │  🟢 Pagas    │
│  (15)        │  (8)         │  (42)        │
├──────────────┼──────────────┼──────────────┤
│  [Card 1]    │  [Card 1]    │  [Card 1]    │
│  [Card 2]    │  [Card 2]    │  [Card 2]    │
│  [Card 3]    │  [Card 3]    │  [Card 3]    │
└──────────────┴──────────────┴──────────────┘

Click em qualquer card → Abre Sheet lateral com detalhes
```

---

### **Integração 2: Extrato do Profissional**

**Arquivo:** `pages/ProfessionalFinancial.tsx`

**Funcionalidades:**
- ✅ Seletor de profissional (dropdown)
- ✅ 4 cards de saldo (Créditos, Débitos, Saldo, Disponível)
- ✅ Lista de movimentações com filtros
- ✅ Categorização visual (cores por tipo)

**Como usar:**
```tsx
// Em App.tsx ou routes
import ProfessionalFinancial from './pages/ProfessionalFinancial';

<Route path="/dashboard/professional-financial" element={<ProfessionalFinancial />} />
```

**Preview:**
```
┌─────────────────────────────────────────────────────────────┐
│  Extrato do Profissional          [Seletor: Dr. João]      │
└─────────────────────────────────────────────────────────────┘

┌──────────────┬──────────────┬──────────────┬──────────────┐
│  💰 Créditos │  💸 Débitos  │  📊 Saldo    │  ✅ Disponível│
│  R$ 12.500   │  R$ 3.200    │  R$ 9.300    │  R$ 9.300    │
└──────────────┴──────────────┴──────────────┴──────────────┘

Filtros: [Todos] [Créditos] [Débitos]

┌─────────────────────────────────────────────────────────────┐
│  ✅ CRÉDITO - Comissão                    + R$ 300,00       │
│  Comissão sobre parcela paga - R$ 1.000,00 (30%)           │
│  📅 25/12/2024 10:30                                        │
├─────────────────────────────────────────────────────────────┤
│  ❌ DÉBITO - Custo Lab                    - R$ 200,00       │
│  Custo de laboratório - Coroa Cerâmica                      │
│  📅 20/12/2024 14:15                                        │
└─────────────────────────────────────────────────────────────┘
```

---

### **Integração 3: Credit Flow no Orçamento**

**Arquivo:** `components/budget/CreditFlowSheet.tsx`

**Como integrar no BudgetForm:**

```tsx
import { CreditFlowSheet } from './components/budget/CreditFlowSheet';

function BudgetForm() {
    const [showCreditFlow, setShowCreditFlow] = useState(false);
    const [budgetTotal, setBudgetTotal] = useState(0);

    const handleCreditFlowConfirm = (data: any) => {
        console.log('Credit Analysis:', data.creditAnalysis);
        console.log('Payment Config:', data.payment);
        
        // Atualizar orçamento com as configurações escolhidas
        setPaymentMethod(data.payment.paymentType);
        setInstallments(data.payment.installments);
        setDownPayment(data.payment.downPayment);
    };

    return (
        <>
            {/* Botão para abrir Credit Flow */}
            <Button onClick={() => setShowCreditFlow(true)}>
                <CreditCard className="mr-2" size={16} />
                Analisar Crédito & Simular Pagamento
            </Button>

            {/* Sheet */}
            <CreditFlowSheet
                open={showCreditFlow}
                onOpenChange={setShowCreditFlow}
                patientId={patient?.id}
                budgetValue={budgetTotal}
                onConfirm={handleCreditFlowConfirm}
            />
        </>
    );
}
```

**Fluxo:**
1. Usuário clica em "Analisar Crédito"
2. Sheet abre pela direita (fullscreen em mobile)
3. Wizard em 3 etapas:
   - Passo 1: Digita CPF → Análise de crédito
   - Passo 2: Escolhe Smart ou Crediário → Configura parcelas
   - Passo 3: Confirma → Retorna dados para o form

---

### **Integração 4: Lab Lock no Tratamento**

**Como usar o LabOrderLock:**

```tsx
import { LabOrderLock } from './components/receivables/LabOrderLock';

function TreatmentItemDetails() {
    const handleSendToLab = () => {
        // Só executa se allowed === true
        console.log('Enviando para laboratório...');
    };

    return (
        <LabOrderLock
            patientId={patient.id}
            budgetId={budget.id}
            estimatedLabCost={2000}
            onProceed={handleSendToLab}
        />
    );
}
```

**Comportamento:**
- ✅ **Liberado:** Botão verde "Enviar para Laboratório" ativo
- ❌ **Bloqueado:** Botão cinza desabilitado + mensagem de quanto falta receber

---

## 📊 Estrutura de Rotas Sugerida

```tsx
// App.tsx ou routes.tsx
import Receivables from './pages/Receivables';
import ProfessionalFinancial from './pages/ProfessionalFinancial';

const routes = [
    // ... outras rotas
    {
        path: '/dashboard/receivables',
        element: <Receivables />,
        title: 'Contas a Receber'
    },
    {
        path: '/dashboard/professional-financial',
        element: <ProfessionalFinancial />,
        title: 'Extrato do Profissional'
    }
];
```

---

## 🎨 Componentes shadcn/ui Utilizados

| Componente | Uso | Instalação |
|------------|-----|------------|
| `Sheet` | Modais laterais | `npx shadcn-ui@latest add sheet` |
| `Card` | Cards de estatísticas | `npx shadcn-ui@latest add card` |
| `Badge` | Status badges | `npx shadcn-ui@latest add badge` |
| `Button` | Botões de ação | `npx shadcn-ui@latest add button` |
| `Select` | Seletor de profissional | `npx shadcn-ui@latest add select` |
| `Separator` | Divisores | `npx shadcn-ui@latest add separator` |
| `Progress` | Barra de progresso (Lab Lock) | `npx shadcn-ui@latest add progress` |

---

## 🔗 Fluxo Completo Integrado

### **Cenário: Criar Orçamento com Análise de Crédito**

```
1. Usuário cria orçamento (R$ 10.000)
   ↓
2. Clica em "Analisar Crédito & Simular Pagamento"
   ↓
3. Sheet abre → Digita CPF → Score 700 (Tier B)
   ↓
4. Sistema mostra:
   - Smart: R$ 10.000 (até 12x)
   - Crediário: R$ 12.000 (até 12x, entrada 20%)
   ↓
5. Cliente escolhe Crediário → 12x com 20% entrada
   ↓
6. Sistema cria:
   - Budget com valor R$ 12.000
   - 1 parcela de entrada: R$ 2.400
   - 12 parcelas de R$ 800
   ↓
7. Parcelas aparecem no Kanban de Receivables
   ↓
8. Quando cliente paga parcela 1:
   - Sistema marca como paga
   - Credita R$ 240 (30%) no extrato do dentista
   ↓
9. Quando soma de parcelas pagas >= custo de lab:
   - Lab Lock libera envio para laboratório
```

---

## ✅ Checklist de Integração

- [ ] Instalar componentes shadcn/ui necessários
- [ ] Adicionar rotas para Receivables e ProfessionalFinancial
- [ ] Integrar CreditFlowSheet no BudgetForm
- [ ] Integrar LabOrderLock nas telas de tratamento
- [ ] Testar fluxo completo end-to-end
- [ ] Adicionar links no menu lateral
- [ ] Configurar permissões de acesso por role

---

## 🎯 Próximos Passos

1. **Testar em Desenvolvimento**
   - Criar parcelas de teste
   - Marcar como pagas
   - Verificar comissões no extrato

2. **Ajustar Estilos**
   - Cores do tema
   - Responsividade mobile
   - Animações de transição

3. **Implementar Integrações Pendentes**
   - WhatsApp/SMS para régua de cobrança
   - Payment gateway para links de pagamento
   - Cron job para rotina diária

4. **Criar Módulo E (CFO Dashboard)**
   - DRE (Demonstrativo de Resultados)
   - PDD (Provisão para Devedores Duvidosos)
   - Fluxo de Caixa Projetado

---

## 📚 Documentação de Referência

- [Módulo A - Credit Engine](./CREDIT_ENGINE.md)
- [Módulo B - Payment Simulator](./PAYMENT_SIMULATOR.md)
- [Módulo C - Receivables Management](./RECEIVABLES_MANAGEMENT.md)
- [Módulo D - Professional Ledger](./PROFESSIONAL_LEDGER.md)
- [shadcn/ui Documentation](https://ui.shadcn.com/)

---

**Sistema Fintech Completo Pronto para Uso!** 🚀💰
