# 🦷 MÓDULO ORTODONTIA (BOS ORTHO)

**Versão:** 1.0  
**Data:** 21/12/2024  
**Status:** 🚧 Planejado (Migration criada, Frontend pendente)

---

## 📋 VISÃO GERAL

O **Módulo Ortodontia** é um sistema completo para gestão de tratamentos ortodônticos de longo prazo, combinando:

- 💰 **Modelo Financeiro de Assinatura** (inspirado no EasyDent)
- 🔬 **Controle Clínico Estruturado** (evolução com dados, não texto livre)
- 💎 **Gestão de Alinhadores High-Ticket** (Invisalign, etc.)
- 🤖 **Automações BOS** (bloqueio de inadimplentes, alertas de troca)

---

## 🎯 PROBLEMA QUE RESOLVE

### **Ortodontia ≠ Clínica Geral**

| Aspecto | Clínica Geral | Ortodontia |
|---------|---------------|------------|
| **Modelo Financeiro** | Pagou → Fez | **Assinatura** (paga mesmo sem ir) |
| **Duração** | Pontual (1 sessão) | **Longo prazo** (12-36 meses) |
| **Cobrança** | Por procedimento | **Mensalidade fixa** |
| **Inadimplência** | Não faz se não pagar | **Bloqueia manutenção** |
| **Controle Clínico** | Texto livre | **Dados estruturados** (fios, placas) |

### **Desafios Específicos:**

1. **Financeiro:** Como cobrar R$ 10.000 em 24x sem perder controle?
2. **Clínico:** Como saber em qual placa o paciente está (de 35)?
3. **Logístico:** Como controlar estoque de alinhadores?
4. **Operacional:** Como bloquear inadimplente sem perder paciente?

---

## 🏗️ ARQUITETURA DO MÓDULO

### **4 Tabelas Principais:**

```
📦 MÓDULO ORTODONTIA
│
├── 💰 ortho_contracts (Contratos/Assinaturas)
│   ├── Valor total, entrada, mensalidade
│   ├── Status (ACTIVE, SUSPENDED, COMPLETED)
│   └── Regras de bloqueio
│
├── 🔬 ortho_treatment_plans (Planos de Tratamento)
│   ├── Controle de alinhadores (atual/total)
│   ├── Fases do tratamento
│   └── Planejamento de IPR e attachments
│
├── 📋 ortho_appointments (Evolução Clínica)
│   ├── Fios, elásticos, correntes
│   ├── Alinhadores entregues
│   ├── Scores de higiene e colaboração
│   └── Planejamento próxima visita
│
└── 📦 ortho_aligner_stock (Estoque de Alinhadores)
    ├── Status de cada placa
    ├── Datas de entrega/uso
    └── Controle logístico
```

---

## 💰 MODELO FINANCEIRO

### **Exemplo Prático:**

**Tratamento:** Invisalign Full (35 placas)  
**Valor Total:** R$ 15.000  
**Entrada:** R$ 3.000 (instalação + setup)  
**Saldo:** R$ 12.000  
**Mensalidades:** 24x de R$ 500  
**Dia de Vencimento:** 10 de cada mês

### **Fluxo:**

1. **Adesão:**
   - Paciente paga R$ 3.000 de entrada
   - Sistema gera 24 parcelas de R$ 500
   - Contrato fica `ACTIVE`

2. **Mensalidades:**
   - Todo dia 10, sistema cobra R$ 500
   - Paciente paga **mesmo que não vá à consulta**
   - Cobrança é pelo "tempo de tratamento"

3. **Inadimplência:**
   - Se atrasar > 10 dias → Contrato vira `SUSPENDED`
   - Sistema **bloqueia agendamento** de manutenção
   - Recepção vê alerta ao tentar agendar

4. **Regularização:**
   - Paciente paga parcelas atrasadas
   - Contrato volta para `ACTIVE`
   - Pode agendar novamente

---

## 🔬 MODELO CLÍNICO

### **A. Aparelho Fixo (Metal/Cerâmica)**

#### **Evolução Estruturada:**

Ao invés de:
```
❌ "Ajustei aparelho, troquei fio"
```

Registramos:
```
✅ Arcada Superior: Fio 0.14 NiTi
✅ Arcada Inferior: Fio 0.16 NiTi
✅ Elásticos: Classe II, 3/16 Médio
✅ Corrente: Canino a Canino (superior)
✅ Braquetes Quebrados: 11, 21
✅ Higiene: Nota 3/5
✅ Colaboração: Nota 4/5 (usou elásticos)
✅ Próxima Visita: Trocar para fio 0.18, iniciar elásticos Classe III
```

#### **Fases do Tratamento:**

1. **DIAGNOSIS** - Diagnóstico/Planejamento
2. **LEVELING** - Nivelamento
3. **ALIGNMENT** - Alinhamento
4. **WORKING** - Fase de Trabalho
5. **SPACE_CLOSURE** - Fechamento de Espaços
6. **FINISHING** - Finalização
7. **RETENTION** - Contenção

---

### **B. Alinhadores (Invisalign, etc.)**

#### **Controle de Progresso:**

```
Paciente: Maria Silva
Tratamento: Invisalign Full

Arcada Superior: Placa 12/35 (34% concluído)
Arcada Inferior: Placa 12/35 (34% concluído)

Próxima Troca: 25/12/2024 (em 4 dias)
Status: ✅ No prazo
```

#### **Evolução Estruturada:**

```
✅ Alinhadores Entregues: #10 até #13 (4 placas)
✅ IPR Realizado: Sim (11-21, 0.3mm)
✅ Attachments Colocados: 11, 21, 31, 41
✅ Higiene: Nota 5/5 (excelente)
✅ Colaboração: Nota 5/5 (usa 22h/dia)
✅ Próxima Visita: Controle em 60 dias, entregar placas #14-#17
```

#### **Controle Logístico:**

| Placa | Arcada | Status | Entregue em | Início Real | Fim Real |
|-------|--------|--------|-------------|-------------|----------|
| #10 | Superior | COMPLETED | 01/11/2024 | 01/11/2024 | 15/11/2024 |
| #11 | Superior | COMPLETED | 01/11/2024 | 15/11/2024 | 29/11/2024 |
| #12 | Superior | IN_USE | 01/11/2024 | 29/11/2024 | - |
| #13 | Superior | DELIVERED | 01/11/2024 | - | - |
| #14 | Superior | ORDERED | - | - | - |

---

## 🤖 AUTOMAÇÕES BOS

### **1. Bloqueio de Inadimplentes**

**Trigger:** `check_ortho_contract_payment_status()`

**Lógica:**
```sql
SE paciente tem contrato ortodôntico ATIVO
E tem parcelas vencidas há mais de 10 dias
ENTÃO
  Suspender contrato
  Bloquear agendamento
  Notificar recepção
```

**Experiência do Usuário:**
```
Recepcionista tenta agendar manutenção
↓
Sistema exibe alerta vermelho:
"⚠️ Contrato Ortodôntico Suspenso
Motivo: Inadimplência - 15 dias de atraso
Valor em Atraso: R$ 1.500 (3 parcelas)
Ação: Regularizar pagamento antes de agendar"
```

---

### **2. Alerta de Troca de Alinhador**

**Trigger:** Cron job diário

**Lógica:**
```sql
SE próxima_troca_alinhador = HOJE
ENTÃO
  Enviar WhatsApp para paciente:
  "🦷 Olá Maria! Hoje é dia de trocar para o alinhador #13.
  Lembre-se: use 22h por dia para melhores resultados!"
```

---

### **3. Relatório de Aging Ortodôntico**

**View:** `ortho_contracts_aging`

**Dados:**
- Pacientes com contratos ativos
- Parcelas vencidas
- Valor em atraso
- Dias de atraso

**Uso:**
- Dashboard financeiro
- Régua de cobrança
- Priorização de contato

---

## 📊 RELATÓRIOS E DASHBOARDS

### **1. Dashboard Ortodôntico (Visão Geral)**

**KPIs:**
- 📈 Contratos Ativos: 45
- 💰 Receita Recorrente Mensal: R$ 22.500
- ⚠️ Contratos Suspensos: 3
- 📉 Taxa de Inadimplência: 6,7%

**Gráficos:**
- Evolução de contratos (mês a mês)
- Receita recorrente vs. pontual
- Taxa de conclusão de tratamentos

---

### **2. Relatório de Progresso de Alinhadores**

**View:** `ortho_aligner_progress`

**Dados:**
| Paciente | Placa Atual | Total | Progresso | Próxima Troca | Status |
|----------|-------------|-------|-----------|---------------|--------|
| Maria Silva | 12/35 | 35 | 34% | 25/12/2024 | ✅ No prazo |
| João Santos | 8/28 | 28 | 29% | 20/12/2024 | ⚠️ Hoje |
| Ana Costa | 15/35 | 35 | 43% | 18/12/2024 | 🔴 Atrasado |

---

### **3. Relatório de Higiene e Colaboração**

**Dados:**
- Média de higiene por paciente
- Média de colaboração por paciente
- Pacientes com baixa colaboração (< 3)
- Ações sugeridas

---

## 🎮 GAMIFICAÇÃO (BOS)

### **Smile Score (Pontuação do Paciente)**

**Como funciona:**
- Paciente ganha pontos por:
  - ✅ Higiene excelente (+10 pts)
  - ✅ Usar elásticos corretamente (+10 pts)
  - ✅ Trocar alinhador no prazo (+5 pts)
  - ✅ Não quebrar braquetes (+5 pts)

- Paciente perde pontos por:
  - ❌ Higiene ruim (-10 pts)
  - ❌ Não usar elásticos (-10 pts)
  - ❌ Atrasar troca de alinhador (-5 pts)
  - ❌ Quebrar braquetes (-5 pts)

**Recompensas:**
- 100+ pontos: Desconto de 10% na contenção
- 200+ pontos: Clareamento grátis
- 300+ pontos: Certificado "Paciente Modelo"

---

## 🚀 IMPLEMENTAÇÃO

### **Status Atual:**

| Componente | Status | Observação |
|------------|--------|------------|
| **Migration SQL** | ✅ Pronto | `008_orthodontics_module.sql` |
| **Backend (Services)** | 🚧 Pendente | `OrthoService.ts` |
| **Frontend (Contratos)** | 🚧 Pendente | `OrthoContractForm.tsx` |
| **Frontend (Evolução)** | 🚧 Pendente | `OrthoAppointmentForm.tsx` |
| **Frontend (Alinhadores)** | 🚧 Pendente | `AlignerTracker.tsx` |
| **Dashboards** | 🚧 Pendente | `OrthoDashboard.tsx` |
| **Automações** | 🚧 Pendente | Triggers criados, jobs pendentes |

---

### **Próximos Passos:**

#### **Sprint 1 (1 semana) - Backend**
- [ ] Executar migration `008_orthodontics_module.sql`
- [ ] Criar `OrthoService.ts`
- [ ] Criar endpoints de API
- [ ] Testar triggers e views

#### **Sprint 2 (2 semanas) - Frontend Financeiro**
- [ ] Criar `OrthoContractForm.tsx` (criar contrato)
- [ ] Criar `OrthoContractList.tsx` (listar contratos)
- [ ] Criar `OrthoAgingReport.tsx` (inadimplência)
- [ ] Integrar com geração de parcelas

#### **Sprint 3 (2 semanas) - Frontend Clínico**
- [ ] Criar `OrthoAppointmentForm.tsx` (evolução)
- [ ] Criar `OrthoTreatmentPlanForm.tsx` (planejamento)
- [ ] Criar `AlignerTracker.tsx` (controle de placas)
- [ ] Criar `OrthoTimeline.tsx` (linha do tempo)

#### **Sprint 4 (1 semana) - Dashboards**
- [ ] Criar `OrthoDashboard.tsx` (visão geral)
- [ ] Criar `AlignerProgressReport.tsx` (progresso)
- [ ] Criar `HygieneComplianceReport.tsx` (higiene)

#### **Sprint 5 (1 semana) - Automações**
- [ ] Implementar bloqueio de inadimplentes
- [ ] Implementar alertas de troca de alinhador
- [ ] Implementar notificações WhatsApp
- [ ] Implementar Smile Score

---

## 📚 REFERÊNCIAS

### **Inspirações:**
- **EasyDent** - Capítulo 30: Orthodontic Payment Plans
- **Invisalign Doctor Site** - Aligner tracking
- **Ortho2** - Clinical charting

### **Diferenciais BOS:**
- ✅ Gamificação (Smile Score)
- ✅ Bloqueio automático de inadimplentes
- ✅ Alertas de troca de alinhador
- ✅ Dados estruturados (não texto livre)
- ✅ Integração com WhatsApp

---

## 🎯 MÉTRICAS DE SUCESSO

### **Financeiro:**
- Taxa de inadimplência < 5%
- Receita recorrente previsível
- Redução de 80% no tempo de cobrança

### **Clínico:**
- 100% das evoluções com dados estruturados
- Redução de 50% em alinhadores perdidos
- Aumento de 30% na colaboração dos pacientes

### **Operacional:**
- Redução de 90% em agendamentos de inadimplentes
- Redução de 70% em ligações de cobrança
- Aumento de 40% na satisfação da equipe

---

**Última Atualização:** 21/12/2024  
**Próxima Revisão:** 28/12/2024
