# 🔧 CORREÇÕES NECESSÁRIAS PARA DEPLOY

## Status: EM PROGRESSO

### ✅ CORRIGIDO
1. **ProfessionalsSettings.tsx** - Arquivo reescrito completamente

### ⏳ PENDENTE

#### 1. Erros de `user.clinic_id` → `profile.clinic_id`
**Arquivos:**
- `components/lab/LabOrderForm.tsx` (linha 34, 36)
- `components/lab/LabOrderList.tsx` (linhas 24, 29, 30, 47)

**Correção:** Trocar `user` por `profile` e `user?.clinic_id` por `profile?.clinic_id`

#### 2. Erros de Propriedades
**components/IntelligenceCenter.tsx:**
- Linha 94: `balanceDue` → `balance_due`
- Linha 95: `totalPaid` → `total_paid`

**components/HighTicketPipeline.tsx:**
- Linhas 75, 241: Adicionar propriedade `patient_id` ao tipo `HighTicketLead`

**components/BudgetForm.tsx:**
- Linha 84: Verificar propriedade `patient_id`

#### 3. Erros de Tipos
**components/IntelligenceGateway.tsx:**
- Linha 15: Comparação de tipos incompatíveis (UserRole vs "MASTER")

**components/BOSChat.tsx:**
- Linha 223: `full_name` não existe em `Profile` → usar `name`

**components/Agenda.tsx:**
- Linha 17: `refreshAppointments` não existe em `DataContextType`

**App.tsx:**
- Linha 117: Tipo incompatível em `ProtectedRoute`

## PRIORIDADE DE CORREÇÃO

### 🔴 CRÍTICO (Impede Build)
1. Erros de `clinic_id` nos componentes lab
2. Propriedades inexistentes (balanceDue, totalPaid, full_name)

### 🟡 IMPORTANTE (Pode causar bugs)
3. Tipos incompatíveis
4. Propriedades faltantes em interfaces

## PRÓXIMOS PASSOS
1. Corrigir erros críticos
2. Testar build novamente
3. Corrigir erros restantes
4. Build final para Cloudflare Pages
