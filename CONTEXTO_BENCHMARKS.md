# 📂 CONTEXTO_BENCHMARKS.md

> **DOCUMENTO DE INTELIGÊNCIA ESTRATÉGICA - CLINIC PRO MANAGER (BOS)**  
> **Objetivo:** Fornecer à IA o contexto profundo sobre as referências de mercado (Benchmarks) que moldaram a arquitetura do sistema.  
> **Uso:** Este arquivo deve ser lido antes de iniciar qualquer implementação de código para garantir fidelidade à visão de negócio.

---

## 1. VISÃO MACRO: O CONCEITO "FRANKENSTEIN DE ELITE"

O **Clinic Pro Manager** (daqui em diante chamado de **BOS**) não foi inventado do zero. Ele é o resultado da fusão das melhores funcionalidades dos líderes de mercado globais e nacionais.
O objetivo não é copiar, mas **integrar** o "Best-in-Class" de cada categoria em um único sistema focado em **Clínicas High-Ticket**.

---

## 2. ANÁLISE PROFUNDA DOS SOFTWARES DE REFERÊNCIA

Abaixo, detalhamos cada software analisado, seu "Core", e exatamente o que foi extraído para o BOS.

### A. QIDENT (A Engenharia de Lucro)
* **O que é:** Software brasileiro focado em precificação científica.
* **O Problema que resolve:** Dentistas precificam com base no vizinho e têm "prejuízo invisível".
* **A Lógica Matemática:**
    * `(Custos Fixos + Prolabore) / Horas Produtivas = Custo do Minuto Clínico`.
    * `Preço Venda - (Impostos + Taxas + Material + (Tempo x Minuto)) = Lucro Real`.
* **IMPLEMENTAÇÃO NO BOS (Profit Engine):**
    * **Tabela:** `clinic_cost_structure` para armazenar a capacidade e custos.
    * **Feature:** O "Wizard de Custos" na Fase 2.
    * **Feature:** A "Barra de Lucratividade" na tela de orçamento. Se a margem for < 20%, o sistema bloqueia.

### B. KOMMO / AMOCRM (A Máquina de Vendas)
* **O que é:** CRM global baseado em mensageiros (WhatsApp/Insta).
* **O Problema que resolve:** CRMs tradicionais são focados em formulários. O paciente quer conversar.
* **A Filosofia:** "Se o cliente está no chat, o CRM é o chat."
* **IMPLEMENTAÇÃO NO BOS (Sales Machine):**
    * **UI/UX:** O "Lead Card" não é um formulário, é uma janela de chat centralizada.
    * **Feature:** Pipeline Visual (Kanban) onde a automação move os cards.
    * **Tabelas:** `leads`, `lead_interactions`, `sales_scripts`.

### C. HEON (O Marketing & Growth)
* **O que é:** Plataforma híbrida de gestão e marketplace de saúde/beleza.
* **O Problema que resolve:** A desconexão entre o Instagram do Doutor e a Agenda do sistema.
* **O Diferencial:** Gera um perfil público (`heon.com/dr-fulano`) para o paciente agendar sozinho.
* **IMPLEMENTAÇÃO NO BOS (Growth):**
    * **Tabela:** `clinic_landing_pages` (Slug, Bio, Foto, Cor).
    * **Feature:** Gerador de Landing Page automática ("Link na Bio") integrado à agenda do BOS.

### D. CONTROLE ODONTO & PRODENT (A Blindagem Operacional)
* **O que são:** Sistemas de gestão tradicionais (ERP), focados em controle rígido.
* **O Problema que resolvem:** Fraudes internas, duplicidade de cadastro e desvio de estoque.
* **Funcionalidades Chave:**
    * *Controle Odonto:* Impede cadastro duplicado (Smart Check-in).
    * *ProDent:* Controle de estoque via "Baixa de Kits" (Receitas).
* **IMPLEMENTAÇÃO NO BOS (Fortress):**
    * **Segurança:** Componente `SecurityPinModal` (inspirado em cofres bancários).
    * **Recepção:** Busca Obrigatória (Holofote) antes de liberar o botão "Novo Paciente".
    * **Estoque:** Tabelas `procedure_recipes` e `inventory_movements`.

### E. TOTVS & CONTA AZUL (O Rigor Financeiro)
* **O que são:** ERPs corporativos generalistas (não são de dentista).
* **O Problema que resolvem:** Amadorismo fiscal e financeiro.
* **Funcionalidades Chave:**
    * *TOTVS:* Compliance fiscal (NFS-e).
    * *Conta Azul:* Conciliação bancária via OFX.
* **IMPLEMENTAÇÃO NO BOS (Bank & Fiscal):**
    * **Automação:** Leitura de arquivos `.ofx` para "casar" (match) pagamentos com lançamentos do sistema.
    * **Tabelas:** `fiscal_invoices`, `bank_transactions`.

### F. EASYDENT (A Experiência Clínica - Legacy)
* **O que é:** Software americano antigo, mas muito robusto em Ortodontia.
* **A Lição:** Tratamentos complexos precisam de "Fases" (Phasing) e contratos recorrentes.
* **IMPLEMENTAÇÃO NO BOS (High-Ticket):**
    * **Feature:** Orçamentos em Cenários (Good/Better/Best).
    * **Ortho:** Gestão visual de alinhadores (`ortho_aligner_stock`) separada da agenda clínica.

---

## 3. SÍNTESE ARQUITETURAL (COMO TUDO SE CONECTA)

O **BOS** utiliza estas inspirações para criar um fluxo único:

1.  **Entrada (Kommo/Heon):** O Lead entra pelo Link na Bio → Cai no Kanban → Robô qualifica.
2.  **Recepção (Controle Odonto):** Paciente chega → Smart Check-in evita duplicidade.
3.  **Venda (EasyDent/QiDent):** Orçamento criado com cálculo de Lucro Real (Profit Engine). Se margem baixa → Bloqueia.
4.  **Execução (ProDent):** Procedimento realizado → Baixa estoque (Kit) automaticamente.
5.  **Financeiro (Conta Azul/TOTVS):** Pagamento via Pix → Conciliação OFX → Emissão NFS-e.
6.  **Retenção (Active Intelligence):** Sentinelas monitoram se o paciente sumiu (S6) ou se o boleto venceu (S2).

---

## 4. DIRETRIZES PARA A IA DE DESENVOLVIMENTO

Ao escrever código para o BOS, considere:

1.  **Prioridade de Dados:** O Schema SQL fornecido já contempla todas essas influências. **Não remova campos** como `estimated_lab_cost` ou `transaction_pin_hash`, pois eles são vitais para as lógicas descritas acima.
2.  **Lógica de Negócio:**
    * Nunca permita cadastrar um procedimento sem definir se a comissão é `%` ou `Fixo` (Influência High-Ticket).
    * Nunca permita estornar dinheiro sem validar o Hash do PIN (Influência ProDent).
3.  **Interface (Frontend):**
    * Telas de Vendas devem parecer Chats (Influência Kommo).
    * Telas de Orçamento devem parecer Dashboards Financeiros (Influência QiDent).

---

## 5. MAPA DE FUNCIONALIDADES POR BENCHMARK

### Matriz de Influências

| Funcionalidade BOS | Inspiração Principal | Tabelas Relacionadas | Status |
|-------------------|---------------------|---------------------|--------|
| **Profit Engine** | QiDent | `clinic_cost_structure`, `procedure_costs` | ✅ Implementado |
| **Pipeline Kanban** | Kommo/AmoCRM | `leads`, `lead_interactions`, `custom_lead_status` | ✅ Implementado |
| **Landing Pages** | Heon | `clinic_landing_pages` | ✅ Implementado |
| **Smart Check-in** | Controle Odonto | `patients` (busca inteligente) | ✅ Implementado |
| **Receitas de Estoque** | ProDent | `procedure_recipes`, `procedure_recipe_items` | ✅ Implementado |
| **Conciliação Bancária** | Conta Azul | `bank_accounts`, `bank_transactions` | ✅ Implementado |
| **NFS-e Automática** | TOTVS | `fiscal_invoices` | 🟡 Estrutura pronta |
| **Orçamentos em Cenários** | EasyDent | `budgets` (option_group_id) | ✅ Implementado |
| **Gestão de Alinhadores** | EasyDent | `ortho_aligner_stock`, `ortho_treatment_plans` | ✅ Implementado |
| **PIN de Segurança** | ProDent | `users` (transaction_pin_hash) | ✅ Implementado |

---

## 6. FILOSOFIA DE DESIGN: "BEST-IN-CLASS INTEGRATION"

### Princípios Fundamentais

1. **Não Reinventar a Roda**
   - Se QiDent já resolveu precificação, usamos a mesma lógica matemática
   - Se Kommo já provou que CRM é chat, seguimos o mesmo padrão

2. **Integração Profunda, Não Superficial**
   - Não é "copiar a tela", é "copiar a lógica de negócio"
   - Exemplo: Não copiamos o design do Heon, mas sim a estratégia de "Link na Bio"

3. **Adaptação ao Contexto High-Ticket**
   - Todos os benchmarks foram adaptados para clínicas de alto valor
   - Exemplo: Pipeline do Kommo foi adaptado para incluir "Tier DIAMOND" (>R$ 10k)

4. **Zero Compromisso com Mediocridade**
   - Se um benchmark tem uma feature "meia-boca", não implementamos
   - Exemplo: EasyDent tem interface antiga, mas a lógica de fases é excelente

---

## 7. CASOS DE USO PRÁTICOS

### Caso 1: Criação de Orçamento (Influência QiDent + EasyDent)

**Fluxo:**
1. CRC cria orçamento para Cervicoplastia (R$ 25.000)
2. Sistema calcula automaticamente:
   - Custo do minuto clínico: R$ 5,00
   - Tempo estimado: 180 min = R$ 900
   - Material + Lab: R$ 3.000
   - Impostos (6%): R$ 1.500
   - **Margem Real:** R$ 19.600 (78%) ✅
3. Sistema permite aprovar (margem > 20%)
4. CRC ganha +500 XP (Tier DIAMOND)

**Código Relacionado:**
- `services/financialCalculator.ts`
- `sql/gamification_triggers_v18.8.sql`

### Caso 2: Lead entra pelo Instagram (Influência Heon + Kommo)

**Fluxo:**
1. Paciente clica no "Link na Bio" do Instagram
2. Cai na Landing Page (`/landing/dr-marcelo`)
3. Preenche formulário rápido (Nome, WhatsApp, Interesse)
4. Lead criado automaticamente no Kanban (Status: NEW)
5. Sentinela S2 detecta: "Lead sem contato há 12h"
6. CRC recebe alerta e inicia conversa via WhatsApp

**Código Relacionado:**
- `pages/landing/[slug].tsx`
- `sql/native_insights_engine.sql` (Sentinela S2)

### Caso 3: Controle de Estoque (Influência ProDent)

**Fluxo:**
1. Profissional executa procedimento "Preenchimento Labial"
2. Sistema busca receita padrão (`procedure_recipes`)
3. Baixa automaticamente:
   - 2ml de Ácido Hialurônico
   - 1 Agulha 27G
   - 1 Seringa 3ml
4. Atualiza `inventory_movements`
5. Se estoque < mínimo → Alerta de reposição

**Código Relacionado:**
- `hooks/useInventory.ts`
- `services/procedureService.ts`

---

## 8. ANTI-PADRÕES (O QUE NÃO FAZER)

### ❌ Não Copiar Limitações dos Benchmarks

1. **QiDent:** Não tem integração com agenda → BOS integra tudo
2. **Kommo:** Não tem controle financeiro → BOS tem Fort Knox
3. **Heon:** Não tem gamificação → BOS tem sistema de XP/Níveis
4. **ProDent:** Interface ultrapassada → BOS usa design moderno
5. **TOTVS:** Complexidade excessiva → BOS simplifica para clínicas

### ✅ Fazer: Pegar o Melhor de Cada Um

- **Matemática do QiDent** + **UX do Kommo** + **Growth do Heon** + **Segurança do ProDent** + **Compliance do TOTVS**

---

## 9. ROADMAP DE EVOLUÇÃO DOS BENCHMARKS

### Q1 2026: Aprimoramentos Inspirados

1. **QiDent 2.0:** Simulador de Cenários Financeiros
   - "E se eu aumentar 10% nos preços?"
   - "E se eu contratar mais um dentista?"

2. **Kommo 2.0:** Automação de Vendas com IA
   - ChatBOS responde leads automaticamente
   - Qualificação automática (BANT)

3. **Heon 2.0:** Marketplace Interno
   - Pacientes podem comprar produtos (clareadores, escovas)
   - Integração com e-commerce

### Q2 2026: Funcionalidades Inéditas

1. **Além dos Benchmarks:** Previsão de Churn com IA
   - Nenhum benchmark atual faz isso
   - BOS será pioneiro

2. **Além dos Benchmarks:** Otimização de Agenda com IA
   - Sugestão automática de horários
   - Balanceamento de carga entre profissionais

---

## 10. CONCLUSÃO: O DNA DO BOS

O **BOS** não é um clone de nenhum software. Ele é uma **síntese evolutiva** que pega:

- A **precisão matemática** do QiDent
- A **agilidade comercial** do Kommo
- A **estratégia de crescimento** do Heon
- A **blindagem operacional** do ProDent/Controle Odonto
- O **rigor fiscal** do TOTVS/Conta Azul
- A **experiência clínica** do EasyDent

E adiciona camadas únicas:

- **Gamificação** (nenhum benchmark tem)
- **Inteligência Nativa** (motor SQL, zero custo de API)
- **Foco High-Ticket** (nenhum é especializado nisso)

---

**Versão do Documento:** 1.0  
**Última Atualização:** 23/12/2025  
**Responsável:** Dr. Marcelo Vilas Bôas  
**Uso:** Leitura obrigatória antes de qualquer desenvolvimento
