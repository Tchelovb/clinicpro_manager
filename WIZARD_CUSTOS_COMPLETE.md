# ✅ WIZARD DE CUSTOS - IMPLEMENTAÇÃO COMPLETA

**Data:** 23/12/2025  
**Status:** ✅ FUNCIONAL  
**Fase:** FASE 2 - MOTOR FINANCEIRO  
**Tarefa:** 2.1 - Wizard de Custos  
**Tempo:** ~1 hora

---

## 📋 RESUMO

Implementado com sucesso o **Wizard de Custos** - componente fundamental do Motor Financeiro que permite configurar a estrutura de custos da clínica e calcular automaticamente o **custo por minuto de cadeira produtiva**.

---

## 🎯 COMPONENTES CRIADOS

### 1. **Serviço de Cálculo** ✅
**Arquivo:** `services/costCalculatorService.ts`

**Funções:**
- `getFixedCostCategories()` - Busca categorias de custo fixo do banco
- `getFixedCostItems()` - Busca itens já cadastrados
- `saveFixedCostItems()` - Salva itens de custo
- `getCostStructure()` - Busca estrutura de custos
- `saveCostStructure()` - Salva estrutura completa
- `calculateMonthlyHours()` - Calcula horas mensais
- `calculateCostPerMinute()` - **Calcula custo por minuto**
- `calculateCostBreakdown()` - Cálculo completo detalhado
- `validateCostStructure()` - Validação de dados

### 2. **Componente Wizard** ✅
**Arquivo:** `pages/settings/CostWizard.tsx`

**4 Steps Implementados:**

#### Step 1: Custos Fixos Mensais
- ✅ Carrega automaticamente categorias do banco
- ✅ Usuário só preenche valores (R$)
- ✅ Total calculado em tempo real
- ✅ Categorias: Aluguel, Energia, Salários, etc.

#### Step 2: Pró-labore
- ✅ Input para valor mensal
- ✅ Explicação sobre o que é pró-labore
- ✅ Resumo: Custos Fixos + Pró-labore

#### Step 3: Capacidade Produtiva
- ✅ Número de cadeiras produtivas
- ✅ Horas semanais de trabalho
- ✅ Taxa de eficiência (slider 50-100%)
- ✅ Cálculo de horas mensais em tempo real

#### Step 4: Resumo e Confirmação
- ✅ Exibição de todos os dados
- ✅ **Custo por minuto destacado**
- ✅ Explicação de como usar o valor
- ✅ Botão salvar

---

## 🧮 FÓRMULA DE CÁLCULO

```
Total Custos = Custos Fixos + Pró-labore
Horas Mensais = (Cadeiras × Horas Semanais × 4) × Eficiência
Minutos Mensais = Horas Mensais × 60
Custo por Minuto = Total Custos / Minutos Mensais
```

**Exemplo:**
- Custos Fixos: R$ 10.000
- Pró-labore: R$ 5.000
- Cadeiras: 2
- Horas Semanais: 40
- Eficiência: 80%

**Resultado:**
- Total: R$ 15.000
- Horas Mensais: 256h (2 × 40 × 4 × 0.8)
- Minutos: 15.360
- **Custo/min: R$ 0,98**

---

## 🔗 INTEGRAÇÃO

### Rota Criada
- `/settings/costs` → CostWizard

### Botão de Acesso
- Settings → Financeiro → **"Configurar Custos"** (card destacado)

### Banco de Dados
**Tabelas Utilizadas:**
- `expense_category` (leitura - categorias de custo fixo)
- `fixed_cost_items` (escrita - valores por categoria)
- `clinic_cost_structure` (escrita - estrutura completa)

---

## 🎨 INTERFACE

### Card de Acesso (Settings)
```
┌──────────────────────────────────────┐
│ Wizard de Custos                     │
│ Configure a estrutura de custos e    │
│ calcule o custo por minuto           │
│                                      │
│           [Configurar Custos]        │
└──────────────────────────────────────┘
```

### Step 1 - Custos Fixos
```
┌──────────────────────────────────────┐
│ Aluguel              [R$ 3.000,00]   │
│ Energia Elétrica     [R$ 500,00]     │
│ Salários e Encargos  [R$ 10.000,00]  │
│ Internet/Telefone    [R$ 200,00]     │
│ ...                                  │
├──────────────────────────────────────┤
│ Total: R$ 13.700,00                  │
└──────────────────────────────────────┘
```

### Step 4 - Resultado
```
┌──────────────────────────────────────┐
│ Custo por Minuto de Cadeira          │
│                                      │
│        R$ 0,98                       │
│                                      │
│ Este é o valor mínimo que você       │
│ precisa gerar por minuto             │
└──────────────────────────────────────┘
```

---

## 🧪 COMO TESTAR

### 1. Acessar Wizard
1. Login no sistema
2. Menu → Configurações
3. Aba "Financeiro"
4. Clicar em **"Configurar Custos"**

### 2. Preencher Step 1
1. Ver categorias carregadas automaticamente
2. Preencher valores (ex: Aluguel R$ 3.000)
3. Ver total atualizar em tempo real
4. Clicar "Próximo"

### 3. Preencher Step 2
1. Definir pró-labore (ex: R$ 5.000)
2. Ver resumo: Custos + Pró-labore
3. Clicar "Próximo"

### 4. Preencher Step 3
1. Definir cadeiras (ex: 2)
2. Definir horas semanais (ex: 40)
3. Ajustar eficiência (ex: 80%)
4. Ver cálculo de horas mensais
5. Clicar "Próximo"

### 5. Revisar e Salvar
1. Ver resumo completo
2. Ver **Custo por Minuto** destacado
3. Clicar "Salvar Configuração"
4. ✅ Verificar toast de sucesso
5. ✅ Verificar dados no banco

---

## 📊 DADOS SALVOS NO BANCO

### Tabela: `clinic_cost_structure`
```sql
{
  clinic_id: uuid,
  fixed_costs_monthly: 13700.00,
  desired_prolabore: 5000.00,
  productive_chairs: 2,
  weekly_hours: 40,
  cost_per_minute: 0.98  -- Calculado automaticamente
}
```

### Tabela: `fixed_cost_items`
```sql
[
  { name: 'Aluguel', amount: 3000.00, category: 'ADMINISTRATIVE' },
  { name: 'Energia Elétrica', amount: 500.00, category: 'ADMINISTRATIVE' },
  { name: 'Salários e Encargos', amount: 10000.00, category: 'ADMINISTRATIVE' },
  ...
]
```

---

## 🚀 PRÓXIMOS PASSOS

### Uso do Custo por Minuto

**1. Precificação de Procedimentos:**
```typescript
const procedureDuration = 30; // minutos
const procedureCost = costPerMinute * procedureDuration;
// Ex: R$ 0,98 × 30 = R$ 29,40 (custo mínimo)
```

**2. Orçamento Profit (Tarefa 2.2):**
- Usar `cost_per_minute` para calcular custo de cada item
- Calcular margem de lucro automaticamente
- Alertar se margem < 20%

**3. Dashboard Financeiro:**
- Exibir custo por minuto em cards
- Comparar com ticket médio
- Análise de rentabilidade

---

## 💡 OBSERVAÇÕES TÉCNICAS

### Performance
- ✅ Cálculos em tempo real (sem lag)
- ✅ Validação em cada step
- ✅ Salvamento otimizado (upsert)

### UX
- ✅ Progress bar visual (4 steps)
- ✅ Navegação intuitiva (Voltar/Próximo)
- ✅ Feedback visual claro
- ✅ Explicações contextuais
- ✅ Dark mode completo

### Segurança
- ✅ Validação de dados
- ✅ Filtro por clínica (RLS)
- ✅ Valores mínimos/máximos

---

## 🐛 CORREÇÕES APLICADAS

### Dependência Instalada
- ✅ `crypto-js` instalado
- ✅ `@types/crypto-js` instalado
- ✅ Erro de import resolvido

---

## 📝 CHANGELOG

### v1.0.0 - 23/12/2025
- ✅ Criado costCalculatorService.ts
- ✅ Criado CostWizard.tsx (4 steps)
- ✅ Adicionada rota /settings/costs
- ✅ Integrado botão em Settings
- ✅ Instaladas dependências
- ✅ Dark mode completo

---

**✅ WIZARD DE CUSTOS FUNCIONAL!**

**Próxima Tarefa:** 2.2 - Orçamento Profit (12h)

**Sistema pronto para calcular custos e precificar procedimentos! 💰**
