# 🔍 ANÁLISE DE CONSISTÊNCIA E RISCOS - CLINIC PRO MANAGER

**Data:** 21/12/2024  
**Versão:** 1.0  
**Analista:** Arquiteto de Software Senior

---

## 1. DISCREPÂNCIAS IDENTIFICADAS

### 🔴 **CRÍTICAS (Ação Imediata Necessária)**

#### **1.1 Notificações Automáticas - Tabelas sem Implementação**
**Problema:**
- Tabelas `notification_channels`, `notification_templates`, `notification_logs` existem
- **ZERO** código frontend ou service para configurar/enviar notificações
- Sistema de confirmações (`appointment_confirmations`) marca `reminder_sent_at` mas não envia nada

**Impacto:** Recalls e confirmações são inúteis sem WhatsApp/SMS  
**Solução:** Implementar `NotificationService` + integração com Twilio/Evolution API  
**Prioridade:** 🔴 CRÍTICA

---

#### **1.2 Comissões - Cálculo Manual**
**Problema:**
- Tabelas `professional_commissions`, `commission_payments` existem
- Não há trigger ou job para calcular comissões automaticamente
- Campo `commission_earned` em `professional_monthly_metrics` nunca é populado

**Impacto:** Profissionais não sabem quanto vão receber  
**Solução:** Criar trigger que calcula comissão quando `treatment_item.status = 'COMPLETED'`  
**Prioridade:** 🔴 ALTA

---

#### **1.3 AI Insights - Engine Fantasma**
**Problema:**
- Tabela `ai_insights` existe
- Não há código que **gera** insights (apenas exibe se existirem)
- Campos `health_events` nunca são populados

**Impacto:** Funcionalidade vendida mas não entregue  
**Solução:** Implementar engine de análise (pode ser regras simples inicialmente)  
**Prioridade:** 🔴 ALTA

---

#### **1.4 Backup Automático - Configurado mas Inativo**
**Problema:**
- Tabela `clinics` tem `backup_frequency`, `backup_email`, `last_backup_at`
- Não há job agendado para fazer backup
- `last_backup_at` sempre NULL

**Impacto:** Perda de dados em caso de falha  
**Solução:** Implementar Supabase Edge Function com cron job  
**Prioridade:** 🔴 CRÍTICA

---

### 🟡 **MÉDIAS (Resolver em Sprint Futura)**

#### **1.5 Status de Orçamento - Enum Desatualizado**
**Problema:**
- Enum `budget_status` tem: DRAFT, SENT, APPROVED, REJECTED, NEGOTIATING
- Código frontend usa "EM ANÁLISE" (não existe no enum)
- Causa erro de comparação em `PatientDetail.tsx:1123`

**Impacto:** Filtros de orçamento podem falhar  
**Solução:** Adicionar 'EM ANÁLISE' ao enum ou padronizar para 'SENT'  
**Prioridade:** 🟡 MÉDIA

---

#### **1.6 Estoque - Movimentação Incompleta**
**Problema:**
- Tabelas `inventory_movements`, `procedure_material_usage` existem
- Não há UI para registrar consumo de materiais durante procedimento
- Campo `stock_after` em `inventory_movements` não é atualizado automaticamente

**Impacto:** Estoque desatualizado  
**Solução:** Criar trigger que atualiza `current_stock` em `inventory_items`  
**Prioridade:** 🟡 MÉDIA

---

#### **1.7 Formulários Clínicos - Sem Interface**
**Problema:**
- Tabelas `clinical_form_templates`, `clinical_form_responses` existem
- Não há UI para criar templates ou preencher formulários
- Campo `fields` (JSONB) não tem schema definido

**Impacto:** Funcionalidade inacessível  
**Solução:** Criar FormBuilder component + FormRenderer  
**Prioridade:** 🟡 MÉDIA

---

### 🟢 **BAIXAS (Nice to Have)**

#### **1.8 Webhooks - Sem Configuração**
**Problema:**
- Tabela `webhooks` existe
- Não há UI para configurar webhooks
- Não há código que dispara webhooks em eventos

**Impacto:** Integrações externas impossíveis  
**Solução:** Criar WebhookManager + triggers de eventos  
**Prioridade:** 🟢 BAIXA

---

## 2. RISCOS DE SEGURANÇA

### 🔴 **CRÍTICOS**

#### **2.1 RLS Policies - Não Validadas**
**Risco:**
- Não há evidência de que todas as tabelas têm RLS habilitado
- Queries podem vazar dados entre clínicas

**Mitigação:**
```sql
-- Executar para validar:
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = false;
```

**Ação:** Habilitar RLS em TODAS as tabelas + criar policies  
**Prioridade:** 🔴 CRÍTICA

---

#### **2.2 Permissões Granulares - Não Aplicadas**
**Risco:**
- Tabela `user_permissions` existe
- Código frontend NÃO valida permissões antes de exibir botões/ações
- Qualquer usuário pode tentar deletar pacientes via API

**Mitigação:**
- Criar middleware de permissões no frontend
- Validar permissões no backend (RLS)

**Ação:** Implementar `usePermissions()` hook  
**Prioridade:** 🔴 ALTA

---

#### **2.3 Senhas de Desconto - Não Implementadas**
**Risco:**
- Campo `require_manager_password_for_discount` em `clinics` = true
- Código NÃO solicita senha ao dar desconto acima do limite
- Recepcionista pode dar 50% de desconto sem aprovação

**Mitigação:**
- Criar modal de confirmação com senha do gestor

**Ação:** Implementar `ManagerPasswordModal`  
**Prioridade:** 🔴 ALTA

---

### 🟡 **MÉDIOS**

#### **2.4 Auditoria - Incompleta**
**Risco:**
- Tabela `system_audit_logs` existe
- Apenas LOGIN/LOGOUT são registrados
- Exclusões, alterações financeiras NÃO são auditadas

**Mitigação:**
- Criar trigger universal de auditoria

**Ação:** Implementar `audit_trigger()` function  
**Prioridade:** 🟡 MÉDIA

---

#### **2.5 API Keys - Sem Rotação**
**Risco:**
- Tabela `api_keys` tem `expires_at`
- Não há job para invalidar chaves expiradas
- Chaves podem ser usadas indefinidamente

**Mitigação:**
- Criar cron job que desativa chaves expiradas

**Ação:** Implementar `expire_api_keys()` function  
**Prioridade:** 🟡 MÉDIA

---

## 3. RISCOS DE PERFORMANCE

### 🔴 **CRÍTICOS**

#### **3.1 Índices Faltantes**
**Problema:**
- Tabelas grandes (`patients`, `appointments`, `transactions`) sem índices em colunas frequentemente filtradas

**Queries Lentas Identificadas:**
```sql
-- Sem índice em patients.patient_score
SELECT * FROM patients WHERE patient_score = 'DIAMOND';

-- Sem índice em appointments.date
SELECT * FROM appointments WHERE date >= NOW();

-- Sem índice em transactions.date
SELECT * FROM transactions WHERE date BETWEEN '2024-01-01' AND '2024-12-31';
```

**Solução:**
```sql
CREATE INDEX idx_patients_score ON patients(patient_score);
CREATE INDEX idx_appointments_date ON appointments(date);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_financial_installments_due_date ON financial_installments(due_date);
CREATE INDEX idx_patient_recalls_due_date ON patient_recalls(due_date);
```

**Prioridade:** 🔴 CRÍTICA

---

#### **3.2 N+1 Queries - DataContext**
**Problema:**
- `DataContext` carrega TODOS os pacientes, orçamentos, tratamentos ao logar
- Em clínicas com 10.000+ pacientes, isso trava o sistema

**Solução:**
- Implementar paginação
- Lazy loading de dados
- Usar React Query para cache

**Prioridade:** 🔴 ALTA

---

### 🟡 **MÉDIOS**

#### **3.3 JSONB sem GIN Index**
**Problema:**
- Campos JSONB (`goals`, `metadata`, `responses`) sem índice GIN
- Queries em JSONB são lentas

**Solução:**
```sql
CREATE INDEX idx_clinics_goals_gin ON clinics USING GIN (goals);
CREATE INDEX idx_tactical_operations_metadata_gin ON tactical_operations USING GIN (metadata);
```

**Prioridade:** 🟡 MÉDIA

---

## 4. RISCOS DE DADOS

### 🔴 **CRÍTICOS**

#### **4.1 Cascade Delete - Não Configurado**
**Problema:**
- Foreign keys sem `ON DELETE CASCADE`
- Deletar paciente deixa órfãos em `medical_alerts`, `appointments`, etc.
- Código frontend tenta deletar manualmente (complexo e propenso a erros)

**Solução:**
```sql
ALTER TABLE medical_alerts
DROP CONSTRAINT medical_alerts_patient_id_fkey,
ADD CONSTRAINT medical_alerts_patient_id_fkey
FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

-- Repetir para todas as tabelas relacionadas
```

**Prioridade:** 🔴 ALTA

---

#### **4.2 Soft Delete - Inconsistente**
**Problema:**
- Algumas tabelas usam `is_active`, outras `active`, outras não têm soft delete
- Queries podem retornar dados "deletados"

**Solução:**
- Padronizar para `is_active` em TODAS as tabelas
- Criar view `active_patients`, `active_budgets`, etc.

**Prioridade:** 🟡 MÉDIA

---

## 5. RECOMENDAÇÕES PRIORITÁRIAS

### **Sprint 1 (Crítico - 1 semana)**
1. ✅ Habilitar RLS em todas as tabelas
2. ✅ Criar índices de performance
3. ✅ Implementar NotificationService (WhatsApp)
4. ✅ Configurar backup automático
5. ✅ Validar permissões no frontend

### **Sprint 2 (Alta - 2 semanas)**
1. ✅ Implementar cálculo automático de comissões
2. ✅ Criar AI Insights Engine (regras básicas)
3. ✅ Implementar auditoria completa
4. ✅ Corrigir enum de budget_status
5. ✅ Implementar ManagerPasswordModal

### **Sprint 3 (Média - 3 semanas)**
1. ✅ Criar UI de formulários clínicos
2. ✅ Implementar movimentação de estoque
3. ✅ Criar dashboards executivos
4. ✅ Implementar paginação no DataContext
5. ✅ Configurar cascade delete

---

## 6. CHECKLIST DE VALIDAÇÃO

### **Segurança**
- [ ] RLS habilitado em todas as tabelas
- [ ] Policies criadas para cada role
- [ ] Permissões validadas no frontend
- [ ] Senha de gestor para descontos
- [ ] Auditoria de ações críticas
- [ ] API keys com expiração

### **Performance**
- [ ] Índices criados em colunas filtradas
- [ ] GIN index em campos JSONB
- [ ] Paginação implementada
- [ ] Cache de queries frequentes
- [ ] Lazy loading de dados

### **Dados**
- [ ] Cascade delete configurado
- [ ] Soft delete padronizado
- [ ] Backup automático ativo
- [ ] Validação de integridade referencial
- [ ] Triggers de atualização automática

### **Funcionalidades**
- [ ] Notificações WhatsApp/SMS funcionando
- [ ] Comissões calculadas automaticamente
- [ ] AI Insights gerando sugestões
- [ ] Formulários clínicos preenchíveis
- [ ] Estoque atualizado em tempo real

---

**Última Atualização:** 21/12/2024  
**Próxima Revisão:** 28/12/2024
