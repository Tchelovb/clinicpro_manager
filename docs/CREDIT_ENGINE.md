# 🏦 Credit Engine - Motor de Análise de Risco

## 📋 Visão Geral

O **Credit Engine** é o coração da Fintech Odontológica. Ele analisa o CPF do paciente/lead e determina:
- **Score de Crédito** (simulado ou via API externa)
- **Tier de Risco** (A, B, C, D)
- **Condições de Pagamento** permitidas
- **Markup de Boleto** (subsídio cruzado)

---

## 🎯 Matriz de Risco

| Tier | Score | Classificação | Parcelas Máx | Entrada Mín | Avalista | Markup Boleto | Permite Boleto |
|------|-------|---------------|--------------|-------------|----------|---------------|----------------|
| **A** | > 800 | Excelente | 24x | 0% | Não | 10% | ✅ Sim |
| **B** | 600-799 | Bom | 12x | 20% | Não | 20% | ✅ Sim |
| **C** | 400-599 | Regular | 6x | 40% | **Sim** | 35% | ✅ Sim |
| **D** | < 400 | Restrito | 1x | 100% | Não | 0% | ❌ **Bloqueado** |

---

## 🛠️ Arquivos Criados

### 1. **`services/creditRiskService.ts`**
Serviço principal com:
- `analyzeCreditRisk()` - Consulta score e retorna análise completa
- `calculateBoletoMarkup()` - Calcula markup baseado no tier
- `getPaymentOptions()` - Retorna opções Smart vs Crediário

### 2. **`components/credit/CreditAnalysisWidget.tsx`**
Widget React para:
- Input de CPF com máscara
- Exibição visual do resultado (Score, Tier, Recomendações)
- Modo compacto para integração em formulários

### 3. **`supabase/migrations/20241225_credit_profiles.sql`**
Tabela `credit_profiles` para armazenar:
- Histórico de análises
- Cache de 30 dias (evita consultas duplicadas)

---

## 📦 Como Usar

### Exemplo 1: Análise Standalone

```typescript
import { creditRiskService } from './services/creditRiskService';

const result = await creditRiskService.analyzeCreditRisk('12345678901', patientId);

console.log(result.score); // 750
console.log(result.tier); // 'B'
console.log(result.recommendation); // "Cliente bom. Máximo 12x com 20% de entrada."
```

### Exemplo 2: Calcular Preços (Smart vs Crediário)

```typescript
const baseValue = 10000; // Preço base do procedimento
const tier = 'B'; // Resultado da análise

const options = creditRiskService.getPaymentOptions(tier, baseValue);

console.log(options.smart.price); // R$ 10.000 (sem markup)
console.log(options.boleto.price); // R$ 12.000 (com 20% de markup)
```

### Exemplo 3: Widget no Formulário de Orçamento

```tsx
import { CreditAnalysisWidget } from './components/credit/CreditAnalysisWidget';

<CreditAnalysisWidget
    patientId={patient.id}
    onAnalysisComplete={(result) => {
        // Atualizar estado do orçamento com as condições permitidas
        setMaxInstallments(result.profile.maxInstallments);
        setMinDownPayment(result.profile.minDownPayment);
        
        // Calcular preços
        const options = creditRiskService.getPaymentOptions(result.tier, totalValue);
        setSmartPrice(options.smart.price);
        setBoletoPrice(options.boleto?.price || null);
    }}
/>
```

---

## 🔐 Integração com API Externa (Produção)

No arquivo `creditRiskService.ts`, substitua a função `fetchCreditScore()`:

```typescript
async fetchCreditScore(cpf: string): Promise<number> {
    const response = await fetch(`${process.env.CREDIT_API_URL}/score`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.CREDIT_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cpf })
    });
    
    if (!response.ok) throw new Error('Falha ao consultar score');
    
    const data = await response.json();
    return data.score;
}
```

**APIs Recomendadas:**
- **Serasa Experian** - https://developer.serasaexperian.com.br/
- **Boa Vista SCPC** - https://www.boavistaservicos.com.br/
- **Quod** - https://www.quod.com.br/

---

## 🎨 Próximos Passos

1. **Integrar no `BudgetForm.tsx`**
   - Adicionar `<CreditAnalysisWidget />` no topo do formulário
   - Exibir duas opções de preço: Smart e Crediário
   - Bloquear boleto se Tier D

2. **Criar Simulador de Parcelas**
   - Componente que mostra tabela de parcelas
   - Respeita `maxInstallments` e `minDownPayment` do tier

3. **Adicionar Cláusula Automática no Contrato**
   - Se escolher Boleto, injetar texto legal no PDF:
     > "O paciente reconhece este documento como título executivo extrajudicial..."

4. **Dashboard de Risco**
   - Gráfico de distribuição de tiers (A, B, C, D)
   - Taxa de inadimplência por tier
   - PDD (Provisão para Devedores Duvidosos)

---

## 🛡️ Proteções Implementadas

✅ **Proteção contra Calote**: Markup embute prêmio de risco  
✅ **Cache de Análises**: Evita custos duplicados de API  
✅ **Validação de CPF**: Formato e dígitos verificadores  
✅ **Tier D Bloqueado**: Não permite boleto para alto risco  

---

**Status:** ✅ **Motor de Risco Implementado**  
**Próximo Módulo:** Simulador de Orçamento com Subsídio Cruzado
