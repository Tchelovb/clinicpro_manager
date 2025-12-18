# ClinicPro - Sistema Completo de Gestão de Clínicas Odontológicas e Estéticas

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Arquitetura do Sistema](#arquitetura-do-sistema)
- [Módulos e Funcionalidades](#módulos-e-funcionalidades)
- [Banco de Dados](#banco-de-dados)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Como Executar](#como-executar)
- [Telas do Sistema](#telas-do-sistema)
- [Problemas Conhecidos](#problemas-conhecidos)
- [Roadmap](#roadmap)

---

## 🎯 Visão Geral

**ClinicPro** é um sistema completo de gestão para clínicas odontológicas e de harmonização facial, desenvolvido para centralizar todas as operações administrativas e clínicas em uma única plataforma moderna e intuitiva.

### Propósito

Otimizar a gestão de clínicas através de um sistema integrado que abrange desde o primeiro contato com o lead até o pós-tratamento, incluindo controle financeiro completo e inteligência de negócios.

### Status Atual

> **Última Atualização**: 18 de Dezembro de 2025  
> **Status**: ✅ **TOTALMENTE FUNCIONAL**  
> **Versão**: 1.0.0

### Público-Alvo

- Clínicas odontológicas e de harmonização facial
- Dentistas e profissionais de saúde
- Recepcionistas e equipe administrativa
- Gestores e administradores de clínicas

### Características Principais

- ✅ **Multi-tenancy Completo**: Suporta múltiplas clínicas com gerenciamento central (MASTER)
- ✅ **Tempo Real**: Atualizações em tempo real via Supabase Realtime
- ✅ **Responsivo**: Interface adaptável para desktop e mobile
- ✅ **Seguro**: Row Level Security (RLS) para isolamento de dados
- ✅ **Escalável**: Arquitetura serverless com Supabase
- ✅ **Completo**: 31 tabelas, 9 módulos principais, 100% funcional

---

## 🛠️ Tecnologias Utilizadas

### Frontend

- **React 19.2.3**: Biblioteca principal para construção da interface
- **TypeScript 5.8.2**: Tipagem estática para maior segurança
- **Vite 6.2.0**: Build tool moderna e rápida
- **React Router DOM 7.10.1**: Navegação SPA
- **Lucide React 0.561.0**: Biblioteca de ícones moderna

### Backend & Infraestrutura

- **Supabase**: Backend-as-a-Service completo
  - PostgreSQL: Banco de dados relacional
  - Auth: Autenticação e autorização
  - Realtime: Atualizações em tempo real
  - Storage: Armazenamento de arquivos
  - Row Level Security (RLS): Segurança a nível de linha

### Bibliotecas Adicionais

- **@tanstack/react-query 5.17.15**: Gerenciamento de estado assíncrono
- **Recharts 3.5.1**: Gráficos e visualizações
- **jsPDF 2.5.1**: Geração de PDFs
- **html2canvas 1.4.1**: Captura de telas
- **XLSX 0.18.5**: Exportação para Excel
- **Zod 3.22.4**: Validação de schemas

### Gerenciamento de Estado

- **Context API**: Estado global da aplicação
- **React Query**: Cache e sincronização de dados do servidor
- **Hooks customizados**: Lógica reutilizável

---

## 🏗️ Arquitetura do Sistema

### Arquitetura Geral

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ Components  │  │   Contexts   │  │  Custom Hooks │  │
│  └─────────────┘  └──────────────┘  └───────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │ @supabase/supabase-js
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  Supabase (Backend)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ PostgreSQL   │  │  Auth (JWT)  │  │   Realtime   │  │
│  │   + RLS      │  │              │  │ Subscriptions│  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Padrões Arquiteturais

- **SPA (Single Page Application)**: Navegação sem recarregamento de página
- **Component-Based**: Componentes reutilizáveis e modulares
- **Serverless**: Sem servidor próprio, totalmente gerenciado pelo Supabase
- **Multi-tenancy**: Isolamento de dados por `clinic_id` via RLS

### Fluxo de Autenticação

1. Usuário insere código da clínica, email e senha
2. Supabase Auth valida credenciais
3. JWT é gerado e armazenado no localStorage
4. `clinic_id` é extraído do perfil do usuário
5. Todas as queries são automaticamente filtradas por `clinic_id` via RLS

### Comunicação com Banco de Dados

- **Queries diretas**: Uso do cliente Supabase sem ORM
- **Exemplo**: `supabase.from('patients').select('*').eq('clinic_id', clinicId)`
- **Realtime**: Subscriptions para atualizações automáticas
- **Transações**: Suporte a operações complexas via RPC functions

---

## 📦 Módulos e Funcionalidades

### 1. 🏠 Dashboard (Central de Inteligência)

**Status**: ✅ Funcional

**Funcionalidades**:

- **KPIs Principais**: Atendimentos, Novas Oportunidades, Meta do Dia
- **Agenda de Hoje**: Lista de agendamentos do dia
- **Lembretes & Tarefas**: Gestão de tarefas e lembretes rápidos
- **Fila de Oportunidades**: Leads pendentes de ação
- **Meta de Conversão**: Acompanhamento de metas diárias

**Correção Recente** (17/12/2025): Erro de coluna `appointments.time` corrigido. Dashboard agora carrega perfeitamente.

---

### 2. 💼 CRM - Central de Conversão

**Status**: ✅ Funcional

![CRM Kanban](file:///C:/Users/marce/.gemini/antigravity/brain/37a74915-7de3-47e2-86f0-8fdfe51804c7/crm_kanban_board_1765999103958.png)

**Funcionalidades**:

- **Kanban Board**: Visualização do funil de vendas
- **Estágios**: Nova Oportunidade → Em Contato → Agendado → Orçamento → Negociação → Aprovado/Perdido
- **Métricas**:
  - Total de oportunidades ativas
  - Taxa de conversão
  - Valor total no pipeline
- **Gestão de Leads**:
  - Cadastro de novos contatos
  - Histórico de interações (WhatsApp, ligações, emails)
  - Tarefas e follow-ups
  - Origens customizáveis (Instagram, Google, Facebook, Indicação)
  - Status customizáveis por clínica
- **Ações**:
  - Arrastar e soltar entre estágios
  - Converter lead em paciente
  - Vincular orçamentos

**Tabelas Relacionadas**:

- `leads`: Dados principais dos leads
- `lead_interactions`: Histórico de comunicações
- `lead_tasks`: Tarefas de acompanhamento
- `lead_source`: Origens customizáveis
- `custom_lead_status`: Status personalizados

---

### 3. 📅 Agenda

**Status**: ✅ Funcional (com ressalvas)

**Funcionalidades**:

- **Visualizações**:
  - Dia: Visão detalhada por hora
  - Semana: Visão semanal
  - Mês: Calendário mensal
- **Agendamentos**:
  - Tipos: Avaliação, Procedimento, Retorno, Urgência
  - Status: Pendente, Confirmado, Concluído, Cancelado, Faltou
  - Duração configurável
  - Notas e observações
- **Profissionais**:
  - Cores diferenciadas por profissional
  - Horários de trabalho configuráveis
  - Bloqueios de agenda
- **Configurações**:
  - Horário de funcionamento da clínica
  - Duração dos slots (15, 30, 45, 60 min)
  - Dias de funcionamento

**Tabelas Relacionadas**:

- `appointments`: Agendamentos
- `professional_schedules`: Horários dos profissionais
- `clinics`: Configurações de agenda

**Problema Conhecido**: Coluna `time` não existe na tabela `appointments` (usa `date` TIMESTAMP)

---

### 4. 👥 Pacientes

**Status**: ✅ Funcional

![Listagem de Pacientes](file:///C:/Users/marce/.gemini/antigravity/brain/37a74915-7de3-47e2-86f0-8fdfe51804c7/patients_listing_page_1765999027186.png)

**Funcionalidades**:

- **Cadastro Completo**:
  - Dados pessoais (nome, CPF, telefone, email, endereço)
  - Data de nascimento e gênero
  - Status do tratamento
- **Busca e Filtros**:
  - Busca por nome, CPF ou telefone
  - Filtros por status
  - Ordenação customizável
- **Ficha do Paciente** (Detalhes):
  - **Prontuário**: Notas clínicas (Anamnese, Evolução, Exames)
  - **Orçamentos**: Histórico de orçamentos (Aprovados, Pendentes, Reprovados)
  - **Tratamentos**: Itens de tratamento com status (Não Iniciado, Em Andamento, Concluído)
  - **Financeiro**: Parcelas a receber, histórico de pagamentos
  - **Documentos**: Contratos, TCLEs, atestados
- **Métricas Financeiras**:
  - Total aprovado
  - Total pago
  - Saldo devedor

**Tabelas Relacionadas**:

- `patients`: Dados principais
- `clinical_notes`: Prontuário
- `budgets` + `budget_items`: Orçamentos
- `treatment_items`: Tratamentos
- `financial_installments`: Parcelas
- `patient_documents`: Documentos

---

### 5. 💰 Financeiro

**Status**: ✅ Funcional

![Módulo Financeiro](file:///C:/Users/marce/.gemini/antigravity/brain/37a74915-7de3-47e2-86f0-8fdfe51804c7/.system_generated/click_feedback/click_feedback_1765999273242.png)

**Funcionalidades**:

#### 5.1 Visão Geral (Dashboard Financeiro)

- **Métricas do Dia**:
  - Entradas hoje
  - Saídas hoje
  - Saldo do dia
- **DRE (Demonstração do Resultado do Exercício)**:
  - Resultado operacional do mês
  - Margem de lucro
  - Comparativo com mês anterior
- **Indicadores**:
  - Ticket médio
  - Inadimplência
  - Contas a pagar vencidas
  - Contas a receber vencidas

#### 5.2 Caixa Diário

- **Abertura de Caixa**:
  - Saldo inicial
  - Responsável
  - Data/hora de abertura
- **Movimentações**:
  - Entradas (recebimentos)
  - Saídas (pagamentos)
  - Categoria e método de pagamento
- **Fechamento de Caixa**:
  - Saldo calculado
  - Saldo informado
  - Diferença (sangria/sobra)
  - Observações

#### 5.3 Contas a Pagar (Despesas)

- **Cadastro de Despesas**:
  - Descrição
  - Categoria (Fixa, Variável, Impostos, Laboratório, Pessoal)
  - Fornecedor
  - Valor
  - Data de vencimento
- **Gestão**:
  - Status (Pendente, Pago, Atrasado, Pago Parcial)
  - Pagamentos parciais
  - Histórico de pagamentos
  - Filtros por período e categoria

#### 5.4 Contas a Receber (Receitas)

- **Parcelas de Pacientes**:
  - Descrição (vinculada a orçamento)
  - Paciente
  - Valor
  - Data de vencimento
  - Método de pagamento
- **Gestão de Recebimentos**:
  - Recebimento total ou parcial
  - Histórico de pagamentos
  - Status automático (Pendente, Pago, Atrasado)
  - Vinculação com transações de caixa

**Tabelas Relacionadas**:

- `financial_installments`: Contas a receber
- `expenses`: Contas a pagar
- `transactions`: Movimentações financeiras
- `cash_registers`: Registros de caixa
- `payment_history`: Histórico de pagamentos
- `expense_category`, `revenue_category`, `payment_method`: Configurações customizáveis

---

### 6. 📄 Documentos

**Status**: ✅ Funcional

**Funcionalidades**:

- **Modelos de Documentos**:
  - Contratos de prestação de serviços
  - TCLEs (Termos de Consentimento)
  - Anamneses (Odontológica, Harmonização Facial)
  - Atestados (Comparecimento, Repouso)
  - Receitas
  - Documentos personalizados
- **Variáveis Dinâmicas**:
  - `{{paciente}}`, `{{cpf}}`, `{{telefone}}`
  - `{{clinica}}`, `{{cnpj}}`, `{{endereco_clinica}}`
  - `{{doutor}}`, `{{data}}`
- **Geração de Documentos**:
  - Seleção de modelo
  - Preenchimento automático de dados do paciente
  - Edição antes de finalizar
  - Assinatura digital (status)
- **Fichas em Branco**:
  - Odontograma
  - Ficha de Anamnese
  - Ficha de Evolução
  - Exportação em PDF

**Tabelas Relacionadas**:

- `document_templates`: Modelos
- `patient_documents`: Documentos gerados

---

### 7. 📊 Relatórios - Central de Inteligência

**Status**: ✅ Funcional

**Funcionalidades**:

- **KPIs Estratégicos**:
  - Resultado líquido do mês
  - Margem de lucro
  - Faturamento bruto
  - Custos operacionais
  - Ticket médio
  - Inadimplência
  - Novos tratamentos
  - Pipeline comercial
- **Gráficos**:
  - Crescimento vs Lucratividade (linha do tempo)
  - Funil de vendas (conversão de leads)
  - Distribuição de receitas por categoria
  - Evolução de despesas
- **Exportações**:
  - PDF
  - Excel
  - CSV

---

### 8. ⚙️ Configurações

**Status**: ✅ Funcional

![Configurações da Clínica](file:///C:/Users/marce/.gemini/antigravity/brain/37a74915-7de3-47e2-86f0-8fdfe51804c7/.system_generated/click_feedback/click_feedback_1765999555110.png)

**Seções**:

#### 8.1 Clínica

- Dados básicos (nome, CNPJ, endereço, telefone, email)
- Código de identificação (único)
- Configurações de agenda (horários, duração de slots, dias de funcionamento)

#### 8.2 Usuários

- Cadastro de usuários do sistema
- Roles: Admin, Dentista, Recepcionista, Auxiliar
- Vinculação com profissionais
- Ativação/desativação

#### 8.3 Profissionais

- Cadastro de dentistas e profissionais
- CRC/CRO e especialidade
- Foto e cor (para agenda)
- Horários de trabalho por dia da semana
- Status ativo/inativo

#### 8.4 Procedimentos

- Cadastro de serviços oferecidos
- Categorias (Prevenção, Dentística, Implantodontia, Estética, etc.)
- Preço base
- Duração estimada
- Número de sessões
- Código TUSS
- Descrição

#### 8.5 Tabelas de Preço

- Criação de múltiplas tabelas (Particular, Convênios)
- Ajuste global por percentual
- Preços específicos por procedimento
- Tabela padrão
- Ativação/desativação

#### 8.6 Convênios

- Cadastro de convênios/planos de saúde
- Código do convênio
- Vinculação com tabela de preços
- Status ativo/inativo

#### 8.7 Financeiro & CRM

- **Categorias de Despesa**: Customizáveis por clínica
- **Categorias de Receita**: Customizáveis por clínica
- **Métodos de Pagamento**: Customizáveis (Pix, Cartão, Boleto, Dinheiro, etc.)
- **Origens de Leads**: Customizáveis (Instagram, Google, Facebook, etc.)
- **Status de Leads**: Customizáveis com ordenação

**Tabelas Relacionadas**:

- `clinics`: Dados da clínica
- `users`: Usuários do sistema
- `professionals`: Profissionais
- `professional_schedules`: Horários
- `procedure`: Procedimentos
- `price_tables` + `price_table_items`: Tabelas de preço
- `conventions`: Convênios
- `expense_category`, `revenue_category`, `payment_method`: Categorias financeiras
- `lead_source`, `custom_lead_status`: Configurações de CRM

---

## 🗄️ Banco de Dados

### Tecnologia

- **PostgreSQL** (via Supabase)
- **Versão**: 15+
- **Extensões**: uuid-ossp, pgcrypto

### Estrutura

O banco de dados possui **31 tabelas** organizadas em módulos:

#### Tabelas Principais

| Tabela              | Descrição                          | Registros Típicos |
| ------------------- | ---------------------------------- | ----------------- |
| `clinics`           | Dados das clínicas (multi-tenancy) | 1-N clínicas      |
| `users`             | Usuários do sistema                | 5-50 por clínica  |
| `patients`          | Cadastro de pacientes              | 100-10.000+       |
| `procedure`         | Procedimentos/Serviços             | 50-500            |
| `price_tables`      | Tabelas de preços                  | 3-20              |
| `price_table_items` | Preços específicos                 | 150-10.000        |

#### Módulo CRM

| Tabela               | Descrição               |
| -------------------- | ----------------------- |
| `leads`              | Leads/Oportunidades     |
| `lead_interactions`  | Histórico de interações |
| `lead_tasks`         | Tarefas de follow-up    |
| `lead_source`        | Origens customizáveis   |
| `custom_lead_status` | Status personalizados   |

#### Módulo Clínico

| Tabela            | Descrição                 |
| ----------------- | ------------------------- |
| `appointments`    | Agendamentos              |
| `clinical_notes`  | Prontuário/Notas clínicas |
| `budgets`         | Orçamentos                |
| `budget_items`    | Itens de orçamento        |
| `treatment_items` | Itens de tratamento       |

#### Módulo Financeiro

| Tabela                   | Descrição                 |
| ------------------------ | ------------------------- |
| `financial_installments` | Contas a receber          |
| `expenses`               | Contas a pagar            |
| `transactions`           | Movimentações financeiras |
| `cash_registers`         | Registros de caixa        |
| `payment_history`        | Histórico de pagamentos   |

#### Módulo Documentos

| Tabela               | Descrição             |
| -------------------- | --------------------- |
| `document_templates` | Modelos de documentos |
| `patient_documents`  | Documentos gerados    |

#### Configurações

| Tabela                   | Descrição                |
| ------------------------ | ------------------------ |
| `professionals`          | Profissionais da clínica |
| `professional_schedules` | Horários de trabalho     |
| `conventions`            | Convênios                |
| `insurance_plans`        | Planos de saúde          |
| `expense_category`       | Categorias de despesas   |
| `revenue_category`       | Categorias de receitas   |
| `payment_method`         | Métodos de pagamento     |

### Tipos Enum (USER-DEFINED)

```sql
-- Roles de usuários
CREATE TYPE role AS ENUM ('ADMIN', 'DENTIST', 'RECEPTIONIST', 'ASSISTANT');

-- Status de leads
CREATE TYPE lead_status AS ENUM ('NEW', 'CONTACT', 'QUALIFICATION', 'SCHEDULED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST');

-- Status de agendamentos
CREATE TYPE appointment_status AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELED', 'MISSED');

-- Tipos de agendamentos
CREATE TYPE appointment_type AS ENUM ('EVALUATION', 'PROCEDURE', 'RETURN', 'URGENCY');

-- Status de orçamentos
CREATE TYPE budget_status AS ENUM ('DRAFT', 'SENT', 'NEGOTIATION', 'APPROVED', 'REJECTED');

-- Status de tratamentos
CREATE TYPE treatment_status AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- Status de pagamentos
CREATE TYPE payment_status AS ENUM ('PENDING', 'PAID', 'PARTIAL', 'OVERDUE');

-- Tipos de transações
CREATE TYPE transaction_type AS ENUM ('INCOME', 'EXPENSE');

-- Tipos de documentos
CREATE TYPE document_type AS ENUM ('CONTRACT', 'CONSENT', 'ANAMNESIS', 'CERTIFICATE', 'PRESCRIPTION', 'OTHER');
```

### Relacionamentos Principais

```
clinics (1) ──────┬─────── (N) users
                  ├─────── (N) patients
                  ├─────── (N) procedure
                  ├─────── (N) leads
                  └─────── (N) appointments

patients (1) ─────┬─────── (N) budgets
                  ├─────── (N) financial_installments
                  ├─────── (N) clinical_notes
                  └─────── (N) patient_documents

budgets (1) ──────┬─────── (N) budget_items
                  └─────── (N) treatment_items

price_tables (1) ─┬─────── (N) price_table_items
                  ├─────── (N) budgets
                  └─────── (N) conventions

leads (1) ────────┬─────── (N) lead_interactions
                  └─────── (N) lead_tasks
```

### Row Level Security (RLS)

Todas as tabelas principais possuem RLS habilitado para garantir isolamento de dados por clínica:

```sql
-- Exemplo de política RLS
CREATE POLICY "clinic_isolation" ON patients
  FOR ALL USING (
    clinic_id = (SELECT clinic_id FROM users WHERE id = auth.uid())
  );
```

### Índices para Performance

```sql
-- Índices para clinic_id (multi-tenancy)
CREATE INDEX idx_patients_clinic_id ON patients(clinic_id);
CREATE INDEX idx_appointments_clinic_id ON appointments(clinic_id);
CREATE INDEX idx_leads_clinic_id ON leads(clinic_id);

-- Índices para datas e status (queries frequentes)
CREATE INDEX idx_appointments_date ON appointments(date);
CREATE INDEX idx_financial_installments_due_date ON financial_installments(due_date);
CREATE INDEX idx_expenses_due_date ON expenses(due_date);
```

---

## 📁 Estrutura do Projeto

```
ClinicPro/
├── components/              # Componentes React
│   ├── Dashboard.tsx       # Dashboard principal (com erro)
│   ├── CRM.tsx             # Módulo CRM/Leads
│   ├── Agenda.tsx          # Módulo de agendamentos
│   ├── Patients.tsx        # Listagem de pacientes
│   ├── PatientDetail.tsx   # Detalhes do paciente
│   ├── PatientForm.tsx     # Formulário de cadastro
│   ├── Financial.tsx       # Módulo financeiro
│   ├── Documents.tsx       # Módulo de documentos
│   ├── Reports.tsx         # Relatórios e BI
│   ├── Settings.tsx        # Configurações
│   ├── Login.tsx           # Tela de login
│   ├── Sidebar.tsx         # Menu lateral
│   ├── BottomNav.tsx       # Menu inferior (mobile)
│   └── settings/           # Componentes de configuração
│       ├── ClinicSettings.tsx
│       ├── UsersSettings.tsx
│       ├── ProfessionalsSettings.tsx
│       ├── ProceduresSettings.tsx
│       ├── PriceTablesSettings.tsx
│       └── FinancialCRMSettings.tsx
├── contexts/               # Contextos React
│   ├── AuthContext.tsx    # Autenticação
│   └── DataContext.tsx    # Dados globais
├── hooks/                  # Custom Hooks
│   ├── useDashboardData.ts
│   ├── usePatients.ts
│   ├── useLeads.ts
│   ├── useCashRegister.ts
│   └── useProfessionals.ts
├── lib/                    # Bibliotecas e configurações
│   ├── supabase.ts        # Cliente Supabase
│   └── queryClient.ts     # React Query
├── services/               # Serviços de API
│   └── settingsService.ts # Serviços de configuração
├── sql/                    # Scripts SQL
│   └── schema.sql         # Schema completo do banco
├── types.ts                # Definições de tipos TypeScript
├── constants.ts            # Constantes e dados mock
├── App.tsx                 # Componente raiz
├── index.tsx               # Entry point
├── vite.config.ts          # Configuração Vite
├── tsconfig.json           # Configuração TypeScript
└── package.json            # Dependências
```

---

## 🚀 Como Executar

### Pré-requisitos

- **Node.js**: versão 16 ou superior
- **npm**: versão 7 ou superior
- **Conta Supabase**: Para configurar o backend

### Passo 1: Clonar o Repositório

```bash
git clone <url-do-repositorio>
cd ClinicPro
```

### Passo 2: Instalar Dependências

```bash
npm install
```

### Passo 3: Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
```

> **Como obter as credenciais**:
>
> 1. Acesse [supabase.com](https://supabase.com)
> 2. Crie um novo projeto ou acesse um existente
> 3. Vá em Settings > API
> 4. Copie a URL e a `anon` key

### Passo 4: Configurar o Banco de Dados

1. No painel do Supabase, vá em **SQL Editor**
2. Execute o script `sql/schema.sql` para criar todas as tabelas
3. Configure as políticas RLS conforme necessário
4. (Opcional) Importe dados de exemplo

### Passo 5: Executar o Projeto

```bash
npm run dev
```

O sistema estará disponível em `http://localhost:3000`

### Passo 6: Fazer Login

Use as credenciais de administrador:

```
Código da Clínica: CLINICPRO
Email: admin@clinicpro.com
Senha: admin123
```

> **Nota**: Estas são credenciais de exemplo. Em produção, altere-as imediatamente.

---

## 🖼️ Telas do Sistema

### Tela de Login

![Login](file:///C:/Users/marce/.gemini/antigravity/brain/37a74915-7de3-47e2-86f0-8fdfe51804c7/login_page_1765998194955.png)

**Elementos**:

- Código da clínica (identificador único)
- Email do usuário
- Senha
- Botão "Entrar"

---

### CRM - Kanban de Leads

![CRM Kanban](file:///C:/Users/marce/.gemini/antigravity/brain/37a74915-7de3-47e2-86f0-8fdfe51804c7/crm_kanban_board_1765999103958.png)

**Funcionalidades Visíveis**:

- 5 colunas do funil (Nova Oportunidade → Negociação)
- Cards de leads com nome, origem e valor
- Métricas: 5 oportunidades, 20% conversão, R$ 9.700 em pipeline
- Botão "+ Novo Contato"
- Alternância de visualização (Kanban/Lista)

---

### Listagem de Pacientes

![Pacientes](file:///C:/Users/marce/.gemini/antigravity/brain/37a74915-7de3-47e2-86f0-8fdfe51804c7/patients_listing_page_1765999027186.png)

**Funcionalidades Visíveis**:

- Busca por nome, CPF ou telefone
- Filtros por status
- Tabela com: Paciente, Contato, Status, Última Visita, Ações
- Badges de status coloridos (Em Tratamento, Manutenção, Arquivo)
- Botão "+ Novo" para cadastro
- Contador de pacientes encontrados

---

### Módulo Financeiro

![Financeiro](file:///C:/Users/marce/.gemini/antigravity/brain/37a74915-7de3-47e2-86f0-8fdfe51804c7/.system_generated/click_feedback/click_feedback_1765999273242.png)

**Funcionalidades Visíveis**:

- 4 tabs: Visão Geral, Caixa Diário, A Pagar, A Receber
- Métricas: Entradas/Saídas Hoje, DRE, Ticket Médio
- Tabelas de contas a pagar e receber
- Status coloridos (Pendente, Pago, Atrasado)
- Botões de ação (Pagar, Receber)

---

### Configurações

![Configurações](file:///C:/Users/marce/.gemini/antigravity/brain/37a74915-7de3-47e2-86f0-8fdfe51804c7/.system_generated/click_feedback/click_feedback_1765999555110.png)

**Funcionalidades Visíveis**:

- Menu lateral com seções: Clínica, Usuários, Profissionais, Procedimentos, Tabelas de Preço, Convênios, Financeiro & CRM
- Formulário de dados da clínica
- Configurações de agenda (horários, duração de slots, dias de funcionamento)
- Botão "Salvar" flutuante

---

## ⚠️ Problemas Conhecidos

### ~~1. Dashboard Principal - Erro de Carregamento~~ ✅ CORRIGIDO

**Status**: ✅ **RESOLVIDO**

**Descrição**: A página `/dashboard` apresentava erro ao carregar dados de agendamentos.

**Erro**: `column appointments.time does not exist`

**Solução Aplicada** (17/12/2025):

- Arquivo `hooks/useDashboardData.ts` corrigido
- Linha 62: Alterado `.order("time")` para `.order("date")`
- Linhas 60-62: Alterado filtro de data para usar range de timestamps (`gte`/`lte`)

**Resultado**: Dashboard agora funciona perfeitamente, exibindo KPIs, agenda, lembretes e fila de oportunidades.

---

### 2. Tabela `procedure` (Singular)

**Descrição**: A tabela de procedimentos é `procedure` (singular), não `procedures` (plural).

**Status**: ✅ Já corrigido no código atual

**Verificar**: Garantir que todas as queries usam `supabase.from('procedure')`

---

## 🔧 Correções Recentes (Dezembro 2025)

### 18/12/2025 - Sessão de Correções Críticas

#### 1. ✅ Seletor de Profissional em Orçamentos

**Problema**: Orçamentos sempre usavam o usuário logado como profissional responsável  
**Solução**:

- Adicionado dropdown de seleção de profissional no formulário de orçamento
- Auto-seleção do profissional logado (se tiver `professional_id`)
- Auto-seleção da tabela "Particular" por padrão
- Validação obrigatória de profissional e tabela de preços

#### 2. ✅ Nome do Profissional em Orçamentos e Tratamentos

**Problema**: Exibindo nome do usuário em vez do profissional responsável  
**Solução**:

- Corrigido join com tabelas `users` e `professionals`
- Nome completo do profissional agora aparece corretamente
- Prefixo "Dr." adicionado automaticamente
- Eliminada duplicação de prefixos

#### 3. ✅ Exclusão de Orçamentos

**Problema**: Botão excluir não funcionava (diálogo `confirm()` não aparecia)  
**Solução**:

- Substituído `window.confirm()` por modal customizado
- Modal estilizado com confirmação visual clara
- Exclusão agora funciona perfeitamente

#### 4. ✅ Recálculo Financeiro ao Excluir Orçamento

**Problema**: Saldo do paciente ficava incorreto após excluir orçamento aprovado  
**Solução**:

- Corrigido filtro de parcelas financeiras (estava mantendo em vez de remover)
- Recálculo correto de `total_approved`, `total_paid` e `balance_due`
- Script SQL criado para corrigir dados legados

#### 5. ✅ Data de Execução em Tratamentos

**Problema**: Data de conclusão não aparecia nos tratamentos concluídos  
**Solução**:

- Adicionado campo `executionDate` ao mapeamento de tratamentos
- Join com profissionais ao recarregar após conclusão
- Data formatada em português (DD/MM/AAAA)

#### 6. ✅ Cards de Estatísticas em Tratamentos

**Problema**: Faltava card "Não Iniciado"  
**Solução**:

- Adicionado 4º card com contador de tratamentos não iniciados
- Grid responsivo (1/2/4 colunas)
- Ícones e cores diferenciadas por status

#### 7. ✅ Tratamentos Não Apareciam Após Aprovar Orçamento

**Problema**: Erro `PGRST201` - ambiguidade no relacionamento `treatment_items` → `users`  
**Solução**:

- Especificado relacionamento `doctor:users!doctor_id` na query
- Join correto com tabela de profissionais
- Tratamentos agora carregam automaticamente após aprovação

---

## 🗺️ Roadmap

### Curto Prazo (1-2 meses)

- [x] ~~Corrigir erro do Dashboard principal~~ ✅ **CONCLUÍDO** (17/12/2025)
- [ ] Implementar notificações push
- [ ] Adicionar suporte a anexos em prontuários
- [ ] Melhorar responsividade mobile
- [ ] Adicionar testes automatizados

### Médio Prazo (3-6 meses)

- [ ] Integração com WhatsApp Business API
- [ ] Assinatura digital de documentos
- [ ] Aplicativo mobile nativo (React Native)
- [ ] Integração com sistemas de pagamento (Stripe, PagSeguro)
- [ ] Backup automático de dados

### Longo Prazo (6-12 meses)

- [ ] IA para sugestões de diagnósticos
- [ ] Integração com NFe (Nota Fiscal Eletrônica)
- [ ] Sistema de fidelidade para pacientes
- [ ] Marketplace de laboratórios
- [ ] API pública para integrações

---

## 📞 Suporte e Contribuição

### Como Contribuir

1. Faça um fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

### Convenções de Código

- **TypeScript**: Sempre tipar variáveis e funções
- **Componentes**: PascalCase para nomes de componentes
- **Funções**: camelCase para funções e variáveis
- **Constantes**: UPPER_SNAKE_CASE para constantes
- **Commits**: Mensagens em português, descritivas

### Reportar Bugs

Abra uma issue no GitHub com:

- Descrição detalhada do problema
- Passos para reproduzir
- Screenshots (se aplicável)
- Versão do navegador e sistema operacional

---

## 📄 Licença

Este projeto é proprietário e confidencial. Todos os direitos reservados.

---

## 👥 Equipe

Desenvolvido com ❤️ para otimizar a gestão de clínicas odontológicas e estéticas.

**Última atualização**: Dezembro 2025
