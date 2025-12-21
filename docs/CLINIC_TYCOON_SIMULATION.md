# 🌍 MULTI-TENANT TYCOON - 3 CLÍNICAS, 3 DESAFIOS

**Versão:** BOS 19.6  
**Data:** 20/12/2025  
**Status:** ✅ PRONTO PARA JOGAR

---

## 🎯 VISÃO GERAL

O **Multi-Tenant Tycoon** eleva o conceito de simulador para um **multiverso de cenários**. Usando a arquitetura multi-tenant do ClinicPro, você pode treinar 3 tipos diferentes de gestão:

### **3 Clínicas = 3 Níveis do Jogo**

1. **🏥 Clínica A - MATRIZ** (🔥 DIFÍCIL): Crise Financeira
2. **🏥 Clínica B - PRIME** (⚖️ MÉDIA): Recorrência/LTV
3. **🏥 Clínica C - START** (🛡️ TÁTICA): Startup

### Conceito
Cada clínica é um "mundo" isolado com desafios únicos. Você pode trocar entre elas usando o seletor de clínicas no header e enfrentar problemas completamente diferentes.

---

## 📊 CENÁRIO DA SIMULAÇÃO

### **Situação Inicial: CRISE**

**Financeiro:**
- 💰 Caixa: R$ 4.500 (BAIXO)
- 💸 Contas a pagar (5 dias): R$ 18.000
- 📊 Déficit: R$ 13.500

**Objetivo:**
Gerar R$ 13.500+ em vendas nos próximos 5 dias para não quebrar.

---

### **Recursos Disponíveis**

**Equipe (5 membros):**
- **Dr. House** (PROFESSIONAL): Especialista em Implantes, ticket alto
- **Dra. Novata** (PROFESSIONAL): Clínica Geral/HOF, boa técnica
- **Dr. Apressado** (PROFESSIONAL): Ortodontista, volume alto
- **Ana Hunter** (CRC): Vendedora agressiva, foca em cirurgia
- **Julia Organizada** (RECEPTIONIST): Organizada, mas deixa buracos

**Oportunidades no Radar:**
- 💎 **5 Diamantes**: R$ 22.000 cada (R$ 110k total)
- 🥇 **15 Ouros**: R$ 5.000 cada (R$ 75k total)
- 🥈 **50 Pratas**: R$ 1.500 média (R$ 75k total)

**Potencial Total:** R$ 260.000

---

## 🚀 COMO EXECUTAR

### **1. Preparação**

Certifique-se de que o ambiente está configurado:
```bash
# Verificar se Supabase está conectado
npm run dev
```

### **2. Executar o Script**

```bash
# Navegar para a pasta do projeto
cd c:\Users\marce\OneDrive\Documentos\ClinicPro

# Executar o seed
npx ts-node scripts/seed_simulation_chaos.ts
```

### **3. Aguardar Conclusão**

O script vai:
1. Criar clínica "Instituto Vilas - Simulação Tycoon"
2. Criar 5 procedimentos inteligentes
3. Criar 5 membros da equipe
4. Injetar R$ 18k em dívidas
5. Criar 70 pacientes com oportunidades

**Tempo estimado:** 30-60 segundos

---

## 🎮 COMO JOGAR

### **Fase 1: Diagnóstico (5 minutos)**

1. **Login como ADMIN**
   - Email: (usar seu admin existente)

2. **Acessar War Room**
   - Rota: `/dashboard/war-room`
   - Verificar: Gráfico deve estar VERMELHO
   - Contas a pagar: R$ 18.000

3. **Acessar Radar de Oportunidades**
   - Rota: `/dashboard/opportunity-radar`
   - Verificar: 70+ oportunidades listadas
   - Filtrar por 💎 Diamante (5 cards azuis)

---

### **Fase 2: Estratégia (10 minutos)**

**Análise:**
- Você precisa de R$ 13.500
- Cada Diamante vale R$ 22.000
- **Solução:** Converter 1 Diamante = Problema resolvido

**Plano de Ação:**
1. Focar nos 5 Diamantes (maior valor, menor esforço)
2. Se não converter, partir para Ouros (15 leads)
3. Pratas são backup (recorrência)

---

### **Fase 3: Execução (Tempo Real)**

**Como CRC (Ana Hunter):**

1. **Abrir Radar de Oportunidades**
2. **Filtrar por Diamante**
3. **Ver card:**
   ```
   Maria Diamante Silva
   R$ 22.000 - Cervicoplastia Premium
   3 dias esperando
   Score: 106
   ```

4. **Clicar em "WhatsApp"**
5. **Script pré-preenchido abre:**
   ```
   Olá Maria! 😊
   
   Dr. Marcelo solicitou que eu revisasse sua proposta de 
   Cervicoplastia Premium para garantirmos sua vaga na 
   agenda dele.
   
   Seu orçamento de R$ 22.000,00 está reservado, mas 
   precisamos confirmar os próximos passos.
   
   Podemos conversar agora sobre as condições especiais 
   de pagamento? 💎
   ```

6. **Enviar mensagem**
7. **Simular resposta positiva**
8. **Aprovar orçamento no sistema**

---

### **Fase 4: Resultado**

**Se converter 1 Diamante:**
- ✅ Entrada: R$ 22.000
- ✅ Pagar dívidas: R$ 18.000
- ✅ Sobra: R$ 4.000
- ✅ **VITÓRIA!** Clínica salva

**Se não converter:**
- ❌ Sexta-feira chega
- ❌ Contas vencem
- ❌ Fornecedores cortam crédito
- ❌ **GAME OVER**

---

## 📈 MÉTRICAS DE SUCESSO

### **Nível 1: Sobrevivência**
- ✅ Pagar todas as contas
- ✅ Manter caixa positivo
- ✅ Não perder fornecedores

### **Nível 2: Crescimento**
- ✅ Converter 3+ Diamantes
- ✅ Converter 10+ Ouros
- ✅ Ativar 20+ Pratas
- ✅ Faturar R$ 50k+ no mês

### **Nível 3: Excelência**
- ✅ Converter TODOS os Diamantes (R$ 110k)
- ✅ Taxa de conversão > 80%
- ✅ Caixa > R$ 50k
- ✅ Zero inadimplência

---

## 🎓 LIÇÕES APRENDIDAS

### **O que você vai treinar:**

1. **Priorização sob Pressão**
   - Focar em high-tickets quando caixa está baixo
   - Não se distrair com pequenas vendas

2. **Uso de Ferramentas**
   - Radar de Oportunidades (filtros, scores)
   - Scripts de WhatsApp (conversão rápida)
   - War Room (visão financeira)

3. **Gestão de Equipe**
   - Delegar para CRC
   - Monitorar performance
   - Ajustar estratégia

4. **Tomada de Decisão**
   - Análise rápida de dados
   - Ação imediata
   - Medição de resultados

---

## 🔄 RESETAR SIMULAÇÃO

Para jogar novamente:

```bash
# Deletar clínica de simulação
# (via Supabase Dashboard ou SQL)
DELETE FROM clinics WHERE name = 'Instituto Vilas - Simulação Tycoon';

# Executar seed novamente
npx ts-node scripts/seed_simulation_chaos.ts
```

---

## 🚀 PRÓXIMAS FASES (ROADMAP)

### **Fase 2: A Máquina de Padrões**
**Desbloqueio:** Após 3 meses consecutivos batendo R$ 50k

**Desafio:**
- Criar POPs (Procedimentos Operacionais Padrão)
- Treinar IA para responder pela equipe
- Sair de férias sem queda de faturamento

### **Fase 3: A Expansão**
**Desbloqueio:** Após Fase 2 completa

**Desafio:**
- Abrir Unidade 2
- Fluxo de caixa compartilhado
- Manter cultura e performance
- Fazer Unidade 2 = Unidade 1

---

## 🎉 CONCLUSÃO

O **Clinic Tycoon** é mais que um teste. É um **simulador de voo para CEOs**.

### **Benefícios:**
- ✅ Treinar sem risco financeiro
- ✅ Testar estratégias
- ✅ Aprender ferramentas
- ✅ Preparar franqueados

### **Resultado:**
Quando a crise REAL chegar, você já terá vivido isso 10 vezes no simulador.

---

**Status:** ✅ **PRONTO PARA JOGAR**  
**Dificuldade:** 🔥🔥🔥 DIFÍCIL  
**Tempo:** 30-60 minutos  
**Recompensa:** Habilidades de CEO

**Boa sorte, Doutor! O jogo começa AGORA.** 🎮🚀

---

## 📋 TROUBLESHOOTING

### Erro: "Cannot find module 'ts-node'"
```bash
npm install -g ts-node
```

### Erro: "Supabase connection failed"
Verificar `.env`:
```
VITE_SUPABASE_URL=sua_url
VITE_SUPABASE_ANON_KEY=sua_key
```

### Erro: "Table does not exist"
Executar migrations primeiro:
```bash
# Verificar se todas as tabelas existem
```

### Script não cria dados
Verificar logs no console. Pode ser:
- Permissões RLS
- Foreign keys inválidas
- Clinic_id não encontrado
