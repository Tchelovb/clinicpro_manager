# 🎯 MAPA COMPLETO DE TELAS - CLINICPRO MANAGER

## 📋 SISTEMA DE SCREEN IDs

### MÓDULO 01: ESTRATÉGICO (Intelligence)
- **SCR-01** → Intelligence Gateway ✅ IMPLEMENTADO
  - Hub com 3 cards clicáveis
  - Acesso: MASTER, ADMIN
  - Arquivo: `pages/IntelligenceGateway.tsx`

- **SCR-01-A** → Central de Metas ⏳ PENDENTE
  - Dashboard financeiro macro
  - Progresso de metas em tempo real

- **SCR-01-B** → BOS Intelligence ⏳ PENDENTE
  - Alertas críticos
  - Insights proativos

### MÓDULO 02: OPERACIONAL
- **SCR-02** → Dashboard Operacional ✅ IMPLEMENTADO
  - Home variável por cargo
  - Arquivo: `pages/Dashboard.tsx`

- **SCR-03** → Agenda Geral ⏳ PENDENTE
  - Calendário de agendamentos
  - Acesso: TODOS

- **SCR-03-A** → Novo Agendamento ⏳ PENDENTE
  - Página dedicada (NO-MODAL)
  - Formulário completo

### MÓDULO 03: PACIENTES & CRM
- **SCR-04** → Lista de Pacientes ⏳ PENDENTE
  - Grid com filtros
  - Acesso: TODOS

- **SCR-04-A** → Perfil do Paciente High-Ticket ✅ IMPLEMENTADO
  - Abas: Dossiê, Clínico, Financeiro, Documentos
  - Integração com `patient_score`, `bad_debtor`, `instagram_handle`
  - Arquivo: `pages/PatientDetail.tsx`

- **SCR-05** → Pipeline de Vendas ⏳ PENDENTE
  - Kanban de leads
  - Acesso: MASTER, ADMIN, CRC

- **SCR-06** → ChatBOS ⏳ PENDENTE
  - Interface de chat AI
  - Acesso: MASTER, ADMIN

### MÓDULO 04: SUPORTE CLÍNICO
- **SCR-07** → Laboratório ⏳ PENDENTE
  - Gestão de próteses
  - Tabela: `lab_orders`

- **SCR-08** → Estoque ⏳ PENDENTE
  - Controle de materiais
  - Tabela: `inventory_items`

### MÓDULO 05: FINANCEIRO & GESTÃO
- **SCR-09** → Financeiro Geral ⏳ PENDENTE
  - DRE, contas a pagar/receber
  - Acesso: MASTER, ADMIN

- **SCR-09-A** → Caixa Diário ⏳ PENDENTE
  - Fort Knox (Abertura/Fechamento)
  - Acesso: RECEPTIONIST

- **SCR-09-B** → Minha Produção ⏳ PENDENTE
  - Financeiro do dentista
  - Acesso: PROFESSIONAL

- **SCR-10** → Configurações & Relatórios ⏳ PENDENTE
  - Gestão do sistema
  - Acesso: MASTER, ADMIN

---

## 🗺️ MATRIZ DE NAVEGAÇÃO POR ROLE

### 👑 MASTER & ADMIN (10 itens)
```
1. 🧠 Intelligence Gateway (SCR-01) → /dashboard/intelligence
2. 📊 Dashboard (SCR-02) → /dashboard
3. 🤖 ChatBOS (SCR-06) → /dashboard/chatbos
4. 👥 Pacientes (SCR-04) → /dashboard/patients
5. 📅 Agenda (SCR-03) → /dashboard/schedule
6. 🧪 Laboratório (SCR-07) → /dashboard/lab
7. 📦 Estoque (SCR-08) → /dashboard/inventory
8. 💰 Financeiro (SCR-09) → /dashboard/financial
9. 📈 Pipeline (SCR-05) → /dashboard/pipeline
10. ⚙️ Configurações (SCR-10) → /dashboard/settings
```

### 🛡️ PROFESSIONAL (4 itens)
```
1. 💼 Minha Produção (SCR-09-B) → /dashboard/production
2. 📅 Minha Agenda (SCR-03) → /dashboard/schedule
3. 👥 Meus Pacientes (SCR-04) → /dashboard/patients
4. 🧪 Laboratório (SCR-07) → /dashboard/lab
```

### 🗣️ CRC (3 itens)
```
1. 📈 Pipeline (SCR-05) → /dashboard/pipeline
2. 👥 Pacientes (SCR-04) → /dashboard/patients
3. 📅 Agenda (SCR-03) → /dashboard/schedule
```

### 👩‍💼 RECEPTIONIST (6 itens)
```
1. ✅ Recepção Hoje (SCR-02) → /dashboard/reception
2. 📅 Agenda (SCR-03) → /dashboard/schedule
3. 👥 Pacientes (SCR-04) → /dashboard/patients
4. 💵 Caixa Diário (SCR-09-A) → /dashboard/cash-register
5. 🧪 Laboratório (SCR-07) → /dashboard/lab
6. 📦 Estoque (SCR-08) → /dashboard/inventory
```

---

## 📊 STATUS DE IMPLEMENTAÇÃO

### ✅ COMPLETO (3 telas)
1. **AppLayout.tsx** - Navegação polimórfica com Screen IDs
2. **IntelligenceGateway.tsx** (SCR-01) - Hub estratégico
3. **PatientDetail.tsx** (SCR-04-A) - Perfil High-Ticket
4. **Dashboard.tsx** (SCR-02) - Central de Metas

### ⏳ PENDENTE (10 telas principais)
1. Central de Metas (SCR-01-A)
2. BOS Intelligence (SCR-01-B)
3. Agenda (SCR-03)
4. Novo Agendamento (SCR-03-A)
5. Lista de Pacientes (SCR-04)
6. Pipeline (SCR-05)
7. ChatBOS (SCR-06)
8. Laboratório (SCR-07)
9. Estoque (SCR-08)
10. Financeiro (SCR-09)
11. Caixa Diário (SCR-09-A)
12. Minha Produção (SCR-09-B)
13. Configurações (SCR-10)

---

## 🎨 DESIGN SYSTEM APLICADO

### Paleta de Cores
- 🟣 **Violet-600** (#7C3AED) - Primária (Marca, Ações)
- 🟢 **Teal-500** (#14B8A6) - Sucesso (Clínico, Saudável)
- 🟡 **Amber-400** (#FBBF24) - High-Ticket (VIP, DIAMOND, GOLD)
- 🔴 **Rose-600** (#E11D48) - Crítico (Inadimplência, Alertas)

### Componentes Base
```tsx
// Card Padrão
<div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">

// Button Primary
<button className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700">

// Badge VIP (DIAMOND/GOLD)
<span className="px-3 py-1 bg-amber-400 text-white rounded-full font-bold">

// Badge Inadimplente
<span className="px-3 py-1 bg-rose-600 text-white rounded-full font-bold">

// Badge Sucesso
<span className="px-3 py-1 bg-teal-500 text-white rounded-full font-bold">
```

---

## 📱 RESPONSIVIDADE

### Mobile (<768px)
- Bottom Navigation Bar (4 itens principais)
- Header com botão "Voltar" em sub-páginas
- Cards empilhados (grid-cols-1)
- Overlay menu para todos os itens

### Desktop (≥768px)
- Sidebar lateral (20px collapsed, 256px expanded)
- Header com título e Screen ID
- Cards em grid (2-4 colunas)
- Tooltips informativos

---

## 🔒 REGRAS DE IMPLEMENTAÇÃO

### 1. NO-MODAL POLICY
- ❌ Não use modais para telas complexas
- ✅ Use rotas dedicadas (ex: `/patients/new`)
- ✅ Botão "Voltar" sempre acessível

### 2. INTEGRAÇÃO DE DADOS
- ✅ Use campos reais do banco (ex: `patient_score`, `bad_debtor`)
- ✅ Não invente dados mockados
- ✅ Conecte com Supabase via `supabase.from('table')`

### 3. VISUAL HIGH-TICKET
- ✅ Amber-400 para pacientes DIAMOND/GOLD
- ✅ Rose-600 para inadimplentes (`bad_debtor`)
- ✅ Teal-500 para status positivos
- ✅ Violet-600 para ações principais

---

## 🚀 PRÓXIMOS PASSOS

### Prioridade ALTA
1. ✅ Criar rotas no App.tsx
2. ⏳ Implementar Lista de Pacientes (SCR-04)
3. ⏳ Implementar Agenda (SCR-03)
4. ⏳ Implementar Pipeline (SCR-05)

### Prioridade MÉDIA
5. ⏳ Implementar ChatBOS (SCR-06)
6. ⏳ Implementar Laboratório (SCR-07)
7. ⏳ Implementar Estoque (SCR-08)
8. ⏳ Implementar Financeiro (SCR-09)

### Prioridade BAIXA
9. ⏳ Implementar Configurações (SCR-10)
10. ⏳ Implementar Relatórios

---

**Última Atualização:** 21/12/2025 20:05
**Status:** 4/14 telas implementadas (28%)
**Próximo:** Configurar rotas no App.tsx
