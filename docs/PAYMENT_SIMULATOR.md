# 💰 Simulador de Orçamento com Subsídio Cruzado

## 📋 Visão Geral

O **Simulador de Orçamento** apresenta **duas opções de preço** ao paciente, baseadas no perfil de crédito:

1. **Valor Smart** (Cartão/Pix) - Preço base sem markup
2. **Valor Crediário** (Boleto/Carnê) - Preço base + Markup de risco

O markup do boleto funciona como um **subsídio cruzado**: clientes de baixo risco pagam um prêmio que cobre a inadimplência dos de alto risco.

---

## 🎯 Estratégia de Precificação

### Exemplo Prático: Procedimento de R$ 10.000

| Tier | Score | Valor Smart | Markup | Valor Crediário | Economia Smart |
|------|-------|-------------|--------|-----------------|----------------|
| **A** | 850 | R$ 10.000 | +10% | R$ 11.000 | R$ 1.000 |
| **B** | 700 | R$ 10.000 | +20% | R$ 12.000 | R$ 2.000 |
| **C** | 500 | R$ 10.000 | +35% | R$ 13.500 | R$ 3.500 |
| **D** | 300 | R$ 10.000 | N/A | ❌ Bloqueado | - |

### Por Que Funciona?

- **Cliente Tier A** paga R$ 11.000 no boleto, mas tem baixíssimo risco de calote
- **Cliente Tier C** paga R$ 13.500, compensando o risco de 40% de inadimplência
- **Resultado:** A clínica mantém margem saudável mesmo com calotes

---

## 🛠️ Componentes Criados

### 1. **`PaymentSimulator.tsx`**

Componente principal que exibe:
- Duas opções lado a lado (Smart vs Crediário)
- Configuração de parcelas e entrada
- Cálculo automático de valores
- Aviso legal para boleto

**Props:**
```typescript
interface PaymentSimulatorProps {
    baseValue: number;           // Valor base do procedimento
    creditTier?: RiskTier;       // Tier do Credit Engine
    onSelectOption?: (option: 'smart' | 'boleto', config: PaymentConfig) => void;
    className?: string;
}
```

**Uso:**
```tsx
<PaymentSimulator
    baseValue={10000}
    creditTier="B"
    onSelectOption={(option, config) => {
        console.log('Opção:', option);
        console.log('Parcelas:', config.installments);
        console.log('Valor da parcela:', config.installmentValue);
    }}
/>
```

### 2. **`BudgetWithCreditFlow.tsx`**

Fluxo completo em 3 etapas:
1. **Análise de Crédito** (CreditAnalysisWidget)
2. **Simulação de Pagamento** (PaymentSimulator)
3. **Confirmação** (Resumo final)

**Uso:**
```tsx
<BudgetWithCreditFlow
    patientId={patient.id}
    budgetValue={15000}
    onConfirm={(data) => {
        // data.creditAnalysis - Resultado da análise
        // data.payment - Configuração escolhida
        // Gerar contrato com esses dados
    }}
/>
```

---

## 📊 Fluxo de Dados

```
1. Usuário digita CPF
   ↓
2. Credit Engine analisa → Retorna Tier (A, B, C ou D)
   ↓
3. PaymentSimulator calcula:
   - Valor Smart = baseValue
   - Valor Crediário = baseValue + markup[tier]
   ↓
4. Usuário escolhe opção e configura parcelas
   ↓
5. Sistema gera contrato com:
   - Valor total
   - Parcelas
   - Cláusula legal (se boleto)
```

---

## 🔐 Proteções Implementadas

### 1. **Tier D Bloqueado**
```typescript
if (creditTier === 'D') {
    // Boleto não disponível
    // Apenas Cartão/Pix à vista
}
```

### 2. **Entrada Mínima Obrigatória**
```typescript
// Tier C exige 40% de entrada
const minDownPayment = profile.minDownPayment; // 40
setDownPaymentPercent(Math.max(downPaymentPercent, minDownPayment));
```

### 3. **Limite de Parcelas**
```typescript
// Tier B: máximo 12x
const maxInstallments = profile.maxInstallments; // 12
setInstallments(Math.min(installments, maxInstallments));
```

### 4. **Cláusula Legal Automática**
Se o paciente escolher **Boleto**, o sistema exibe:

> ⚠️ **Importante:**  
> O contrato incluirá cláusula de confissão de dívida, constituindo título executivo extrajudicial conforme Art. 784, III do CPC.

Isso garante que, em caso de inadimplência, a clínica pode executar a dívida judicialmente sem precisar de processo de conhecimento.

---

## 🎨 Interface Visual

### Opção Smart (Azul)
- Ícone: Cartão de Crédito
- Cor: Azul (#3B82F6)
- Destaque: "Melhor custo-benefício"

### Opção Crediário (Roxo)
- Ícone: Documento
- Cor: Roxo (#8B5CF6)
- Destaque: "Facilita o acesso"
- Aviso: Markup visível (ex: "+R$ 2.000 (20% markup)")

### Tier D (Vermelho)
- Ícone: Alerta
- Cor: Vermelho (#EF4444)
- Mensagem: "Boleto Não Disponível - Score insuficiente"

---

## 📝 Próximos Passos

### Módulo C: Gestão de Caixa & Contas a Receber

1. **Visualização Kanban de Parcelas**
   - Colunas: A Vencer | Vencidas | Pagas
   - Drag & drop para marcar como pago

2. **Régua de Cobrança Automatizada**
   - D-3: Lembrete amigável
   - D+1: Aviso de vencimento
   - D+15: Bloqueio de agenda

3. **Trava de Custo de Terceiros**
   - Bloquear envio para laboratório se:
     ```
     valorPagoPeloCliente < estimated_lab_cost
     ```

### Módulo D: Extrato do Profissional

1. **Professional Ledger**
   - Créditos: Comissões proporcionais ao recebimento
   - Débitos: Custos de material/lab compartilhados

2. **Cálculo de Comissão**
   ```typescript
   // Exemplo: Procedimento de R$ 10.000, comissão 30%
   // Cliente pagou 3 de 10 parcelas
   comissaoLiberada = (10000 * 0.30) * (3/10) = R$ 900
   ```

---

## 🧪 Testes Sugeridos

### Teste 1: Cliente Tier A
- CPF: 111.111.111-18 (último dígito 8 → Score 850)
- Resultado esperado:
  - Smart: R$ 10.000
  - Crediário: R$ 11.000 (10% markup)
  - Parcelas: até 24x

### Teste 2: Cliente Tier D
- CPF: 111.111.111-10 (último dígito 0 → Score 300)
- Resultado esperado:
  - Smart: R$ 10.000
  - Crediário: ❌ Bloqueado
  - Apenas à vista

### Teste 3: Cliente Tier C com Entrada
- CPF: 111.111.111-12 (último dígito 2 → Score 500)
- Configurar: 40% entrada + 6x
- Resultado esperado:
  - Entrada: R$ 5.400 (40% de R$ 13.500)
  - 6x de R$ 1.350

---

## ✅ Status do Módulo B

**Implementado:**
- ✅ PaymentSimulator component
- ✅ Cálculo de markup por tier
- ✅ Configuração de parcelas e entrada
- ✅ Validação de limites (min/max)
- ✅ Aviso legal para boleto
- ✅ Fluxo completo (BudgetWithCreditFlow)

**Próximo:** Módulo C - Gestão de Caixa & Régua de Cobrança
