# 🚀 FASE 2 - REFATORAÇÃO CLINICPRO MANAGER

## 📋 PLANEJAMENTO FASE 2

**Data de Início:** 21/12/2025 20:27
**Status:** 🟡 EM ANDAMENTO
**Objetivo:** Refatorar 3 telas de alta prioridade (SCR-03, SCR-05, SCR-06)

---

## 🎯 TELAS DA FASE 2 (3/14)

### **1. SCR-03 - Agenda** ⏳ EM ANDAMENTO
**Arquivo Atual:** `components/Agenda.tsx`
**Novo Arquivo:** `pages/Agenda.tsx`
**Prioridade:** 🔴 ALTA

**Objetivo:**
- Refatorar visual do calendário
- Remover modais (NO-MODAL policy)
- Aplicar ClinicPro Design System
- Manter lógica de agendamentos

**Características a Implementar:**
- ✅ Calendário mensal limpo
- ✅ Lista de agendamentos do dia
- ✅ Filtros por profissional/status
- ✅ Botão "Novo Agendamento" → rota `/dashboard/schedule/new`
- ✅ Click no agendamento → rota `/dashboard/schedule/:id`
- ✅ Badges de status (Confirmado/Pendente/Cancelado)
- ✅ Cores por profissional

**Integração:**
```typescript
// Tabela: appointments
appointments (
  id, clinic_id, patient_id, doctor_id, date,
  duration, type, status, notes
)

// Status possíveis
type: 'EVALUATION' | 'PROCEDURE' | 'RETURN' | 'EMERGENCY'
status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
```

---

### **2. SCR-05 - Pipeline** ⏳ PENDENTE
**Arquivo Atual:** `components/HighTicketPipeline.tsx`
**Novo Arquivo:** `pages/Pipeline.tsx`
**Prioridade:** 🔴 ALTA

**Objetivo:**
- Refatorar visual do Kanban
- Aplicar ClinicPro Design System
- Manter lógica de drag & drop

**Características a Implementar:**
- ✅ Kanban com 5 colunas (Novo, Contato, Orçamento, Negociação, Fechado)
- ✅ Cards de leads com informações essenciais
- ✅ Drag & drop funcional
- ✅ Filtros por origem/prioridade
- ✅ Botão "Novo Lead" → rota `/dashboard/pipeline/new`
- ✅ Click no lead → rota `/dashboard/pipeline/:id`
- ✅ Badges de prioridade (Alta/Média/Baixa)
- ✅ Valor estimado visível

**Integração:**
```typescript
// Tabela: leads
leads (
  id, clinic_id, name, phone, email, source,
  status, interest, value, patient_id, budget_id,
  lead_score, priority, desired_treatment
)

// Status possíveis
status: 'NEW' | 'CONTACT' | 'BUDGET' | 'NEGOTIATION' | 'WON' | 'LOST'
priority: 'HIGH' | 'MEDIUM' | 'LOW'
```

---

### **3. SCR-06 - ChatBOS** ⏳ PENDENTE
**Arquivo Atual:** `components/ChatBOSPage.tsx`
**Novo Arquivo:** `pages/ChatBOS.tsx`
**Prioridade:** 🔴 ALTA

**Objetivo:**
- Refatorar visual do chat
- Estilizar como WhatsApp/ChatGPT
- Manter lógica de IA

**Características a Implementar:**
- ✅ Interface de chat moderna
- ✅ Mensagens do usuário (direita, violet)
- ✅ Mensagens do BOS (esquerda, slate)
- ✅ Input com botão enviar
- ✅ Indicador de digitação
- ✅ Scroll automático
- ✅ Histórico de conversas
- ✅ Avatar do BOS (ícone Brain)

**Integração:**
```typescript
// Lógica existente de chat
// Manter hooks e contextos atuais
// Apenas refatorar visual
```

---

## 🎨 DESIGN SYSTEM (Manter Padrão)

### **Paleta de Cores:**
- 🟣 Violet-600 (#7C3AED) - Primária
- 🟢 Teal-500 (#14B8A6) - Sucesso
- 🟡 Amber-400 (#FBBF24) - VIP
- 🔴 Rose-600 (#E11D48) - Crítico

### **Componentes:**
- Cards: `bg-white rounded-xl border-slate-200 shadow-sm`
- Buttons: `bg-violet-600 text-white rounded-lg hover:bg-violet-700`
- Badges: Semânticos (teal/amber/rose)
- Inputs: `border-slate-200 focus:ring-violet-500`

---

## 📱 RESPONSIVIDADE (Manter Padrão)

### **Mobile (<768px):**
- Cards empilhados
- Filtros em coluna
- Bottom Bar visível

### **Desktop (≥768px):**
- Grid de 2-4 colunas
- Filtros em linha
- Sidebar visível

---

## 🔒 REGRAS (Manter)

1. **NO-MODAL POLICY:** Rotas dedicadas
2. **NAVEGAÇÃO POLIMÓRFICA:** Baseada em role
3. **VISUAL HIGH-TICKET:** Amber para VIP
4. **MOBILE FIRST:** Bottom Bar + Sidebar

---

## 📊 PROGRESSO ESPERADO

**Antes da Fase 2:** 5/14 telas (36%)
**Após a Fase 2:** 8/14 telas (57%)
**Incremento:** +3 telas (+21%)

---

## 🚀 CRONOGRAMA

### **Etapa 1: Agenda (SCR-03)**
- ⏳ Criar `pages/Agenda.tsx`
- ⏳ Implementar calendário
- ⏳ Implementar lista de agendamentos
- ⏳ Testar integração

### **Etapa 2: Pipeline (SCR-05)**
- ⏳ Criar `pages/Pipeline.tsx`
- ⏳ Implementar Kanban
- ⏳ Implementar drag & drop
- ⏳ Testar integração

### **Etapa 3: ChatBOS (SCR-06)**
- ⏳ Criar `pages/ChatBOS.tsx`
- ⏳ Implementar interface de chat
- ⏳ Estilizar mensagens
- ⏳ Testar integração

### **Etapa 4: Documentação**
- ⏳ Atualizar IMPLEMENTATION_STATUS.md
- ⏳ Atualizar FINAL_SUMMARY.md
- ⏳ Criar PHASE_2_SUMMARY.md

### **Etapa 5: Deploy**
- ⏳ Commit & Push
- ⏳ Verificar build
- ⏳ Testar no Cloudflare Pages

---

## 📝 NOTAS IMPORTANTES

### **Agenda:**
- Usar biblioteca de calendário (ex: react-big-calendar ou criar custom)
- Cores por profissional (usar `users.color`)
- Confirmação de agendamento (tabela `appointment_confirmations`)

### **Pipeline:**
- Usar react-beautiful-dnd ou @dnd-kit para drag & drop
- Calcular valor total por coluna
- Mostrar taxa de conversão

### **ChatBOS:**
- Manter lógica de IA existente
- Apenas refatorar visual
- Adicionar histórico de conversas

---

## 🎯 CRITÉRIOS DE SUCESSO

✅ **Visual:**
- Design System aplicado
- Responsivo (Mobile + Desktop)
- Animações suaves

✅ **Funcional:**
- Lógica mantida
- Integração com Supabase
- Sem erros de build

✅ **UX:**
- NO-MODAL policy
- Navegação intuitiva
- Feedback visual

✅ **Código:**
- TypeScript strict
- Componentes reutilizáveis
- Código limpo

---

**Status:** 🟡 EM ANDAMENTO
**Próximo:** Implementar Agenda (SCR-03)
**Última Atualização:** 21/12/2025 20:27
