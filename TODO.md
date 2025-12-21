# 📋 TODO - CLINIC PRO MANAGER

**Última Atualização:** 21/12/2024  
**Versão:** 2.0  
**Status Geral:** 75/100 (85% funcionalidades implementadas)

---

## 🔴 CRÍTICO (Bloqueadores de Produção)

### 1. ⚠️ Notificações Automáticas
**Prioridade:** 🔴 CRÍTICA  
**Esforço:** 2 semanas  
**Responsável:** _____

**Tarefas:**
- [ ] Integrar WhatsApp (Evolution API ou Twilio)
- [ ] Criar `NotificationService.ts`
- [ ] Criar UI de configuração de canais
- [ ] Criar templates de mensagens personalizáveis
- [ ] Implementar agendamento automático (24h e 2h antes)
- [ ] Implementar envio automático de recalls
- [ ] Testar envio de mensagens
- [ ] Documentar API de notificações

**Bloqueio:** Recalls e confirmações são inúteis sem envio automático

---

### 2. 💾 Backup Automático
**Prioridade:** 🔴 CRÍTICA  
**Esforço:** 1 semana  
**Responsável:** _____

**Tarefas:**
- [ ] Criar Supabase Edge Function com cron job
- [ ] Implementar exportação automática do banco (diária/semanal)
- [ ] Configurar upload para storage externo (S3 ou Google Drive)
- [ ] Implementar notificação de sucesso/falha
- [ ] Criar UI de restauração de backup
- [ ] Testar processo completo de backup e restore
- [ ] Documentar procedimento de recuperação

**Bloqueio:** Risco de perda de dados

---

### 3. 🔒 RLS (Row Level Security) - Validação
**Prioridade:** 🔴 CRÍTICA  
**Esforço:** 3 dias  
**Responsável:** _____

**Tarefas:**
- [ ] Auditar todas as 68 tabelas
- [ ] Habilitar RLS onde estiver desabilitado
- [ ] Criar policies para ADMIN
- [ ] Criar policies para PROFESSIONAL
- [ ] Criar policies para CRC
- [ ] Criar policies para RECEPTIONIST
- [ ] Criar policies para MASTER
- [ ] Testar isolamento de dados entre clínicas
- [ ] Documentar policies criadas

**Bloqueio:** Risco de vazamento de dados entre clínicas

---

### 4. ⚡ Índices de Performance
**Prioridade:** 🔴 CRÍTICA  
**Esforço:** 1 dia  
**Responsável:** _____

**Tarefas:**
- [ ] Criar índice em `patients(patient_score)`
- [ ] Criar índice em `patients(clinic_id)`
- [ ] Criar índice em `appointments(date)`
- [ ] Criar índice em `transactions(date)`
- [ ] Criar índice em `financial_installments(due_date)`
- [ ] Criar índice em `patient_recalls(due_date)`
- [ ] Criar índice em `patient_recalls(status)`
- [ ] Criar índice em `medical_alerts(is_critical, is_active)`
- [ ] Criar índices GIN em campos JSONB
- [ ] Testar performance antes/depois

**Bloqueio:** Sistema lento com muitos dados

---

## 🔴 ALTA (Funcionalidades Prometidas)

### 5. 💰 Cálculo Automático de Comissões
**Prioridade:** 🔴 ALTA  
**Esforço:** 1 semana  
**Responsável:** _____

**Tarefas:**
- [ ] Criar trigger `calculate_commission()`
- [ ] Criar função de cálculo de comissão
- [ ] Criar dashboard de comissões para profissionais
- [ ] Criar relatório mensal de comissões
- [ ] Criar UI de pagamento de comissões
- [ ] Testar cálculo com diferentes cenários
- [ ] Documentar regras de comissionamento

**Bloqueio:** Profissionais não sabem quanto vão receber

---

### 6. 🤖 AI Insights Engine
**Prioridade:** 🔴 ALTA  
**Esforço:** 3 semanas  
**Responsável:** _____

**Tarefas:**
- [ ] Criar `InsightsEngine.ts`
- [ ] Implementar regras básicas (no-show, leads perdidos, etc.)
- [ ] Criar análise de padrões
- [ ] Criar geração automática de insights
- [ ] Criar dashboard de insights
- [ ] Implementar sugestões de ações
- [ ] Criar sistema de priorização de insights
- [ ] Testar com dados reais
- [ ] Documentar regras de insights

**Bloqueio:** Diferencial competitivo perdido

---

### 7. 📊 Dashboards Executivos (War Room)
**Prioridade:** 🔴 ALTA  
**Esforço:** 2 semanas  
**Responsável:** _____

**Tarefas:**
- [ ] Criar componente `WarRoom.tsx`
- [ ] Criar `HealthPillarCard.tsx` (5 pilares)
- [ ] Criar `TrendChart.tsx` (gráficos de tendência)
- [ ] Criar `KPICard.tsx` (cards de KPI)
- [ ] Implementar visão de 5 pilares (ClinicHealth)
- [ ] Implementar gráficos com Recharts
- [ ] Implementar comparação mês a mês
- [ ] Implementar exportação de relatórios (PDF)
- [ ] Testar com dados reais

**Bloqueio:** Gestores não têm visão consolidada

---

### 8. 🔒 Validação de Permissões no Frontend
**Prioridade:** 🔴 ALTA  
**Esforço:** 3 dias  
**Responsável:** _____

**Tarefas:**
- [ ] Criar hook `usePermissions()`
- [ ] Criar componente `<ProtectedAction>`
- [ ] Implementar validação antes de exibir botões
- [ ] Implementar mensagens de erro amigáveis
- [ ] Aplicar em todas as ações críticas
- [ ] Testar com diferentes roles
- [ ] Documentar sistema de permissões

**Bloqueio:** Qualquer usuário pode tentar ações não permitidas

---

## 🟡 MÉDIA (Funcionalidades Parciais)

### 9. 💰 Financial Split Automático
**Prioridade:** 🟡 MÉDIA  
**Esforço:** 2 semanas  
**Responsável:** _____

**Tarefas:**
- [ ] Criar UI de configuração de repasses
- [ ] Implementar cálculo automático ao criar orçamento
- [ ] Criar visualização de margem líquida
- [ ] Criar relatório de repasses
- [ ] Testar com diferentes cenários
- [ ] Documentar regras de split

**Impacto:** Visão de margem real

---

### 10. 📋 Formulários Clínicos Customizáveis
**Prioridade:** 🟡 MÉDIA  
**Esforço:** 3 semanas  
**Responsável:** _____

**Tarefas:**
- [ ] Criar `FormBuilder.tsx` (criar templates)
- [ ] Criar `FormRenderer.tsx` (preencher formulários)
- [ ] Implementar validação de campos
- [ ] Implementar assinatura digital
- [ ] Criar biblioteca de templates padrão
- [ ] Testar criação e preenchimento
- [ ] Documentar schema de campos

**Impacto:** Anamnese e formulários não utilizáveis

---

### 11. 📦 Movimentação de Estoque
**Prioridade:** 🟡 MÉDIA  
**Esforço:** 1 semana  
**Responsável:** _____

**Tarefas:**
- [ ] Criar UI de movimentação (entrada, saída, ajuste)
- [ ] Criar trigger que atualiza `current_stock`
- [ ] Implementar alertas de estoque mínimo
- [ ] Criar relatório de consumo por procedimento
- [ ] Testar atualização automática de estoque
- [ ] Documentar fluxo de movimentação

**Impacto:** Estoque desatualizado

---

### 12. 💊 Prescrições Digitais
**Prioridade:** 🟡 MÉDIA  
**Esforço:** 1 semana  
**Responsável:** _____

**Tarefas:**
- [ ] Criar UI completa de prescrição
- [ ] Implementar biblioteca de medicamentos
- [ ] Criar impressão formatada
- [ ] Implementar assinatura digital
- [ ] Testar geração de prescrições
- [ ] Documentar templates de prescrição

**Impacto:** Funcionalidade clínica incompleta

---

### 13. 📸 Galeria de Imagens Clínicas
**Prioridade:** 🟡 MÉDIA  
**Esforço:** 1 semana  
**Responsável:** _____

**Tarefas:**
- [ ] Implementar upload de imagens
- [ ] Criar galeria organizada por tipo
- [ ] Implementar comparação before/after
- [ ] Implementar consentimento de uso
- [ ] Testar upload e visualização
- [ ] Documentar tipos de imagens

**Impacto:** Before/After não visualizável

---

### 14. 🦷 Odontograma Interativo
**Prioridade:** 🟡 MÉDIA  
**Esforço:** 2 semanas  
**Responsável:** _____

**Tarefas:**
- [ ] Criar interface gráfica de odontograma
- [ ] Implementar marcação de dentes
- [ ] Implementar histórico de alterações
- [ ] Implementar impressão
- [ ] Testar com diferentes casos
- [ ] Documentar códigos de status

**Impacto:** Planejamento odontológico limitado

---

### 15. 📝 Contratos Recorrentes (Assinaturas)
**Prioridade:** 🟡 MÉDIA  
**Esforço:** 2 semanas  
**Responsável:** _____

**Tarefas:**
- [ ] Criar dashboard de contratos
- [ ] Implementar cobrança automática mensal
- [ ] Implementar suspensão/cancelamento
- [ ] Criar relatório de receita recorrente
- [ ] Testar ciclo completo de assinatura
- [ ] Documentar tipos de contratos

**Impacto:** Botox Club, planos mensais não gerenciáveis

---

### 16. ⚡ Paginação no DataContext
**Prioridade:** 🟡 MÉDIA  
**Esforço:** 1 semana  
**Responsável:** _____

**Tarefas:**
- [ ] Implementar paginação em todas as listas
- [ ] Implementar lazy loading
- [ ] Migrar para React Query (cache)
- [ ] Implementar infinite scroll
- [ ] Testar com grandes volumes de dados
- [ ] Documentar estratégia de paginação

**Impacto:** Sistema trava com muitos dados

---

### 17. 🦷 Módulo de Ortodontia (BOS ORTHO)
**Prioridade:** 🟡 MÉDIA  
**Esforço:** 6 semanas  
**Responsável:** _____

**Tarefas:**

**Sprint 1 - Backend (1 semana):**
- [x] Executar migration `008_orthodontics_module.sql` ✅ **CONCLUÍDO**
- [x] Criar `OrthoService.ts` ✅ **CONCLUÍDO**
- [ ] Criar endpoints de API (contratos, planos, evoluções)
- [ ] Testar triggers e views
- [ ] Documentar API

**Sprint 2 - Frontend Financeiro (2 semanas):**
- [x] Criar `OrthoContractForm.tsx` (criar contrato) ✅ **CONCLUÍDO**
- [x] Criar `OrthoContractList.tsx` (listar contratos) ✅ **CONCLUÍDO**
- [x] Criar `OrthoAgingReport.tsx` (inadimplência) ✅ **CONCLUÍDO**
- [x] Integrar com geração automática de parcelas ✅ **CONCLUÍDO**
- [ ] Testar fluxo completo de adesão

**Sprint 3 - Frontend Clínico (2 semanas):**
- [ ] Criar `OrthoAppointmentForm.tsx` (evolução estruturada)
- [ ] Criar `OrthoTreatmentPlanForm.tsx` (planejamento)
- [x] Criar `AlignerTracker.tsx` (controle de alinhadores) ✅ **CONCLUÍDO**
- [ ] Criar `OrthoTimeline.tsx` (linha do tempo)
- [ ] Testar registro de consultas

**Sprint 4 - Dashboards (1 semana):**
- [ ] Criar `OrthoDashboard.tsx` (visão geral)
- [ ] Criar `AlignerProgressReport.tsx` (progresso de alinhadores)
- [ ] Criar `HygieneComplianceReport.tsx` (higiene e colaboração)
- [ ] Criar gráficos de evolução

**Sprint 5 - Automações (1 semana):**
- [ ] Implementar bloqueio de inadimplentes na agenda
- [ ] Implementar alertas de troca de alinhador (WhatsApp)
- [ ] Implementar Smile Score (gamificação)
- [ ] Testar automações completas

**Integração:**
- [x] Integrar com PatientDetail.tsx ✅ **CONCLUÍDO**
- [x] Adicionar aba "Ortodontia" ✅ **CONCLUÍDO**
- [x] Adicionar modal de criação de contrato ✅ **CONCLUÍDO**

**Sprint 4 - Dashboards (1 semana):**
- [ ] Criar `OrthoDashboard.tsx` (visão geral)
- [ ] Criar `AlignerProgressReport.tsx` (progresso de alinhadores)
- [ ] Criar `HygieneComplianceReport.tsx` (higiene e colaboração)
- [ ] Criar gráficos de evolução

**Sprint 5 - Automações (1 semana):**
- [ ] Implementar bloqueio de inadimplentes na agenda
- [ ] Implementar alertas de troca de alinhador (WhatsApp)
- [ ] Implementar Smile Score (gamificação)
- [ ] Testar automações completas

**Impacto:** Gestão completa de tratamentos ortodônticos de longo prazo

**Documentação:** `docs/MODULO_ORTODONTIA.md`

---

## 🟢 BAIXA (Nice to Have)

### 17. 🔗 Webhooks
**Prioridade:** 🟢 BAIXA  
**Esforço:** 1 semana  
**Responsável:** _____

**Tarefas:**
- [ ] Criar UI de configuração de webhooks
- [ ] Implementar disparo automático em eventos
- [ ] Implementar retry em caso de falha
- [ ] Criar logs de webhooks
- [ ] Testar com serviços externos
- [ ] Documentar eventos disponíveis

**Impacto:** Integrações externas impossíveis

---

### 18. 📄 Atestados Médicos
**Prioridade:** 🟢 BAIXA  
**Esforço:** 3 dias  
**Responsável:** _____

**Tarefas:**
- [ ] Criar UI de geração de atestados
- [ ] Criar templates personalizáveis
- [ ] Implementar assinatura digital
- [ ] Implementar impressão
- [ ] Testar geração de atestados
- [ ] Documentar templates

**Impacto:** Funcionalidade clínica secundária

---

### 19. 📢 Campanhas de Marketing
**Prioridade:** 🟢 BAIXA  
**Esforço:** 1 semana  
**Responsável:** _____

**Tarefas:**
- [ ] Criar dashboard de campanhas
- [ ] Implementar rastreamento de conversão
- [ ] Implementar cálculo de ROI
- [ ] Criar relatórios de campanha
- [ ] Testar rastreamento
- [ ] Documentar métricas

**Impacto:** ROI de marketing não mensurável

---

### 20. ✍️ Assinatura Digital
**Prioridade:** 🟢 BAIXA  
**Esforço:** 2 semanas  
**Responsável:** _____

**Tarefas:**
- [ ] Integrar com serviço de assinatura (DocuSign/ClickSign)
- [ ] Implementar fluxo de assinatura
- [ ] Implementar armazenamento de documentos assinados
- [ ] Validar validade jurídica
- [ ] Testar fluxo completo
- [ ] Documentar processo de assinatura

**Impacto:** Contratos ainda em papel

---

## 📊 RESUMO EXECUTIVO

### **Distribuição por Prioridade:**

| Prioridade | Quantidade | % | Esforço Total |
|------------|------------|---|---------------|
| 🔴 **CRÍTICA** | 4 | 19% | 3 semanas |
| 🔴 **ALTA** | 4 | 19% | 9 semanas |
| 🟡 **MÉDIA** | 9 | 43% | 19 semanas |
| 🟢 **BAIXA** | 4 | 19% | 4 semanas |
| **TOTAL** | **21** | **100%** | **35 semanas** |

### **Esforço Total Estimado:** ~9 meses

**Novo:** Módulo de Ortodontia adicionado (+6 semanas)

---

## 🎯 PLANO DE SPRINTS SUGERIDO

### **Sprint 1 (1 semana) - Segurança e Performance** 🔴
- [ ] Validar RLS em todas as tabelas
- [ ] Criar índices de performance
- [ ] Implementar validação de permissões no frontend
- [ ] Configurar backup automático

**Entregável:** Sistema seguro e performático

---

### **Sprint 2-3 (2 semanas) - Notificações** 🔴
- [ ] Integrar WhatsApp (Evolution API)
- [ ] Criar NotificationService
- [ ] Implementar envio automático de recalls
- [ ] Implementar envio automático de confirmações

**Entregável:** Recalls e confirmações 100% automáticos

---

### **Sprint 4 (1 semana) - Comissões** 🔴
- [ ] Criar trigger de cálculo automático
- [ ] Criar dashboard de comissões
- [ ] Criar relatório mensal

**Entregável:** Comissões automáticas

---

### **Sprint 5-6 (2 semanas) - Dashboards** 🔴
- [ ] Criar War Room (dashboard executivo)
- [ ] Implementar gráficos de tendência
- [ ] Criar visão de 5 pilares (ClinicHealth)

**Entregável:** Visão executiva completa

---

### **Sprint 7-9 (3 semanas) - AI Insights** 🔴
- [ ] Implementar engine de regras
- [ ] Criar análise de padrões
- [ ] Criar dashboard de insights

**Entregável:** Inteligência preditiva ativa

---

### **Sprint 10-11 (2 semanas) - Financial Split** 🟡
- [ ] Configuração de repasses
- [ ] Cálculo automático
- [ ] Visualização de margem

**Entregável:** Margem real visível

---

### **Sprint 12-14 (3 semanas) - Formulários Clínicos** 🟡
- [ ] FormBuilder
- [ ] FormRenderer
- [ ] Templates padrão

**Entregável:** Anamnese digital

---

### **Sprint 15+ (Restante)** 🟡🟢
- [ ] Demais funcionalidades médias e baixas

---

## 📝 NOTAS

### **Dependências Críticas:**
1. **Notificações** dependem de conta Evolution API ou Twilio
2. **Backup** depende de storage externo (S3 ou Google Drive)
3. **Assinatura Digital** depende de integração com DocuSign/ClickSign

### **Riscos Identificados:**
- RLS não validado pode causar vazamento de dados
- Falta de índices pode causar lentidão severa
- Falta de backup pode causar perda de dados

### **Próximos Passos Imediatos:**
1. ✅ Executar Sprint 1 (Segurança e Performance)
2. ✅ Contratar serviço de WhatsApp (Evolution API)
3. ✅ Executar Sprint 2-3 (Notificações)

---

**Última Revisão:** 21/12/2024  
**Próxima Revisão:** 28/12/2024
