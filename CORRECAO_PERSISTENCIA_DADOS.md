# 🔧 CORREÇÃO DE PERSISTÊNCIA DE DADOS
## Sincronização Frontend ↔ Backend após Unificação

**Data:** 03/01/2026 09:45  
**Problema:** Dados salvam no formulário mas não persistem no banco  
**Causa:** Frontend ainda usa campos antigos (`professional_id` em `users`)  
**Prioridade:** 🔴 CRÍTICA  

---

## 🎯 PROBLEMAS IDENTIFICADOS

### **1. AuthContext.tsx**
- ✅ **JÁ CORRIGIDO:** Removido JOIN com `professionals`
- ✅ **JÁ CORRIGIDO:** Busca apenas de `users`
- ⚠️ **FALTA:** Função para atualizar perfil do usuário

### **2. Persistência de Dados**
- ❌ Dados salvam mas desaparecem ao recarregar
- ❌ `clinic_id` pode não estar sendo enviado
- ❌ Campos podem estar sendo enviados para tabela errada

### **3. Sidebar**
- ✅ **JÁ CORRIGIDO:** `sideOffset={0}` em dropdown-menu.tsx
- ✅ **JÁ CORRIGIDO:** `collisionPadding={8}` adicionado

---

## 🛠️ CORREÇÕES NECESSÁRIAS

### **CORREÇÃO 1: Adicionar função updateProfile no AuthContext**

**Arquivo:** `contexts/AuthContext.tsx`

**Adicionar após a função `refreshProfile`:**

```typescript
const updateProfile = async (updates: Partial<User>) => {
  if (!user?.id) {
    console.error('❌ [AUTH] Usuário não logado');
    return { error: 'Usuário não logado' };
  }

  try {
    console.log('🔄 [AUTH] Atualizando perfil...', updates);

    // Atualizar no banco (tabela users)
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        clinic_id: user.clinic_id, // Sempre enviar clinic_id
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('❌ [AUTH] Erro ao atualizar perfil:', error);
      return { error: error.message };
    }

    // Atualizar estado local
    setUser({ ...user, ...data });
    console.log('✅ [AUTH] Perfil atualizado com sucesso');
    
    return { data };
  } catch (error) {
    console.error('❌ [AUTH] Erro inesperado:', error);
    return { error: 'Erro ao atualizar perfil' };
  }
};
```

**Exportar no Provider:**

```typescript
<AuthContext.Provider
  value={{
    user,
    session,
    loading,
    signIn,
    signOut,
    refreshProfile,
    updateProfile,  // ✅ ADICIONAR
    isAdmin,
    isMaster,
  }}
>
```

**Atualizar interface AuthContextType:**

```typescript
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string, clinicCode?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<{ data?: any; error?: string }>;  // ✅ ADICIONAR
  isAdmin: boolean;
  isMaster: boolean;
}
```

---

### **CORREÇÃO 2: Garantir clinic_id em todas as operações**

**Regra de Ouro:**
```typescript
// ✅ SEMPRE enviar clinic_id em INSERT/UPDATE
const { data, error } = await supabase
  .from('users')
  .update({
    name: 'Novo Nome',
    clinic_id: user.clinic_id,  // ✅ OBRIGATÓRIO
    // ... outros campos
  })
  .eq('id', user.id);
```

---

### **CORREÇÃO 3: Remover referências a professional_id em users**

**Arquivos para verificar:**
- `contexts/DataContext.tsx` (linha 1219)
- Qualquer hook que faça UPDATE em `users`
- Formulários de edição de perfil

**Regra:**
```typescript
// ❌ ERRADO
.update({ professional_id: someId })

// ✅ CORRETO
// Não enviar professional_id para tabela users
// Se precisar, usar apenas id (users.id = professionals.id)
```

---

### **CORREÇÃO 4: Validar RLS (Row Level Security)**

**SQL para verificar:**

```sql
-- Verificar se RLS permite UPDATE
SELECT * FROM pg_policies 
WHERE tablename = 'users' 
AND cmd = 'UPDATE';

-- Se necessário, criar policy
CREATE POLICY "Users can update own profile"
ON users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

---

## 🧪 TESTE DE PERSISTÊNCIA

### **Teste 1: Atualizar Nome**

```typescript
// No componente de perfil
const handleSave = async () => {
  const { error } = await updateProfile({
    name: 'Dr. Marcelo Atualizado'
  });

  if (error) {
    console.error('Erro:', error);
    alert('Erro ao salvar');
  } else {
    alert('Salvo com sucesso!');
    // Recarregar página para validar
    window.location.reload();
  }
};
```

### **Teste 2: Atualizar Cor da Agenda**

```typescript
const handleColorChange = async (newColor: string) => {
  const { error } = await updateProfile({
    agenda_color: newColor
  });

  if (error) {
    console.error('Erro:', error);
  } else {
    console.log('Cor atualizada!');
  }
};
```

### **Teste 3: Validar Persistência**

```sql
-- No Supabase SQL Editor
SELECT 
    id,
    name,
    agenda_color,
    clinic_id,
    updated_at
FROM users
WHERE email = 'admin@clinicpro.com';

-- Deve mostrar os dados atualizados
```

---

## 📊 CHECKLIST DE VALIDAÇÃO

- [ ] `updateProfile` adicionado no AuthContext
- [ ] `updateProfile` exportado no Provider
- [ ] Interface `AuthContextType` atualizada
- [ ] `clinic_id` sempre enviado em updates
- [ ] Sem referências a `professional_id` em `users`
- [ ] RLS permite UPDATE para próprio usuário
- [ ] Teste de atualização de nome funciona
- [ ] Teste de atualização de cor funciona
- [ ] Dados persistem após F5
- [ ] Console sem erros 400

---

## 🎯 RESULTADO ESPERADO

**Antes:**
```
1. Usuário edita nome
2. Salva
3. Aparece salvo
4. F5 (recarrega)
5. Nome volta ao anterior ❌
```

**Depois:**
```
1. Usuário edita nome
2. Salva
3. Aparece salvo
4. F5 (recarrega)
5. Nome permanece atualizado ✅
```

---

## 🚨 ERROS COMUNS E SOLUÇÕES

### **Erro: "column professional_id does not exist"**

**Causa:** Tentando UPDATE com `professional_id` em `users`

**Solução:**
```typescript
// ❌ ERRADO
.update({ professional_id: id })

// ✅ CORRETO
// Não enviar professional_id
```

### **Erro: "new row violates row-level security policy"**

**Causa:** RLS bloqueando UPDATE

**Solução:**
```sql
-- Verificar policies
SELECT * FROM pg_policies WHERE tablename = 'users';

-- Criar policy se necessário
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid() = id);
```

### **Erro: "null value in column clinic_id"**

**Causa:** Não enviando `clinic_id` no UPDATE

**Solução:**
```typescript
// ✅ SEMPRE enviar clinic_id
.update({
  name: newName,
  clinic_id: user.clinic_id  // ✅ OBRIGATÓRIO
})
```

---

## 📝 CÓDIGO COMPLETO - AuthContext.tsx

```typescript
// Adicionar esta função após refreshProfile

const updateProfile = async (updates: Partial<User>) => {
  if (!user?.id) {
    console.error('❌ [AUTH] Usuário não logado');
    return { error: 'Usuário não logado' };
  }

  try {
    console.log('🔄 [AUTH] Atualizando perfil...', updates);

    // Garantir que clinic_id sempre seja enviado
    const updateData = {
      ...updates,
      clinic_id: user.clinic_id,
      updated_at: new Date().toISOString()
    };

    // Remover campos que não existem em users
    delete updateData.professional_id;  // ✅ Não existe em users

    // Atualizar no banco
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('❌ [AUTH] Erro ao atualizar perfil:', error);
      return { error: error.message };
    }

    // Atualizar estado local
    setUser({ ...user, ...data });
    console.log('✅ [AUTH] Perfil atualizado com sucesso');
    
    return { data };
  } catch (error: any) {
    console.error('❌ [AUTH] Erro inesperado:', error);
    return { error: error.message || 'Erro ao atualizar perfil' };
  }
};

// No return do Provider
<AuthContext.Provider
  value={{
    user,
    session,
    loading,
    signIn,
    signOut,
    refreshProfile,
    updateProfile,  // ✅ ADICIONAR
    isAdmin,
    isMaster,
  }}
>
  {children}
</AuthContext.Provider>
```

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ Implementar `updateProfile` no AuthContext
2. ✅ Testar atualização de nome
3. ✅ Testar atualização de cor
4. ✅ Validar persistência com F5
5. ✅ Verificar console sem erros

---

**Dr. Marcelo, implemente estas correções e os dados finalmente vão persistir!** 🚀

**Quer que eu implemente o `updateProfile` agora no AuthContext?** 💾
