# PROMPT MESTRE: IMPLEMENTAÇÃO FINTECH ODONTOLÓGICA HIGH TICKET

## 🏛️ Contexto Estratégico (Background)
"O sistema se chama **Clinic Pro Manager**, focado em odontologia de alta performance e procedimentos High Ticket. O Dr. Marcelo (CEO) atua com cirurgias estéticas da face. 

**O Diferencial Competitivo:** Modelo de Gestão de Risco de Crédito. 
Operamos como um banco: vendemos no boleto/carnê para democratizar o acesso ao High Ticket, mas usamos precificação atuarial (markup de risco), análise de score automatizada e um motor de comissões baseado no recebimento real (caixa), protegendo a clínica contra inadimplência e descasamento de fluxo de caixa."

---

## 🤖 Instrução para a IA

**ATUE COMO:** Software Architect & Fintech Expert
**OBJETIVO:** Implementar o Módulo Financeiro "Clinic Pro Manager"

### 1. ESCOPO TÉCNICO
Utilize **React, Vite, Tailwind CSS, Shadcn UI e Supabase**. 
O banco de dados já possui as tabelas: `transactions`, `expenses`, `financial_installments`, `credit_profiles`, `professional_ledger` e `payment_method_fees`.

### 2. IMPLEMENTAÇÃO POR MÓDULOS

#### A. MOTOR DE ANÁLISE & RISCO (Credit Engine)
- Crie um componente `CreditAnalysisWidget` que consulte o CPF do lead.
- Aplique a **Matriz de Risco**: 
  - **Score > 800 (A):** Liberado 24x, 0% entrada.
  - **Score 600-799 (B):** Máx 12x, 20% entrada.
  - **Score 400-599 (C):** Máx 6x, 40% entrada + Avalista.
  - **Score < 400 (D):** Bloqueado (Apenas Cartão/Pix).
- Salve o resultado na tabela `credit_profiles`.

#### B. SIMULADOR DE ORÇAMENTO COM SUBSÍDIO CRUZADO
- Desenvolva uma calculadora de orçamento que apresente DOIS valores:
  1. **Valor Smart (Cartão/Pix):** Preço base da tabela.
  2. **Valor Crediário (Boleto):** Preço base + Markup de Risco (A: 10%, B: 20%, C: 35%).
- O sistema deve injetar automaticamente a "Cláusula de Confissão de Dívida e Título Executivo" no contrato se a opção for Boleto.

#### C. GESTÃO DE CAIXA & CONTAS A RECEBER (Jira-Style)
- Implemente uma visualização de `financial_installments` estilo Kanban ou Data-Table avançada.
- Adicione uma 'Régua de Cobrança' automatizada:
  - D-3 (Lembrete), D+1 (Aviso), D+15 (Bloqueio de Agenda no sistema).
- Crie a **'Trava de Custo de Terceiros'**: Bloqueie o envio de pedidos para laboratório se o valor acumulado pago pelo paciente for menor que o `estimated_lab_cost` do procedimento.

#### D. EXTRATO DO PROFISSIONAL (Professional Ledger)
- Implemente o extrato `professional_ledger`. 
- Toda vez que uma transação de paciente for confirmada, o sistema deve calcular a comissão (conforme `professional_commissions`) e creditar **apenas o valor proporcional ao recebido** na conta do dentista.
- Permita lançar débitos (compartilhamento de custos de material ou lab) diretamente no extrato do profissional.

#### E. DASHBOARD DE SAÚDE FINANCEIRA (CFO View)
- Gere gráficos de:
  - Fluxo de Caixa (Real vs. Previsto).
  - PDD (Provisão para Devedores Duvidosos): Quanto do meu a receber está em risco?
  - DRE Automático: Receita - Impostos - Taxas Cartão - Comissões - Custos Fixos = Lucro Líquido.

### 3. DIRETRIZES DE DESIGN
- Interface limpa, executiva, com cores que indiquem segurança (Green) e risco (Orange/Red).
- Uso de Sheets laterais para detalhamento de parcelas e histórico de cobrança.

---

## 🛡️ O Que Esse Prompt Garante (The "Why")
1. **Proteção contra Lab:** Não deixa gastar dinheiro com prótese antes do paciente pagar o custo.
2. **Proteção contra Dentista:** Só paga comissão do que efetivamente entrou no caixa.
3. **Proteção contra Calote:** O preço do boleto embute um prêmio de risco (markup) que cobre a inadimplência estatística.

---

## 📂 Contexto do Banco de Dados (Schema Completo)

```sql
-- (Cole aqui o DDL completo fornecido anteriormente se necessário para a IA ter o contexto exato das tabelas)
-- Tabelas Chave para o Financeiro:
-- public.credit_profiles
-- public.financial_installments
-- public.professional_ledger
-- public.transactions
-- public.expenses
-- public.budgets
-- public.patients
```
