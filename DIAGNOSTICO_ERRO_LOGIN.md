# 🔴 DIAGNÓSTICO FINAL - ERRO DE LOGIN 400

**Data:** 03/01/2026 09:20  
**Problema:** Usuário admin@clinicpro.com não consegue fazer login  
**Erro:** 400 Bad Request no AuthContext.tsx linha 67  

---

## 🎯 CAUSA RAIZ IDENTIFICADA

### **Problema no AuthContext.tsx (Linha 67)**

```typescript
// ❌ ERRADO (Código Atual)
const { data: dbProfile } = await supabase
  .from('users')
  .select(`
    *,
    professional:professionals!professional_id(  // ❌ FK INCORRETA
      id,
      name,
      crc,
      specialty,
      council
    )
  `)
  .eq('id', currentSession.user.id)
  .maybeSingle();
```

**Por que está errado:**
1. `users.professional_id` é uma **auto-referência** para `users.id`
2. Não existe FK `professional_id` apontando para `professionals.id`
3. O JOIN correto deve usar `users.id = professionals.id`

---

## ✅ SOLUÇÃO

### **Opção 1: JOIN Correto (RECOMENDADO)**

```typescript
// ✅ CORRETO
const { data: dbProfile } = await supabase
  .from('users')
  .select(`
    *,
    professional:professionals!id(  // ✅ FK CORRETA (users.id = professionals.id)
      id,
      name,
      crc,
      specialty,
      council
    )
  `)
  .eq('id', currentSession.user.id)
  .maybeSingle();
```

### **Opção 2: LEFT JOIN Seguro (MAIS SEGURO)**

```typescript
// ✅ AINDA MELHOR (funciona para admin que não é profissional)
const { data: dbProfile } = await supabase
  .from('users')
  .select(`
    *,
    professional:professionals(  // LEFT JOIN automático
      id,
      name,
      crc,
      specialty,
      council
    )
  `)
  .eq('id', currentSession.user.id)
  .maybeSingle();
```

**Vantagem:** Se o usuário não tiver registro em `professionals` (como o admin), o JOIN retorna `null` ao invés de falhar.

### **Opção 3: Sem JOIN (MAIS SIMPLES)**

```typescript
// ✅ SIMPLIFICADO (sem JOIN)
const { data: dbProfile } = await supabase
  .from('users')
  .select('*')
  .eq('id', currentSession.user.id)
  .maybeSingle();

// Se precisar de dados do professional, buscar separadamente
let professionalData = null;
if (dbProfile?.is_clinical_provider && dbProfile?.id) {
  const { data } = await supabase
    .from('professionals')
    .select('*')
    .eq('id', dbProfile.id)
    .maybeSingle();
  professionalData = data;
}
```

---

## 📋 PASSO A PASSO PARA RESOLVER

### **1️⃣ Criar Usuário no Supabase Auth (SE NÃO EXISTIR)**

```
1. Abra Supabase Dashboard
2. Authentication > Users > Add User
3. Email: admin@clinicpro.com
4. Password: admin123
5. Auto Confirm: ✅ SIM
6. Create User
```

### **2️⃣ Executar Script SQL**

Execute o arquivo: `sql/FIX_ADMIN_LOGIN_FINAL.sql`

Isso vai:
- ✅ Criar clínica CLINICPRO
- ✅ Criar/atualizar usuário admin no `public.users`
- ✅ Configurar `clinic_id` correto
- ✅ Definir `role = MASTER`
- ✅ Definir `professional_id = NULL` (admin não é profissional)

### **3️⃣ Corrigir AuthContext.tsx**

**Arquivo:** `contexts/AuthContext.tsx`  
**Linha:** 67

**Alterar de:**
```typescript
professional:professionals!professional_id(
```

**Para:**
```typescript
professional:professionals(  // LEFT JOIN automático
```

**OU (mais explícito):**
```typescript
professional:professionals!id(  // JOIN usando users.id = professionals.id
```

---

## 🔍 VALIDAÇÃO

Após fazer as correções, valide com esta query SQL:

```sql
-- Verificar usuário admin
SELECT 
    u.id,
    u.email,
    u.name,
    u.role,
    u.clinic_id,
    u.active,
    u.is_clinical_provider,
    u.professional_id,
    c.name as clinic_name,
    p.id as professional_exists
FROM public.users u
LEFT JOIN public.clinics c ON u.clinic_id = c.id
LEFT JOIN public.professionals p ON u.id = p.id
WHERE u.email = 'admin@clinicpro.com';
```

**Resultado Esperado:**
```
id: [uuid do auth]
email: admin@clinicpro.com
name: Administrador
role: MASTER
clinic_id: 550e8400-e29b-41d4-a716-446655440000
active: true
is_clinical_provider: false
professional_id: NULL
clinic_name: ClinicPro
professional_exists: NULL  (admin não é profissional)
```

---

## 🎯 RESULTADO FINAL

Após implementar as correções:

1. ✅ Usuário admin existe no `auth.users`
2. ✅ Usuário admin existe no `public.users`
3. ✅ `clinic_id` está configurado
4. ✅ `role = MASTER`
5. ✅ AuthContext faz JOIN correto
6. ✅ Login funciona perfeitamente

---

## ⚠️ IMPORTANTE

**NÃO IMPLEMENTE NADA AINDA!**

Este é apenas o **diagnóstico**. Aguarde autorização do Dr. Marcelo para:
1. Executar o script SQL
2. Corrigir o AuthContext.tsx
3. Testar o login

---

**Status:** 🔴 **AGUARDANDO AUTORIZAÇÃO**

**Dr. Marcelo, autoriza implementar as correções?**

---

**Assinado:**  
Engenheiro Sênior de Diagnóstico  
Data: 03/01/2026 09:20
