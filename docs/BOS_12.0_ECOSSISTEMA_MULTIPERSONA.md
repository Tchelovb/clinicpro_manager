# 🎭 ECOSSISTEMA MULTIPERSONA BOS 12.0

**Versão:** BOS 12.0  
**Data:** 20/12/2025  
**Objetivo:** Transformar o ClinicPro em um RPG Corporativo com gamificação personalizada por função

---

## 📋 ÍNDICE

1. [Visão Estratégica](#1-visão-estratégica)
2. [Definição de Personas](#2-definição-de-personas)
3. [Sistema de Missões](#3-sistema-de-missões)
4. [Tabela de Recompensas](#4-tabela-de-recompensas)
5. [Intelligence Gateway Dinâmico](#5-intelligence-gateway-dinâmico)
6. [ChatBOS Personalizado](#6-chatbos-personalizado)
7. [Implementação Técnica](#7-implementação-técnica)

---

## 1. VISÃO ESTRATÉGICA

### Transformação de Paradigma

**ANTES (Sistema Único):**
```
Dr. Marcelo → Sistema → Dados Genéricos → Equipe
```

**DEPOIS (Ecossistema Multipersona):**
```
Dr. Marcelo → Visão Estratégica (EBITDA, ROI, 50K)
    ↓
Secretária → Visão Operacional (Agenda, Leads)
    ↓
CRC → Visão Comercial (Pipeline, Conversão)
    ↓
Dentista → Visão Clínica (Produção, Qualidade)
```

### Benefícios

1. **Para o Dr. Marcelo:**
   - Deixa de ser "cobrador de tarefas"
   - Vira "Comandante da Frota"
   - Foco 100% em estratégia e alta performance

2. **Para a Equipe:**
   - Cada um tem sua jornada própria
   - Gamificação personalizada
   - Recompensas tangíveis

3. **Para o Instituto:**
   - Cultura de alta performance
   - Auto-gestão da equipe
   - Crescimento exponencial

---

## 2. DEFINIÇÃO DE PERSONAS

### 2.1 ADMIN (Dr. Marcelo - O Sócio Estrategista)

**Identidade:**
- **Título:** Diretor Exponencial
- **Foco:** Lucro Líquido, EBITDA, ROI, Milestone de 50K
- **Visão:** Macro - Saúde global do negócio

**Métricas Principais:**
```javascript
{
  "faturamento_mensal": "R$ 50.000",
  "margem_liquida": "40%",
  "roi_marketing": "250%",
  "ticket_medio": "R$ 15.000",
  "procedimentos_high_ticket": 8
}
```

**Fontes de XP:**
| Ação | XP | Multiplicador |
|------|-----|---------------|
| Orçamento High-Ticket aprovado (> R$ 20k) | 1.000 | × 2.0 |
| Milestone de 50K batido | 5.000 | × 1.0 |
| Margem > 45% no mês | 2.000 | × 1.0 |
| ROI > 300% | 1.500 | × 1.0 |

**Intelligence Gateway:**
- **Card 1:** ClinicHealth Global (5 Pilares)
- **Card 2:** Oportunidades High-Ticket
- **Card 3:** Evolução Executiva (Nível 1-4)

---

### 2.2 SECRETARY (A Sentinela da Agenda)

**Identidade:**
- **Título:** Mestre de Fluxo
- **Foco:** Densidade de Agenda, Velocidade de Resposta
- **Visão:** Operacional - Eficiência diária

**Métricas Principais:**
```javascript
{
  "taxa_ocupacao_agenda": "85%",
  "lead_response_time": "3 min",
  "taxa_confirmacao": "95%",
  "no_show_rate": "5%",
  "leads_respondidos_dia": 15
}
```

**Fontes de XP:**
| Ação | XP | Condição |
|------|-----|----------|
| Responder lead em < 5 min | 50 | Por lead |
| Taxa de ocupação > 90% | 500 | Diária |
| Zero no-shows no dia | 300 | Diária |
| 100% da agenda confirmada | 400 | Diária |
| Streak de 7 dias perfeitos | 1.000 | Semanal |

**Intelligence Gateway:**
- **Card 1:** Saúde da Agenda (Ocupação, Confirmações)
- **Card 2:** Missões de Resgate (Leads sem resposta)
- **Card 3:** Evolução Operacional (Nível 1-5)

**Níveis de Progressão:**
1. **Nível 1:** Aprendiz de Fluxo (0 - 2.000 XP)
2. **Nível 2:** Organizadora Eficiente (2.000 - 5.000 XP)
3. **Nível 3:** Sentinela da Agenda (5.000 - 10.000 XP)
4. **Nível 4:** Mestre de Operações (10.000 - 20.000 XP)
5. **Nível 5:** Guardiã do Tempo (20.000+ XP)

---

### 2.3 CRC / VENDEDOR (O Fechador de Elite)

**Identidade:**
- **Título:** Arquiteto de Conversão
- **Foco:** Pipeline, Conversão, Upsell
- **Visão:** Comercial - Receita gerada

**Métricas Principais:**
```javascript
{
  "taxa_conversao": "35%",
  "pipeline_value": "R$ 150.000",
  "orcamentos_aprovados_mes": 12,
  "ticket_medio_vendido": "R$ 18.000",
  "upsells_realizados": 5
}
```

**Fontes de XP:**
| Ação | XP | Multiplicador |
|------|-----|---------------|
| Cada R$ 1.000 convertido | 100 | × 1.0 |
| Orçamento High-Ticket aprovado | 500 | × 1.5 |
| Reativar orçamento > 30 dias | 800 | × 1.0 |
| Upsell HOF → Cirurgia | 1.200 | × 1.0 |
| Conversão > 40% no mês | 2.000 | × 1.0 |

**Intelligence Gateway:**
- **Card 1:** Saúde do Funil (Pipeline, Conversão)
- **Card 2:** Oportunidades de Upsell
- **Card 3:** Evolução Comercial (Nível 1-5)

**Níveis de Progressão:**
1. **Nível 1:** Consultor Iniciante (0 - 3.000 XP)
2. **Nível 2:** Vendedor Competente (3.000 - 8.000 XP)
3. **Nível 3:** Fechador de Elite (8.000 - 15.000 XP)
4. **Nível 4:** Mestre do Upsell (15.000 - 25.000 XP)
5. **Nível 5:** Arquiteto de Conversão (25.000+ XP)

---

### 2.4 DENTIST (O Diretor Clínico)

**Identidade:**
- **Título:** Guardião da Excelência
- **Foco:** Produção, Qualidade, Satisfação
- **Visão:** Clínica - Resultados técnicos

**Métricas Principais:**
```javascript
{
  "producao_mensal": "R$ 80.000",
  "tratamentos_concluidos": 25,
  "nps_score": 95,
  "pos_ops_realizados": "100%",
  "prontuarios_completos": "100%"
}
```

**Fontes de XP:**
| Ação | XP | Condição |
|------|-----|----------|
| Tratamento concluído no prazo | 200 | Por tratamento |
| Avaliação 5 estrelas | 150 | Por avaliação |
| 100% prontuários preenchidos | 500 | Semanal |
| 100% pós-ops realizados | 400 | Semanal |
| NPS > 90 no mês | 1.500 | Mensal |

**Intelligence Gateway:**
- **Card 1:** Saúde Clínica (Produção, NPS)
- **Card 2:** Pós-Operatórios Pendentes
- **Card 3:** Evolução Técnica (Nível 1-5)

**Níveis de Progressão:**
1. **Nível 1:** Profissional Competente (0 - 2.500 XP)
2. **Nível 2:** Especialista Reconhecido (2.500 - 6.000 XP)
3. **Nível 3:** Mestre Clínico (6.000 - 12.000 XP)
4. **Nível 4:** Diretor de Excelência (12.000 - 20.000 XP)
5. **Nível 5:** Guardião da Qualidade (20.000+ XP)

---

## 3. SISTEMA DE MISSÕES

### 3.1 Tabela de Missões Semanais

| Função | Missão | KPI | XP | Frequência |
|--------|--------|-----|-----|------------|
| **ADMIN** | Visão de Águia High-Ticket | Aprovar 2 orçamentos de Reabilitação | 2.500 | Semanal |
| **ADMIN** | Milestone Conquistado | Bater R$ 50k no mês | 5.000 | Mensal |
| **SECRETARY** | Sentinela da Velocidade | 100% leads < 5 min | 1.000 | Semanal |
| **SECRETARY** | Agenda de Ferro | Taxa confirmação > 95% | 1.500 | Semanal |
| **SECRETARY** | Zero Faltas | 0% no-show na semana | 800 | Semanal |
| **CRC** | Resgate de Ouro | R$ 15k em orçamentos > 30 dias | 2.000 | Semanal |
| **CRC** | Mestre do Upsell | 3 conversões HOF → Cirurgia | 1.800 | Semanal |
| **CRC** | Pipeline de Elite | Pipeline > R$ 100k | 1.200 | Semanal |
| **DENTIST** | Excelência Clínica | 5 tratamentos concluídos | 1.200 | Semanal |
| **DENTIST** | Guardião do Pós-Op | 100% pós-ops realizados | 1.000 | Semanal |
| **DENTIST** | Prontuário Perfeito | 100% prontuários completos | 800 | Semanal |

### 3.2 Lógica de Distribuição Automática

```sql
-- Missões são criadas automaticamente toda segunda-feira às 6h
CREATE OR REPLACE FUNCTION distribute_weekly_missions()
RETURNS void AS $$
DECLARE
  v_user RECORD;
BEGIN
  FOR v_user IN 
    SELECT id, role, clinic_id FROM users WHERE active = true
  LOOP
    -- Criar missões baseadas no role
    IF v_user.role = 'ADMIN' THEN
      INSERT INTO tactical_operations (
        clinic_id, assigned_to, type, title, description,
        xp_reward, priority, deadline, metadata
      ) VALUES (
        v_user.clinic_id, v_user.id, 'milestone_conquest',
        '🎯 Visão de Águia High-Ticket',
        'Aprovar 2 orçamentos de Reabilitação (Lentes/Implantes/Cirurgia)',
        2500, 'high', NOW() + INTERVAL '7 days',
        jsonb_build_object('mission_type', 'weekly', 'role', 'admin')
      );
    ELSIF v_user.role = 'RECEPTIONIST' THEN
      INSERT INTO tactical_operations (
        clinic_id, assigned_to, type, title, description,
        xp_reward, priority, deadline, metadata
      ) VALUES (
        v_user.clinic_id, v_user.id, 'rescue_roi',
        '⚡ Sentinela da Velocidade',
        'Responder 100% dos novos leads em menos de 5 minutos',
        1000, 'high', NOW() + INTERVAL '7 days',
        jsonb_build_object('mission_type', 'weekly', 'role', 'secretary')
      );
    -- ... outras roles
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

---

## 4. TABELA DE RECOMPENSAS

### 4.1 Sistema de Conversão XP → Prêmios

| Nível | XP Necessário | Recompensa | Tipo |
|-------|---------------|------------|------|
| **Bronze** | 5.000 XP | Voucher café/lanche | Individual |
| **Bronze** | 5.000 XP | Saída 1h mais cedo (sexta) | Individual |
| **Prata** | 15.000 XP | Almoço de equipe | Coletivo |
| **Prata** | 15.000 XP | Reconhecimento público | Individual |
| **Ouro** | 25.000 XP | Bônus R$ 200-500 | Individual |
| **Ouro** | 25.000 XP | Day-off remunerado | Individual |
| **Lendário** | 50.000 XP | Jantar de gala | Coletivo |
| **Lendário** | 50.000 XP | Viagem de incentivo | Coletivo |

### 4.2 Estrutura SQL de Recompensas

```sql
CREATE TABLE reward_catalog (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id uuid REFERENCES clinics(id),
  
  -- Identificação
  title text NOT NULL,
  description text,
  category text CHECK (category IN ('bronze', 'silver', 'gold', 'legendary')),
  
  -- Custo e Restrições
  xp_cost integer NOT NULL,
  role_restriction text[], -- NULL = todos podem resgatar
  stock_limit integer, -- NULL = ilimitado
  stock_available integer,
  
  -- Tipo de Recompensa
  reward_type text CHECK (reward_type IN (
    'voucher', 'time_off', 'bonus', 'recognition', 
    'team_event', 'experience'
  )),
  
  -- Valor Monetário (para controle financeiro)
  monetary_value numeric DEFAULT 0,
  
  -- Status
  is_active boolean DEFAULT true,
  requires_admin_approval boolean DEFAULT true,
  
  -- Timestamps
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE reward_redemptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id uuid REFERENCES clinics(id),
  user_id uuid REFERENCES users(id),
  reward_id uuid REFERENCES reward_catalog(id),
  
  -- Controle
  xp_spent integer NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'delivered', 'cancelled'
  )),
  
  -- Aprovação
  approved_by uuid REFERENCES users(id),
  approved_at timestamp,
  
  -- Entrega
  delivered_at timestamp,
  notes text,
  
  -- Timestamps
  created_at timestamp DEFAULT now()
);
```

### 4.3 Lógica de Resgate

```sql
CREATE OR REPLACE FUNCTION redeem_reward(
  p_user_id UUID,
  p_reward_id UUID
) RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  redemption_id UUID
) AS $$
DECLARE
  v_user_xp INTEGER;
  v_reward RECORD;
  v_redemption_id UUID;
BEGIN
  -- Buscar XP disponível do usuário
  SELECT total_xp INTO v_user_xp
  FROM user_progression
  WHERE user_id = p_user_id;
  
  -- Buscar recompensa
  SELECT * INTO v_reward
  FROM reward_catalog
  WHERE id = p_reward_id AND is_active = true;
  
  -- Validações
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Recompensa não encontrada ou inativa', NULL::UUID;
    RETURN;
  END IF;
  
  IF v_user_xp < v_reward.xp_cost THEN
    RETURN QUERY SELECT false, 
      format('XP insuficiente. Você tem %s XP, precisa de %s XP', v_user_xp, v_reward.xp_cost),
      NULL::UUID;
    RETURN;
  END IF;
  
  IF v_reward.stock_available IS NOT NULL AND v_reward.stock_available <= 0 THEN
    RETURN QUERY SELECT false, 'Recompensa esgotada', NULL::UUID;
    RETURN;
  END IF;
  
  -- Criar resgate
  INSERT INTO reward_redemptions (
    clinic_id, user_id, reward_id, xp_spent, status
  ) VALUES (
    (SELECT clinic_id FROM users WHERE id = p_user_id),
    p_user_id, p_reward_id, v_reward.xp_cost,
    CASE WHEN v_reward.requires_admin_approval THEN 'pending' ELSE 'approved' END
  ) RETURNING id INTO v_redemption_id;
  
  -- Deduzir XP (mas não afeta o nível - nível é baseado em XP histórico)
  UPDATE user_progression
  SET 
    total_xp = total_xp - v_reward.xp_cost,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Atualizar estoque
  IF v_reward.stock_available IS NOT NULL THEN
    UPDATE reward_catalog
    SET stock_available = stock_available - 1
    WHERE id = p_reward_id;
  END IF;
  
  RETURN QUERY SELECT true, 'Resgate realizado com sucesso!', v_redemption_id;
END;
$$ LANGUAGE plpgsql;
```

---

## 5. INTELLIGENCE GATEWAY DINÂMICO

### 5.1 Lógica de Renderização por Role

```typescript
// IntelligenceGateway.tsx
const getGatewayConfig = (role: UserRole): GatewayConfig => {
  switch (role) {
    case 'ADMIN':
      return {
        card1: {
          title: 'ClinicHealth Global',
          subtitle: 'Saúde Macro do Negócio',
          metrics: ['ivc', 'faturamento', 'margem', 'roi'],
          gradient: 'from-blue-600 to-cyan-600'
        },
        card2: {
          title: 'Oportunidades High-Ticket',
          subtitle: 'Pipeline Premium',
          metrics: ['orcamentos_high_ticket', 'conversao_cirurgias', 'upsells'],
          gradient: 'from-red-600 to-orange-600'
        },
        card3: {
          title: 'Evolução Executiva',
          subtitle: 'Diretor Exponencial',
          metrics: ['nivel', 'xp', 'milestone_50k'],
          gradient: 'from-purple-600 to-indigo-600'
        }
      };
      
    case 'RECEPTIONIST':
      return {
        card1: {
          title: 'Saúde da Agenda',
          subtitle: 'Eficiência Operacional',
          metrics: ['taxa_ocupacao', 'confirmacoes', 'no_shows'],
          gradient: 'from-green-600 to-emerald-600'
        },
        card2: {
          title: 'Missões de Resgate',
          subtitle: 'Leads Sem Resposta',
          metrics: ['leads_pendentes', 'response_time', 'conversao_agenda'],
          gradient: 'from-yellow-600 to-amber-600'
        },
        card3: {
          title: 'Evolução Operacional',
          subtitle: 'Sentinela da Agenda',
          metrics: ['nivel', 'xp', 'streak'],
          gradient: 'from-pink-600 to-rose-600'
        }
      };
      
    // ... outras roles
  }
};
```

### 5.2 Filtro de Operações Táticas por Role

```sql
CREATE OR REPLACE VIEW tactical_operations_by_role AS
SELECT 
  tac.*,
  u.role,
  CASE 
    WHEN u.role = 'ADMIN' THEN 
      tac.type IN ('milestone_conquest', 'ticket_expansion')
    WHEN u.role = 'RECEPTIONIST' THEN 
      tac.type IN ('rescue_roi', 'base_protection') 
      AND tac.metadata->>'mission_type' = 'agenda'
    WHEN u.role = 'DENTIST' THEN 
      tac.type IN ('base_protection') 
      AND tac.metadata->>'mission_type' = 'clinical'
    ELSE true
  END as is_relevant
FROM tactical_operations tac
JOIN users u ON u.clinic_id = tac.clinic_id
WHERE tac.status = 'active';
```

---

## 6. CHATBOS PERSONALIZADO

### 6.1 System Prompts por Role

```typescript
const SYSTEM_PROMPTS = {
  ADMIN: `
Você é o BOS, Sócio Estrategista do Dr. Marcelo.

FOCO: EBITDA, ROI, Milestone de 50K
TOM: Executivo, estratégico, proativo
MÉTRICAS: Lucro líquido, margem, procedimentos high-ticket

FORMATO DE RESPOSTA:
1. Diagnóstico Executivo
2. Impacto Financeiro (R$)
3. Ação Estratégica
4. Resultado Esperado (XP + R$)
  `,
  
  RECEPTIONIST: `
Você é o BOS, Assistente de Operações da Secretária.

FOCO: Agenda, Leads, Eficiência Operacional
TOM: Suporte, organizacional, motivador
MÉTRICAS: Taxa de ocupação, response time, confirmações

FORMATO DE RESPOSTA:
1. Status da Agenda
2. Leads Pendentes
3. Ação Imediata
4. Progresso do Dia (XP)
  `,
  
  DENTIST: `
Você é o BOS, Consultor Clínico do Dentista.

FOCO: Produção, Qualidade, Satisfação do Paciente
TOM: Técnico, orientador, celebrador
MÉTRICAS: Tratamentos concluídos, NPS, pós-ops

FORMATO DE RESPOSTA:
1. Produção do Dia
2. Pós-Operatórios Pendentes
3. Feedback de Pacientes
4. Progresso Clínico (XP)
  `
};
```

---

## 7. IMPLEMENTAÇÃO TÉCNICA

### 7.1 Alterações no Schema

```sql
-- Adicionar campo assigned_to em tactical_operations
ALTER TABLE tactical_operations
ADD COLUMN assigned_to uuid REFERENCES users(id);

-- Adicionar índice
CREATE INDEX idx_tactical_operations_assigned ON tactical_operations(assigned_to);

-- Adicionar metadados de missão
ALTER TABLE tactical_operations
ADD COLUMN mission_type text CHECK (mission_type IN ('daily', 'weekly', 'monthly', 'custom'));
```

### 7.2 Função de Cálculo de XP por Role

```sql
CREATE OR REPLACE FUNCTION calculate_xp_for_action(
  p_user_id UUID,
  p_action_type TEXT,
  p_value NUMERIC DEFAULT 0
) RETURNS INTEGER AS $$
DECLARE
  v_role TEXT;
  v_xp INTEGER := 0;
BEGIN
  -- Buscar role do usuário
  SELECT role INTO v_role FROM users WHERE id = p_user_id;
  
  -- Calcular XP baseado em role e ação
  CASE v_role
    WHEN 'ADMIN' THEN
      v_xp := CASE p_action_type
        WHEN 'budget_approved_high_ticket' THEN 1000
        WHEN 'milestone_50k' THEN 5000
        WHEN 'margin_above_45' THEN 2000
        ELSE 0
      END;
      
    WHEN 'RECEPTIONIST' THEN
      v_xp := CASE p_action_type
        WHEN 'lead_response_fast' THEN 50
        WHEN 'agenda_full' THEN 500
        WHEN 'zero_no_shows' THEN 300
        WHEN 'perfect_week' THEN 1000
        ELSE 0
      END;
      
    WHEN 'DENTIST' THEN
      v_xp := CASE p_action_type
        WHEN 'treatment_completed' THEN 200
        WHEN 'five_star_review' THEN 150
        WHEN 'perfect_records' THEN 500
        ELSE 0
      END;
  END CASE;
  
  -- Aplicar multiplicador se houver valor
  IF p_value >= 20000 THEN
    v_xp := v_xp * 2;
  ELSIF p_value >= 10000 THEN
    v_xp := FLOOR(v_xp * 1.5);
  END IF;
  
  RETURN v_xp;
END;
$$ LANGUAGE plpgsql;
```

---

## 📊 ROADMAP DE IMPLEMENTAÇÃO

### Fase 1: Fundação (Semana 1)
- [x] Documentação do ecossistema
- [ ] Criar tabelas de recompensas
- [ ] Adicionar campo assigned_to
- [ ] Implementar função de distribuição de missões

### Fase 2: Interface (Semana 2)
- [ ] Refatorar Intelligence Gateway
- [ ] Implementar filtros por role
- [ ] Criar Loja de Recompensas (UI)
- [ ] Personalizar ChatBOS

### Fase 3: Automação (Semana 3)
- [ ] Cron job para distribuição semanal
- [ ] Notificações de conquistas
- [ ] Painel de liderança
- [ ] Relatório de ROI de Gente

### Fase 4: Refinamento (Semana 4)
- [ ] Ajustes de balanceamento de XP
- [ ] Testes com equipe real
- [ ] Documentação de uso
- [ ] Treinamento da equipe

---

## 🎯 RESULTADO ESPERADO

Com o Ecossistema Multipersona BOS 12.0, o Instituto Vilas terá:

1. **Equipe Auto-Gerenciável**
   - Cada membro sabe exatamente o que fazer
   - Gamificação personalizada mantém motivação alta
   - Recompensas tangíveis geram dopamina real

2. **Dr. Marcelo Liberado**
   - Foco 100% em estratégia e alta performance
   - Sistema cuida da gestão operacional
   - Visão clara do ROI de cada membro

3. **Cultura de Alta Performance**
   - Competição saudável entre membros
   - Celebração de conquistas
   - Crescimento exponencial sustentável

---

**Versão:** BOS 12.0  
**Data:** 20/12/2025  
**Status:** 📋 Documentado - Pronto para Implementação  
**Próximo Passo:** Criar estruturas SQL e refatorar Intelligence Gateway
