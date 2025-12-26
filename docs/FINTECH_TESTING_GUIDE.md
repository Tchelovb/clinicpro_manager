# 🧪 Guia de Teste End-to-End - Fintech Clinic Pro

## 📋 Pré-requisitos

Antes de começar os testes, certifique-se de que:

- [ ] Servidor de desenvolvimento está rodando (`npm run dev`)
- [ ] Supabase está configurado e conectado
- [ ] Migrations foram aplicadas:
  - `20241225_credit_profiles.sql`
  - `20241225_professional_ledger.sql`
  - Tabela `installments` existe
- [ ] Usuário de teste está logado

---

## 🎯 Teste 1: Fluxo Completo de Orçamento com Fintech

### **Objetivo:** Testar todo o fluxo desde a criação do orçamento até o CFO Dashboard

### **Passos:**

#### **1. Criar Paciente (se não existir)**
```
1. Ir para /patients
2. Clicar em "+ Novo Paciente"
3. Preencher:
   - Nome: João da Silva
   - CPF: 123.456.789-00
   - Telefone: (11) 98765-4321
   - Email: joao@email.com
4. Salvar
```

**✅ Resultado Esperado:** Paciente criado com sucesso

---

#### **2. Criar Orçamento com Análise de Crédito**
```
1. Ir para /patients/{id}
2. Clicar em "Novo Orçamento"
3. Adicionar procedimentos:
   - Implante: R$ 8.000
   - Coroa: R$ 2.000
   - Total: R$ 10.000
4. Clicar em "Analisar Crédito & Simular Pagamento"
```

**✅ Resultado Esperado:** Sheet abre pela direita

---

#### **3. Análise de Crédito (Módulo A)**
```
1. No Sheet, digitar CPF: 123.456.789-00
2. Clicar em "Analisar"
3. Aguardar resposta
```

**✅ Resultado Esperado:**
- Score exibido (ex: 700)
- Tier classificado (ex: B)
- Condições mostradas:
  - Máximo 12 parcelas
  - Entrada mínima 20%
  - Markup 20%

---

#### **4. Simulação de Pagamento (Módulo B)**
```
1. Clicar em "Próximo"
2. Ver duas opções:
   - Smart: R$ 10.000 (cartão/pix)
   - Crediário: R$ 12.000 (boleto, +20%)
3. Escolher "Crediário"
4. Configurar:
   - Entrada: R$ 2.400 (20%)
   - Parcelas: 12x de R$ 800
5. Clicar em "Próximo"
```

**✅ Resultado Esperado:**
- Cálculos corretos
- Aviso legal exibido
- Confirmação mostra resumo

---

#### **5. Confirmar e Criar Parcelas**
```
1. Revisar resumo
2. Clicar em "Confirmar"
3. Sheet fecha
4. Orçamento salvo com configuração
```

**✅ Resultado Esperado:**
- Orçamento criado: R$ 12.000
- 13 parcelas criadas:
  - 1 entrada: R$ 2.400
  - 12 parcelas: R$ 800 cada

---

#### **6. Verificar Contas a Receber (Módulo C)**
```
1. Ir para /receivables
2. Ver Kanban com 3 colunas
3. Verificar parcelas na coluna "A Vencer"
```

**✅ Resultado Esperado:**
- 13 cards na coluna "A Vencer"
- Card de estatísticas mostra:
  - A Receber: R$ 12.000
  - Vencidas: R$ 0
  - Recebido: R$ 0

---

#### **7. Marcar Parcela como Paga**
```
1. Clicar em um card de parcela
2. Sheet abre com detalhes
3. Clicar em "Marcar como Pago"
4. Confirmar
```

**✅ Resultado Esperado:**
- Parcela move para coluna "Pagas"
- Estatísticas atualizam:
  - A Receber: R$ 11.200
  - Recebido: R$ 800

---

#### **8. Verificar Comissão do Profissional (Módulo D)**
```
1. Ir para /professional-financial
2. Selecionar profissional (dentista)
3. Ver extrato
```

**✅ Resultado Esperado:**
- Crédito de R$ 240 (30% de R$ 800)
- Descrição: "Comissão sobre parcela paga"
- Saldo disponível: R$ 240

---

#### **9. Marcar Mais Parcelas como Pagas**
```
1. Voltar para /receivables
2. Marcar mais 3 parcelas como pagas
3. Total pago: R$ 3.200 (4 parcelas)
```

**✅ Resultado Esperado:**
- 4 parcelas na coluna "Pagas"
- Recebido: R$ 3.200
- Comissão acumulada: R$ 960

---

#### **10. Testar Trava de Laboratório (Módulo C)**
```
1. Ir para tratamento do paciente
2. Tentar enviar para laboratório
3. Custo estimado: R$ 2.000
4. Verificar status
```

**✅ Resultado Esperado:**
- ✅ **Liberado** (cliente pagou R$ 3.200 > R$ 2.000)
- Botão "Enviar para Laboratório" ativo
- Barra de progresso: 160%

---

#### **11. Ver CFO Dashboard (Módulo E)**
```
1. Ir para /cfo
2. Ver dashboard completo
```

**✅ Resultado Esperado:**

**Cards de Métricas:**
- Receita Líquida: R$ 3.008 (R$ 3.200 - 6% impostos)
- Lucro Líquido: ~R$ 1.500
- PDD: R$ 0 (nenhuma vencida)
- Health Score: > 80

**Tab DRE:**
```
Receita Bruta:        R$ 3.200
(-) Impostos (6%):    R$   192
= Receita Líquida:    R$ 3.008
(-) Custos Variáveis: R$   500
= Lucro Bruto:        R$ 2.508  (83%)
(-) Despesas Fixas:   R$ 1.000
= EBITDA:             R$ 1.508  (50%)
= Lucro Líquido:      R$ 1.508  (50%)
```

**Tab PDD:**
- Total a Receber (Vencido): R$ 0
- Provisão: R$ 0
- Taxa de Inadimplência: 0%

**Tab Fluxo de Caixa:**
- Gráfico mostrando entradas de R$ 3.200
- Saldo acumulado crescente

---

## 🧪 Teste 2: Cenário de Inadimplência

### **Objetivo:** Testar PDD e régua de cobrança

### **Passos:**

#### **1. Criar Parcelas Vencidas**
```
1. No banco de dados, atualizar due_date de 3 parcelas:
   - 1 parcela: vencida há 15 dias
   - 1 parcela: vencida há 45 dias
   - 1 parcela: vencida há 95 dias
```

**SQL:**
```sql
UPDATE installments 
SET due_date = CURRENT_DATE - INTERVAL '15 days'
WHERE id = '{id_parcela_1}';

UPDATE installments 
SET due_date = CURRENT_DATE - INTERVAL '45 days'
WHERE id = '{id_parcela_2}';

UPDATE installments 
SET due_date = CURRENT_DATE - INTERVAL '95 days'
WHERE id = '{id_parcela_3}';
```

---

#### **2. Verificar Kanban**
```
1. Ir para /receivables
2. Ver coluna "Vencidas"
```

**✅ Resultado Esperado:**
- 3 cards na coluna "Vencidas"
- Badges vermelhos mostrando dias de atraso
- Estatísticas:
  - Vencidas: R$ 2.400
  - Taxa de inadimplência visível

---

#### **3. Verificar PDD no CFO**
```
1. Ir para /cfo
2. Tab "PDD"
3. Ver gráfico de barras
```

**✅ Resultado Esperado:**

**Gráfico:**
```
0-30 dias:   R$   800 → Provisão R$    8 (1%)
31-60 dias:  R$   800 → Provisão R$   40 (5%)
61-90 dias:  R$     0 → Provisão R$    0 (0%)
90+ dias:    R$   800 → Provisão R$  600 (75%)
────────────────────────────────────────────
Total:       R$ 2.400 → Provisão R$  648 (27%)
```

**Alertas:**
- 🔴 **Crítico:** Taxa de inadimplência crítica (27% > 10%)

---

#### **4. Testar Régua de Cobrança**
```
1. Executar rotina diária (via console ou cron):
   receivablesService.runDailyCollectionRoutine(clinicId)
2. Ver logs no console
```

**✅ Resultado Esperado:**
```
[COLLECTION] Sending WARNING to (11) 98765-4321:
"Olá João da Silva, identificamos que sua parcela de R$ 800,00 venceu..."

[COLLECTION] Blocked scheduling for patient {id}
```

---

## 🧪 Teste 3: Saque do Profissional

### **Objetivo:** Testar sistema de saque

### **Passos:**

#### **1. Verificar Saldo**
```
1. Ir para /professional-financial
2. Ver saldo disponível: R$ 960
```

---

#### **2. Processar Saque**
```
1. Clicar em "Solicitar Saque"
2. Digitar valor: R$ 500
3. Confirmar
```

**✅ Resultado Esperado:**
- Débito de R$ 500 no extrato
- Categoria: WITHDRAWAL
- Saldo disponível: R$ 460

---

#### **3. Tentar Saque Maior que Saldo**
```
1. Tentar sacar R$ 1.000
2. Ver erro
```

**✅ Resultado Esperado:**
- Erro: "Saldo insuficiente"
- Saque bloqueado

---

## 📊 Checklist de Validação Final

### **Módulo A - Credit Engine**
- [ ] Análise de CPF funciona
- [ ] Tier é calculado corretamente
- [ ] Condições são aplicadas

### **Módulo B - Payment Simulator**
- [ ] Duas opções são exibidas
- [ ] Markup é calculado corretamente
- [ ] Cláusula legal aparece

### **Módulo C - Receivables**
- [ ] Kanban exibe parcelas corretamente
- [ ] Marcar como pago funciona
- [ ] Trava de lab funciona
- [ ] Estatísticas são precisas

### **Módulo D - Professional Ledger**
- [ ] Comissão é creditada ao pagar parcela
- [ ] Extrato mostra movimentações
- [ ] Saldo é calculado corretamente
- [ ] Saque funciona com validação

### **Módulo E - CFO Dashboard**
- [ ] DRE é calculado corretamente
- [ ] PDD mostra provisões
- [ ] Fluxo de caixa é projetado
- [ ] Health Score é calculado
- [ ] Alertas aparecem quando necessário

---

## 🐛 Problemas Comuns e Soluções

### **Erro: "Cannot find module"**
**Solução:** Verificar imports e paths

### **Erro: "Table does not exist"**
**Solução:** Rodar migrations do Supabase

### **Erro: "RLS policy violation"**
**Solução:** Verificar políticas RLS no Supabase

### **Comissão não é creditada**
**Solução:** Verificar integração entre receivablesService e professionalLedgerService

### **Gráficos não aparecem**
**Solução:** Instalar recharts: `npm install recharts`

---

## ✅ Resultado Esperado Final

Após todos os testes, o sistema deve:

1. ✅ Criar orçamentos com análise de crédito
2. ✅ Simular pagamentos com markup
3. ✅ Gerenciar parcelas no Kanban
4. ✅ Creditar comissões automaticamente
5. ✅ Bloquear lab até pagamento suficiente
6. ✅ Calcular PDD e DRE corretamente
7. ✅ Exibir health score e alertas

**Sistema Fintech 100% Funcional!** 🎉

---

## 📝 Relatório de Teste

Após completar os testes, preencha:

| Teste | Status | Observações |
|-------|--------|-------------|
| Fluxo Completo | ⬜ | |
| Inadimplência | ⬜ | |
| Saque Profissional | ⬜ | |
| DRE | ⬜ | |
| PDD | ⬜ | |
| Fluxo de Caixa | ⬜ | |

**Data do Teste:** ___/___/_____  
**Testado por:** _______________  
**Versão:** 1.0.0
