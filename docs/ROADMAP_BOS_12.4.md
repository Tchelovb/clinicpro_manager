# 🎯 ROADMAP DE IMPLEMENTAÇÃO - BOS 12.4

**Versão:** BOS 12.4  
**Data:** 20/12/2025  
**Objetivo:** Integrar Frontend e IA com Role-Based Intelligence

---

## 📋 PLANO DE EXECUÇÃO

### **FASE 1: Fundação SQL** ✅ CONCLUÍDA
- [x] Tabelas de recompensas
- [x] Missões semanais por role
- [x] Funções de XP e conversão
- [x] Leaderboard
- [x] Correção de enum roles

### **FASE 2: Documentação** ✅ CONCLUÍDA
- [x] BOS_12.0_ECOSSISTEMA_MULTIPERSONA.md
- [x] BOS_12.1_ROLE_BASED_INTELLIGENCE.md
- [x] FIX_ROLE_ENUM_BOS_12.md
- [x] SYSTEM_BLUEPRINT_BOS.md

### **FASE 3: Frontend - Intelligence Gateway** 🚧 PRÓXIMO
**Arquivos a modificar:**
1. `IntelligenceGateway.tsx` - Personalizar cards por role
2. `useGameification.ts` - Adicionar filtros por role
3. `GamificationTestPage.tsx` - Exibir dados personalizados

**Tarefas:**
- [ ] Criar configuração de gateway por role
- [ ] Implementar filtro de métricas
- [ ] Adicionar segurança (dados sensíveis apenas ADMIN)
- [ ] Testar com cada role

### **FASE 4: ChatBOS Personalizado** 📋 PLANEJADO
**Arquivos a modificar:**
1. `useBOSChat.ts` - System prompts por role
2. `BOSChat.tsx` - UI adaptativa
3. `BOSFloatingButton.tsx` - Ícone/cor por role

**Tarefas:**
- [ ] Implementar system prompts dinâmicos
- [ ] Adicionar contexto de role
- [ ] Personalizar tom de voz
- [ ] Testar respostas por role

### **FASE 5: Painel de Permissões** 🔮 FUTURO
**Novo componente:**
- `RoleManagementPanel.tsx` - Gestão de roles e permissões

**Tarefas:**
- [ ] UI para alterar roles
- [ ] Validação de permissões
- [ ] Auditoria de mudanças
- [ ] Testes de segurança

---

## 🎯 MAPEAMENTO DE ROLES

### **Estrutura Atual do Banco:**

```typescript
type UserRole = 
  | 'ADMIN'        // Dr. Marcelo - Sócio Estrategista
  | 'DENTIST'      // Dentista - Guardião da Excelência  
  | 'RECEPTIONIST' // Secretária - Mestre de Fluxo
  | 'PROFESSIONAL' // CRC/Vendedor - Arquiteto de Conversão
```

### **Mapeamento de Personas:**

| Role | Persona | Foco Principal | Gateway Card 1 |
|------|---------|----------------|----------------|
| **ADMIN** | Sócio Estrategista | EBITDA, ROI, 50K | ClinicHealth Global |
| **DENTIST** | Guardião da Excelência | Produção, NPS, Pós-Ops | Saúde Clínica |
| **RECEPTIONIST** | Mestre de Fluxo | Agenda, Velocidade | Saúde da Agenda |
| **PROFESSIONAL** | Arquiteto de Conversão | Conversão, Upsell | Saúde do Funil |

---

## 📝 CHECKLIST DE IMPLEMENTAÇÃO

### **Passo 1: Atualizar Types** ✅
```typescript
// types.ts ou constants.ts
export type UserRole = 'ADMIN' | 'DENTIST' | 'RECEPTIONIST' | 'PROFESSIONAL';

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  DENTIST: 'Dentista',
  RECEPTIONIST: 'Recepcionista',
  PROFESSIONAL: 'Consultor de Vendas'
};

export const ROLE_PERSONAS: Record<UserRole, string> = {
  ADMIN: 'Sócio Estrategista',
  DENTIST: 'Guardião da Excelência',
  RECEPTIONIST: 'Mestre de Fluxo',
  PROFESSIONAL: 'Arquiteto de Conversão'
};
```

### **Passo 2: Configurar Gateway** 📊
```typescript
// IntelligenceGateway.tsx
interface GatewayCard {
  title: string;
  subtitle: string;
  description: string;
  gradient: string;
  icon: LucideIcon;
  route: string;
  metrics?: string[];
}

const GATEWAY_CONFIG: Record<UserRole, {
  card1: GatewayCard;
  card2: GatewayCard;
  card3: GatewayCard;
}> = {
  ADMIN: {
    card1: {
      title: 'ClinicHealth Global',
      subtitle: 'Saúde Macro',
      description: 'Monitoramento dos 5 Pilares e gestão de metas',
      gradient: 'from-blue-600 to-cyan-600',
      icon: Activity,
      route: '/dashboard/clinic-health',
      metrics: ['ivc', 'margem', 'roi', 'faturamento']
    },
    // ... card2, card3
  },
  DENTIST: {
    // ... configuração específica
  },
  // ... outros roles
};
```

### **Passo 3: Personalizar ChatBOS** 🤖
```typescript
// useBOSChat.ts
const SYSTEM_PROMPTS: Record<UserRole, string> = {
  ADMIN: `Você é o BOS, Sócio Estrategista...`,
  DENTIST: `Você é o BOS, Consultor Clínico...`,
  RECEPTIONIST: `Você é o BOS, Assistente de Operações...`,
  PROFESSIONAL: `Você é o BOS, Consultora de Vendas...`
};

function getSystemPrompt(role: UserRole): string {
  return SYSTEM_PROMPTS[role];
}
```

### **Passo 4: Segurança de Dados** 🔐
```typescript
// Componente de métrica sensível
function SensitiveMetric({ value, label }: Props) {
  const { profile } = useAuth();
  
  if (profile?.role !== 'ADMIN') {
    return null; // Não exibe para não-admins
  }
  
  return <MetricCard value={value} label={label} />;
}
```

### **Passo 5: Filtrar Operações** 🎯
```typescript
// useGameification.ts
const fetchOperations = async () => {
  let query = supabase
    .from('tactical_operations')
    .select('*')
    .eq('assigned_to', profile.id)
    .eq('status', 'active');
  
  // Filtrar por role
  if (profile.role === 'RECEPTIONIST') {
    query = query.in('type', ['rescue_roi', 'base_protection']);
  } else if (profile.role === 'PROFESSIONAL') {
    query = query.in('type', ['ticket_expansion', 'rescue_roi']);
  }
  
  const { data } = await query;
  return data;
};
```

---

## 🚀 ORDEM DE EXECUÇÃO

### **Semana 1: Gateway Personalizado**
**Dia 1-2:** Configuração de cards por role
**Dia 3-4:** Implementar filtros de métricas
**Dia 5:** Testes e ajustes

### **Semana 2: ChatBOS Contextual**
**Dia 1-2:** System prompts por role
**Dia 3-4:** Testar respostas
**Dia 5:** Ajustes de tom de voz

### **Semana 3: Painel de Permissões**
**Dia 1-3:** Criar UI de gestão
**Dia 4-5:** Testes de segurança

---

## ⚠️ PONTOS DE ATENÇÃO

### **1. Migração de Dados**
- Verificar se há usuários com role `MANAGER` ou outros valores antigos
- Migrar para os 4 roles oficiais

### **2. Permissões**
- Garantir que RLS está aplicado em todas as tabelas
- Testar acesso com cada role

### **3. Performance**
- Views SQL podem impactar performance
- Considerar cache de métricas

### **4. UX**
- Cada role deve ter experiência fluida
- Evitar confusão com dados irrelevantes

---

## 📊 MÉTRICAS DE SUCESSO

### **KPIs de Implementação:**
- [ ] 100% dos componentes adaptados por role
- [ ] 0 erros de permissão
- [ ] Tempo de resposta < 500ms
- [ ] 100% de cobertura de testes

### **KPIs de Uso:**
- [ ] Engajamento por role > 80%
- [ ] Satisfação da equipe > 90%
- [ ] Redução de dúvidas sobre dados
- [ ] Aumento de XP ganho por semana

---

## 🎯 RESULTADO ESPERADO

Ao final da implementação:

1. **Dr. Marcelo (ADMIN):**
   - Vê EBITDA, margem, ROI
   - Foco em estratégia e alta performance
   - Sistema auto-gerencia equipe

2. **Dentista (DENTIST):**
   - Vê produção, NPS, pós-ops
   - Foco em excelência clínica
   - Gamificação por qualidade

3. **Secretária (RECEPTIONIST):**
   - Vê agenda, confirmações, leads
   - Foco em eficiência operacional
   - Gamificação por velocidade

4. **CRC (PROFESSIONAL):**
   - Vê conversão, pipeline, upsell
   - Foco em vendas e receita
   - Gamificação por resultados

---

**Versão:** BOS 12.4  
**Data:** 20/12/2025  
**Status:** 📋 Planejado - Pronto para Execução  
**Próximo Passo:** Implementar Intelligence Gateway personalizado
