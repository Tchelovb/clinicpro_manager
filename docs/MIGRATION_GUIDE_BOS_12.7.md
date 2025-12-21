# 🚀 MIGRAÇÃO ESTRUTURAL DE ROLES - BOS 12.7

**Versão:** BOS 12.7  
**Data:** 20/12/2025  
**Tipo:** Migração Estrutural Completa (OPÇÃO B)  
**Objetivo:** Reconstruir enum role com 4 valores oficiais

---

## ⚠️ **ATENÇÃO - LEIA ANTES DE EXECUTAR**

Esta migração faz alterações **ESTRUTURAIS** no banco de dados.

**Requisitos:**
- ✅ Backup completo do banco
- ✅ Executar em horário de baixo tráfego
- ✅ Ter acesso de superusuário no PostgreSQL
- ✅ Testar em ambiente de desenvolvimento primeiro

---

## 📋 **RESUMO DA MIGRAÇÃO**

### **ANTES:**
```
ENUM role: ADMIN, DENTIST, RECEPTIONIST, PROFESSIONAL
```

### **DEPOIS:**
```
ENUM role: ADMIN, PROFESSIONAL, RECEPTIONIST, CRC
```

### **MAPEAMENTO:**
| Antes | Depois | Persona |
|-------|--------|---------|
| `ADMIN` | `ADMIN` | O Comandante |
| `DENTIST` | `PROFESSIONAL` | Guardião da Técnica (Clínico) |
| `RECEPTIONIST` | `RECEPTIONIST` | Mestre de Fluxo |
| `PROFESSIONAL` | `CRC` | Arquiteta de Conversão (Vendedor) |

---

## 🚀 **COMO EXECUTAR**

### **Passo 1: Backup**
```bash
# Fazer backup completo do banco
pg_dump -U postgres -d clinicpro > backup_pre_migration_$(date +%Y%m%d_%H%M%S).sql
```

### **Passo 2: Executar Migração**
1. Abra o **Supabase SQL Editor**
2. Copie o conteúdo de `MIGRATION_ROLES_BOS_12.7.sql`
3. **LEIA** todos os comentários
4. Clique em **RUN**
5. Aguarde a conclusão (pode levar alguns segundos)

### **Passo 3: Validar**
1. Abra o **Supabase SQL Editor**
2. Copie o conteúdo de `VALIDATION_ROLES_BOS_12.7.sql`
3. Clique em **RUN**
4. Verifique os resultados

---

## ✅ **VALIDAÇÕES AUTOMÁTICAS**

O script de migração inclui:

### **1. Backup Automático**
- Cria tabela `users_backup_roles`
- Salva todos os usuários antes da migração

### **2. Mapeamento Temporário**
- Usa coluna `role_temp` para conversão segura
- Mapeia roles antigos para novos

### **3. Validação de Integridade**
- Verifica se nenhum usuário foi perdido
- Compara total antes/depois
- Valida que todos têm role válido

### **4. Rollback Disponível**
- Script de rollback incluído
- Restaura estado anterior se necessário

---

## 📊 **RESULTADO ESPERADO**

### **Console Output:**
```
========================================
BACKUP CRIADO - ESTADO ATUAL:
Total de usuários: 5
ADMIN: 1
DENTIST: 2
RECEPTIONIST: 1
PROFESSIONAL: 1
========================================

========================================
MAPEAMENTO TEMPORÁRIO:
ADMIN: 1
PROFESSIONAL (Clínico): 2
RECEPTIONIST: 1
CRC (Vendedor): 1
========================================

========================================
MIGRAÇÃO CONCLUÍDA!
========================================
ESTADO FINAL:
Total de usuários: 5 (Backup: 5)
ADMIN: 1
PROFESSIONAL (Clínico): 2
RECEPTIONIST: 1
CRC (Vendedor): 1
========================================
✅ VALIDAÇÃO: Nenhum usuário foi perdido!
========================================
```

### **Enum Final:**
```sql
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = 'role'::regtype 
ORDER BY enumsortorder;

-- Resultado:
-- ADMIN
-- PROFESSIONAL
-- RECEPTIONIST
-- CRC
```

---

## 🔍 **SCRIPT DE VALIDAÇÃO**

Execute `VALIDATION_ROLES_BOS_12.7.sql` para verificar:

### **1. Validação de Enum**
- ✅ Enum tem exatamente 4 valores
- ✅ Valores corretos: ADMIN, PROFESSIONAL, RECEPTIONIST, CRC

### **2. Validação de Usuários**
- ✅ Nenhum usuário foi perdido
- ✅ Todos têm role válido
- ✅ Distribuição por role

### **3. Comparação Antes/Depois**
- ✅ DENTIST → PROFESSIONAL
- ✅ PROFESSIONAL → CRC
- ✅ ADMIN e RECEPTIONIST mantidos

### **4. Integridade Referencial**
- ✅ Nenhum user_progression órfão
- ✅ Nenhuma tactical_operation órfã

---

## 🛡️ **ROLLBACK (SE NECESSÁRIO)**

Se algo der errado, execute:

```sql
-- ROLLBACK COMPLETO
DO $$
BEGIN
  RAISE NOTICE 'INICIANDO ROLLBACK...';
  
  -- Restaurar dados do backup
  TRUNCATE users;
  
  INSERT INTO users (id, email, name, role, clinic_id, created_at)
  SELECT id, email, name, role::text::role, clinic_id, created_at
  FROM users_backup_roles;
  
  RAISE NOTICE 'ROLLBACK CONCLUÍDO!';
END $$;
```

---

## 📝 **PRÓXIMOS PASSOS (FRONTEND)**

Após a migração SQL bem-sucedida:

### **1. Atualizar Types**
```typescript
// types.ts ou constants.ts
export type UserRole = 'ADMIN' | 'PROFESSIONAL' | 'RECEPTIONIST' | 'CRC';

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  PROFESSIONAL: 'Profissional Clínico',
  RECEPTIONIST: 'Recepcionista',
  CRC: 'Consultor de Vendas'
};

export const ROLE_PERSONAS: Record<UserRole, string> = {
  ADMIN: 'O Comandante',
  PROFESSIONAL: 'Guardião da Técnica',
  RECEPTIONIST: 'Mestre de Fluxo',
  CRC: 'Arquiteta de Conversão'
};
```

### **2. Global Search & Replace**
```bash
# Substituir DENTIST por PROFESSIONAL em todos os arquivos
# VS Code: Ctrl+Shift+H
# Buscar: 'DENTIST'
# Substituir: 'PROFESSIONAL'
# Arquivos: *.ts, *.tsx
```

### **3. Atualizar Componentes**
- `TeamCommandCenter.tsx` - Atualizar ROLE_CONFIG
- `IntelligenceGateway.tsx` - Atualizar configurações
- `Sidebar.tsx` - Atualizar navegação
- `useBOSChat.ts` - Atualizar system prompts

### **4. Testar Login**
- ✅ Login como ADMIN
- ✅ Login como PROFESSIONAL
- ✅ Login como RECEPTIONIST
- ✅ Login como CRC

---

## 🧪 **CHECKLIST DE VALIDAÇÃO**

### **SQL:**
- [ ] Backup criado
- [ ] Migração executada sem erros
- [ ] Validação executada
- [ ] Todos os usuários preservados
- [ ] Enum tem 4 valores corretos
- [ ] Nenhum dado órfão

### **Frontend:**
- [ ] Types atualizados
- [ ] Componentes atualizados
- [ ] DENTIST substituído por PROFESSIONAL
- [ ] ChatBOS atualizado
- [ ] Testes de login OK

### **Funcional:**
- [ ] ADMIN vê dados financeiros
- [ ] PROFESSIONAL vê agenda clínica
- [ ] RECEPTIONIST vê leads
- [ ] CRC vê pipeline de vendas
- [ ] Permissões RBAC funcionando

---

## 📞 **SUPORTE**

Se encontrar problemas:

1. **NÃO ENTRE EM PÂNICO**
2. Execute o script de rollback
3. Verifique os logs de erro
4. Revise a documentação
5. Teste em ambiente de desenvolvimento

---

## 🎯 **RESULTADO FINAL**

Após a migração completa:

### **Estrutura Limpa:**
```
ADMIN        → Dr. Marcelo (Comandante)
PROFESSIONAL → Dentistas (Guardião da Técnica)
RECEPTIONIST → Secretária (Mestre de Fluxo)
CRC          → Vendedor (Arquiteta de Conversão)
```

### **Sistema Organizado:**
- ✅ Banco de dados limpo
- ✅ Enum consistente
- ✅ Código alinhado
- ✅ Permissões claras
- ✅ Gamificação personalizada

---

**Versão:** BOS 12.7  
**Data:** 20/12/2025  
**Status:** 📋 Pronto para Execução  
**Arquivos:**
- `MIGRATION_ROLES_BOS_12.7.sql` - Script de migração
- `VALIDATION_ROLES_BOS_12.7.sql` - Script de validação
