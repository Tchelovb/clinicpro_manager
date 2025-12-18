# 🏦 Financial Fort Knox - Plano de Implementação

> **Data**: 18/12/2025  
> **Objetivo**: Transformar o módulo financeiro em um sistema blindado com controle rigoroso de sessão de caixa

---

## 📊 Análise do Schema Atual

### ✅ O que JÁ TEMOS (Aproveitável)

#### Tabela `cash_registers` (Linhas 372-386)
```sql
CREATE TABLE public.cash_registers (
  id UUID PRIMARY KEY,
  clinic_id UUID REFERENCES clinics(id),
  user_id UUID REFERENCES users(id),
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  opening_balance NUMERIC(10,2) NOT NULL,
  closing_balance NUMERIC(10,2),
  calculated_balance NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL,
  observations TEXT
);
```

**Status**: ✅ **EXCELENTE BASE** - Já tem 80% do necessário!

**O que falta adicionar**:
- `declared_balance` (valor contado pelo usuário)
- `difference_amount` (quebra de caixa)
- `difference_reason` (justificativa)
- Constraint CHECK para status

#### Tabela `transactions` (Linhas 389-404)
```sql
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY,
  clinic_id UUID REFERENCES clinics(id),
  cash_register_id UUID REFERENCES cash_registers(id), -- ✅ JÁ TEM!
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  type transaction_type NOT NULL,
  category TEXT NOT NULL,
  date DATE NOT NULL,
  payment_method TEXT NOT NULL,
  expense_id UUID REFERENCES expenses(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Status**: ✅ **PERFEITO** - Já vincula com `cash_register_id`!

**O que falta**:
- Renomear `cash_register_id` para `session_id` (opcional, por clareza)
- Adicionar trigger de segurança

#### Outras Tabelas Relevantes
- ✅ `financial_installments` - Contas a receber
- ✅ `expenses` - Contas a pagar  
- ✅ `payment_history` - Histórico de pagamentos

---

## 🎯 O que PRECISA SER IMPLEMENTADO

### 1. Nova Tabela: `clinic_financial_settings`

**Propósito**: Configurações de segurança financeira por clínica

```sql
CREATE TABLE IF NOT EXISTS public.clinic_financial_settings (
  clinic_id UUID PRIMARY KEY REFERENCES public.clinics(id) ON DELETE CASCADE,
  
  -- Regras de Abertura/Fechamento
  force_cash_opening BOOLEAN DEFAULT TRUE,      -- Obriga abrir caixa ao logar?
  force_daily_closing BOOLEAN DEFAULT TRUE,     -- Obriga fechar para abrir outro?
  allow_negative_balance BOOLEAN DEFAULT FALSE, -- Permite caixa negativo?
  blind_closing BOOLEAN DEFAULT TRUE,           -- Fechamento cego?
  
  -- Valores Padrão
  default_change_fund NUMERIC(10,2) DEFAULT 100.00, -- Fundo de troco padrão
  
  -- Limites de Alerta
  max_difference_without_approval NUMERIC(10,2) DEFAULT 50.00, -- Quebra > R$50 = Auditoria
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar registro padrão para clínicas existentes
INSERT INTO public.clinic_financial_settings (clinic_id)
SELECT id FROM public.clinics
ON CONFLICT (clinic_id) DO NOTHING;
```

---

### 2. Alterações na Tabela `cash_registers`

**Script de Migração**:

```sql
-- Adicionar novas colunas
ALTER TABLE public.cash_registers
ADD COLUMN IF NOT EXISTS declared_balance NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS difference_amount NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS difference_reason TEXT;

-- Adicionar constraint para status
ALTER TABLE public.cash_registers
DROP CONSTRAINT IF EXISTS cash_registers_status_check;

ALTER TABLE public.cash_registers
ADD CONSTRAINT cash_registers_status_check 
CHECK (status IN ('OPEN', 'CLOSED', 'AUDIT_PENDING'));

-- Renomear para melhor clareza (opcional)
COMMENT ON TABLE public.cash_registers IS 'Sessões de caixa - controla abertura/fechamento e movimentações financeiras';
```

---

### 3. Trigger de Segurança Financeira 🔒

**O Coração do Fort Knox**: Impede transações sem caixa aberto

```sql
-- Função que valida sessão aberta
CREATE OR REPLACE FUNCTION check_open_session_before_transaction()
RETURNS TRIGGER AS $$
DECLARE
    open_session_id UUID;
    settings RECORD;
BEGIN
    -- 1. Buscar configurações da clínica
    SELECT * INTO settings
    FROM clinic_financial_settings
    WHERE clinic_id = NEW.clinic_id;
    
    -- 2. Se não forçar abertura, libera (modo legado)
    IF settings.force_cash_opening = FALSE THEN
        RETURN NEW;
    END IF;
    
    -- 3. Buscar sessão ABERTA do usuário atual
    SELECT id INTO open_session_id
    FROM cash_registers
    WHERE user_id = auth.uid() 
      AND clinic_id = NEW.clinic_id
      AND status = 'OPEN'
      AND closed_at IS NULL
    ORDER BY opened_at DESC
    LIMIT 1;

    -- 4. Se não tiver sessão aberta, BLOQUEIA
    IF open_session_id IS NULL THEN
        RAISE EXCEPTION 'BLOQUEIO FINANCEIRO: Você precisa abrir o caixa antes de realizar movimentações financeiras. Vá em Financeiro > Abrir Caixa.';
    END IF;

    -- 5. Vincula transação à sessão automaticamente
    NEW.cash_register_id := open_session_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger
DROP TRIGGER IF EXISTS trg_financial_security ON public.transactions;
CREATE TRIGGER trg_financial_security
BEFORE INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION check_open_session_before_transaction();
```

---

### 4. Views Auxiliares

#### View: Sessão Ativa do Usuário

```sql
CREATE OR REPLACE VIEW user_active_session AS
SELECT 
  cr.id as session_id,
  cr.user_id,
  cr.clinic_id,
  cr.opened_at,
  cr.opening_balance,
  cr.status,
  u.name as user_name,
  -- Calcular saldo atual em tempo real
  cr.opening_balance + COALESCE(
    (SELECT SUM(CASE WHEN type = 'INCOME' THEN amount ELSE -amount END)
     FROM transactions
     WHERE cash_register_id = cr.id),
    0
  ) as current_balance,
  -- Contar transações
  (SELECT COUNT(*) FROM transactions WHERE cash_register_id = cr.id) as transaction_count
FROM cash_registers cr
JOIN users u ON cr.user_id = u.id
WHERE cr.status = 'OPEN'
  AND cr.closed_at IS NULL;
```

#### View: Histórico de Fechamentos

```sql
CREATE OR REPLACE VIEW cash_closing_history AS
SELECT 
  cr.id,
  cr.clinic_id,
  u.name as user_name,
  cr.opened_at,
  cr.closed_at,
  cr.opening_balance,
  cr.calculated_balance,
  cr.declared_balance,
  cr.difference_amount,
  cr.difference_reason,
  cr.status,
  -- Duração da sessão
  EXTRACT(EPOCH FROM (cr.closed_at - cr.opened_at))/3600 as hours_open,
  -- Total de transações
  (SELECT COUNT(*) FROM transactions WHERE cash_register_id = cr.id) as total_transactions
FROM cash_registers cr
JOIN users u ON cr.user_id = u.id
WHERE cr.status IN ('CLOSED', 'AUDIT_PENDING')
ORDER BY cr.closed_at DESC;
```

---

## 🎨 Componentes Frontend a Criar

### 1. `CashOpeningModal.tsx` - Modal de Abertura Obrigatória

**Quando aparece**: 
- Ao fazer login (se `force_cash_opening = true`)
- Ao tentar fazer movimentação sem caixa aberto

**Funcionalidades**:
- Input: Saldo inicial / Fundo de troco
- Botão: "Abrir Caixa" (cria registro em `cash_registers`)
- **Bloqueante**: Não pode fechar sem abrir

**Fluxo**:
```typescript
const handleOpenCash = async () => {
  const { data, error } = await supabase
    .from('cash_registers')
    .insert({
      clinic_id: user.clinic_id,
      user_id: user.id,
      opening_balance: openingBalance,
      calculated_balance: openingBalance,
      status: 'OPEN'
    });
    
  if (!error) {
    setActiveSession(data[0]);
    toast.success('Caixa aberto com sucesso!');
  }
};
```

---

### 2. `CashClosingWizard.tsx` - Wizard de Fechamento (3 Passos)

**Passo 1: Conferência de Cartões**
- Listar todas as transações de cartão do dia
- Somar total de cada bandeira/maquininha
- Usuário confirma valores

**Passo 2: Contagem de Espécie (Fechamento Cego)**
- Se `blind_closing = true`: **NÃO MOSTRA** o saldo calculado
- Input: "Quanto tem em dinheiro vivo na gaveta?"
- Input: "Quanto tem em comprovantes de cartão?"

**Passo 3: Relatório de Conferência**
- Mostra diferença: `declared_balance - calculated_balance`
- Se diferença != 0:
  - ✅ Verde: Diferença < R$ 5
  - ⚠️ Amarelo: R$ 5 - R$ 50
  - 🚨 Vermelho: > R$ 50 (exige justificativa)
- Input obrigatório: "Justificativa da diferença"
- Botão: "Finalizar Fechamento"

**Fluxo**:
```typescript
const handleCloseCash = async () => {
  const difference = declaredBalance - calculatedBalance;
  const status = Math.abs(difference) > maxDifferenceWithoutApproval 
    ? 'AUDIT_PENDING' 
    : 'CLOSED';
    
  await supabase
    .from('cash_registers')
    .update({
      closed_at: new Date().toISOString(),
      declared_balance: declaredBalance,
      difference_amount: difference,
      difference_reason: differenceReason,
      status: status
    })
    .eq('id', activeSession.id);
};
```

---

### 3. `CashDashboard.tsx` - Dashboard de Caixa Atual

**Informações Exibidas**:
- 💰 Saldo Inicial: R$ 100,00
- 📈 Entradas: R$ 1.500,00
- 📉 Saídas: R$ 200,00
- 💵 Saldo Atual: R$ 1.400,00
- ⏱️ Aberto há: 3h 25min
- 📊 Transações: 15

**Ações Rápidas**:
- Botão: "Sangria" (retirar dinheiro)
- Botão: "Suprimento" (adicionar troco)
- Botão: "Fechar Caixa"

---

### 4. `CashHistoryReport.tsx` - Relatório de Fechamentos

**Tabela com Colunas**:
- Usuário
- Data Abertura
- Data Fechamento
- Duração
- Saldo Inicial
- Saldo Calculado
- Saldo Declarado
- Diferença (com cor)
- Justificativa
- Status

**Filtros**:
- Por usuário
- Por período
- Por status (Fechado, Auditoria Pendente)

---

## 🔄 Fluxos de Trabalho (UX)

### Fluxo 1: Início do Dia

```
1. Recepcionista faz login
2. Sistema verifica: tem sessão OPEN?
   └─ NÃO → Abre CashOpeningModal (bloqueante)
   └─ SIM → Libera acesso normal
3. Recepcionista digita: R$ 100,00 (fundo de troco)
4. Clica "Abrir Caixa"
5. Sistema cria registro em cash_registers
6. Dashboard liberado
```

### Fluxo 2: Recebimento de Paciente

```
1. Recepcionista vai em "Receber Pagamento"
2. Seleciona parcela: R$ 500,00
3. Clica "Confirmar Recebimento"
4. Sistema tenta INSERT em transactions
5. Trigger valida: tem sessão OPEN?
   └─ SIM → Vincula session_id automaticamente
   └─ NÃO → ERRO: "Abra o caixa primeiro"
6. Transação registrada
7. Saldo atualizado em tempo real
```

### Fluxo 3: Sangria/Suprimento

```
1. Recepcionista clica "Sangria"
2. Modal: "Quanto vai retirar?"
3. Input: R$ 500,00
4. Motivo: "Depósito no banco"
5. Sistema cria transaction:
   - type: EXPENSE
   - category: "Sangria"
   - amount: 500
   - session_id: (automático)
6. Saldo do caixa reduz
```

### Fluxo 4: Fechamento de Caixa

```
1. Fim do expediente
2. Recepcionista clica "Fechar Caixa"
3. Wizard Passo 1: Conferência de Cartões
   - Visa: R$ 800,00 ✓
   - Master: R$ 300,00 ✓
4. Wizard Passo 2: Contagem de Espécie
   - Sistema NÃO mostra saldo calculado
   - Input: "Dinheiro vivo: R$ 400,00"
5. Wizard Passo 3: Confronto
   - Calculado: R$ 1.400,00
   - Declarado: R$ 1.390,00
   - Diferença: -R$ 10,00 🟡
   - Input obrigatório: "Justificativa: Troco dado errado"
6. Clica "Finalizar"
7. Sistema:
   - Update cash_registers (status = CLOSED)
   - Se diferença > R$ 50 → status = AUDIT_PENDING
8. Caixa fechado
```

---

## 📋 Checklist de Implementação

### Fase 1: Database (1 dia)
- [ ] Criar tabela `clinic_financial_settings`
- [ ] Alterar tabela `cash_registers` (adicionar colunas)
- [ ] Criar trigger `check_open_session_before_transaction`
- [ ] Criar views `user_active_session` e `cash_closing_history`
- [ ] Testar trigger manualmente

### Fase 2: Backend/Context (2 dias)
- [ ] Criar `FinancialContext.tsx`
- [ ] Hook: `useActiveSession()` - busca sessão aberta
- [ ] Hook: `useCashOperations()` - abrir/fechar/sangria/suprimento
- [ ] Função: `openCashSession(openingBalance)`
- [ ] Função: `closeCashSession(declaredBalance, reason)`
- [ ] Função: `performWithdrawal(amount, reason)` - Sangria
- [ ] Função: `performDeposit(amount, reason)` - Suprimento

### Fase 3: Componentes UI (3 dias)
- [ ] `CashOpeningModal.tsx` - Modal bloqueante
- [ ] `CashClosingWizard.tsx` - Wizard 3 passos
- [ ] `CashDashboard.tsx` - Dashboard de caixa atual
- [ ] `CashHistoryReport.tsx` - Relatório de fechamentos
- [ ] `SangriaSuprimentoModal.tsx` - Modal de movimentações internas

### Fase 4: Integração (2 dias)
- [ ] Integrar `CashOpeningModal` no login
- [ ] Adicionar verificação em todas as telas financeiras
- [ ] Atualizar `PaymentReceiveModal` para usar sessão
- [ ] Atualizar `ExpensePaymentModal` para usar sessão
- [ ] Adicionar indicador de caixa aberto na Sidebar

### Fase 5: Testes (2 dias)
- [ ] Testar abertura obrigatória
- [ ] Testar bloqueio de transação sem caixa
- [ ] Testar fechamento cego
- [ ] Testar quebra de caixa (diferença)
- [ ] Testar sangria/suprimento
- [ ] Testar múltiplos usuários (cada um com seu caixa)

---

## 🎯 Verificação do Plano

### Testes Automatizados
**Não aplicável** - Sistema usa Supabase (sem testes unitários configurados)

### Testes Manuais

#### Teste 1: Abertura Obrigatória de Caixa
1. Fazer logout
2. Fazer login com usuário de recepção
3. **Esperado**: Modal "Abrir Caixa" aparece e não pode ser fechado
4. Digitar R$ 100,00 e clicar "Abrir Caixa"
5. **Esperado**: Modal fecha e dashboard é liberado

#### Teste 2: Bloqueio de Transação sem Caixa
1. No Supabase SQL Editor, executar:
   ```sql
   UPDATE cash_registers SET status = 'CLOSED' WHERE user_id = auth.uid();
   ```
2. Tentar receber um pagamento de paciente
3. **Esperado**: Erro "BLOQUEIO FINANCEIRO: Você precisa abrir o caixa..."

#### Teste 3: Fechamento Cego
1. Abrir caixa com R$ 100,00
2. Receber R$ 500,00 de um paciente
3. Clicar "Fechar Caixa"
4. **Esperado**: Sistema NÃO mostra que deveria ter R$ 600,00
5. Digitar R$ 590,00 (errado de propósito)
6. **Esperado**: Sistema mostra diferença de -R$ 10,00 e pede justificativa

#### Teste 4: Auditoria Pendente
1. Criar diferença > R$ 50,00 no fechamento
2. **Esperado**: Status muda para "AUDIT_PENDING"
3. Verificar que aparece destacado no relatório

---

## 💡 Valor Estratégico

### Para a Clínica
- ✅ **Rastreabilidade Total**: Toda movimentação tem responsável
- ✅ **Fim de Furtos Silenciosos**: Quebra de caixa é registrada e justificada
- ✅ **Auditoria Automática**: Diferenças grandes vão para aprovação
- ✅ **Profissionalismo**: Nível de clínica high-end

### Para o Gestor
- 📊 Relatório de performance por usuário
- 🔍 Identificar padrões de quebra
- 💰 Controle exato do fluxo de caixa
- ⚖️ Responsabilização individual

---

## 🚨 Pontos de Atenção

### Migração de Dados Legados
- Transações antigas não têm `session_id`
- **Solução**: Criar "Sessão Legado" e vincular

```sql
-- Criar sessão legado para cada clínica
INSERT INTO cash_registers (clinic_id, user_id, opened_at, closed_at, opening_balance, calculated_balance, status, observations)
SELECT 
  id as clinic_id,
  (SELECT id FROM users WHERE clinic_id = clinics.id LIMIT 1) as user_id,
  '2024-01-01 00:00:00' as opened_at,
  '2024-12-31 23:59:59' as closed_at,
  0 as opening_balance,
  0 as calculated_balance,
  'CLOSED' as status,
  'Sessão Legado - Dados Anteriores ao Fort Knox' as observations
FROM clinics;

-- Vincular transações antigas
UPDATE transactions
SET cash_register_id = (
  SELECT id FROM cash_registers 
  WHERE clinic_id = transactions.clinic_id 
    AND observations LIKE '%Legado%'
  LIMIT 1
)
WHERE cash_register_id IS NULL;
```

### Desempenho
- Trigger executa em TODA inserção de transaction
- **Otimização**: Usar índice em `(user_id, status, clinic_id)`

```sql
CREATE INDEX idx_cash_registers_active_session 
ON cash_registers(user_id, clinic_id, status) 
WHERE status = 'OPEN';
```

---

**Próxima Ação**: Revisar plano e aprovar para implementação
