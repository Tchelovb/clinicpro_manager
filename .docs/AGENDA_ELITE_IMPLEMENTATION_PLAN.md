# 📅 AGENDA ELITE CLINICPRO - PLANO DE IMPLEMENTAÇÃO
**Data:** 03/01/2026  
**Objetivo:** Transformar a Agenda em um Canvas de Alta Performance com design Apple/Linear/Asaas

---

## 🎯 VISÃO GERAL

### **Antes (Atual):**
- ❌ Bordas pesadas e visuais carregados
- ❌ Fila de atendimento sempre visível (ocupa espaço)
- ❌ Sem suporte para compromissos administrativos
- ❌ Mobile com menu superior (não ergonômico)
- ❌ Cores sólidas e sem glassmorphism

### **Depois (Elite):**
- ✅ Glassmorphism com `backdrop-blur-xl`
- ✅ Fila de atendimento em Sheet lateral (sob demanda)
- ✅ Compromissos administrativos (reuniões, almoços)
- ✅ Mobile com Tab Bar inferior (Thumb Zone)
- ✅ Paleta pastel premium
- ✅ Indicadores de faturamento previsto

---

## 📦 COMPONENTES A CRIAR/MODIFICAR

### **1. NOVOS COMPONENTES**

#### `components/tasks/TasksSheet.tsx`
```tsx
// Sheet lateral para gerenciar tarefas do dia
// Inspiração: Todoist + Linear
// Features:
// - Lista de tarefas com checkbox
// - Prioridade (alta, média, baixa)
// - Due date
// - Integração com agenda
```

#### `components/agenda/DateStripMobile.tsx`
```tsx
// Carrossel horizontal de datas para mobile
// Inspiração: Apple Calendar iOS
// Features:
// - Swipe horizontal
// - Data selecionada destacada
// - Indicadores de agendamentos (dots)
```

#### `components/agenda/FloatingActionButton.tsx`
```tsx
// FAB para novo agendamento (mobile)
// Inspiração: Material Design 3
// Features:
// - Fixed bottom-right
// - Glassmorphism
// - Animação de entrada
```

---

### **2. COMPONENTES A REFATORAR**

#### `components/agenda/AgendaHeader.tsx`
**Mudanças:**
- ✅ Remover bordas pesadas
- ✅ Aplicar `bg-[#F5F5F7]` integrado
- ✅ Adicionar 3 botões principais:
  - **Profissionais** (dropdown minimalista)
  - **Ver Fluxo** (abre AttendanceSidebar como Sheet)
  - **Tarefas** (abre TasksSheet)
- ✅ Adicionar indicador de faturamento previsto

**Estrutura:**
```tsx
<header className="bg-[#F5F5F7] dark:bg-slate-950">
  {/* Logo + Navegação Temporal */}
  <div className="flex items-center justify-between">
    <DateNavigation />
    <div className="flex gap-3">
      <ProfessionalsSelector />
      <FlowButton onClick={() => setShowAttendance(true)} />
      <TasksButton onClick={() => setShowTasks(true)} />
    </div>
  </div>
  
  {/* Indicador de Faturamento */}
  <div className="mt-4 bg-white/40 backdrop-blur-xl rounded-[20px] p-4">
    <p className="text-sm text-slate-500">Faturamento Previsto Hoje</p>
    <p className="text-3xl font-light">R$ 25.000,00</p>
  </div>
</header>
```

---

#### `components/AgendaForm.tsx`
**Mudanças:**
- ✅ Adicionar Toggle: **Paciente** vs **Compromisso Administrativo**
- ✅ Se "Administrativo": `patient_id` = null, campo de texto livre para título
- ✅ Garantir sincronização com Google Calendar via `google_event_id`

**Estrutura:**
```tsx
<form>
  {/* Toggle Tipo de Evento */}
  <div className="flex gap-2 mb-6">
    <button 
      type="button"
      onClick={() => setEventType('PATIENT')}
      className={cn(
        "flex-1 py-3 rounded-xl transition-all",
        eventType === 'PATIENT' 
          ? "bg-blue-500 text-white" 
          : "bg-slate-100 text-slate-600"
      )}
    >
      Paciente
    </button>
    <button 
      type="button"
      onClick={() => setEventType('ADMINISTRATIVE')}
      className={cn(
        "flex-1 py-3 rounded-xl transition-all",
        eventType === 'ADMINISTRATIVE' 
          ? "bg-purple-500 text-white" 
          : "bg-slate-100 text-slate-600"
      )}
    >
      Compromisso
    </button>
  </div>

  {/* Campos Condicionais */}
  {eventType === 'PATIENT' ? (
    <PatientSelector required />
  ) : (
    <input 
      type="text" 
      placeholder="Ex: Reunião de Equipe, Almoço com Fornecedor"
      className="w-full px-4 py-3 rounded-xl"
    />
  )}
</form>
```

---

#### `pages/Agenda.tsx`
**Mudanças:**
- ✅ Remover `AttendanceSidebar` da renderização fixa
- ✅ Adicionar Sheet lateral para fila de atendimento
- ✅ Aplicar glassmorphism nos cards de agendamento
- ✅ Paleta pastel para status
- ✅ Calcular e exibir faturamento previsto

**Paleta de Cores Pastel:**
```tsx
const STATUS_COLORS = {
  PENDING: 'bg-slate-50/80 border-slate-200',
  CONFIRMED: 'bg-blue-50/80 border-blue-200',
  ARRIVED: 'bg-green-50/80 border-green-200',
  IN_PROGRESS: 'bg-purple-50/80 border-purple-200',
  COMPLETED: 'bg-emerald-50/80 border-emerald-200',
  CANCELLED: 'bg-red-50/80 border-red-200',
  NO_SHOW: 'bg-orange-50/80 border-orange-200',
  ADMINISTRATIVE: 'bg-amber-50/80 border-amber-200' // NOVO
};
```

**Card de Agendamento:**
```tsx
<div className={cn(
  "p-4 rounded-[20px] backdrop-blur-md",
  "shadow-[0_8px_30px_rgb(0,0,0,0.04)]",
  "border transition-all duration-300",
  "hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)]",
  "hover:-translate-y-1",
  STATUS_COLORS[appointment.status]
)}>
  {/* Conteúdo */}
</div>
```

---

## 🎨 DESIGN SYSTEM

### **Cores Base:**
```css
--bg-primary: #F5F5F7;
--bg-dark: #0B0B0C;
--glass-light: rgba(255, 255, 255, 0.4);
--glass-dark: rgba(255, 255, 255, 0.05);
```

### **Bordas:**
```css
--radius-sm: 12px;
--radius-md: 20px;
--radius-lg: 32px;
```

### **Sombras Etéreas:**
```css
--shadow-sm: 0 8px 30px rgb(0 0 0 / 0.04);
--shadow-md: 0 12px 40px rgb(0 0 0 / 0.08);
--shadow-lg: 0 32px 64px rgb(0 0 0 / 0.05);
```

---

## 📱 MOBILE ADAPTATIONS

### **Tab Bar Inferior:**
```tsx
<nav className="fixed bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-xl border-t border-white/20">
  <div className="flex justify-around items-center h-full px-4">
    <TabButton icon={Calendar} label="Agenda" active />
    <TabButton icon={Users} label="Pacientes" />
    <TabButton icon={Search} label="Busca" />
    <TabButton icon={DollarSign} label="Financeiro" />
    <TabButton icon={Menu} label="Mais" />
  </div>
</nav>
```

### **FAB (Floating Action Button):**
```tsx
<button className="fixed bottom-24 right-6 h-14 w-14 rounded-full bg-blue-500 shadow-lg hover:shadow-xl transition-all">
  <Plus className="h-6 w-6 text-white" />
</button>
```

---

## 🔄 FLUXO DE DADOS

### **Cálculo de Faturamento Previsto:**
```typescript
const calculateDailyRevenue = async (date: Date) => {
  const { data: appointments } = await supabase
    .from('appointments')
    .select(`
      *,
      budget:budgets(final_value)
    `)
    .eq('date', date)
    .in('status', ['PENDING', 'CONFIRMED', 'ARRIVED']);

  return appointments.reduce((total, apt) => 
    total + (apt.budget?.final_value || 0), 0
  );
};
```

### **Sincronização Google Calendar:**
```typescript
const syncToGoogleCalendar = async (appointment) => {
  if (appointment.patient_id === null) {
    // Compromisso administrativo
    const event = {
      summary: appointment.notes, // Título livre
      start: { dateTime: appointment.date },
      end: { dateTime: addMinutes(appointment.date, appointment.duration) }
    };
    
    const response = await googleCalendar.events.insert({ event });
    
    // Salvar google_event_id
    await supabase
      .from('appointments')
      .update({ google_event_id: response.data.id })
      .eq('id', appointment.id);
  }
};
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### **Fase 1: Fundação (2h)**
- [ ] Criar `TasksSheet.tsx`
- [ ] Criar `DateStripMobile.tsx`
- [ ] Criar `FloatingActionButton.tsx`

### **Fase 2: Refatoração (3h)**
- [ ] Refatorar `AgendaHeader.tsx`
- [ ] Atualizar `AgendaForm.tsx` (Toggle)
- [ ] Modificar `Agenda.tsx` (Glassmorphism)

### **Fase 3: Inteligência (2h)**
- [ ] Implementar cálculo de faturamento
- [ ] Adicionar sincronização Google Calendar
- [ ] Testar compromissos administrativos

### **Fase 4: Mobile (2h)**
- [ ] Integrar Tab Bar inferior
- [ ] Adicionar FAB
- [ ] Testar Thumb Zone

### **Fase 5: Polimento (1h)**
- [ ] Ajustar animações
- [ ] Testar dark mode
- [ ] Validar responsividade

---

## 🎯 RESULTADO ESPERADO

### **Desktop:**
- Área útil 100% da largura
- Fila de atendimento em Sheet lateral
- Indicador de faturamento no topo
- Cards com glassmorphism e paleta pastel

### **Mobile:**
- Tab Bar inferior (Thumb Zone)
- DateStrip horizontal deslizável
- FAB para novo agendamento
- Gestos intuitivos

### **Funcionalidades:**
- Compromissos administrativos
- Sincronização Google Calendar
- Tarefas integradas
- Faturamento previsto em tempo real

---

**Pronto para iniciar a implementação!** 🚀
