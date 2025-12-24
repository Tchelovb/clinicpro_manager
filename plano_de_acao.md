# 🎯 PLANO DE AÇÃO COMPLETO - CLINIC PRO MANAGER (BOS)

**Data de Criação:** 23/12/2025  
**Status do Projeto:** 🟡 Em Desenvolvimento Avançado  
**Meta:** Transformar o ClinicPro em um "Sócio Digital Ativo" Enterprise-Grade
# 🤖 INSTRUÇÃO DE ARQUITETURA: HIERARQUIA DE DEPENDÊNCIAS SQL

Ao construir o Módulo de Configurações, você deve respeitar a integridade referencial do banco de dados. Não tente criar formulários isolados.

**ANALISE AS DEPENDÊNCIAS:**
1. Para criar um **Orçamento (budgets)**, o usuário PRECISA selecionar uma **Tabela de Preço (price_tables)**.
2. Para criar um **Item de Orçamento (budget_items)**, deve existir um **Procedimento (procedure)** previamente cadastrado.
3. Para configurar o **Lucro de um Procedimento (procedure_costs)**, deve existir o **Custo Fixo (clinic_cost_structure)** e os **Kits de Materiais (procedure_recipes)**.

**SUA TAREFA:**
Crie uma interface de Configurações que utilize o padrão **Sheet First** e organize as abas por ordem de "Precedência de Dados":
- **Aba 1 (Fundação):** Clínica, Usuários e Profissionais.
- **Aba 2 (Financeiro):** Contas Bancárias, Categorias, Impostos e Taxas de Cartão.
- **Aba 3 (Comercial):** Tabelas de Preços e Procedimentos.
- **Aba 4 (Estoque):** Categorias de Insumos e Itens de Estoque.
- **Aba 5 (Clínico):** Templates de Anamnese e Documentos.
  se precisar crie mais abas
**REQUISITO DE UX:**
Sempre que um campo for um `Select` (Foreign Key), preveja um botão "+" ao lado para abrir um **Sub-Sheet** de cadastro rápido, caso o pré-requisito não exista. (Ex: No cadastro de Procedimento, se não houver Categoria, abrir Sheet de Nova Categoria).
---

## 📊 ANÁLISE DO ESTADO ATUAL DO SISTEMA

### ✅ O QUE JÁ ESTÁ IMPLEMENTADO
# 🤖 CLINICPRO MASTER PLAN & UI RE-ORIENTATION (v2.0)

Atue como Senior Full-Stack Developer e Architect. O Dr. Marcelo (Product Owner) estabeleceu novas diretrizes para o sistema ClinicPro. A partir de agora, este prompt deve ser a sua base de referência para todas as implementações.

## 1. 🎨 DIRETRIZES DE UI/UX: "SHEET FIRST STRATEGY" (OBRIGATÓRIO)
O objetivo é padronizar a interface para um nível "High Ticket" (estilo Kommo/HubSpot).

* **REGRA DO SHEET (GAVETA):** Use GAVETAS LATERAIS (Sheets) para todos os formulários de Cadastro (Novo), Edição e Visualização de Detalhes.
    * **Comportamento:** Deslize da direita para a esquerda.
    * **Anatomia:** Header e Footer (Botões) FIXOS. Conteúdo central com scroll interno (`overflow-y-auto`).
    * **Visual:** Fundo com desfoque (`backdrop-blur-sm`), overlay escuro (`bg-black/50`) e sombra profunda (`shadow-2xl`).
    * **Larguras (Tailwind):** Pequeno (`sm:max-w-md`), Padrão (`sm:max-w-xl`), ou Extra Wide para orçamentos/tabelas (`sm:max-w-4xl`).

* **REGRA DO MODAL (DIALOG):** Use MODAIS CENTRALIZADOS apenas para Confirmações Destrutivas (Ex: "Excluir?") e Segurança (PIN). Nunca para cadastros.

#### 1. **Infraestrutura & Arquitetura** (95% Completo)
- ✅ **Stack Tecnológica Moderna:**
  - React 18 + TypeScript + Vite
  - Tailwind CSS + Shadcn/UI + Lucide Icons
  - Supabase (PostgreSQL) com RLS
  - Deploy em Cloudflare Pages

- ✅ **Banco de Dados Completo (68+ Tabelas):**
  - `clinics`, `users`, `patients`, `professionals`
  - `budgets`, `budget_items`, `installments`, `transactions`
  - `appointments`, `treatment_items`, `clinical_notes`
  - `ai_insights`, `user_progression`, `tactical_operations`
  - `ortho_contracts`, `ortho_treatment_plans`, `ortho_appointments`
  - `lab_orders`, `inventory_items`, `inventory_movements`
  - `leads`, `lead_interactions`, `marketing_campaigns`
  - `procedure_costs`, `procedure_recipes`, `clinic_cost_structure`
  - `fiscal_invoices`, `bank_transactions`, `commission_payments`
  - E mais 40+ tabelas auxiliares

#### 2. **Módulos Funcionais Implementados** (70% Completo)

**A. Gestão de Pacientes** ✅
- Cadastro completo com fotos e documentos
- Perfil detalhado com 8 abas (Dados, Clínica Geral, Ortodontia, HOF, Financeiro, Imagens, Documentos, Histórico)
- Sistema de classificação (Diamond, Gold, Standard, Risk, Blacklist)
- Galeria de imagens (antes/depois)
- Histórico clínico e financeiro completo

**B. Módulo Financeiro** ✅ (Parcial)
- Gestão de orçamentos com múltiplas opções
- Controle de parcelas e recebimentos
- Fluxo de caixa básico
- Relatórios financeiros
- ⚠️ **FALTANDO:** Profit Engine completo, OFX Matcher, NFS-e

**C. Gestão Clínica** ✅
- Procedimentos categorizados (Clínica Geral, Ortodontia, HOF)
- 200+ especialidades cadastradas
- Planos de tratamento
- Agenda de consultas
- Prontuário eletrônico básico

**D. Ortodontia Avançada** ✅
- Contratos ortodônticos
- Planos de tratamento
- Controle de alinhadores
- Evoluções clínicas
- Gestão de fases

**E. Laboratório** ✅
- Pedidos de próteses
- Controle de prazos
- Status de trabalhos
- Integração com tratamentos

**F. Estoque** ✅
- Cadastro de produtos
- Movimentações
- Alertas de estoque mínimo
- Receitas de procedimentos (Kits)

**G. Gamificação** ✅ (80%)
- Sistema de XP e níveis (1-4)
- Conquistas e recompensas
- Triggers automáticos de XP
- ⚠️ **FALTANDO:** Interface visual completa, Ranking público

**H. Inteligência Artificial** ✅ (60%)
- Motor de Insights Nativos (7 Sentinelas SQL)
- ChatBOS com GPT-4
- ClinicHealth Score (5 pilares)
- ⚠️ **FALTANDO:** 10 Sentinelas adicionais, Universal Rescue

#### 3. **Hooks & Serviços Implementados** (24 Hooks)
- ✅ `usePatients`, `useBudgets`, `useProcedures`
- ✅ `useGameification`, `useBOSChat`, `useAIInsights`
- ✅ `useOrtho`, `useFinancialCalculator`, `useCashRegister`
- ✅ `useLeads`, `useOpportunityHub`, `useWarRoom`
- ✅ `MasterIntelligenceService`, `gamificationService`
- ✅ `highTicketService`, `orthoService`, `labOrderService`

#### 4. **Componentes UI Implementados** (134 Componentes TSX)
- ✅ `AppLayout`, `BOSChat`, `IntelligenceCenter`
- ✅ `PatientDetail`, `PatientForm`, `PatientTreatments`
- ✅ `HighTicketPipeline`, `GoldenLeadsRecovery`
- ✅ `GamificationFeedback`, `BOSInsightsRadar`
- ✅ `FinancialPages`, `DocumentsCenter`
- ✅ E mais 120+ componentes especializados

---

## 🚨 GAPS CRÍTICOS IDENTIFICADOS

### 🔴 FASE 1: FUNDAÇÃO & BLINDAGEM (40% Completo)

| Item | Status | Prioridade |
|------|--------|-----------|
| Smart Check-in (Holofote) | ❌ Não implementado | 🔴 CRÍTICO |
| Security PIN Modal | ❌ Não implementado | 🔴 CRÍTICO |
| Audit Logs | ✅ Tabela existe, ❌ Implementação parcial | 🟡 ALTA |
| Sentinela S15 (Anomaly Detector) | ❌ Não implementado | 🟡 ALTA |
| Biometria (Leitor de digitais) | ❌ Não implementado | 🟢 MÉDIA |

### 🔴 FASE 2: PROFIT ENGINE (30% Completo)

| Item | Status | Prioridade |
|------|--------|-----------|
| Wizard de Custos | ❌ Não implementado | 🔴 CRÍTICO |
| Cadastro de Kits (Receitas) | ✅ Tabelas existem, ❌ UI incompleta | 🔴 CRÍTICO |
| Orçamento Profit (Barra de Margem) | ❌ Não implementado | 🔴 CRÍTICO |
| Sentinela S1 (Profit Guardian) | ❌ Não implementado | 🔴 CRÍTICO |
| Sentinela S4 (Commission Locker) | ❌ Não implementado | 🟡 ALTA |
| Cálculo de `cost_per_minute` | ❌ Não implementado | 🔴 CRÍTICO |

### 🟡 FASE 3: SALES MACHINE & CRM (50% Completo)

| Item | Status | Prioridade |
|------|--------|-----------|
| Kanban Board | ✅ Implementado (`HighTicketPipeline`) | ✅ COMPLETO |
| Lead Card 360 | ✅ Implementado parcialmente | 🟡 ALTA |
| Sentinela S9 (Lead Rot) | ❌ Não implementado | 🟡 ALTA |
| Sentinela S12 (Opportunity Stagnation) | ❌ Não implementado | 🔴 CRÍTICO |
| Sentinela S13 (Financial Limbo) | ❌ Não implementado | 🔴 CRÍTICO |
| Universal Monitor UI | ❌ Não implementado | 🟡 ALTA |

### 🟡 FASE 4: FISCAL & BANCÁRIO (20% Completo)

| Item | Status | Prioridade |
|------|--------|-----------|
| Importador OFX | ❌ Não implementado | 🟡 ALTA |
| Algoritmo de Match | ❌ Não implementado | 🟡 ALTA |
| Emissor NFS-e | ❌ Não implementado | 🟢 MÉDIA |
| Sentinela S3 (Fiscal Watchdog) | ❌ Não implementado | 🟢 MÉDIA |

### 🟢 FASE 5: EXPANSÃO (40% Completo)

| Item | Status | Prioridade |
|------|--------|-----------|
| Sentinela S6 (Universal Rescue) | ❌ Não implementado | 🔴 CRÍTICO |
| Sentinela S5 (Lab Watchdog) | ❌ Não implementado | 🟡 ALTA |
| Sentinela S7 (Inventory Spy) | ❌ Não implementado | 🟡 ALTA |
| Sentinela S8 (Document Hunter) | ❌ Não implementado | 🟢 MÉDIA |
| Sentinela S10 (Ghostbuster) | ❌ Não implementado | 🟡 ALTA |
| Sentinela S11 (Recurrence AI) | ❌ Não implementado | 🟡 ALTA |
| Landing Page Generator | ✅ Tabela existe, ❌ UI não implementada | 🟢 MÉDIA |
| Painel de Gamificação | ✅ Parcial (feedback), ❌ HUD completo | 🟡 ALTA |

---

## 📋 PLANO DE AÇÃO DETALHADO (ROADMAP EXECUTIVO)

### 🎯 SPRINT 1: FUNDAÇÃO & SEGURANÇA (Semanas 1-2)

**Meta:** Blindar o sistema contra duplicidades e fraudes

#### Tarefa 1.1: Smart Check-in (Holofote) 🔴
**Prioridade:** CRÍTICA  
**Tempo Estimado:** 8 horas  
**Responsável:** Dev Frontend + UX

**Objetivo:** Implementar busca obrigatória antes de cadastrar novo paciente

**Checklist:**
- [ ] Criar componente `SmartCheckIn.tsx`
- [ ] Implementar barra de busca com debounce (300ms)
- [ ] Buscar por: Nome, CPF, Telefone, E-mail
- [ ] Exibir resultados em cards com foto e dados principais
- [ ] Botão "Novo Paciente" só ativa após busca vazia
- [ ] Adicionar mensagem: "⚠️ Busque antes de cadastrar para evitar duplicidade"
- [ ] Integrar com `PatientForm.tsx`
- [ ] Testes: Tentar cadastrar sem buscar (deve bloquear)

**Arquivos a Criar/Modificar:**
- `components/SmartCheckIn.tsx` (NOVO)
- `pages/PatientsList.tsx` (MODIFICAR)
- `components/PatientForm.tsx` (MODIFICAR)

**SQL Necessário:** Nenhum (usa tabela `patients` existente)

---

#### Tarefa 1.2: Security PIN Modal 🔴
**Prioridade:** CRÍTICA  
**Tempo Estimado:** 12 horas  
**Responsável:** Dev Full Stack

**Objetivo:** Criar modal de PIN para ações sensíveis (estornos, descontos >5%, exclusões)

**Checklist:**
- [ ] Criar componente `SecurityPinModal.tsx`
- [ ] Implementar teclado numérico virtual (0-9)
- [ ] Hash do PIN: `bcrypt` ou `crypto.createHash('sha256')`
- [ ] Validar contra `users.transaction_pin_hash`
- [ ] Limitar tentativas: 3 falhas = bloquear por 15min
- [ ] Log de tentativas em `system_audit_logs`
- [ ] Integrar com:
  - Estorno de pagamentos (`ReceivePayment.tsx`)
  - Descontos >5% em orçamentos (`BudgetForm.tsx`)
  - Exclusão de pacientes (`PatientDetail.tsx`)
  - Aprovação de orçamentos com margem <20% (Tarefa 2.3)
- [ ] Testes: PIN correto (libera), PIN errado 3x (bloqueia)

**Arquivos a Criar/Modificar:**
- `components/SecurityPinModal.tsx` (NOVO)
- `services/securityService.ts` (NOVO)
- `pages/financial/ReceivePayment.tsx` (MODIFICAR)
- `components/BudgetForm.tsx` (MODIFICAR)

**SQL Necessário:**
```sql
-- Adicionar campo de bloqueio temporário
ALTER TABLE users ADD COLUMN pin_locked_until TIMESTAMP;
```

---

#### Tarefa 1.3: Audit Logs Completo 🟡
**Prioridade:** ALTA  
**Tempo Estimado:** 6 horas  
**Responsável:** Dev Backend

**Objetivo:** Garantir log de todas as ações críticas

**Checklist:**
- [ ] Criar serviço `auditService.ts`
- [ ] Função `logAction(action_type, entity_type, entity_id, old_value, new_value)`
- [ ] Integrar em:
  - Criação/Edição/Exclusão de pacientes
  - Aprovação/Rejeição de orçamentos
  - Recebimentos e estornos
  - Alteração de custos de procedimentos
  - Exportação de dados
- [ ] Criar página `AuditLogs.tsx` para visualização (somente ADMIN)
- [ ] Filtros: Data, Usuário, Tipo de Ação, Entidade
- [ ] Exportar logs para CSV

**Arquivos a Criar/Modificar:**
- `services/auditService.ts` (NOVO)
- `pages/AuditLogs.tsx` (NOVO)
- Modificar hooks: `usePatients`, `useBudgets`, `useFinancialCalculator`

**SQL Necessário:** Tabela `system_audit_logs` já existe ✅

---

#### Tarefa 1.4: Sentinela S15 (Anomaly Detector) 🟡
**Prioridade:** ALTA  
**Tempo Estimado:** 10 horas  
**Responsável:** Dev Backend + SQL

**Objetivo:** Detectar comportamentos anômalos e bloquear conta

**Checklist:**
- [ ] Criar função SQL `detect_anomalies()`
- [ ] Regras de detecção:
  - Login fora do horário (antes 7h ou depois 22h)
  - Exportação de >100 registros de uma vez
  - Tentativa de acesso a dados de outra clínica
  - Múltiplas tentativas de PIN errado
- [ ] Ação: Inserir em `ai_insights` com prioridade CRITICAL
- [ ] Bloquear usuário: `users.is_active = false`
- [ ] Notificar ADMIN por e-mail (integração com `notification_logs`)
- [ ] Criar trigger para executar a cada ação suspeita
- [ ] Painel de alertas de segurança no dashboard ADMIN

**Arquivos a Criar/Modificar:**
- `sql/sentinel_s15_anomaly_detector.sql` (NOVO)
- `services/securityService.ts` (MODIFICAR)
- `components/SecurityAlertsPanel.tsx` (NOVO)

**SQL Necessário:**
```sql
CREATE OR REPLACE FUNCTION detect_anomalies()
RETURNS TRIGGER AS $$
BEGIN
  -- Lógica de detecção
  -- Inserir em ai_insights se detectar anomalia
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

### 🎯 SPRINT 2: PROFIT ENGINE (Semanas 3-5)

**Meta:** Ninguém chuta preços. Lucro Real em tempo real.

#### Tarefa 2.1: Wizard de Custos 🔴
**Prioridade:** CRÍTICA  
**Tempo Estimado:** 16 horas  
**Responsável:** Dev Full Stack + UX

**Objetivo:** Calcular o `cost_per_minute` da clínica

**Checklist:**
- [ ] Criar página `CostWizard.tsx` (multi-step)
- [ ] **Step 1:** Despesas Fixas Mensais
  - Aluguel, Energia, Água, Internet, Salários, etc.
  - Usar categorias de `expense_category`
  - Somar total de despesas fixas
- [ ] **Step 2:** Prolabore Desejado
  - Input: Valor mensal que o Dr. quer retirar
- [ ] **Step 3:** Capacidade Produtiva
  - Número de cadeiras ativas
  - Horas semanais de atendimento
  - Taxa de eficiência (padrão: 80%)
- [ ] **Step 4:** Cálculo Automático
  - `total_monthly_hours = (weekly_hours * 4 * active_chairs) * efficiency_rate`
  - `cost_per_minute = (fixed_costs + prolabore) / (total_monthly_hours * 60)`
- [ ] Salvar em `clinic_cost_structure`
- [ ] Exibir resultado: "Seu custo por minuto é R$ X,XX"
- [ ] Botão "Recalcular" para atualizar mensalmente

**Arquivos a Criar/Modificar:**
- `pages/CostWizard.tsx` (NOVO)
- `services/profitEngineService.ts` (NOVO)
- `hooks/useProfitEngine.ts` (NOVO)

**SQL Necessário:** Tabela `clinic_cost_structure` já existe ✅

---

#### Tarefa 2.2: Cadastro de Kits (Receitas de Procedimentos) 🔴
**Prioridade:** CRÍTICA  
**Tempo Estimado:** 14 horas  
**Responsável:** Dev Full Stack

**Objetivo:** Vincular materiais (estoque) a procedimentos

**Checklist:**
- [ ] Criar página `ProcedureRecipes.tsx`
- [ ] Para cada procedimento, permitir criar "Kits"
- [ ] Adicionar itens do estoque ao kit
- [ ] Definir quantidade de cada material
- [ ] Calcular custo total do kit automaticamente
- [ ] Salvar em `procedure_recipes` e `procedure_recipe_items`
- [ ] Ao executar procedimento, baixar estoque automaticamente
- [ ] Integrar com `procedure_costs.material_cost`
- [ ] Exibir custo de materiais no orçamento

**Arquivos a Criar/Modificar:**
- `pages/ProcedureRecipes.tsx` (NOVO)
- `components/RecipeBuilder.tsx` (NOVO)
- `services/inventoryService.ts` (MODIFICAR)
- `hooks/useProcedures.ts` (MODIFICAR)

**SQL Necessário:** Tabelas `procedure_recipes` e `procedure_recipe_items` já existem ✅

---

#### Tarefa 2.3: Orçamento Profit (Barra de Margem) 🔴
**Prioridade:** CRÍTICA  
**Tempo Estimado:** 20 horas  
**Responsável:** Dev Full Stack + UX

**Objetivo:** Exibir margem de lucro real em tempo real durante criação de orçamento

**Checklist:**
- [ ] Modificar `BudgetForm.tsx` para incluir Profit Bar
- [ ] Para cada procedimento adicionado, calcular:
  - `procedure_time_cost = estimated_time_minutes * cost_per_minute`
  - `material_cost` (do kit vinculado)
  - `lab_cost` (se houver)
  - `tax_cost = price * tax_rate_percent / 100`
  - `card_fee = price * card_fee_percent / 100`
  - `total_cost = procedure_time_cost + material_cost + lab_cost + tax_cost + card_fee`
  - `profit = price - total_cost`
  - `margin_percent = (profit / price) * 100`
- [ ] Exibir barra de progresso:
  - Verde: margem >30%
  - Amarelo: margem 20-30%
  - Vermelho: margem <20%
- [ ] Se margem <20%, exibir alerta: "⚠️ Margem abaixo do mínimo!"
- [ ] Bloquear aprovação se margem <0% (prejuízo)
- [ ] Se margem <20%, exigir PIN Master para aprovar (Tarefa 1.2)
- [ ] Salvar margem calculada em `budgets.potential_margin`

**Arquivos a Criar/Modificar:**
- `components/BudgetForm.tsx` (MODIFICAR)
- `components/ProfitBar.tsx` (NOVO)
- `services/profitEngineService.ts` (MODIFICAR)
- `hooks/useFinancialCalculator.ts` (MODIFICAR)

**SQL Necessário:** Campos já existem em `budgets` e `procedure_costs` ✅

---

#### Tarefa 2.4: Sentinela S1 (Profit Guardian) 🔴
**Prioridade:** CRÍTICA  
**Tempo Estimado:** 8 horas  
**Responsável:** Dev Backend + SQL

**Objetivo:** Monitorar orçamentos e bloquear se margem <20%

**Checklist:**
- [ ] Criar função SQL `sentinel_s1_profit_guardian()`
- [ ] Trigger: Ao criar/atualizar orçamento
- [ ] Calcular margem líquida (mesma lógica da Tarefa 2.3)
- [ ] Se margem <20%, inserir em `ai_insights`:
  - Título: "⚠️ Orçamento com Margem Baixa"
  - Descrição: "Margem de X% está abaixo do mínimo de 20%"
  - Prioridade: CRITICAL
  - Ação: "Revisar preços ou custos"
- [ ] Se margem <0%, bloquear aprovação (status = BLOCKED)
- [ ] Notificar CRC e Gerente

**Arquivos a Criar/Modificar:**
- `sql/sentinel_s1_profit_guardian.sql` (NOVO)
- `sql/native_insights_engine.sql` (MODIFICAR - adicionar S1)

**SQL Necessário:**
```sql
CREATE OR REPLACE FUNCTION sentinel_s1_profit_guardian()
RETURNS TRIGGER AS $$
DECLARE
  v_margin NUMERIC;
BEGIN
  -- Calcular margem
  v_margin := calculate_budget_margin(NEW.id);
  
  IF v_margin < 20 THEN
    INSERT INTO ai_insights (...) VALUES (...);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

#### Tarefa 2.5: Sentinela S4 (Commission Locker) 🟡
**Prioridade:** ALTA  
**Tempo Estimado:** 10 horas  
**Responsável:** Dev Backend + SQL

**Objetivo:** Bloquear comissão de dentistas se paciente não pagou

**Checklist:**
- [ ] Criar função SQL `sentinel_s4_commission_locker()`
- [ ] Regra: Só liberar comissão se `installments.status = 'PAID'`
- [ ] Ao gerar repasse (`commission_payments`), verificar status das parcelas
- [ ] Se parcela não paga, não incluir no repasse
- [ ] Inserir em `ai_insights` se houver comissões bloqueadas
- [ ] Criar relatório de "Comissões Pendentes de Liberação"

**Arquivos a Criar/Modificar:**
- `sql/sentinel_s4_commission_locker.sql` (NOVO)
- `services/commissionService.ts` (NOVO)
- `pages/CommissionReports.tsx` (NOVO)

**SQL Necessário:**
```sql
CREATE OR REPLACE FUNCTION sentinel_s4_commission_locker()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se parcela está paga antes de liberar comissão
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

### 🎯 SPRINT 3: SALES MACHINE & CRM (Semanas 6-7)

**Meta:** Zero leads perdidos. Recuperação ativa de oportunidades.

#### Tarefa 3.1: Sentinela S9 (Lead Rot) 🟡
**Prioridade:** ALTA  
**Tempo Estimado:** 6 horas  
**Responsável:** Dev Backend + SQL

**Objetivo:** Alertar leads parados >24h na coluna "Novo"

**Checklist:**
- [ ] Criar função SQL `sentinel_s9_lead_rot()`
- [ ] Executar diariamente (cron job ou pg_cron)
- [ ] Buscar leads com:
  - `status = 'NEW'`
  - `created_at < NOW() - INTERVAL '24 hours'`
  - Sem interações em `lead_interactions`
- [ ] Inserir em `ai_insights` para cada lead encontrado
- [ ] Criar tarefa no CRM para CRC entrar em contato
- [ ] Notificar Gerente

**Arquivos a Criar/Modificar:**
- `sql/sentinel_s9_lead_rot.sql` (NOVO)
- `sql/cron_jobs.sql` (NOVO - configurar pg_cron)

**SQL Necessário:**
```sql
CREATE OR REPLACE FUNCTION sentinel_s9_lead_rot()
RETURNS void AS $$
BEGIN
  INSERT INTO ai_insights (...)
  SELECT ... FROM leads
  WHERE status = 'NEW'
  AND created_at < NOW() - INTERVAL '24 hours'
  AND NOT EXISTS (SELECT 1 FROM lead_interactions WHERE lead_id = leads.id);
END;
$$ LANGUAGE plpgsql;
```

---

#### Tarefa 3.2: Sentinela S12 (Opportunity Stagnation) 🔴
**Prioridade:** CRÍTICA  
**Tempo Estimado:** 8 horas  
**Responsável:** Dev Backend + SQL

**Objetivo:** Alertar orçamentos abertos sem follow-up há >10 dias

**Checklist:**
- [ ] Criar função SQL `sentinel_s12_opportunity_stagnation()`
- [ ] Executar diariamente
- [ ] Buscar orçamentos com:
  - `status IN ('DRAFT', 'PENDING')`
  - `created_at < NOW() - INTERVAL '10 days'`
  - `last_follow_up_at IS NULL OR last_follow_up_at < NOW() - INTERVAL '10 days'`
- [ ] Inserir em `ai_insights`
- [ ] Criar tarefa no CRM: "Retomar contato com paciente"
- [ ] Sugerir script de vendas (de `sales_scripts`)

**Arquivos a Criar/Modificar:**
- `sql/sentinel_s12_opportunity_stagnation.sql` (NOVO)
- `components/OpportunityRecovery.tsx` (NOVO)

**SQL Necessário:**
```sql
CREATE OR REPLACE FUNCTION sentinel_s12_opportunity_stagnation()
RETURNS void AS $$
BEGIN
  INSERT INTO ai_insights (...)
  SELECT ... FROM budgets
  WHERE status IN ('DRAFT', 'PENDING')
  AND created_at < NOW() - INTERVAL '10 days'
  AND (last_follow_up_at IS NULL OR last_follow_up_at < NOW() - INTERVAL '10 days');
END;
$$ LANGUAGE plpgsql;
```

---

#### Tarefa 3.3: Sentinela S13 (Financial Limbo) 🔴
**Prioridade:** CRÍTICA  
**Tempo Estimado:** 8 horas  
**Responsável:** Dev Backend + SQL

**Objetivo:** Alertar orçamentos aprovados sem pagamento em 48h

**Checklist:**
- [ ] Criar função SQL `sentinel_s13_financial_limbo()`
- [ ] Executar a cada 6 horas
- [ ] Buscar orçamentos com:
  - `status = 'APPROVED'`
  - `updated_at < NOW() - INTERVAL '48 hours'`
  - Sem parcelas criadas OU todas parcelas com `status = 'PENDING'`
- [ ] Inserir em `ai_insights` com prioridade CRITICAL
- [ ] Notificar Financeiro e CRC
- [ ] Sugerir ação: "Entrar em contato urgente para confirmar pagamento"

**Arquivos a Criar/Modificar:**
- `sql/sentinel_s13_financial_limbo.sql` (NOVO)
- `components/FinancialLimboAlert.tsx` (NOVO)

**SQL Necessário:**
```sql
CREATE OR REPLACE FUNCTION sentinel_s13_financial_limbo()
RETURNS void AS $$
BEGIN
  INSERT INTO ai_insights (...)
  SELECT ... FROM budgets b
  WHERE b.status = 'APPROVED'
  AND b.updated_at < NOW() - INTERVAL '48 hours'
  AND NOT EXISTS (
    SELECT 1 FROM installments i
    WHERE i.budget_id = b.id AND i.status = 'PAID'
  );
END;
$$ LANGUAGE plpgsql;
```

---

#### Tarefa 3.4: Universal Monitor UI 🟡
**Prioridade:** ALTA  
**Tempo Estimado:** 12 horas  
**Responsável:** Dev Frontend + UX

**Objetivo:** Painel centralizado de alertas das Sentinelas

**Checklist:**
- [ ] Criar página `UniversalMonitor.tsx`
- [ ] Tabs:
  - Tratamentos Parados (S6)
  - Oportunidades Paradas (S12)
  - Limbo Financeiro (S13)
  - Leads Frios (S9)
  - Laboratório (S5)
  - Estoque (S7)
  - Documentos (S8)
  - No-Show (S10)
  - Recorrência (S11)
- [ ] Para cada alerta, exibir:
  - Paciente/Lead
  - Descrição do problema
  - Ação sugerida
  - Botão "Resolver" (marca insight como RESOLVED)
- [ ] Filtros: Prioridade, Categoria, Data
- [ ] Contador de alertas não resolvidos no menu lateral

**Arquivos a Criar/Modificar:**
- `pages/UniversalMonitor.tsx` (NOVO)
- `components/SentinelAlertCard.tsx` (NOVO)
- `hooks/useSentinelAlerts.ts` (NOVO)

**SQL Necessário:** Usa tabela `ai_insights` existente ✅

---

#### Tarefa 3.5: Lead Card 360 (Aprimoramento) 🟡
**Prioridade:** ALTA  
**Tempo Estimado:** 10 horas  
**Responsável:** Dev Frontend + UX

**Objetivo:** Transformar ficha de lead em interface estilo chat (Kommo)

**Checklist:**
- [ ] Modificar `LeadCard.tsx` para layout 2 colunas:
  - Esquerda: Timeline de interações (estilo chat)
  - Direita: Dados do lead (compactos)
- [ ] Timeline:
  - Mensagens enviadas/recebidas
  - Ligações realizadas
  - E-mails enviados
  - Mudanças de status
- [ ] Input de nova mensagem no rodapé
- [ ] Botões rápidos: "Ligar", "WhatsApp", "E-mail"
- [ ] Integrar com `lead_interactions`
- [ ] Auto-scroll para última mensagem

**Arquivos a Criar/Modificar:**
- `components/LeadCard.tsx` (MODIFICAR)
- `components/LeadTimeline.tsx` (NOVO)
- `hooks/useLeads.ts` (MODIFICAR)

**SQL Necessário:** Tabela `lead_interactions` já existe ✅

---

### 🎯 SPRINT 4: FISCAL & BANCÁRIO (Semanas 8-9)

**Meta:** Contador feliz. Conciliação automática.

#### Tarefa 4.1: Importador OFX 🟡
**Prioridade:** ALTA  
**Tempo Estimado:** 16 horas  
**Responsável:** Dev Full Stack

**Objetivo:** Ler arquivos OFX do banco e importar transações

**Checklist:**
- [ ] Criar página `BankReconciliation.tsx`
- [ ] Input de upload de arquivo `.ofx`
- [ ] Parser OFX (usar biblioteca `ofx-js` ou similar)
- [ ] Extrair transações: Data, Valor, Descrição, Tipo
- [ ] Salvar em `bank_transactions`
- [ ] Vincular a `bank_accounts`
- [ ] Exibir lista de transações importadas
- [ ] Botão "Importar" para confirmar

**Arquivos a Criar/Modificar:**
- `pages/BankReconciliation.tsx` (NOVO)
- `services/ofxService.ts` (NOVO)
- `hooks/useBankReconciliation.ts` (NOVO)

**SQL Necessário:** Tabelas `bank_accounts` e `bank_transactions` já existem ✅

---

#### Tarefa 4.2: Algoritmo de Match 🟡
**Prioridade:** ALTA  
**Tempo Estimado:** 20 horas  
**Responsável:** Dev Full Stack + Algoritmos

**Objetivo:** Sugerir correspondência entre transações bancárias e recebimentos

**Checklist:**
- [ ] Criar serviço `matchingService.ts`
- [ ] Algoritmo de matching:
  - Buscar `installments` com `amount` próximo (±5%)
  - Buscar `installments` com `due_date` próxima (±7 dias)
  - Buscar por nome do paciente na descrição OFX
  - Calcular score de confiança (0-100%)
- [ ] Exibir sugestões na UI:
  - "Este PIX de R$ 500 pode ser da Maria Silva (90% confiança)"
- [ ] Botões: "Confirmar", "Ignorar", "Buscar Manualmente"
- [ ] Ao confirmar, atualizar:
  - `installments.status = 'PAID'`
  - `installments.paid_date = transaction_date`
  - `bank_transactions.is_reconciled = true`
  - `bank_transactions.matched_transaction_id = installment.id`

**Arquivos a Criar/Modificar:**
- `services/matchingService.ts` (NOVO)
- `components/MatchSuggestions.tsx` (NOVO)
- `pages/BankReconciliation.tsx` (MODIFICAR)

**SQL Necessário:** Campos já existem ✅

---

#### Tarefa 4.3: Emissor NFS-e 🟢
**Prioridade:** MÉDIA  
**Tempo Estimado:** 24 horas  
**Responsável:** Dev Full Stack + Integração

**Objetivo:** Emitir Nota Fiscal de Serviço Eletrônica

**Checklist:**
- [ ] Pesquisar API da prefeitura local (varia por cidade)
- [ ] Criar serviço `nfseService.ts`
- [ ] Integração com API:
  - Autenticação
  - Envio de dados do serviço
  - Recebimento do XML e PDF
- [ ] Salvar em `fiscal_invoices`
- [ ] Botão "Emitir NFS-e" no financeiro (após recebimento)
- [ ] Exibir PDF da nota
- [ ] Enviar por e-mail para o paciente

**Arquivos a Criar/Modificar:**
- `services/nfseService.ts` (NOVO)
- `pages/FiscalInvoices.tsx` (NOVO)
- `components/NfseEmitter.tsx` (NOVO)

**SQL Necessário:** Tabela `fiscal_invoices` já existe ✅

**Observação:** Implementação varia por cidade. Pode ser necessário contratar serviço terceiro.

---

#### Tarefa 4.4: Sentinela S3 (Fiscal Watchdog) 🟢
**Prioridade:** MÉDIA  
**Tempo Estimado:** 6 horas  
**Responsável:** Dev Backend + SQL

**Objetivo:** Alertar receitas sem NFS-e emitida após 24h

**Checklist:**
- [ ] Criar função SQL `sentinel_s3_fiscal_watchdog()`
- [ ] Executar diariamente
- [ ] Buscar `installments` com:
  - `status = 'PAID'`
  - `paid_date < NOW() - INTERVAL '24 hours'`
  - Sem registro em `fiscal_invoices`
- [ ] Inserir em `ai_insights`
- [ ] Notificar Financeiro

**Arquivos a Criar/Modificar:**
- `sql/sentinel_s3_fiscal_watchdog.sql` (NOVO)

**SQL Necessário:**
```sql
CREATE OR REPLACE FUNCTION sentinel_s3_fiscal_watchdog()
RETURNS void AS $$
BEGIN
  INSERT INTO ai_insights (...)
  SELECT ... FROM installments i
  WHERE i.status = 'PAID'
  AND i.paid_date < NOW() - INTERVAL '24 hours'
  AND NOT EXISTS (
    SELECT 1 FROM fiscal_invoices f WHERE f.transaction_id = i.id
  );
END;
$$ LANGUAGE plpgsql;
```

---

### 🎯 SPRINT 5: EXPANSÃO & SENTINELAS AVANÇADAS (Semana 10+)

**Meta:** Excelência operacional. Zero pacientes perdidos.

#### Tarefa 5.1: Sentinela S6 (Universal Rescue - O General) 🔴
**Prioridade:** CRÍTICA  
**Tempo Estimado:** 16 horas  
**Responsável:** Dev Backend + SQL

**Objetivo:** Monitorar TODOS os pacientes em tratamento sem consulta futura

**Checklist:**
- [ ] Criar função SQL `sentinel_s6_universal_rescue()`
- [ ] Executar diariamente
- [ ] Buscar pacientes com:
  - `clinical_status = 'Em Tratamento'`
  - Sem agendamento futuro em `appointments`
  - Última consulta há mais de X dias (varia por especialidade):
    - Ortodontia: >45 dias
    - Implante: >120 dias (fase ósseo-integração)
    - HOF (Botox/Preenchimento): >180 dias
    - Clínica Geral: >90 dias
- [ ] Inserir em `ai_insights` com prioridade HIGH
- [ ] Criar tarefa no CRM: "Resgatar paciente em tratamento"
- [ ] Sugerir ação: "Ligar para agendar retorno"
- [ ] Exibir no Universal Monitor (Tarefa 3.4)

**Arquivos a Criar/Modificar:**
- `sql/sentinel_s6_universal_rescue.sql` (NOVO)
- `components/TreatmentRescuePanel.tsx` (NOVO)

**SQL Necessário:**
```sql
CREATE OR REPLACE FUNCTION sentinel_s6_universal_rescue()
RETURNS void AS $$
DECLARE
  v_patient RECORD;
  v_last_appointment_date DATE;
  v_days_threshold INTEGER;
BEGIN
  FOR v_patient IN
    SELECT * FROM patients WHERE clinical_status = 'Em Tratamento'
  LOOP
    -- Buscar última consulta
    SELECT MAX(date) INTO v_last_appointment_date
    FROM appointments
    WHERE patient_id = v_patient.id AND status = 'COMPLETED';
    
    -- Definir threshold por especialidade
    -- Lógica de detecção
    -- Inserir em ai_insights se necessário
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

---

#### Tarefa 5.2: Sentinela S5 (Lab Watchdog) 🟡
**Prioridade:** ALTA  
**Tempo Estimado:** 6 horas  
**Responsável:** Dev Backend + SQL

**Objetivo:** Alertar próteses que devem chegar amanhã

**Checklist:**
- [ ] Criar função SQL `sentinel_s5_lab_watchdog()`
- [ ] Executar diariamente às 18h
- [ ] Buscar `lab_orders` com:
  - `expected_return_date = CURRENT_DATE + 1`
  - `status != 'RECEIVED'`
- [ ] Inserir em `ai_insights`
- [ ] Notificar Recepção
- [ ] Sugerir ação: "Ligar para laboratório confirmar entrega"

**Arquivos a Criar/Modificar:**
- `sql/sentinel_s5_lab_watchdog.sql` (NOVO)

**SQL Necessário:**
```sql
CREATE OR REPLACE FUNCTION sentinel_s5_lab_watchdog()
RETURNS void AS $$
BEGIN
  INSERT INTO ai_insights (...)
  SELECT ... FROM lab_orders
  WHERE expected_return_date = CURRENT_DATE + 1
  AND status != 'RECEIVED';
END;
$$ LANGUAGE plpgsql;
```

---

#### Tarefa 5.3: Sentinela S7 (Inventory Spy) 🟡
**Prioridade:** ALTA  
**Tempo Estimado:** 10 horas  
**Responsável:** Dev Backend + SQL

**Objetivo:** Prever falta de estoque baseada na agenda futura

**Checklist:**
- [ ] Criar função SQL `sentinel_s7_inventory_spy()`
- [ ] Executar diariamente
- [ ] Buscar agendamentos da próxima semana
- [ ] Para cada procedimento agendado:
  - Buscar kit vinculado (`procedure_recipes`)
  - Calcular consumo previsto de materiais
- [ ] Comparar com estoque atual (`inventory_items.current_stock`)
- [ ] Se estoque insuficiente, inserir em `ai_insights`
- [ ] Sugerir ação: "Comprar X unidades de Y"

**Arquivos a Criar/Modificar:**
- `sql/sentinel_s7_inventory_spy.sql` (NOVO)
- `components/InventoryForecast.tsx` (NOVO)

**SQL Necessário:**
```sql
CREATE OR REPLACE FUNCTION sentinel_s7_inventory_spy()
RETURNS void AS $$
BEGIN
  -- Buscar agendamentos futuros
  -- Calcular consumo previsto
  -- Comparar com estoque
  -- Inserir alertas
END;
$$ LANGUAGE plpgsql;
```

---

#### Tarefa 5.4: Sentinela S8 (Document Hunter) 🟢
**Prioridade:** MÉDIA  
**Tempo Estimado:** 8 horas  
**Responsável:** Dev Backend + SQL

**Objetivo:** Bloquear agendamento se TCLE não assinado

**Checklist:**
- [ ] Criar função SQL `sentinel_s8_document_hunter()`
- [ ] Trigger: Ao criar agendamento
- [ ] Verificar se paciente tem TCLE assinado para procedimento invasivo
- [ ] Se não tiver, bloquear agendamento
- [ ] Inserir em `ai_insights`
- [ ] Sugerir ação: "Solicitar assinatura do TCLE"

**Arquivos a Criar/Modificar:**
- `sql/sentinel_s8_document_hunter.sql` (NOVO)

**SQL Necessário:**
```sql
CREATE OR REPLACE FUNCTION sentinel_s8_document_hunter()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar TCLE
  -- Bloquear se necessário
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

#### Tarefa 5.5: Sentinela S10 (Ghostbuster - No-Show) 🟡
**Prioridade:** ALTA  
**Tempo Estimado:** 8 horas  
**Responsável:** Dev Backend + SQL

**Objetivo:** Identificar faltosos recorrentes e sugerir cobrança antecipada

**Checklist:**
- [ ] Criar função SQL `sentinel_s10_ghostbuster()`
- [ ] Executar diariamente
- [ ] Buscar pacientes com:
  - 2+ faltas consecutivas (`appointments.status = 'NO_SHOW'`)
- [ ] Inserir em `ai_insights`
- [ ] Sugerir ação: "Exigir pagamento antecipado para próxima consulta"
- [ ] Marcar paciente com flag `is_no_show_risk = true`

**Arquivos a Criar/Modificar:**
- `sql/sentinel_s10_ghostbuster.sql` (NOVO)

**SQL Necessário:**
```sql
ALTER TABLE patients ADD COLUMN is_no_show_risk BOOLEAN DEFAULT false;

CREATE OR REPLACE FUNCTION sentinel_s10_ghostbuster()
RETURNS void AS $$
BEGIN
  -- Buscar faltosos
  -- Inserir alertas
  -- Atualizar flag
END;
$$ LANGUAGE plpgsql;
```

---

#### Tarefa 5.6: Sentinela S11 (Recurrence AI) 🟡
**Prioridade:** ALTA  
**Tempo Estimado:** 12 horas  
**Responsável:** Dev Backend + SQL + IA

**Objetivo:** Identificar oportunidades de renovação (Botox, Preenchimento, etc.)

**Checklist:**
- [ ] Criar função SQL `sentinel_s11_recurrence_ai()`
- [ ] Executar diariamente
- [ ] Buscar procedimentos recorrentes realizados há X meses:
  - Botox: 6 meses
  - Preenchimento: 12 meses
  - Limpeza: 6 meses
  - Clareamento: 12 meses
- [ ] Inserir em `ai_insights` como "Oportunidade de Renovação"
- [ ] Criar card no CRM automaticamente
- [ ] Sugerir ação: "Ligar para agendar renovação"

**Arquivos a Criar/Modificar:**
- `sql/sentinel_s11_recurrence_ai.sql` (NOVO)
- `components/RecurrenceOpportunities.tsx` (NOVO)

**SQL Necessário:**
```sql
CREATE OR REPLACE FUNCTION sentinel_s11_recurrence_ai()
RETURNS void AS $$
BEGIN
  -- Buscar procedimentos vencidos
  -- Criar oportunidades
  -- Inserir em ai_insights
END;
$$ LANGUAGE plpgsql;
```

---

#### Tarefa 5.7: Landing Page Generator 🟢
**Prioridade:** MÉDIA  
**Tempo Estimado:** 20 horas  
**Responsável:** Dev Full Stack + UX

**Objetivo:** Gerar landing page pública do dentista ("Link na Bio")

**Checklist:**
- [ ] Criar página `LandingPageBuilder.tsx`
- [ ] Inputs:
  - Slug (ex: `dr-marcelo`)
  - Foto de perfil
  - Bio/Descrição
  - Especialidades
  - Cor primária
  - Botão de agendamento (link para agenda pública)
- [ ] Salvar em `clinic_landing_pages`
- [ ] Gerar página pública em `/landing/[slug]`
- [ ] Integrar com agenda (permitir agendamento online)
- [ ] SEO: Meta tags, Open Graph, Schema.org

**Arquivos a Criar/Modificar:**
- `pages/LandingPageBuilder.tsx` (NOVO)
- `pages/landing/[slug].tsx` (NOVO)
- `services/landingPageService.ts` (NOVO)

**SQL Necessário:** Tabela `clinic_landing_pages` já existe ✅

---

#### Tarefa 5.8: Painel de Gamificação (HUD Completo) 🟡
**Prioridade:** ALTA  
**Tempo Estimado:** 16 horas  
**Responsável:** Dev Frontend + UX

**Objetivo:** Exibir XP, Nível, Conquistas e Ranking

**Checklist:**
- [ ] Criar página `GamificationDashboard.tsx`
- [ ] Seções:
  - **Meu Perfil:** XP atual, Nível, Progresso para próximo nível
  - **Conquistas:** Lista de conquistas desbloqueadas e bloqueadas
  - **Ranking:** Top 10 profissionais por XP
  - **Histórico de XP:** Gráfico de evolução mensal
- [ ] Animações ao ganhar XP (confetti, som)
- [ ] Notificações de novas conquistas
- [ ] Integrar com `user_progression` e `achievements`

**Arquivos a Criar/Modificar:**
- `pages/GamificationDashboard.tsx` (NOVO)
- `components/XPProgressBar.tsx` (NOVO)
- `components/AchievementCard.tsx` (NOVO)
- `components/LeaderboardTable.tsx` (NOVO)

**SQL Necessário:** Tabelas `user_progression` e `achievements` já existem ✅

---

## 📊 MATRIZ DE PRIORIZAÇÃO

### 🔴 PRIORIDADE CRÍTICA (Fazer AGORA - Semanas 1-5)

| # | Tarefa | Sprint | Tempo | Impacto |
|---|--------|--------|-------|---------|
| 1 | Smart Check-in | 1 | 8h | Evita duplicidade de cadastros |
| 2 | Security PIN Modal | 1 | 12h | Previne fraudes e estornos indevidos |
| 3 | Wizard de Custos | 2 | 16h | Base do Profit Engine |
| 4 | Cadastro de Kits | 2 | 14h | Controle de custos de materiais |
| 5 | Orçamento Profit | 2 | 20h | Visibilidade de margem real |
| 6 | Sentinela S1 (Profit Guardian) | 2 | 8h | Bloqueia prejuízos |
| 7 | Sentinela S12 (Opportunity Stagnation) | 3 | 8h | Recupera vendas paradas |
| 8 | Sentinela S13 (Financial Limbo) | 3 | 8h | Evita "vendas fantasma" |
| 9 | Sentinela S6 (Universal Rescue) | 5 | 16h | Resgata pacientes em tratamento |

**Total:** 110 horas (~14 dias úteis com 1 dev full-time)

---

### 🟡 PRIORIDADE ALTA (Fazer em seguida - Semanas 6-9)

| # | Tarefa | Sprint | Tempo | Impacto |
|---|--------|--------|-------|---------|
| 10 | Audit Logs Completo | 1 | 6h | Rastreabilidade total |
| 11 | Sentinela S15 (Anomaly Detector) | 1 | 10h | Segurança contra fraudes |
| 12 | Sentinela S4 (Commission Locker) | 2 | 10h | Evita pagar comissão sem receber |
| 13 | Sentinela S9 (Lead Rot) | 3 | 6h | Evita perda de leads |
| 14 | Universal Monitor UI | 3 | 12h | Centraliza alertas |
| 15 | Lead Card 360 | 3 | 10h | Melhora conversão de vendas |
| 16 | Importador OFX | 4 | 16h | Facilita conciliação bancária |
| 17 | Algoritmo de Match | 4 | 20h | Automatiza conciliação |
| 18 | Sentinela S5 (Lab Watchdog) | 5 | 6h | Evita atrasos de laboratório |
| 19 | Sentinela S7 (Inventory Spy) | 5 | 10h | Previne falta de materiais |
| 20 | Sentinela S10 (Ghostbuster) | 5 | 8h | Reduz no-shows |
| 21 | Sentinela S11 (Recurrence AI) | 5 | 12h | Gera novas vendas |
| 22 | Painel de Gamificação | 5 | 16h | Engaja equipe |

**Total:** 142 horas (~18 dias úteis)

---

### 🟢 PRIORIDADE MÉDIA (Fazer depois - Semanas 10+)

| # | Tarefa | Sprint | Tempo | Impacto |
|---|--------|--------|-------|---------|
| 23 | Emissor NFS-e | 4 | 24h | Compliance fiscal |
| 24 | Sentinela S3 (Fiscal Watchdog) | 4 | 6h | Evita multas fiscais |
| 25 | Sentinela S8 (Document Hunter) | 5 | 8h | Compliance jurídico |
| 26 | Landing Page Generator | 5 | 20h | Marketing e captação |

**Total:** 58 horas (~7 dias úteis)

---

## 🎯 CRONOGRAMA EXECUTIVO

### Cenário 1: 1 Desenvolvedor Full Stack (40h/semana)

| Semana | Sprint | Tarefas | Horas |
|--------|--------|---------|-------|
| 1-2 | Sprint 1 | Tarefas 1, 2, 10, 11 | 36h |
| 3-5 | Sprint 2 | Tarefas 3, 4, 5, 6, 12 | 68h |
| 6-7 | Sprint 3 | Tarefas 7, 8, 13, 14, 15 | 50h |
| 8-9 | Sprint 4 | Tarefas 16, 17, 23, 24 | 66h |
| 10-12 | Sprint 5 | Tarefas 9, 18, 19, 20, 21, 22, 25, 26 | 90h |

**Total:** 310 horas (~39 dias úteis = ~8 semanas)

---

### Cenário 2: 2 Desenvolvedores (1 Frontend + 1 Backend)

| Semana | Sprint | Dev Frontend | Dev Backend |
|--------|--------|--------------|-------------|
| 1 | Sprint 1 | Tarefa 1 (8h) | Tarefas 2, 10, 11 (28h) |
| 2 | Sprint 2 | Tarefa 5 (20h) | Tarefas 3, 4 (30h) |
| 3 | Sprint 2 | - | Tarefas 6, 12 (18h) |
| 4 | Sprint 3 | Tarefas 14, 15 (22h) | Tarefas 7, 8, 13 (22h) |
| 5 | Sprint 4 | Tarefa 16 (16h) | Tarefa 17 (20h) |
| 6 | Sprint 4 | - | Tarefas 23, 24 (30h) |
| 7-8 | Sprint 5 | Tarefas 22, 26 (36h) | Tarefas 9, 18, 19, 20, 21, 25 (60h) |

**Total:** ~6 semanas (com 2 devs trabalhando em paralelo)

---

## 📈 MÉTRICAS DE SUCESSO

### KPIs Técnicos
- [ ] **Cobertura de Testes:** >80%
- [ ] **Performance:** Tempo de resposta <2s
- [ ] **Uptime:** >99.5%
- [ ] **Bugs Críticos:** 0 em produção

### KPIs de Negócio
- [ ] **Redução de Duplicidade:** <1% de cadastros duplicados
- [ ] **Margem Média:** >30% em todos os orçamentos
- [ ] **Taxa de Conversão de Leads:** >40%
- [ ] **Recuperação de Oportunidades:** >60% dos orçamentos parados
- [ ] **Redução de No-Shows:** <10%
- [ ] **Aumento de Recorrência:** +25% em procedimentos recorrentes

### KPIs de Inteligência
- [ ] **Alertas Gerados:** >100/mês
- [ ] **Taxa de Resolução de Alertas:** >80%
- [ ] **Tempo Médio de Resolução:** <48h
- [ ] **Pacientes Resgatados:** >20/mês

---

## 🚀 PRÓXIMOS PASSOS IMEDIATOS

### Esta Semana (Semana 1)
1. ✅ Revisar e aprovar este Plano de Ação
2. ⏳ Alocar recursos (desenvolvedores)
3. ⏳ Configurar ambiente de desenvolvimento
4. ⏳ Iniciar Tarefa 1.1 (Smart Check-in)
5. ⏳ Iniciar Tarefa 1.2 (Security PIN Modal)

### Próxima Semana (Semana 2)
1. ⏳ Finalizar Sprint 1 (Tarefas 1.1 a 1.4)
2. ⏳ Testes de integração Sprint 1
3. ⏳ Deploy em ambiente de staging
4. ⏳ Iniciar Sprint 2 (Tarefa 2.1 - Wizard de Custos)

---

## 📝 OBSERVAÇÕES FINAIS

### Pontos de Atenção
1. **Dependências Externas:**
   - API de NFS-e varia por cidade (Tarefa 4.3)
   - Integração com WhatsApp Business API (futuro)
   - Integração com bancos para OFX (Tarefa 4.1)

2. **Débitos Técnicos Identificados:**
   - Alguns componentes precisam refatoração (ex: `BudgetForm.tsx`)
   - Falta de testes unitários em alguns serviços
   - Documentação de código incompleta

3. **Riscos:**
   - Mudanças no schema SQL podem impactar dados existentes
   - Implementação de Sentinelas pode gerar muitos alertas inicialmente
   - Curva de aprendizado da equipe com novas funcionalidades

### Recomendações
1. **Priorizar Sprints 1 e 2:** São a base do sistema
2. **Fazer testes com dados reais:** Após cada Sprint
3. **Coletar feedback dos usuários:** Especialmente CRCs e Dentistas
4. **Documentar tudo:** Código, processos, decisões
5. **Manter backlog atualizado:** Novas ideias e bugs

---

**Versão do Documento:** 1.0  
**Data:** 23/12/2025  
**Responsável:** Dr. Marcelo Vilas Bôas  
**Próxima Revisão:** 30/12/2025  

---

## ✅ CHECKLIST DE APROVAÇÃO

- [ ] Plano revisado e aprovado pelo Dr. Marcelo
- [ ] Equipe de desenvolvimento alocada
- [ ] Ambiente de desenvolvimento configurado
- [ ] Repositório Git atualizado
- [ ] Primeira tarefa iniciada (Smart Check-in)

**🚀 Mãos à obra, Comandante! O BOS está pronto para decolar!**
