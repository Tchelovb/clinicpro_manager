# ⚙️ Módulo Configurações Avançado - Plano de Implementação
## O "Cérebro" do ClinicPro - Nível Enterprise

> **Data**: 18/12/2025  
> **Objetivo**: Transformar Configurações de básico para Enterprise-Grade  
> **Inspiração**: Clinicorp, Dentalis, Simples Dental

---

## 📊 Visão Geral

### Status Atual (README.md)
- ✅ Dados da clínica
- ✅ Usuários e roles
- ✅ Profissionais
- ✅ Procedimentos
- ✅ Tabelas de preço
- ✅ Convênios
- ✅ Categorias financeiras

### Gaps Identificados
- ❌ Personalização de marca (White Label)
- ❌ Auditoria e logs de segurança
- ❌ Regras financeiras avançadas
- ❌ Formulários clínicos dinâmicos
- ❌ Automações e notificações
- ❌ Compliance e LGPD

---

## 🎯 Arquitetura Definitiva - 6 Pilares

### Estrutura de Menu (Sidebar Vertical)

```
⚙️ CONFIGURAÇÕES
├── 🏥 1. Identidade Institucional
├── 🛡️ 2. Segurança & Auditoria
├── 💰 3. Regras Financeiras
├── 🦷 4. Clínico & Prontuário
├── 🤖 5. Notificações & Automações
└── 🔌 6. Integrações & Backup
```

---

## 1. 🏥 Identidade Institucional (Branding & White Label)

### 1.1 Logotipia Dinâmica

**Problema**: Documentos e interface com visual genérico  
**Solução**: Upload de logos e aplicação automática

#### Database Schema

```sql
-- Adicionar colunas à tabela clinics
ALTER TABLE clinics
ADD COLUMN logo_light_url TEXT,
ADD COLUMN logo_dark_url TEXT,
ADD COLUMN favicon_url TEXT,
ADD COLUMN primary_color VARCHAR(7) DEFAULT '#3B82F6',
ADD COLUMN secondary_color VARCHAR(7) DEFAULT '#10B981';
```

#### Funcionalidades

**Upload de Logos**:
- Logo Claro (para fundo branco)
- Logo Escuro (para dark mode)
- Favicon (ícone do navegador)
- Formatos: PNG, SVG (recomendado)
- Tamanho máximo: 2MB
- Armazenamento: Supabase Storage

**Aplicação Automática**:
- Sidebar (topo)
- Cabeçalho de orçamentos (PDF)
- Cabeçalho de receitas (PDF)
- Cabeçalho de atestados (PDF)
- Email templates

#### Componente: `BrandingSettings.tsx`

```typescript
interface BrandingSettings {
  logoLight: File | string;
  logoDark: File | string;
  favicon: File | string;
  primaryColor: string;
  secondaryColor: string;
}

// Upload para Supabase Storage
const uploadLogo = async (file: File, type: 'light' | 'dark' | 'favicon') => {
  const { data, error } = await supabase.storage
    .from('clinic-assets')
    .upload(`${clinicId}/logo-${type}.png`, file);
  
  return data?.path;
};
```

---

### 1.2 Cores da Clínica (Theme Customization)

**Problema**: Sistema sempre azul padrão  
**Solução**: Seletor de cores com preview em tempo real

#### Funcionalidades

**Seletor de Cores**:
- Color Picker visual
- Presets de paletas (Dourado/Preto, Rosa/Branco, Verde/Azul)
- Preview em tempo real
- Aplicação em:
  - Botões primários
  - Bordas de cards
  - Gráficos (Recharts)
  - Status badges
  - Links e hover states

#### Implementação CSS Variables

```css
/* Aplicar cores dinâmicas via CSS Variables */
:root {
  --primary-color: var(--clinic-primary, #3B82F6);
  --secondary-color: var(--clinic-secondary, #10B981);
}

/* Injetar no <head> via JavaScript */
document.documentElement.style.setProperty('--clinic-primary', primaryColor);
```

---

### 1.3 Rodapé de Documentos

**Problema**: Rodapé fixo no código  
**Solução**: Editor de texto rico para rodapé customizável

#### Database Schema

```sql
ALTER TABLE clinics
ADD COLUMN document_footer TEXT DEFAULT 
'{{CLINIC_NAME}} - {{CNPJ}}
{{ADDRESS}} - Tel: {{PHONE}}
Responsável Técnico: {{RT_NAME}} - {{CRO}}';
```

#### Variáveis Disponíveis

```
{{CLINIC_NAME}}     - Nome da clínica
{{CNPJ}}            - CNPJ formatado
{{ADDRESS}}         - Endereço completo
{{PHONE}}           - Telefone
{{EMAIL}}           - Email
{{RT_NAME}}         - Nome do RT
{{CRO}}             - CRO do RT
{{WEBSITE}}         - Site
{{INSTAGRAM}}       - @instagram
```

#### Componente: `DocumentFooterEditor.tsx`

- Editor de texto rico (TinyMCE ou Quill)
- Preview em tempo real
- Botões para inserir variáveis
- Formatação (negrito, itálico, alinhamento)

---

## 2. 🛡️ Segurança & Auditoria (O "Fort Knox")

### 2.1 Audit Log (Sistema de Rastreabilidade)

**Problema**: Não há registro de quem fez o quê  
**Solução**: Log completo de todas as ações críticas

#### Database Schema

```sql
CREATE TABLE system_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id),
  user_id UUID REFERENCES users(id),
  user_name TEXT NOT NULL,
  action_type TEXT NOT NULL, -- CREATE, UPDATE, DELETE, LOGIN, LOGOUT
  entity_type TEXT NOT NULL, -- PATIENT, BUDGET, APPOINTMENT, EXPENSE, etc.
  entity_id UUID,
  old_value JSONB,           -- Valor anterior (para UPDATEs)
  new_value JSONB,           -- Valor novo
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_audit_logs_clinic ON system_audit_logs(clinic_id, created_at DESC);
CREATE INDEX idx_audit_logs_user ON system_audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_entity ON system_audit_logs(entity_type, entity_id);
```

#### Triggers Automáticos

```sql
-- Exemplo: Trigger para auditoria de pacientes
CREATE OR REPLACE FUNCTION audit_patients_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO system_audit_logs (clinic_id, user_id, user_name, action_type, entity_type, entity_id, old_value)
    VALUES (
      OLD.clinic_id,
      auth.uid(),
      (SELECT name FROM users WHERE id = auth.uid()),
      'DELETE',
      'PATIENT',
      OLD.id,
      row_to_json(OLD)
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO system_audit_logs (clinic_id, user_id, user_name, action_type, entity_type, entity_id, old_value, new_value)
    VALUES (
      NEW.clinic_id,
      auth.uid(),
      (SELECT name FROM users WHERE id = auth.uid()),
      'UPDATE',
      'PATIENT',
      NEW.id,
      row_to_json(OLD),
      row_to_json(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO system_audit_logs (clinic_id, user_id, user_name, action_type, entity_type, entity_id, new_value)
    VALUES (
      NEW.clinic_id,
      auth.uid(),
      (SELECT name FROM users WHERE id = auth.uid()),
      'CREATE',
      'PATIENT',
      NEW.id,
      row_to_json(NEW)
    );
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_audit_patients
AFTER INSERT OR UPDATE OR DELETE ON patients
FOR EACH ROW EXECUTE FUNCTION audit_patients_changes();
```

#### Componente: `AuditLogViewer.tsx`

**Funcionalidades**:
- Tabela com filtros avançados
- Filtrar por: Usuário, Tipo de Ação, Entidade, Data
- Busca por texto
- Exportar para Excel/PDF
- Diff visual (antes/depois)
- Paginação

**Colunas**:
- Data/Hora
- Usuário
- Ação (CREATE/UPDATE/DELETE)
- Entidade (Paciente, Orçamento, etc.)
- Detalhes (expandível)
- IP Address

---

### 2.2 Sessão & Bloqueio

**Problema**: Sistema fica aberto indefinidamente  
**Solução**: Auto-logout e bloqueio rápido

#### Database Schema

```sql
ALTER TABLE clinic_financial_settings
ADD COLUMN auto_logout_minutes INTEGER DEFAULT 15,
ADD COLUMN require_password_on_unlock BOOLEAN DEFAULT TRUE;
```

#### Funcionalidades

**Auto-Logout**:
- Detectar inatividade (sem mouse/teclado)
- Configurável: 5, 10, 15, 30, 60 minutos
- Aviso 1 minuto antes
- Logout automático

**Bloqueio Rápido** (Panic Button):
- Atalho: Ctrl+L
- Blur na tela inteira
- Exige senha para desbloquear
- Útil quando paciente entra na sala

#### Implementação

```typescript
// hooks/useAutoLogout.ts
export function useAutoLogout(timeoutMinutes: number) {
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        // Logout
        supabase.auth.signOut();
      }, timeoutMinutes * 60 * 1000);
    };
    
    // Eventos que resetam o timer
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keypress', resetTimer);
    
    resetTimer();
    
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keypress', resetTimer);
    };
  }, [timeoutMinutes]);
}
```

---

### 2.3 Perfis de Acesso Granulares (ACL)

**Problema**: Apenas 4 roles fixos (Admin, Dentista, Recepcionista, Auxiliar)  
**Solução**: Permissões granulares por funcionalidade

#### Database Schema

```sql
CREATE TABLE user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Financeiro
  can_view_financial BOOLEAN DEFAULT FALSE,
  can_give_discount BOOLEAN DEFAULT FALSE,
  max_discount_percent NUMERIC(5,2) DEFAULT 0,
  can_delete_transaction BOOLEAN DEFAULT FALSE,
  can_close_cash BOOLEAN DEFAULT FALSE,
  
  -- Pacientes
  can_create_patient BOOLEAN DEFAULT TRUE,
  can_edit_patient BOOLEAN DEFAULT TRUE,
  can_delete_patient BOOLEAN DEFAULT FALSE,
  can_view_all_patients BOOLEAN DEFAULT TRUE,
  
  -- Orçamentos
  can_create_budget BOOLEAN DEFAULT TRUE,
  can_approve_budget BOOLEAN DEFAULT FALSE,
  can_edit_price BOOLEAN DEFAULT FALSE,
  
  -- Agenda
  can_create_appointment BOOLEAN DEFAULT TRUE,
  can_cancel_appointment BOOLEAN DEFAULT TRUE,
  can_view_all_schedules BOOLEAN DEFAULT TRUE,
  
  -- Configurações
  can_access_settings BOOLEAN DEFAULT FALSE,
  can_manage_users BOOLEAN DEFAULT FALSE,
  can_view_audit_logs BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Componente: `PermissionsManager.tsx`

**Interface**:
```
┌─────────────────────────────────────────┐
│ Permissões de: Ana Silva (Recepcionista)│
├─────────────────────────────────────────┤
│ 💰 FINANCEIRO                            │
│ ☑ Visualizar módulo financeiro          │
│ ☐ Dar descontos (Limite: 5%)            │
│ ☐ Excluir transações                    │
│ ☑ Fechar caixa                          │
│                                          │
│ 👥 PACIENTES                             │
│ ☑ Criar paciente                        │
│ ☑ Editar paciente                       │
│ ☐ Excluir paciente                      │
│                                          │
│ 📋 ORÇAMENTOS                            │
│ ☑ Criar orçamento                       │
│ ☐ Aprovar orçamento                     │
│ ☐ Alterar preços                        │
└─────────────────────────────────────────┘
```

---

## 3. 💰 Regras Financeiras (O "Cofre")

### 3.1 Regras de Caixa

**Já implementado no Fort Knox**, mas precisa de UI de configuração

#### Componente: `CashRulesSettings.tsx`

```typescript
interface CashRules {
  force_cash_opening: boolean;
  force_daily_closing: boolean;
  allow_negative_balance: boolean;
  blind_closing: boolean;
  default_change_fund: number;
  max_difference_without_approval: number;
}
```

**Interface**:
```
┌─────────────────────────────────────────┐
│ 💰 REGRAS DE CAIXA                       │
├─────────────────────────────────────────┤
│ ☑ Obrigar abertura de caixa ao logar   │
│ ☑ Obrigar fechamento diário             │
│ ☐ Permitir saldo negativo               │
│ ☑ Fechamento cego (não mostra saldo)   │
│                                          │
│ Fundo de troco padrão: R$ 100,00        │
│ Diferença máxima sem auditoria: R$ 50   │
└─────────────────────────────────────────┘
```

---

### 3.2 Bloqueio de Inadimplentes

**Problema**: Pacientes inadimplentes continuam agendando  
**Solução**: Bloqueio automático configurável

#### Database Schema

```sql
ALTER TABLE clinic_financial_settings
ADD COLUMN block_debtors_scheduling BOOLEAN DEFAULT FALSE,
ADD COLUMN debtor_block_days INTEGER DEFAULT 30; -- Bloquear após X dias de atraso
```

#### Lógica de Bloqueio

```typescript
// Ao tentar agendar, verificar:
const checkDebtorStatus = async (patientId: string) => {
  const { data: settings } = await supabase
    .from('clinic_financial_settings')
    .select('block_debtors_scheduling, debtor_block_days')
    .single();
    
  if (!settings.block_debtors_scheduling) return true; // Libera
  
  // Verificar parcelas vencidas
  const { data: overdueInstallments } = await supabase
    .from('financial_installments')
    .select('*')
    .eq('patient_id', patientId)
    .eq('status', 'OVERDUE')
    .lt('due_date', new Date(Date.now() - settings.debtor_block_days * 24 * 60 * 60 * 1000).toISOString());
    
  if (overdueInstallments && overdueInstallments.length > 0) {
    throw new Error(`Paciente inadimplente há mais de ${settings.debtor_block_days} dias. Regularize os pagamentos antes de agendar.`);
  }
  
  return true;
};
```

---

### 3.3 Limite de Desconto

**Problema**: Qualquer um pode dar 50% de desconto  
**Solução**: Limite configurável + senha do gestor

#### Database Schema

```sql
ALTER TABLE clinic_financial_settings
ADD COLUMN max_discount_without_approval NUMERIC(5,2) DEFAULT 5.00; -- 5%
```

#### Lógica de Validação

```typescript
const applyDiscount = async (budgetId: string, discountPercent: number) => {
  const { data: settings } = await supabase
    .from('clinic_financial_settings')
    .select('max_discount_without_approval')
    .single();
    
  if (discountPercent > settings.max_discount_without_approval) {
    // Exigir senha do gestor
    const managerPassword = prompt('Desconto acima do limite. Senha do gestor:');
    const isValid = await validateManagerPassword(managerPassword);
    
    if (!isValid) {
      throw new Error('Senha incorreta. Desconto não autorizado.');
    }
  }
  
  // Aplicar desconto
  // ...
};
```

---

### 3.4 Comissionamento

**Problema**: Cálculo manual de comissões  
**Solução**: Tabela de comissões + relatório automático

#### Database Schema

```sql
CREATE TABLE professional_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID REFERENCES professionals(id),
  commission_percent NUMERIC(5,2) DEFAULT 30.00, -- 30% padrão
  payment_rule TEXT CHECK (payment_rule IN ('ON_RECEIPT', 'ON_EXECUTION')),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE commission_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID REFERENCES professionals(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_procedures_value NUMERIC(10,2),
  commission_value NUMERIC(10,2),
  paid_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('PENDING', 'PAID')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Componente: `CommissionSettings.tsx`

**Tabela Visual**:
```
┌──────────────────────────────────────────────────────┐
│ Profissional       │ Comissão │ Regra de Pagamento  │
├──────────────────────────────────────────────────────┤
│ Dr. João Silva     │ 30%      │ No Recebimento      │
│ Dra. Maria Santos  │ 35%      │ No Recebimento      │
│ Dr. Pedro Costa    │ 25%      │ Na Execução         │
└──────────────────────────────────────────────────────┘
```

---

### 3.5 Taxas de Maquininhas

**Problema**: DRE não considera taxas de cartão  
**Solução**: Cadastro de taxas + cálculo automático de valor líquido

#### Database Schema

```sql
CREATE TABLE payment_method_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id),
  payment_method_name TEXT NOT NULL, -- "Visa Crédito", "Master Débito"
  fee_percent NUMERIC(5,2) NOT NULL,  -- 3.5%
  active BOOLEAN DEFAULT TRUE
);
```

#### Cálculo Automático

```typescript
const calculateNetValue = (grossValue: number, paymentMethod: string) => {
  const fee = await getFeeByPaymentMethod(paymentMethod);
  const feeAmount = grossValue * (fee.fee_percent / 100);
  const netValue = grossValue - feeAmount;
  
  return {
    grossValue,
    feeAmount,
    netValue
  };
};

// Exemplo:
// Recebimento: R$ 1.000,00 em Visa Crédito (3.5%)
// Taxa: R$ 35,00
// Líquido: R$ 965,00
```

---

## 4. 🦷 Clínico & Prontuário (A "Inteligência Médica")

### 4.1 Construtor de Anamneses Dinâmicas

**Problema**: Anamnese hardcoded no código  
**Solução**: Construtor drag-and-drop com JSONB

#### Database Schema

```sql
CREATE TABLE clinical_form_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id),
  title TEXT NOT NULL, -- "Anamnese HOF", "Anamnese Ortodontia"
  description TEXT,
  structure JSONB NOT NULL, -- Schema das perguntas
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE clinical_form_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  template_id UUID REFERENCES clinical_form_templates(id),
  responses JSONB NOT NULL, -- Respostas do paciente
  filled_by UUID REFERENCES users(id),
  filled_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Estrutura JSONB (Schema de Perguntas)

```json
{
  "version": "1.0",
  "sections": [
    {
      "id": "section-1",
      "title": "Histórico de Saúde",
      "fields": [
        {
          "id": "field-1",
          "type": "boolean",
          "key": "has_diabetes",
          "label": "Possui Diabetes?",
          "required": true,
          "alert_if": true,
          "alert_message": "⚠️ PACIENTE DIABÉTICO - Atenção especial"
        },
        {
          "id": "field-2",
          "type": "text",
          "key": "allergies",
          "label": "Alergias conhecidas:",
          "placeholder": "Descreva medicamentos ou alimentos...",
          "required": false
        },
        {
          "id": "field-3",
          "type": "multiple_choice",
          "key": "medications",
          "label": "Medicamentos em uso:",
          "options": [
            "Anticoagulantes",
            "Anti-hipertensivos",
            "Antidepressivos",
            "Outros"
          ],
          "allow_multiple": true
        },
        {
          "id": "field-4",
          "type": "scale",
          "key": "pain_level",
          "label": "Nível de dor (0-10):",
          "min": 0,
          "max": 10,
          "step": 1
        }
      ]
    },
    {
      "id": "section-2",
      "title": "Histórico Odontológico",
      "fields": [
        {
          "id": "field-5",
          "type": "date",
          "key": "last_dental_visit",
          "label": "Última visita ao dentista:",
          "required": false
        },
        {
          "id": "field-6",
          "type": "textarea",
          "key": "previous_treatments",
          "label": "Tratamentos anteriores:",
          "rows": 4
        }
      ]
    }
  ]
}
```

#### Tipos de Campos Suportados

```typescript
type FieldType = 
  | 'text'           // Input de texto simples
  | 'textarea'       // Texto longo
  | 'number'         // Numérico
  | 'date'           // Seletor de data
  | 'boolean'        // Sim/Não (checkbox)
  | 'multiple_choice'// Múltipla escolha
  | 'scale'          // Escala (0-10)
  | 'file_upload'    // Upload de arquivo
  | 'signature'      // Assinatura digital
  | 'header'         // Título de seção
  | 'divider';       // Separador visual
```

#### Componente: `FormBuilder.tsx`

**Interface Drag-and-Drop**:
```
┌─────────────────────────────────────────────────────┐
│ CONSTRUTOR DE ANAMNESE                              │
├─────────────────────────────────────────────────────┤
│ Componentes Disponíveis:                            │
│ [📝 Texto] [📄 Texto Longo] [✓ Sim/Não]            │
│ [📅 Data] [🔢 Número] [⭐ Escala] [📋 Múltipla]    │
│                                                      │
│ ┌─────────────────────────────────────────────┐    │
│ │ PREVIEW: Anamnese de Harmonização Facial    │    │
│ ├─────────────────────────────────────────────┤    │
│ │ Seção 1: Histórico de Saúde                 │    │
│ │ ☐ Possui Diabetes? [Sim/Não]                │    │
│ │ Alergias: [_________________________]       │    │
│ │                                              │    │
│ │ [+ Adicionar Campo]                          │    │
│ └─────────────────────────────────────────────┘    │
│                                                      │
│ [Salvar Template] [Testar Formulário]              │
└─────────────────────────────────────────────────────┘
```

#### Componente: `DynamicForm.tsx`

**Renderizador de Formulários**:
```typescript
export function DynamicForm({ template, onSubmit }: Props) {
  const [responses, setResponses] = useState({});
  
  const renderField = (field: FormField) => {
    switch (field.type) {
      case 'boolean':
        return (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={responses[field.key]}
              onChange={(e) => setResponses({
                ...responses,
                [field.key]: e.target.checked
              })}
            />
            <label>{field.label}</label>
            {field.alert_if && responses[field.key] && (
              <span className="text-red-600 font-semibold">
                {field.alert_message}
              </span>
            )}
          </div>
        );
      
      case 'scale':
        return (
          <div>
            <label>{field.label}</label>
            <input
              type="range"
              min={field.min}
              max={field.max}
              step={field.step}
              value={responses[field.key] || field.min}
              onChange={(e) => setResponses({
                ...responses,
                [field.key]: Number(e.target.value)
              })}
            />
            <span>{responses[field.key] || field.min}</span>
          </div>
        );
      
      // ... outros tipos
    }
  };
  
  return (
    <form onSubmit={() => onSubmit(responses)}>
      {template.sections.map(section => (
        <div key={section.id}>
          <h3>{section.title}</h3>
          {section.fields.map(field => (
            <div key={field.id}>
              {renderField(field)}
            </div>
          ))}
        </div>
      ))}
      <button type="submit">Salvar Anamnese</button>
    </form>
  );
}
```

---

### 4.2 Editor de Modelos de Documentos

**Problema**: Templates de documentos hardcoded  
**Solução**: Editor WYSIWYG com variáveis

#### Componente: `DocumentTemplateEditor.tsx`

**Editor de Texto Rico** (TinyMCE ou Quill):
```
┌─────────────────────────────────────────────────────┐
│ EDITOR DE MODELO: Atestado de Comparecimento        │
├─────────────────────────────────────────────────────┤
│ [B] [I] [U] [Align] [Color] [Insert Variable ▼]    │
│                                                      │
│ ┌─────────────────────────────────────────────┐    │
│ │ Atesto para os devidos fins que o(a)        │    │
│ │ paciente {{PATIENT_NAME}}, portador(a) do   │    │
│ │ CPF {{PATIENT_CPF}}, esteve em consulta     │    │
│ │ odontológica nesta data {{TODAY}}, das      │    │
│ │ {{START_TIME}} às {{END_TIME}}.             │    │
│ │                                              │    │
│ │ {{CLINIC_CITY}}, {{TODAY_FULL}}             │    │
│ │                                              │    │
│ │ _____________________________                │    │
│ │ {{DOCTOR_NAME}}                              │    │
│ │ CRO: {{DOCTOR_CRO}}                          │    │
│ └─────────────────────────────────────────────┘    │
│                                                      │
│ Variáveis Disponíveis:                              │
│ {{PATIENT_NAME}} {{PATIENT_CPF}} {{PATIENT_PHONE}}  │
│ {{DOCTOR_NAME}} {{DOCTOR_CRO}} {{TODAY}}            │
│ {{CLINIC_NAME}} {{CLINIC_ADDRESS}}                  │
│                                                      │
│ [Salvar Template] [Preview PDF]                     │
└─────────────────────────────────────────────────────┘
```

---

## 5. 🤖 Notificações & Automações (O "Robô")

### 5.1 Lembretes de Retorno Automáticos

**Problema**: Esquecer de chamar paciente para retorno  
**Solução**: Regras automáticas por procedimento

#### Database Schema

```sql
CREATE TABLE procedure_return_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_id UUID REFERENCES procedure(id),
  return_interval_days INTEGER NOT NULL, -- Ex: 120 dias (4 meses)
  auto_create_task BOOLEAN DEFAULT TRUE,
  notification_message TEXT,
  active BOOLEAN DEFAULT TRUE
);

CREATE TABLE patient_return_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  procedure_name TEXT,
  last_procedure_date DATE,
  next_return_date DATE,
  status TEXT CHECK (status IN ('PENDING', 'CONTACTED', 'SCHEDULED', 'COMPLETED')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Lógica Automática

```typescript
// Ao concluir tratamento, criar lembrete
const onTreatmentComplete = async (treatmentId: string) => {
  const treatment = await getTreatment(treatmentId);
  const rule = await getReturnRule(treatment.procedure_id);
  
  if (rule) {
    const nextReturnDate = addDays(new Date(), rule.return_interval_days);
    
    await supabase.from('patient_return_reminders').insert({
      patient_id: treatment.patient_id,
      procedure_name: treatment.procedure_name,
      last_procedure_date: new Date(),
      next_return_date: nextReturnDate,
      status: 'PENDING'
    });
  }
};

// Job diário: Verificar lembretes pendentes
const checkPendingReminders = async () => {
  const { data: reminders } = await supabase
    .from('patient_return_reminders')
    .select('*')
    .eq('status', 'PENDING')
    .lte('next_return_date', new Date());
    
  // Criar tarefas para a recepção
  for (const reminder of reminders) {
    await createTask({
      title: `Ligar para ${reminder.patient_name} - Retorno ${reminder.procedure_name}`,
      dueDate: new Date(),
      type: 'RETURN_CALL'
    });
  }
};
```

---

### 5.2 Templates de Mensagens

**Problema**: Digitar mesma mensagem repetidamente  
**Solução**: Biblioteca de templates com variáveis

#### Database Schema

```sql
CREATE TABLE message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id),
  name TEXT NOT NULL,
  category TEXT, -- "CONFIRMATION", "REMINDER", "BIRTHDAY", "FOLLOW_UP"
  content TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Templates Padrão

```sql
INSERT INTO message_templates (clinic_id, name, category, content) VALUES
(clinic_id, 'Confirmação de Consulta', 'CONFIRMATION', 
'Olá {{PATIENT_NAME}}! 👋

Sua consulta está confirmada para:
📅 {{APPOINTMENT_DATE}}
🕐 {{APPOINTMENT_TIME}}
👨‍⚕️ Com {{DOCTOR_NAME}}

Nos vemos em breve! 😊
{{CLINIC_NAME}}'),

(clinic_id, 'Lembrete 24h', 'REMINDER',
'Oi {{PATIENT_NAME}}! 

Lembrando que sua consulta é AMANHÃ:
📅 {{APPOINTMENT_DATE}} às {{APPOINTMENT_TIME}}

Qualquer imprevisto, avise com antecedência.
{{CLINIC_NAME}} - {{CLINIC_PHONE}}'),

(clinic_id, 'Aniversário', 'BIRTHDAY',
'🎉 Parabéns, {{PATIENT_NAME}}! 🎂

A equipe {{CLINIC_NAME}} deseja um dia maravilhoso!

Como presente, você ganhou 10% de desconto em qualquer procedimento este mês! 🎁'),

(clinic_id, 'Follow-up Orçamento', 'FOLLOW_UP',
'Oi {{PATIENT_NAME}},

Gostaria de saber se teve tempo de analisar o orçamento que enviamos?

Estou à disposição para esclarecer qualquer dúvida! 😊
{{DOCTOR_NAME}} - {{CLINIC_PHONE}}');
```

#### Componente: `MessageTemplateSelector.tsx`

```typescript
export function MessageTemplateSelector({ onSelect }: Props) {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  const applyTemplate = (template: MessageTemplate, patient: Patient) => {
    let message = template.content;
    
    // Substituir variáveis
    message = message.replace(/{{PATIENT_NAME}}/g, patient.name);
    message = message.replace(/{{CLINIC_NAME}}/g, clinic.name);
    message = message.replace(/{{CLINIC_PHONE}}/g, clinic.phone);
    // ... outras variáveis
    
    return message;
  };
  
  return (
    <div>
      <select onChange={(e) => setSelectedTemplate(e.target.value)}>
        {templates.map(t => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
      
      <textarea value={applyTemplate(selectedTemplate, patient)} />
      
      <button onClick={() => copyToClipboard()}>
        📋 Copiar para WhatsApp
      </button>
    </div>
  );
}
```

---

### 5.3 Gamificação da Equipe

**Problema**: Falta de motivação e visibilidade de metas  
**Solução**: Metas configuráveis + dashboard de progresso

#### Database Schema

```sql
CREATE TABLE clinic_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id),
  month DATE NOT NULL, -- Primeiro dia do mês
  revenue_goal NUMERIC(10,2),
  new_patients_goal INTEGER,
  conversion_rate_goal NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Componente: `GoalsSettings.tsx`

```
┌─────────────────────────────────────────────────────┐
│ 🎯 METAS DO MÊS - Dezembro 2025                     │
├─────────────────────────────────────────────────────┤
│ Meta de Faturamento:     R$ 50.000,00               │
│ Meta de Novos Pacientes: 20                         │
│ Meta de Conversão:       25%                        │
│                                                      │
│ [Salvar Metas]                                      │
└─────────────────────────────────────────────────────┘
```

**Dashboard com Progresso**:
```
┌─────────────────────────────────────────────────────┐
│ 💰 Faturamento: R$ 35.000 / R$ 50.000 (70%)        │
│ ████████████████░░░░░░░░                            │
│                                                      │
│ 👥 Novos Pacientes: 15 / 20 (75%)                  │
│ ██████████████████░░░░░░                            │
│                                                      │
│ 📈 Taxa de Conversão: 22% / 25% (88%)              │
│ ████████████████████░░░░                            │
└─────────────────────────────────────────────────────┘
```

---

## 6. 🔌 Integrações & Backup

### 6.1 Exportação de Dados (LGPD Compliance)

**Problema**: Paciente solicita seus dados (direito LGPD)  
**Solução**: Exportação automática em JSON/PDF

#### Funcionalidade

```typescript
const exportPatientData = async (patientId: string) => {
  const patient = await getPatientComplete(patientId);
  
  const data = {
    personal_data: {
      name: patient.name,
      cpf: patient.cpf,
      phone: patient.phone,
      email: patient.email,
      address: patient.address
    },
    clinical_history: patient.notes,
    budgets: patient.budgets,
    treatments: patient.treatments,
    financial: patient.financials,
    documents: patient.documents
  };
  
  // Gerar PDF ou JSON
  return generatePDF(data);
};
```

---

### 6.2 Backup Automático

**Problema**: Perda de dados  
**Solução**: Backup diário automático

#### Database Schema

```sql
CREATE TABLE backup_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id),
  backup_date DATE NOT NULL,
  file_url TEXT,
  file_size_mb NUMERIC(10,2),
  status TEXT CHECK (status IN ('SUCCESS', 'FAILED')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 📋 Checklist de Implementação

### Fase 1: Identidade Institucional (3 dias)
- [ ] Upload de logos (Supabase Storage)
- [ ] Seletor de cores com preview
- [ ] Editor de rodapé de documentos
- [ ] Aplicação em PDFs

### Fase 2: Segurança & Auditoria (5 dias)
- [ ] Tabela `system_audit_logs`
- [ ] Triggers de auditoria (pacientes, orçamentos, transações)
- [ ] Componente `AuditLogViewer`
- [ ] Auto-logout configurável
- [ ] Bloqueio rápido (Panic Button)
- [ ] Tabela `user_permissions`
- [ ] Componente `PermissionsManager`

### Fase 3: Regras Financeiras (3 dias)
- [ ] UI para configurações de caixa
- [ ] Bloqueio de inadimplentes
- [ ] Limite de desconto + senha gestor
- [ ] Tabela de comissões
- [ ] Tabela de taxas de maquininhas

### Fase 4: Clínico & Prontuário (7 dias)
- [ ] Tabela `clinical_form_templates`
- [ ] Componente `FormBuilder` (drag-and-drop)
- [ ] Componente `DynamicForm` (renderizador)
- [ ] Editor de templates de documentos
- [ ] Sistema de variáveis

### Fase 5: Notificações & Automações (4 dias)
- [ ] Tabela `procedure_return_rules`
- [ ] Job de lembretes automáticos
- [ ] Tabela `message_templates`
- [ ] Componente `MessageTemplateSelector`
- [ ] Sistema de metas e gamificação

### Fase 6: Integrações & Backup (2 dias)
- [ ] Exportação de dados (LGPD)
- [ ] Sistema de backup automático

---

## 🎯 Estimativa Total

- **Tempo de Desenvolvimento**: 24 dias úteis (~5 semanas)
- **Complexidade**: Alta
- **Prioridade**: Média-Alta (após Fort Knox)
- **Impacto**: Transformacional

---

## 💡 Valor Estratégico

### Para a Clínica
- ✅ **Branding Profissional**: Documentos com identidade visual
- ✅ **Segurança Jurídica**: Auditoria completa de ações
- ✅ **Controle Financeiro**: Regras automáticas evitam perdas
- ✅ **Flexibilidade Clínica**: Formulários adaptados à especialidade
- ✅ **Automação**: Menos trabalho manual, mais eficiência

### Para o Mercado
- 🏆 **Diferencial Competitivo**: Nível enterprise
- 🏆 **Compliance**: LGPD, segurança, auditoria
- 🏆 **Escalabilidade**: Sistema cresce com a clínica
- 🏆 **White Label**: Cada clínica com sua marca

---

**Próxima Ação**: Priorizar pilares e iniciar implementação gradual
