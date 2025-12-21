# 🎮 BOS 8.0 - QUICK REFERENCE GUIDE

## 🎯 CONCEITO CENTRAL

**Dopamina Gerencial** = Gamificação Executiva que transforma gestão em progressão mensurável

---

## 📊 SISTEMA DE 3 PILARES

### 1️⃣ OPERAÇÕES TÁTICAS (Quests)
```
ai_insights → Missões Executivas

Tipos:
🔴 Resgate de ROI (Lead > 12h)
💎 Expansão de Ticket (Upsell de Vendas)
🛡️ Proteção de Base (Inadimplência)
🏆 Conquista de Milestone (Meta 50K)
```

### 2️⃣ MATURIDADE DE GESTÃO (XP)
```
XP = (Receita / 1000) × Multiplier

Níveis:
1. Gestor de Fluxo (0-5k XP)
2. Estrategista High-Ticket (5k-15k XP)
3. Arquiteto do Instituto (15k-30k XP)
4. Diretor Exponencial (30k+ XP)
```

### 3️⃣ CLINICHEALTH (HP)
```
IVC = Índice de Vitalidade Corporativa (0-100)

Pilares:
📱 Marketing (ROI, CAC, Leads)
💰 Vendas (Conversão, Pipeline)
⚕️ Clínico (Produção, Qualidade)
⚙️ Operacional (Eficiência, Agenda)
💵 Financeiro (Margem, Fluxo)
```

---

## 🎨 FEEDBACK VISUAL

### Notificações de Radar
```
🎯 Ativo High-Ticket Detectado
⚠️ Perda de Altitude (Pilar em queda)
🏆 Boss Final à Vista (Milestone próximo)
🔥 Modo de Expansão (Streak ativado)
```

### Tom de Voz
```
❌ NÃO: "Parabéns! Você ganhou pontos!"
✅ SIM: "+R$ 15.000 injetados no EBITDA. Avançamos 30% rumo ao Milestone de 50K"

❌ NÃO: "Você subiu de nível!"
✅ SIM: "Novo nível desbloqueado: ESTRATEGISTA HIGH-TICKET. Novas habilidades: Analista de ROI + Mestre do Upsell"
```

---

## 🛠️ IMPLEMENTAÇÃO RÁPIDA

### SQL (Tabelas Essenciais)
```sql
-- Progressão do Usuário
user_progression (level, xp, health_score, streak)

-- Operações Táticas
tactical_operations (type, financial_impact, xp_reward, status)

-- Eventos de Saúde
health_events (event_type, impact, pillar)
```

### React Hook
```typescript
const { 
    progression,      // Nível, XP, Achievements
    operations,       // Missões ativas
    clinicHealth,     // IVC e pilares
    completeOperation // Marcar missão como completa
} = useGameification();
```

---

## 🎯 EXEMPLOS DE USO

### Cenário 1: Lead Parado
```
INPUT: ai_insight (Lead sem contato há 15h)
OUTPUT: 
  Operação Tática: "Resgate de ROI - Ana Silva"
  Impacto: R$ 25.000 em risco
  XP Reward: 500
  Deadline: 2h
```

### Cenário 2: Upsell Identificado
```
INPUT: Paciente HOF há 2+ anos
OUTPUT:
  Operação Tática: "Expansão de Ticket - Maria → Cervicoplastia"
  Impacto: R$ 22.000 potencial
  XP Reward: 1000
  Power-Up: +R$ 450/hora clínica
```

### Cenário 3: Meta Batida
```
INPUT: Faturamento = R$ 50.000
OUTPUT:
  +2000 XP
  Streak: +1
  Notificação: "🏆 BOSS FINAL DERROTADO!"
  Desbloqueio: Próximo nível (se XP suficiente)
```

---

## 📈 MÉTRICAS DE SUCESSO

### KPIs do Sistema
- **Engajamento:** Operações completadas / Operações criadas
- **Progressão:** XP médio por semana
- **Saúde:** IVC médio mensal
- **Conversão:** Taxa de conclusão de missões High-Ticket

### Metas
- [ ] 80%+ de operações completadas
- [ ] IVC > 75 (saúde boa)
- [ ] Nível 2 em 30 dias
- [ ] Milestone de 50K em 60 dias

---

**Lembre-se:** Este não é um jogo. É um **Simulador de Crescimento Executivo** onde cada ponto representa receita real e cada nível representa maturidade de gestão.
