# 🤖 INSTRUÇÕES PARA IA - UNIFICAÇÃO DE IDENTIDADE

## 📋 REGRA DE OURO

**A partir de agora, considere a tabela `users` como o cadastro mestre.**

A tabela `professionals` deve ser tratada **apenas como uma flag de ativação para a agenda**, compartilhando **obrigatoriamente o mesmo `UUID`** da tabela `users`.

---

## 🎯 PRINCÍPIOS FUNDAMENTAIS

### 1. ID ÚNICO = UMA PESSOA FÍSICA

```
Dr. Marcelo = UUID "550e8400-e29b-41d4-a716-446655440000"

✅ CORRETO:
- users.id = "550e8400-e29b-41d4-a716-446655440000"
- professionals.id = "550e8400-e29b-41d4-a716-446655440000"
- appointments.doctor_id = "550e8400-e29b-41d4-a716-446655440000"
- user_integrations.user_id = "550e8400-e29b-41d4-a716-446655440000"

❌ ERRADO:
- users.id = "550e8400-e29b-41d4-a716-446655440000"
- professionals.id = "7c9e6679-7425-40de-944b-e07fc1f90ae7"  ← ID DIFERENTE!
```

### 2. FONTE ÚNICA DA VERDADE

| Campo | Tabela Mestre | Tabela Espelho | Sincronização |
|-------|---------------|----------------|---------------|
| Nome | `users.name` | `professionals.name` | Trigger automático |
| CRO | `users.cro` | `professionals.crc` | Trigger automático |
| Especialidade | `users.specialty` | `professionals.specialty` | Trigger automático |
| Cor Agenda | `users.agenda_color` | `professionals.color` | Trigger automático |
| Email | `users.email` | ❌ Não existe | N/A |
| Login | `auth.users` → `users.id` | ❌ Não existe | N/A |

### 3. RELACIONAMENTOS CORRETOS

```sql
-- ✅ CORRETO: Buscar profissionais para agenda
SELECT u.id, u.name, u.agenda_color, u.specialty
FROM users u
WHERE u.clinic_id = ?
  AND u.is_clinical_provider = true
  AND u.active = true;

-- ❌ ERRADO: Buscar em professionals separado
SELECT p.id, p.name, p.color
FROM professionals p
WHERE p.clinic_id = ?;  -- IDs podem ser diferentes!
```

---

## 🔧 FLUXOS CORRETOS

### CRIAÇÃO DE NOVO PROFISSIONAL

```typescript
// 1. Criar user primeiro (Auth + Database)
const { data: authUser } = await supabase.auth.admin.createUser({
    email: 'dr.marcelo@clinica.com',
    password: 'senha123'
});

const userId = authUser.user.id;  // UUID gerado pelo Supabase

// 2. Inserir em users com TODOS os dados
await supabase.from('users').upsert({
    id: userId,  // ⚠️ MESMO ID do auth
    clinic_id: clinicId,
    email: 'dr.marcelo@clinica.com',
    name: 'Dr. Marcelo',
    role: 'PROFESSIONAL',
    is_clinical_provider: true,
    cro: '12345/SP',
    specialty: 'Ortodontia',
    agenda_color: '#3B82F6'
});

// 3. Inserir em professionals com MESMO ID
await supabase.from('professionals').insert({
    id: userId,  // ⚠️ MESMO ID do user!
    clinic_id: clinicId,
    name: 'Dr. Marcelo',
    crc: '12345/SP',
    specialty: 'Ortodontia',
    color: '#3B82F6'
});

// 4. Atualizar users.professional_id (auto-referência)
await supabase.from('users').update({
    professional_id: userId  // ⚠️ Aponta para si mesmo
}).eq('id', userId);
```

### BUSCA DE PROFISSIONAIS PARA AGENDA

```typescript
// ✅ CORRETO: Usar users como fonte
const { data: professionals } = await supabase
    .from('users')
    .select(`
        id,
        name,
        agenda_color,
        specialty,
        cro,
        photo_url
    `)
    .eq('clinic_id', clinicId)
    .eq('is_clinical_provider', true)
    .eq('active', true)
    .order('name');

// ❌ ERRADO: Buscar em professionals
const { data: professionals } = await supabase
    .from('professionals')
    .select('*')
    .eq('clinic_id', clinicId);
```

### SINCRONIZAÇÃO GOOGLE CALENDAR

```typescript
// ✅ CORRETO: Usar auth.uid() como referência
const { data: { user } } = await supabase.auth.getUser();
const userId = user.id;  // Este é o ID ÚNICO

// Buscar agenda do profissional
const { data: appointments } = await supabase
    .from('appointments')
    .select('*')
    .eq('doctor_id', userId)  // ⚠️ Mesmo ID do auth
    .eq('clinic_id', clinicId);

// Sincronizar com Google
await syncWithGoogleCalendar({
    userId: userId,  // ⚠️ Mesmo ID
    appointments: appointments
});
```

### CRIAÇÃO DE AGENDAMENTO

```typescript
// ✅ CORRETO: doctor_id vem do contexto de auth
const { data: { user } } = await supabase.auth.getUser();

await supabase.from('appointments').insert({
    clinic_id: clinicId,
    patient_id: patientId,
    doctor_id: user.id,  // ⚠️ ID do auth (= users.id = professionals.id)
    date: appointmentDate,
    type: 'TREATMENT',
    status: 'PENDING'
});
```

---

## 🚫 ANTI-PADRÕES (NUNCA FAZER)

### ❌ 1. Criar professional com ID diferente do user
```typescript
// ❌ ERRADO
const newProfessionalId = uuid();  // Gera novo UUID
await supabase.from('professionals').insert({
    id: newProfessionalId,  // ❌ ID diferente!
    name: 'Dr. Marcelo'
});
```

### ❌ 2. Buscar professional sem validar user
```typescript
// ❌ ERRADO
const { data: prof } = await supabase
    .from('professionals')
    .select('*')
    .eq('id', professionalId)
    .single();

// Não valida se existe user correspondente!
```

### ❌ 3. Usar professional_id como referência principal
```typescript
// ❌ ERRADO
const { data: appointments } = await supabase
    .from('appointments')
    .select('*')
    .eq('doctor_id', user.professional_id);  // ❌ Indireção desnecessária

// ✅ CORRETO
const { data: appointments } = await supabase
    .from('appointments')
    .select('*')
    .eq('doctor_id', user.id);  // ✅ Direto
```

### ❌ 4. Atualizar apenas professionals
```typescript
// ❌ ERRADO
await supabase.from('professionals').update({
    specialty: 'Nova Especialidade'
}).eq('id', userId);

// Dados ficam dessincronizados com users!

// ✅ CORRETO
await supabase.from('users').update({
    specialty: 'Nova Especialidade'
}).eq('id', userId);

// Trigger sincroniza automaticamente com professionals
```

---

## 📊 QUERIES PADRÃO

### Listar Profissionais da Clínica
```sql
SELECT 
    u.id,
    u.name,
    u.email,
    u.cro,
    u.specialty,
    u.agenda_color,
    u.photo_url,
    u.is_active,
    COUNT(a.id) as total_appointments
FROM users u
LEFT JOIN appointments a ON a.doctor_id = u.id AND a.date >= CURRENT_DATE
WHERE u.clinic_id = ?
  AND u.is_clinical_provider = true
  AND u.active = true
GROUP BY u.id
ORDER BY u.name;
```

### Agenda do Profissional (com Google Sync)
```sql
SELECT 
    a.id,
    a.date,
    a.duration,
    a.type,
    a.status,
    p.name as patient_name,
    p.phone as patient_phone,
    u.name as doctor_name,
    u.agenda_color as doctor_color
FROM appointments a
JOIN patients p ON a.patient_id = p.id
JOIN users u ON a.doctor_id = u.id
WHERE a.doctor_id = auth.uid()  -- ⚠️ Mesmo ID do auth
  AND a.clinic_id = ?
  AND a.date BETWEEN ? AND ?
ORDER BY a.date;
```

### Validar Integridade
```sql
-- Verificar se todos os profissionais têm user correspondente
SELECT 
    p.id,
    p.name,
    CASE 
        WHEN u.id IS NULL THEN '❌ SEM USER'
        WHEN p.id != u.id THEN '⚠️ ID DIFERENTE'
        ELSE '✅ OK'
    END as status
FROM professionals p
LEFT JOIN users u ON p.id = u.id;

-- Deve retornar apenas '✅ OK'
```

---

## 🔐 REGRAS DE SEGURANÇA (RLS)

### Users Table
```sql
-- Usuário só vê users da própria clínica
CREATE POLICY "users_select_own_clinic" ON users
FOR SELECT USING (
    clinic_id IN (
        SELECT clinic_id FROM users WHERE id = auth.uid()
    )
);
```

### Professionals Table
```sql
-- Profissionais só da própria clínica
CREATE POLICY "professionals_select_own_clinic" ON professionals
FOR SELECT USING (
    clinic_id IN (
        SELECT clinic_id FROM users WHERE id = auth.uid()
    )
);
```

### Appointments Table
```sql
-- Agendamentos: próprios ou da clínica (se admin)
CREATE POLICY "appointments_select" ON appointments
FOR SELECT USING (
    doctor_id = auth.uid()  -- ⚠️ Mesmo ID do auth
    OR clinic_id IN (
        SELECT clinic_id FROM users 
        WHERE id = auth.uid() AND role IN ('ADMIN', 'MASTER')
    )
);
```

---

## 🎯 CHECKLIST DE VALIDAÇÃO

Antes de qualquer operação com profissionais, validar:

- [ ] `users.id` = `professionals.id` (mesmo UUID)
- [ ] `users.professional_id` = `users.id` (auto-referência)
- [ ] `users.is_clinical_provider` = `true`
- [ ] Existe registro em `professionals` com mesmo ID
- [ ] `appointments.doctor_id` aponta para `users.id`
- [ ] `user_integrations.user_id` aponta para `users.id`

---

## 🚀 RESULTADO ESPERADO

### Antes (Problemático)
```
Google Calendar: user_id = "550e8400..."
Agenda Clínica: professional_id = "7c9e6679..."
Resultado: ❌ Não sincroniza (IDs diferentes)
```

### Depois (Correto)
```
Google Calendar: user_id = "550e8400..."
Agenda Clínica: doctor_id = "550e8400..."
Professionals: id = "550e8400..."
Resultado: ✅ Sincronização perfeita (MESMO ID)
```

---

## 📝 RESUMO EXECUTIVO

1. **users.id** é a FONTE ÚNICA DA VERDADE
2. **professionals.id** DEVE SER IGUAL a **users.id**
3. **appointments.doctor_id** aponta para **users.id**
4. **user_integrations.user_id** aponta para **users.id**
5. **Trigger automático** sincroniza dados entre tabelas
6. **Google Calendar** e **Agenda Clínica** usam o MESMO ID

**Fim dos fantasmas no banco de dados! 🎯**

---

**Assinado:**  
Dr. Marcelo & Engenheiro Sênior de Sistemas  
Data: 03/01/2026
