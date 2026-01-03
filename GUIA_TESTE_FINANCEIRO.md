# 💰 GUIA DE TESTE - INTELIGÊNCIA FINANCEIRA
## Validação de Comissões e Repasse de 30%

**Data:** 03/01/2026 09:30  
**Objetivo:** Validar cálculo automático de comissões após unificação  
**Foco:** Repasse de 30% para profissionais  

---

## 🎯 TESTE 1: COMISSÕES POR PROFISSIONAL

### **Passo a Passo:**

1. **Abra o Menu Lateral**
   - Clique no ícone de menu (☰)
   - Ou pressione a tecla de atalho

2. **Navegue para Financeiro**
   - Clique em "Financeiro"
   - OU
   - Clique em "Relatórios"

3. **Busque "Comissões por Profissional"**
   - Procure por:
     - "Comissões"
     - "Repasse"
     - "Ledger Profissional"
     - "Pagamentos a Profissionais"

4. **Selecione o Profissional**
   - Procure por:
     - "Dr. Marcelo"
     - "Admin"
     - "marcelovboass@gmail.com"
   - Selecione o período (ex: último mês)

5. **Verifique os Dados**
   - ✅ Procedimentos aparecem?
   - ✅ Valores estão corretos?
   - ✅ Comissão de 30% está calculada?
   - ✅ Total bate com o esperado?

---

## 📊 EXEMPLO DE CÁLCULO ESPERADO

### **Cenário 1: Harmonização Facial**
```
Procedimento: Harmonização Facial
Valor Bruto: R$ 5.000,00
Comissão (30%): R$ 1.500,00
Valor Líquido Clínica: R$ 3.500,00
```

### **Cenário 2: Cervicoplastia**
```
Procedimento: Cervicoplastia
Valor Bruto: R$ 50.000,00
Comissão (30%): R$ 15.000,00
Valor Líquido Clínica: R$ 35.000,00
```

### **Cenário 3: Múltiplos Procedimentos**
```
Procedimento 1: Botox - R$ 1.000,00 → Comissão: R$ 300,00
Procedimento 2: Preenchimento - R$ 2.000,00 → Comissão: R$ 600,00
Procedimento 3: Limpeza - R$ 500,00 → Comissão: R$ 150,00

TOTAL BRUTO: R$ 3.500,00
TOTAL COMISSÃO: R$ 1.050,00 (30%)
TOTAL CLÍNICA: R$ 2.450,00 (70%)
```

---

## 🔍 VALIDAÇÃO SQL (Se Quiser Conferir no Banco)

### **Query 1: Ver Todos os Procedimentos do Dr. Marcelo**
```sql
SELECT 
    ti.id,
    ti.procedure_name,
    ti.execution_date,
    ti.total_value as valor_bruto,
    (ti.total_value * 0.30) as comissao_30_porcento,
    (ti.total_value * 0.70) as valor_clinica,
    ti.status,
    u.name as profissional,
    p.name as paciente
FROM treatment_items ti
JOIN users u ON ti.professional_id = u.id
JOIN patients p ON ti.patient_id = p.id
WHERE u.email = 'marcelovboass@gmail.com'
  AND ti.status = 'COMPLETED'
ORDER BY ti.execution_date DESC
LIMIT 20;
```

### **Query 2: Ver Ledger do Profissional**
```sql
SELECT 
    pl.id,
    pl.transaction_date,
    pl.category,
    pl.type,
    pl.amount,
    pl.description,
    pl.balance_after,
    u.name as profissional
FROM professional_ledger pl
JOIN users u ON pl.professional_id = u.id
WHERE u.email = 'marcelovboass@gmail.com'
ORDER BY pl.transaction_date DESC
LIMIT 20;
```

### **Query 3: Resumo de Comissões por Mês**
```sql
SELECT 
    DATE_TRUNC('month', ti.execution_date) as mes,
    COUNT(*) as total_procedimentos,
    SUM(ti.total_value) as valor_total_bruto,
    SUM(ti.total_value * 0.30) as total_comissao,
    SUM(ti.total_value * 0.70) as total_clinica,
    u.name as profissional
FROM treatment_items ti
JOIN users u ON ti.professional_id = u.id
WHERE u.email = 'marcelovboass@gmail.com'
  AND ti.status = 'COMPLETED'
  AND ti.execution_date >= DATE_TRUNC('year', CURRENT_DATE)
GROUP BY DATE_TRUNC('month', ti.execution_date), u.name
ORDER BY mes DESC;
```

---

## 🎯 TESTE 2: GOOGLE CALENDAR (Preparação)

### **Onde Encontrar:**

1. **Opção 1: Menu Configurações**
   ```
   Menu > Configurações > Integrações > Google Calendar
   ```

2. **Opção 2: Menu Agenda**
   ```
   Menu > Agenda > Botão "Sincronizar Google" (canto superior direito)
   ```

3. **Opção 3: Perfil do Usuário**
   ```
   Clique no avatar > Configurações > Integrações
   ```

### **O Que Verificar:**

- [ ] Botão "Vincular Google Calendar" aparece?
- [ ] Ao clicar, abre popup de autorização do Google?
- [ ] Após autorizar, mostra "Vinculado com sucesso"?
- [ ] Eventos do Google aparecem na agenda como bloqueios?
- [ ] Cor dos bloqueios é diferente dos agendamentos normais?

---

## ⚠️ PROBLEMAS COMUNS E SOLUÇÕES

### **Problema 1: "Comissões não aparecem"**

**Possíveis Causas:**
1. Procedimentos não foram marcados como "COMPLETED"
2. `professional_id` está NULL
3. Filtro de data está incorreto

**Solução:**
```sql
-- Verificar status dos procedimentos
SELECT status, COUNT(*) 
FROM treatment_items 
WHERE professional_id = (SELECT id FROM users WHERE email = 'marcelovboass@gmail.com')
GROUP BY status;

-- Se necessário, marcar como COMPLETED
UPDATE treatment_items
SET status = 'COMPLETED',
    execution_date = CURRENT_DATE
WHERE professional_id = (SELECT id FROM users WHERE email = 'marcelovboass@gmail.com')
  AND status = 'NOT_STARTED';
```

### **Problema 2: "Valores estão errados"**

**Possíveis Causas:**
1. `total_value` está NULL ou 0
2. Percentual de comissão está incorreto
3. Cálculo está usando valor errado

**Solução:**
```sql
-- Verificar valores
SELECT 
    procedure_name,
    total_value,
    (total_value * 0.30) as comissao_calculada
FROM treatment_items
WHERE professional_id = (SELECT id FROM users WHERE email = 'marcelovboass@gmail.com')
  AND total_value > 0
ORDER BY execution_date DESC
LIMIT 10;
```

### **Problema 3: "Menu Configurações demora a carregar"**

**Possível Causa:**
Query de `user_permissions` sem índice

**Solução:**
```sql
-- Criar índice se não existir
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id 
ON user_permissions(user_id);

-- Verificar se índice existe
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'user_permissions';
```

---

## 📊 DASHBOARD DE VALIDAÇÃO

### **Métricas Esperadas:**

| Métrica | Valor Esperado | Como Validar |
|---------|----------------|--------------|
| **Total de Procedimentos** | > 0 | Query 1 |
| **Valor Total Bruto** | > R$ 0 | Query 3 |
| **Total Comissão (30%)** | = Bruto × 0.30 | Query 3 |
| **Total Clínica (70%)** | = Bruto × 0.70 | Query 3 |
| **Ledger Balance** | Correto | Query 2 |

---

## 🚀 PRÓXIMOS PASSOS APÓS VALIDAÇÃO

### **Se Tudo Estiver OK:**
1. ✅ Testar criação de novo procedimento
2. ✅ Verificar se comissão é calculada automaticamente
3. ✅ Testar Google Calendar
4. ✅ Validar prontuários imutáveis

### **Se Encontrar Problemas:**
1. ❌ Anotar qual funcionalidade
2. ❌ Tirar print do erro
3. ❌ Copiar mensagem do console (F12)
4. ❌ Me enviar para correção

---

## 🔐 VALIDAÇÃO DE SEGURANÇA

### **Teste de Permissões:**

1. **Como Admin/Master:**
   - ✅ Deve ver comissões de TODOS os profissionais
   - ✅ Deve poder editar valores
   - ✅ Deve poder aprovar pagamentos

2. **Como Profissional:**
   - ✅ Deve ver apenas SUAS comissões
   - ❌ NÃO deve ver de outros profissionais
   - ❌ NÃO deve poder editar valores

3. **Como Secretária:**
   - ⚠️ Pode ou não ver (depende da configuração)
   - ❌ NÃO deve poder editar valores
   - ❌ NÃO deve poder aprovar pagamentos

---

## 📝 CHECKLIST DE TESTE

- [ ] Acessei Financeiro/Relatórios
- [ ] Encontrei "Comissões por Profissional"
- [ ] Selecionei meu nome
- [ ] Procedimentos aparecem
- [ ] Valores estão corretos
- [ ] Comissão de 30% está calculada
- [ ] Total bate com esperado
- [ ] Ledger está atualizado
- [ ] Performance está boa (< 2s)
- [ ] Sem erros no console

---

## 🎯 RESULTADO ESPERADO

**Após validação completa:**
- ✅ Comissões calculando automaticamente
- ✅ Valores corretos (30% profissional, 70% clínica)
- ✅ Ledger atualizado em tempo real
- ✅ Relatórios carregando rápido
- ✅ Google Calendar pronto para vincular

---

**Dr. Marcelo, siga este guia e me avise:**
1. ✅ Se tudo funcionou perfeitamente
2. ⚠️ Se encontrou alguma inconsistência
3. ❌ Se deu algum erro

**Estou de prontidão para resolver qualquer problema!** 🥂🚀
