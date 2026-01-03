# 🔍 PROMPT DE DIAGNÓSTICO COMPLETO - PERSISTÊNCIA DE DADOS

## 📋 CONTEXTO DO PROBLEMA

**Sistema:** ClinicPro - Sistema de Gestão de Clínicas Odontológicas  
**Tecnologias:** React + TypeScript + Supabase (PostgreSQL)  
**Problema:** Dados de competências de usuários não persistem após salvar

### ❌ SINTOMAS OBSERVADOS

1. **Checkboxes desmarcam após F5:**
   - ☑️ PRODUÇÃO → ☐ (desaparece)
   - ☑️ CRC (CAPTAÇÃO) → ☐ (desaparece)
   - ☑️ AVALIAÇÃO → ☐ (desaparece)

2. **Dados salvos não aparecem ao recarregar:**
   - Competências marcadas somem
   - Flags booleanas voltam para `false`
   - Dados relacionados (CRO, Especialidade) podem sumir

3. **Console mostra sucesso mas dados não persistem:**
   ```
   ✅ [SUBMIT] Users atualizado com sucesso
   🎉 [SUBMIT] Atualização concluída com sucesso!
   ```
   Mas ao reabrir: dados antigos aparecem

---

## 🎯 MISSÃO DA IA

**Você deve realizar uma auditoria COMPLETA e SISTEMÁTICA do sistema para identificar e corrigir TODAS as causas da falha de persistência de dados.**

Execute as seguintes etapas **NA ORDEM** e documente CADA descoberta:

---

## 📝 ETAPA 1: AUDITORIA DO SCHEMA DO BANCO DE DADOS

### 1.1 Verificar Estrutura da Tabela `users`

```sql
-- Execute no Supabase SQL Editor:
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN (
    'is_clinical_provider',
    'is_sales_rep',
    'is_orcamentista',
    'commission_percent',
    'sales_commission_percent',
    'collection_percent',
    'cro',
    'specialty',
    'council',
    'gender',
    'cpf',
    'agenda_color',
    'payment_release_rule'
)
ORDER BY column_name;
```

**VERIFICAR:**
- ✅ Todas as colunas existem?
- ✅ Tipos de dados corretos? (boolean, numeric, varchar)
- ✅ Valores default adequados?

### 1.2 Verificar Políticas RLS (Row Level Security)

```sql
-- Verificar políticas da tabela users:
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'users';
```

**VERIFICAR:**
- ✅ Existe política de UPDATE?
- ✅ A política permite atualizar as colunas de competências?
- ✅ Há restrições que bloqueiam a gravação?

### 1.3 Testar INSERT/UPDATE Manual

```sql
-- Teste direto no banco:
UPDATE users
SET 
    is_clinical_provider = true,
    is_sales_rep = true,
    is_orcamentista = true,
    commission_percent = 30,
    cro = 'TESTE-123',
    specialty = 'Teste Especialidade'
WHERE email = 'marcelovboass@gmail.com';

-- Verificar se salvou:
SELECT 
    name,
    is_clinical_provider,
    is_sales_rep,
    is_orcamentista,
    commission_percent,
    cro,
    specialty
FROM users
WHERE email = 'marcelovboass@gmail.com';
```

**RESULTADO ESPERADO:**
- Se funcionar → Problema está no FRONTEND
- Se falhar → Problema está no BANCO (RLS ou constraints)

---

## 📝 ETAPA 2: AUDITORIA DO CÓDIGO FRONTEND

### 2.1 Verificar Componente `NewMemberSheet.tsx`

**Arquivo:** `c:\Users\marce\OneDrive\Documentos\ClinicPro\components\settings\NewMemberSheet.tsx`

#### 2.1.1 Verificar Payload de Salvamento

Localize a função `handleSubmit` e verifique:

```typescript
// LINHA ~244-263
const payload = {
    name: finalName,
    gender,
    cpf,
    role: dbRole,
    is_clinical_provider: capabilities.includes('producao'),  // ✅ VERIFICAR
    is_orcamentista: capabilities.includes('avaliacao'),      // ✅ VERIFICAR
    is_sales_rep: capabilities.includes('vendedor'),          // ✅ VERIFICAR
    commission_percent: Number(clinicalSplit) || 30,
    sales_commission_percent: Number(salesCommission) || 0,
    collection_percent: Number(collectionCommission) || 0,
    cro: capabilities.includes('producao') ? cro : null,
    specialty: capabilities.includes('producao') ? specialty : null,
    // ...
};
```

**VERIFICAR:**
1. ✅ O array `capabilities` está populado corretamente?
2. ✅ Os IDs das competências estão corretos? (`'producao'`, `'avaliacao'`, `'vendedor'`)
3. ✅ O payload está sendo enviado para o Supabase?

#### 2.1.2 Verificar Mapeamento de Competências

Localize o `useEffect` que carrega `initialData` (linha ~112-165):

```typescript
// Mapear Competências do Banco para UI
const caps = [];
if (initialData.role === 'ADMIN') caps.push('dono');
if (initialData.is_clinical_provider) caps.push('producao');      // ✅ VERIFICAR
if (initialData.is_orcamentista) caps.push('avaliacao');          // ✅ VERIFICAR
if (initialData.is_sales_rep) caps.push('vendedor');              // ✅ VERIFICAR
if (Number(initialData.collection_percent) > 0) caps.push('cobranca');

setCapabilities(caps);
```

**VERIFICAR:**
1. ✅ Os nomes das propriedades estão corretos?
2. ✅ O `initialData` contém os valores corretos ao carregar?
3. ✅ O `setCapabilities` está sendo chamado?

### 2.2 Verificar Componente `Team.tsx`

**Arquivo:** `c:\Users\marce\OneDrive\Documentos\ClinicPro\pages\settings\Team.tsx`

#### 2.2.1 Verificar Query de Busca

Localize a função `fetchUsers` (linha ~54-64):

```typescript
const query = supabase
    .from('users')
    .select(`
        id, name, email, role, photo_url, created_at, 
        cro, specialty, agenda_color, cpf, gender,
        is_clinical_provider, is_sales_rep, is_orcamentista,  // ✅ VERIFICAR
        commission_percent, sales_commission_percent, collection_percent,
        transaction_pin_hash
    `)
    .eq('clinic_id', user.clinic_id)
    .order('created_at', { ascending: false });
```

**VERIFICAR:**
1. ✅ Todas as colunas de competências estão no SELECT?
2. ✅ A query retorna os dados corretos?

---

## 📝 ETAPA 3: AUDITORIA DE FLUXO DE DADOS

### 3.1 Adicionar Logs de Rastreamento

Adicione os seguintes logs no `NewMemberSheet.tsx`:

```typescript
// NO INÍCIO DO handleSubmit (antes do payload):
console.log('🔍 [DEBUG] Estado capabilities:', capabilities);
console.log('🔍 [DEBUG] Estado cro:', cro);
console.log('🔍 [DEBUG] Estado specialty:', specialty);

// APÓS CRIAR O PAYLOAD:
console.log('📦 [DEBUG] Payload COMPLETO:', JSON.stringify(payload, null, 2));

// APÓS RECEBER RESPOSTA DO SUPABASE:
console.log('✅ [DEBUG] Resposta do banco:', JSON.stringify(updatedUser, null, 2));

// NO useEffect QUE CARREGA initialData:
console.log('🔄 [DEBUG] initialData RECEBIDO:', JSON.stringify(initialData, null, 2));
console.log('🔄 [DEBUG] Capabilities MAPEADAS:', caps);
```

### 3.2 Testar Fluxo Completo

1. **Abra o Console** (F12)
2. **Edite um usuário**
3. **Marque competências:**
   - ☑️ PRODUÇÃO
   - ☑️ AVALIAÇÃO
   - ☑️ VENDEDOR
4. **Preencha CRO e Especialidade**
5. **Clique em Salvar**
6. **Copie TODOS os logs do console**
7. **Feche o modal**
8. **Reabra o modal**
9. **Copie NOVAMENTE os logs**

**COMPARAR:**
- Payload enviado vs. Resposta do banco
- Resposta do banco vs. initialData ao recarregar

---

## 📝 ETAPA 4: VERIFICAR SINCRONIZAÇÃO COM TABELA `professionals`

### 4.1 Verificar Foreign Key

```sql
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'professionals'
AND tc.constraint_type = 'FOREIGN KEY';
```

**VERIFICAR:**
- ✅ FK `professionals.id` → `users.id` existe?
- ✅ ON DELETE CASCADE está configurado?

### 4.2 Verificar Dados em `professionals`

```sql
SELECT 
    p.id,
    p.name,
    p.specialty,
    p.crc,
    p.is_active,
    u.is_clinical_provider,
    u.is_sales_rep,
    u.is_orcamentista
FROM professionals p
INNER JOIN users u ON p.id = u.id
WHERE u.email = 'marcelovboass@gmail.com';
```

**VERIFICAR:**
- ✅ Registro existe em `professionals`?
- ✅ Dados estão sincronizados?
- ✅ `users.id = professionals.id`?

---

## 📝 ETAPA 5: VERIFICAR TRIGGERS E CONSTRAINTS

### 5.1 Listar Triggers

```sql
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('users', 'professionals');
```

**VERIFICAR:**
- ✅ Existe algum trigger que modifica os dados após INSERT/UPDATE?
- ✅ Algum trigger está revertendo as mudanças?

### 5.2 Verificar Constraints

```sql
SELECT
    con.conname AS constraint_name,
    con.contype AS constraint_type,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'users';
```

**VERIFICAR:**
- ✅ Há CHECK constraints que bloqueiam valores?
- ✅ Há constraints que forçam valores default?

---

## 📝 ETAPA 6: VERIFICAR CACHE E ESTADO DO REACT

### 6.1 Verificar Estado do React

Adicione no `NewMemberSheet.tsx`:

```typescript
// Após setCapabilities:
useEffect(() => {
    console.log('🔄 [REACT] capabilities STATE CHANGED:', capabilities);
}, [capabilities]);

useEffect(() => {
    console.log('🔄 [REACT] initialData CHANGED:', initialData);
}, [initialData]);
```

### 6.2 Verificar Ciclo de Vida

**VERIFICAR:**
1. ✅ O componente está re-renderizando após salvar?
2. ✅ O `initialData` está sendo atualizado após `fetchUsers()`?
3. ✅ O `useEffect` está sendo executado corretamente?

---

## 📝 ETAPA 7: SOLUÇÃO BASEADA NOS ACHADOS

### Se o problema for no BANCO:

```sql
-- Desabilitar RLS temporariamente para teste:
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Ou ajustar política:
DROP POLICY IF EXISTS users_update_policy ON users;

CREATE POLICY users_update_policy ON users
FOR UPDATE
USING (clinic_id = auth.uid()::text OR auth.uid() IN (SELECT id FROM users WHERE role IN ('ADMIN', 'MASTER')))
WITH CHECK (clinic_id = auth.uid()::text OR auth.uid() IN (SELECT id FROM users WHERE role IN ('ADMIN', 'MASTER')));
```

### Se o problema for no FRONTEND:

#### Opção 1: Forçar Recarga do initialData

```typescript
// No Team.tsx, após salvar:
onSuccess={() => {
    fetchUsers(0);
    setMemberToEdit(null); // Limpar estado
    setIsNewMemberOpen(false); // Fechar modal
}}
```

#### Opção 2: Usar Estado Global (Context)

Criar um contexto para gerenciar os dados da equipe e garantir sincronia.

#### Opção 3: Otimistic Update

Atualizar o estado local imediatamente após salvar, sem esperar o banco.

---

## 📝 ETAPA 8: VALIDAÇÃO FINAL

### 8.1 Teste Completo

1. ✅ Criar novo usuário com competências
2. ✅ Editar usuário existente
3. ✅ Marcar/desmarcar competências
4. ✅ Salvar
5. ✅ Recarregar página (F5)
6. ✅ Reabrir modal
7. ✅ Verificar se dados persistiram

### 8.2 Teste de Regressão

1. ✅ Login funciona?
2. ✅ Outros módulos funcionam?
3. ✅ Não quebrou nada?

---

## 📊 RELATÓRIO DE DIAGNÓSTICO

Ao finalizar, crie um relatório com:

### ✅ ACHADOS

- [ ] Problema identificado no banco de dados (RLS, schema, triggers)
- [ ] Problema identificado no frontend (payload, mapeamento, estado)
- [ ] Problema identificado na sincronização (users ↔ professionals)
- [ ] Outro: _______________

### 🔧 CORREÇÕES APLICADAS

1. **Arquivo:** _______________
   - **Linha:** _______________
   - **Mudança:** _______________
   - **Motivo:** _______________

2. **SQL:**
   ```sql
   -- Script executado:
   ```

### ✅ VALIDAÇÃO

- [ ] Dados persistem após salvar
- [ ] Dados persistem após F5
- [ ] Competências marcadas aparecem corretamente
- [ ] CRO e Especialidade salvam
- [ ] Sem erros no console
- [ ] Sem erros 403 (RLS)

---

## 🚀 EXECUÇÃO DO PROMPT

**IA, execute este diagnóstico COMPLETO e SISTEMÁTICO seguindo TODAS as etapas na ordem. Documente CADA achado e proponha soluções baseadas em MELHORES PRÁTICAS.**

**IMPORTANTE:**
1. Não pule etapas
2. Execute os SQLs no Supabase
3. Adicione os logs no código
4. Teste o fluxo completo
5. Documente tudo
6. Proponha solução definitiva

**OBJETIVO FINAL:**
Garantir que TODOS os dados de competências, CRO, especialidade e configurações de usuário sejam salvos corretamente e persistam após recarregar a página.
