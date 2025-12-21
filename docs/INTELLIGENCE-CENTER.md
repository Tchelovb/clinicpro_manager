# 📊 Intelligence Center - Arquitetura Completa

## 🎯 Filosofia: Tripé da Gestão Inteligente

O Intelligence Center opera em **3 camadas de profundidade**, economizando tokens da API e maximizando performance:

### **Camada 1: Radar (Dashboards)** 📈
- Visualização rápida de métricas
- Gráficos de tendência
- KPIs em tempo real
- **Custo**: Zero tokens (dados em cache)

### **Camada 2: Arquivo (Relatórios Detalhados)** 📋
- Listas filtráveis e exportáveis
- Drill-down em cada transação
- Views SQL otimizadas
- **Custo**: Zero tokens (queries diretas)

### **Camada 3: Mente (BOS Insights)** 🧠
- Análise estratégica sob demanda
- Geração de planos de ação
- Alertas proativos
- **Custo**: Tokens apenas quando necessário

---

## 🗃️ Views SQL Criadas

### 1. **vw_cash_flow** - Fluxo de Caixa
```sql
SELECT * FROM vw_cash_flow 
WHERE clinic_id = 'SEU_ID'
  AND date >= '2024-01-01'
ORDER BY date DESC;
```

**Campos:**
- `flow_type`: ENTRADA ou SAÍDA
- `category`: Categoria da transação
- `amount`: Valor
- `month`, `year`: Agregadores temporais

**Uso:** Projeção de caixa, análise de receitas vs despesas

---

### 2. **vw_receivables** - Inadimplência
```sql
SELECT * FROM vw_receivables 
WHERE clinic_id = 'SEU_ID'
  AND payment_status = 'VENCIDO'
ORDER BY days_overdue DESC;
```

**Campos:**
- `payment_status`: PAGO, PENDENTE, VENCIDO
- `days_overdue`: Dias de atraso
- `patient_name`, `patient_phone`: Contato

**Uso:** Gestão de inadimplência, projeção de recebíveis

---

### 3. **vw_leads_roi** - ROI por Origem
```sql
SELECT source, 
       COUNT(*) as total_leads,
       SUM(converted_value) as total_revenue
FROM vw_leads_roi 
WHERE clinic_id = 'SEU_ID'
GROUP BY source
ORDER BY total_revenue DESC;
```

**Campos:**
- `source`: Canal de origem (Instagram, Google, etc.)
- `conversion_status`: CONVERTEU ou NÃO CONVERTEU
- `converted_value`: Valor gerado

**Uso:** Decisão de investimento em marketing

---

### 4. **vw_budget_funnel** - Funil de Orçamentos
```sql
SELECT * FROM vw_budget_funnel 
WHERE clinic_id = 'SEU_ID'
  AND status = 'SENT'
  AND temperature = 'QUENTE'
ORDER BY total_value DESC;
```

**Campos:**
- `temperature`: QUENTE (≤3 dias), MORNO (4-10), FRIO (>10)
- `days_in_funnel`: Tempo no funil
- `total_value`: Valor do orçamento

**Uso:** Priorização de follow-up, recovery

---

### 5. **vw_schedule_occupancy** - Taxa de Ocupação
```sql
SELECT day_of_week,
       COUNT(*) as total_appointments,
       AVG(productivity_score) as avg_productivity
FROM vw_schedule_occupancy 
WHERE clinic_id = 'SEU_ID'
  AND date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY day_of_week;
```

**Campos:**
- `productivity_score`: 1 (realizado), 0.5 (pendente), 0 (cancelado)
- `day_of_week`: 0-6 (Domingo-Sábado)
- `hour_of_day`: Horário do atendimento

**Uso:** Otimização de horários, expansão de equipe

---

### 6. **vw_income_statement** - DRE Gerencial
```sql
SELECT period,
       gross_revenue,
       total_expenses,
       net_profit,
       profit_margin_percent
FROM vw_income_statement 
WHERE clinic_id = 'SEU_ID'
ORDER BY period DESC
LIMIT 12;
```

**Campos:**
- `gross_revenue`: Receita bruta
- `salary_expenses`, `rent_expenses`, etc.: Despesas detalhadas
- `net_profit`: Lucro líquido
- `profit_margin_percent`: Margem de lucro

**Uso:** Análise de lucratividade, decisões estratégicas

---

### 7. **vw_executive_kpis** - Dashboard Executivo
```sql
SELECT * FROM vw_executive_kpis 
WHERE clinic_id = 'SEU_ID';
```

**Retorna em 1 query:**
- Receita e despesas do mês
- Leads ativos
- Orçamentos pendentes e valor
- Total de pacientes
- Agendamentos próximos 7 dias
- Taxa de conversão geral

**Uso:** Visão 360° da clínica em segundos

---

## 🚀 Como Usar no Frontend

### Integração com React Query:

```typescript
// hooks/useIntelligenceReports.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export const useCashFlow = (clinicId: string, startDate?: string) => {
    return useQuery({
        queryKey: ['cash-flow', clinicId, startDate],
        queryFn: async () => {
            let query = supabase
                .from('vw_cash_flow')
                .select('*')
                .eq('clinic_id', clinicId);
            
            if (startDate) {
                query = query.gte('date', startDate);
            }
            
            const { data, error } = await query.order('date', { ascending: false });
            
            if (error) throw error;
            return data;
        },
    });
};

export const useReceivables = (clinicId: string, statusFilter?: string) => {
    return useQuery({
        queryKey: ['receivables', clinicId, statusFilter],
        queryFn: async () => {
            let query = supabase
                .from('vw_receivables')
                .select('*')
                .eq('clinic_id', clinicId);
            
            if (statusFilter) {
                query = query.eq('payment_status', statusFilter);
            }
            
            const { data, error } = await query.order('due_date', { ascending: true });
            
            if (error) throw error;
            return data;
        },
    });
};

// ... outros hooks
```

---

## 💡 Integração com BOS (Modo Sob Demanda)

### Exemplo de Botão "Pedir Insight ao BOS":

```typescript
// No componente de relatório
<button onClick={() => {
    const prompt = `
        Analisando o fluxo de caixa dos últimos 30 dias:
        ${JSON.stringify(cashFlowData)}
        
        Identifique os 3 principais gargalos financeiros e sugira ações imediatas.
    `;
    
    sendMessage(prompt); // Hook do BOS Chat
}}>
    🧠 Pedir Análise ao BOS
</button>
```

**Resultado:** BOS analisa os dados da view e gera insights estratégicos apenas quando solicitado.

---

## 📈 Roadmap de Expansão

### Fase 2: Relatórios Avançados
- [ ] **Análise de Cohort**: Retenção de pacientes por período de cadastro
- [ ] **Lifetime Value (LTV)**: Valor médio por paciente
- [ ] **CAC por Canal**: Custo de aquisição por origem de lead
- [ ] **Rentabilidade por Procedimento**: Margem por tipo de tratamento

### Fase 3: Automações
- [ ] **Alertas Automáticos**: BOS notifica quando KPI sair do padrão
- [ ] **Relatórios Agendados**: Envio automático por email semanalmente
- [ ] **Benchmarking**: Comparação com médias do setor

---

## 🔒 Segurança e Performance

### RLS (Row Level Security):
Todas as views respeitam o `clinic_id` e só retornam dados da clínica autenticada.

### Índices Otimizados:
- `idx_transactions_date`: Queries temporais ultra-rápidas
- `idx_budgets_status_clinic`: Filtros de funil em <10ms
- `idx_leads_source_clinic`: ROI por canal instantâneo

### Caching Recomendado:
- Views de KPIs: Cache de 5 minutos
- Views de listas: Sem cache (dados em tempo real)
- DRE: Cache de 1 hora

---

## 🏛️ Vantagens Estratégicas

### Para o Operacional:
✅ Decisões baseadas em dados reais, não intuição  
✅ Identificação rápida de inadimplência  
✅ Otimização de agenda e recursos  

### Para o Comercial:
✅ ROI claro de cada canal de marketing  
✅ Priorização científica de follow-ups  
✅ Previsão precisa de fechamento  

### Para o Financeiro:
✅ DRE gerencial em segundos  
✅ Projeção de caixa confiável  
✅ Análise de lucratividade por período  

### Para o BOS:
✅ Economia de tokens (só analisa quando pedido)  
✅ Contexto rico para insights profundos  
✅ Alertas proativos em anomalias  

---

**O Intelligence Center agora é uma máquina de decisão!** 🚀📊💼
