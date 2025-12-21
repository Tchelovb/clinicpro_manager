# 🚨 NÍVEIS DE ALERTA - INTELLIGENCE CENTER 7.0

## Motor de Inteligência Nativa (Zero API Cost)

---

## 📊 Classificação de Prioridades

### 🔴 **CRITICAL (Crítico)**
**Cor:** Vermelho (#DC2626)  
**Badge:** Pulsante  
**Notificação:** Push imediata  
**SLA de Resposta:** Até 2 horas

**Critérios:**
- Impacto financeiro direto > R$ 10.000
- Perda iminente de cliente VIP (LTV > R$ 10k)
- Inadimplência pós-cirúrgica > R$ 10k
- Orçamento high-ticket (> R$ 15k) parado > 3 dias

**Exemplos:**
```
💰 Orçamento High-Ticket Parado: Maria Silva
   Orçamento de R$ 25.000,00 está em negociação há 5 dias sem movimentação.
   
⚠️ Inadimplência Pós-Cirúrgica: João Santos
   Procedimento "Lifting Facial" concluído há 15 dias com saldo devedor de R$ 12.500,00.
```

---

### 🟠 **HIGH (Alta Prioridade)**
**Cor:** Laranja (#EA580C)  
**Badge:** Destacado  
**Notificação:** Diária (resumo)  
**SLA de Resposta:** Até 24 horas

**Critérios:**
- Impacto financeiro > R$ 5.000
- Lead de alta prioridade sem contato > 12h
- Paciente VIP inativo > 6 meses
- Taxa de conversão < 20% (últimos 30 dias)
- Orçamento aprovado > R$ 10k sem agendamento

**Exemplos:**
```
🔥 Lead Quente Sem Contato: Ana Paula
   Lead cadastrado há 18 horas sem nenhuma interação registrada. PRIORIDADE ALTA - Fonte: Instagram
   
👑 Paciente VIP Inativo: Carlos Mendes
   Cliente com LTV de R$ 15.000,00 não retorna há 8 meses. Risco de perda de fidelização.
```

---

### 🟡 **MEDIUM (Média Prioridade)**
**Cor:** Amarelo (#CA8A04)  
**Badge:** Normal  
**Notificação:** Semanal (resumo)  
**SLA de Resposta:** Até 3 dias

**Critérios:**
- Oportunidade de melhoria operacional
- No-show recorrente (≥ 3 faltas em 3 meses)
- Orçamento aprovado sem agendamento (< R$ 10k)
- Inadimplência pós-cirúrgica < R$ 5k

**Exemplos:**
```
🚫 Paciente com No-Show Recorrente: Pedro Lima
   Paciente faltou 4 vezes nos últimos 3 meses sem avisar. Impacto operacional: 240 minutos de agenda perdidos.
   
📅 Orçamento Aprovado Sem Agendamento: Juliana Costa
   Orçamento de R$ 7.500,00 foi aprovado há 10 dias mas o procedimento ainda não foi agendado.
```

---

### 🟢 **LOW (Baixa Prioridade)**
**Cor:** Azul (#2563EB)  
**Badge:** Discreto  
**Notificação:** Mensal (resumo)  
**SLA de Resposta:** Informativo

**Critérios:**
- Insights informativos
- Oportunidades de upsell
- Sugestões de melhoria de processo
- Tendências positivas

**Exemplos:**
```
💡 Oportunidade de Upsell: Fernanda Oliveira
   Paciente realizou Botox há 4 meses. Momento ideal para oferecer manutenção.
   
📈 Tendência Positiva: Taxa de Conversão
   Sua taxa de conversão subiu 15% este mês. Continue com as estratégias atuais!
```

---

## 🎯 Matriz de Decisão

| Prioridade | Valor em Risco | Tempo de Resposta | Ação Imediata |
|------------|----------------|-------------------|---------------|
| **CRITICAL** | > R$ 10.000 | 2 horas | ✅ Sim |
| **HIGH** | R$ 5.000 - R$ 10.000 | 24 horas | ✅ Sim |
| **MEDIUM** | R$ 1.000 - R$ 5.000 | 3 dias | ⚠️ Planejada |
| **LOW** | < R$ 1.000 | Informativo | ℹ️ Opcional |

---

## 🔔 Regras de Notificação

### **Push Notifications (Críticos)**
- Exibir badge vermelho pulsante no botão "Alertas"
- Notificação push no navegador (se permitido)
- Email automático para o gestor

### **Dashboard Highlights (High)**
- Badge laranja no botão "Alertas"
- Destaque na aba "Insights & Alertas"
- Resumo diário por email

### **Weekly Digest (Medium)**
- Listagem na aba "Insights"
- Resumo semanal por email

### **Monthly Report (Low)**
- Disponível apenas na aba "Insights"
- Relatório mensal consolidado

---

## 📋 Categorias de Insights

### **SALES (Vendas)**
- Orçamentos parados
- Taxa de conversão baixa
- Pipeline estagnado

### **MARKETING (Marketing)**
- Leads sem contato
- ROI negativo de campanhas
- Canais com baixa performance

### **FINANCIAL (Financeiro)**
- Inadimplência pós-procedimento
- Despesas acima da meta
- Ponto de equilíbrio não atingido

### **RETENTION (Fidelização)**
- Pacientes VIP inativos
- Churn risk (risco de perda)
- Oportunidades de upsell

### **OPERATIONAL (Operacional)**
- No-show recorrente
- Taxa de ocupação baixa
- Tempo de espera alto

### **CLINICAL (Clínico)**
- Orçamento aprovado sem agendamento
- Procedimentos com alta taxa de retrabalho
- NPS baixo

---

## 🎨 Design Visual por Prioridade

### **CRITICAL**
```css
border-left: 4px solid #DC2626;
background: #FEE2E2; /* Red 100 */
badge: bg-red-600 animate-pulse
icon: AlertCircle (red-600)
```

### **HIGH**
```css
border-left: 4px solid #EA580C;
background: #FFEDD5; /* Orange 100 */
badge: bg-orange-600
icon: AlertTriangle (orange-600)
```

### **MEDIUM**
```css
border-left: 4px solid #CA8A04;
background: #FEF9C3; /* Yellow 100 */
badge: bg-yellow-600
icon: Info (yellow-600)
```

### **LOW**
```css
border-left: 4px solid #2563EB;
background: #DBEAFE; /* Blue 100 */
badge: bg-blue-600
icon: CheckCircle (blue-600)
```

---

## 🔄 Ciclo de Vida do Insight

```
┌─────────────┐
│   CRIADO    │ ← Motor de Insights detecta anomalia
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    OPEN     │ ← Exibido na aba "Insights & Alertas"
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  RESOLVED   │ ← Usuário marca como resolvido (botão X)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  ARCHIVED   │ ← Auto-arquivado após 30 dias
└─────────────┘
```

---

## 🎯 Métricas de Sucesso

### **Indicadores de Performance do Motor**
- **Taxa de Resolução:** % de insights resolvidos em até 7 dias
- **Tempo Médio de Resposta:** Tempo entre criação e resolução
- **Impacto Financeiro:** Valor recuperado por insights resolvidos
- **Precisão:** % de insights que geraram ação real

### **Metas**
- ✅ 90% dos CRITICAL resolvidos em 24h
- ✅ 80% dos HIGH resolvidos em 3 dias
- ✅ Taxa de falso positivo < 10%
- ✅ Impacto financeiro > R$ 50k/mês

---

## 🚀 Integração com ChatBOS

O **ChatBOS** terá acesso à tabela `ai_insights` para:

1. **Contexto Automático:** Quando o Dr. Marcelo perguntar "O que tenho pendente?", o BOS lista os insights CRITICAL e HIGH.

2. **Análise Profunda:** O BOS pode explicar o impacto financeiro e sugerir estratégias de resolução.

3. **Priorização Inteligente:** O BOS ordena os insights por valor em risco × urgência.

**Exemplo de Interação:**
```
👤 Dr. Marcelo: "O que tenho de urgente hoje?"

🤖 BOS: "Doutor, você tem 3 alertas CRÍTICOS:

1. 💰 Orçamento de R$ 25.000 da Maria Silva parado há 5 dias
   → Ação: Ligar agora e oferecer condição especial

2. ⚠️ João Santos deve R$ 12.500 de cirurgia concluída
   → Ação: Acionar cobrança imediata

3. 🔥 Lead Ana Paula (Instagram) sem contato há 18h
   → Ação: WhatsApp urgente

Valor total em risco: R$ 37.500. Deseja que eu prepare os scripts de contato?"
```

---

## ✅ Checklist de Implementação

- [x] Motor de Insights Nativo (SQL)
- [x] 7 Sentinelas Automáticas
- [x] Sistema de Prioridades (4 níveis)
- [x] Triggers Automáticos
- [x] Função CRON para execução periódica
- [ ] Integração com ChatBOS
- [ ] Sistema de Notificações Push
- [ ] Dashboard de Métricas do Motor
- [ ] Relatórios de Performance

---

**Doutor Marcelo, o Motor de Inteligência Nativa está pronto para rodar 24/7 sem custo de API!** 🚀
