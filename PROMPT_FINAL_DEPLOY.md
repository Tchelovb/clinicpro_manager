# 🚀 PROMPT FINAL DE DEPLOY - UNIFICAÇÃO COMPLETA
## Instruções para Implementação Frontend + Backend

**Data:** 03/01/2026  
**Status da Infraestrutura:** ✅ UNIFICADA COM SUCESSO  
**Objetivo:** Implementar lógica frontend e backend respeitando ID ÚNICO  

---

## 📋 CONTEXTO DA UNIFICAÇÃO

A infraestrutura de banco de dados foi **unificada com sucesso**. O problema de duplicidade de IDs foi resolvido:

### **Antes (Problemático):**
```
Dr. Marcelo:
├── auth.users.id = [ID_A]
├── users.id = [ID_A]
└── professionals.id = [ID_B]  ❌ DIFERENTE!

Resultado: Google Calendar não sincroniza, agenda vazia
```

### **Depois (Correto):**
```
Dr. Marcelo:
├── auth.users.id = [ID_ÚNICO]
├── users.id = [ID_ÚNICO]
├── professionals.id = [ID_ÚNICO]  ✅ MESMO ID!
└── users.professional_id = [ID_ÚNICO]  ✅ AUTO-REFERÊNCIA

Resultado: ✅ Sincronização perfeita!
```

---

## 🎯 DIRETRIZES RIGOROSAS PARA IMPLEMENTAÇÃO

### **1. FONTE ÚNICA DE ID**

**REGRA DE OURO:** Não diferencie mais `user_id` de `professional_id` ou `doctor_id`. **TODOS agora utilizam o UUID da tabela `public.users`.**

```typescript
// ✅ CORRETO
const { data: { user } } = await supabase.auth.getUser();
const userId = user.id;  // Este é o ID ÚNICO para TUDO

// Criar agendamento
await supabase.from('appointments').insert({
    doctor_id: userId,  // ✅ Mesmo ID do auth
    patient_id: patientId,
    // ...
});

// ❌ ERRADO - NÃO FAZER MAIS
const professionalId = user.professional_id;  // ❌ Indireção desnecessária
await supabase.from('appointments').insert({
    doctor_id: professionalId,  // ❌ Pode ser NULL ou diferente
    // ...
});
```

### **2. REFERÊNCIA DE AGENDA**

**REGRA:** Ao buscar profissionais para a Agenda ou Google Sync, faça o `JOIN` direto entre `appointments.doctor_id` e `users.id`.

```typescript
// ✅ CORRETO: Buscar agendamentos com dados do profissional
const { data: appointments } = await supabase
    .from('appointments')
    .select(`
        *,
        doctor:users!doctor_id(
            id,
            name,
            agenda_color,
            photo_url,
            specialty,
            cro
        ),
        patient:patients(
            id,
            name,
            phone
        )
    `)
    .eq('clinic_id', clinicId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date');

// ❌ ERRADO - NÃO FAZER
const { data: appointments } = await supabase
    .from('appointments')
    .select('*, professionals(*)')  // ❌ Join errado
    .eq('professional_id', professionalId);  // ❌ Campo não existe
```

### **3. FILTRO DE DOUTORES**

**REGRA:** Para listar apenas quem atende na agenda, utilize o filtro `WHERE is_clinical_provider = true` na tabela `users`.

```typescript
// ✅ CORRETO: Listar profissionais para agenda
const { data: professionals } = await supabase
    .from('users')
    .select(`
        id,
        name,
        email,
        agenda_color,
        photo_url,
        specialty,
        cro,
        is_active
    `)
    .eq('clinic_id', clinicId)
    .eq('is_clinical_provider', true)  // ✅ Filtro correto
    .eq('active', true)
    .order('name');

// ❌ ERRADO - NÃO FAZER
const { data: professionals } = await supabase
    .from('professionals')  // ❌ Não usar mais como fonte principal
    .select('*')
    .eq('clinic_id', clinicId);
```

### **4. GOOGLE CALENDAR SYNC**

**REGRA:** A tabela `user_integrations` agora deve ser lida usando o `id` do usuário logado. **Não tente criar novos registros na tabela `professionals` com IDs diferentes**; use o UUID existente em `users`.

```typescript
// ✅ CORRETO: Buscar integração do Google
const { data: { user } } = await supabase.auth.getUser();

const { data: integration } = await supabase
    .from('user_integrations')
    .select('*')
    .eq('user_id', user.id)  // ✅ Mesmo ID do auth
    .eq('provider', 'google_calendar')
    .maybeSingle();

// Sincronizar eventos
if (integration?.access_token) {
    const googleEvents = await fetchGoogleCalendarEvents(integration.access_token);
    
    // Criar bloqueios na agenda local
    for (const event of googleEvents) {
        await supabase.from('appointments').insert({
            clinic_id: clinicId,
            doctor_id: user.id,  // ✅ Mesmo ID do auth
            patient_id: null,  // Bloqueio sem paciente
            date: event.start.dateTime,
            duration: calculateDuration(event),
            type: 'BLOCKED',
            status: 'CONFIRMED',
            notes: `Bloqueado via Google Calendar: ${event.summary}`,
            google_event_id: event.id
        });
    }
}

// ❌ ERRADO - NÃO FAZER
const { data: integration } = await supabase
    .from('user_integrations')
    .select('*')
    .eq('user_id', user.professional_id)  // ❌ Pode ser NULL
    .maybeSingle();
```

### **5. IDENTIDADE VISUAL**

**REGRA:** Utilize o campo `agenda_color` e `photo_url` diretamente da tabela `users` para renderizar os cards dos profissionais na agenda.

```typescript
// ✅ CORRETO: Renderizar card do profissional
interface ProfessionalCardProps {
    professional: {
        id: string;
        name: string;
        agenda_color: string;
        photo_url?: string;
        specialty?: string;
    };
}

const ProfessionalCard: React.FC<ProfessionalCardProps> = ({ professional }) => {
    return (
        <div 
            className="professional-card"
            style={{ borderLeft: `4px solid ${professional.agenda_color}` }}
        >
            {professional.photo_url ? (
                <img src={professional.photo_url} alt={professional.name} />
            ) : (
                <div 
                    className="avatar-placeholder"
                    style={{ backgroundColor: professional.agenda_color }}
                >
                    {professional.name.charAt(0)}
                </div>
            )}
            <h3>{professional.name}</h3>
            <p>{professional.specialty}</p>
        </div>
    );
};

// Buscar dados do profissional
const { data: professional } = await supabase
    .from('users')
    .select('id, name, agenda_color, photo_url, specialty')
    .eq('id', userId)
    .single();

// ❌ ERRADO - NÃO FAZER
const { data: professional } = await supabase
    .from('professionals')  // ❌ Não usar como fonte principal
    .select('color, photo_url')  // ❌ Campos podem estar desatualizados
    .eq('id', professionalId);
```

---

## 🔧 IMPLEMENTAÇÕES ESPECÍFICAS

### **A) Componente de Agenda**

**Arquivo:** `pages/Agenda.tsx` ou `components/agenda/AgendaView.tsx`

```typescript
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const AgendaView = () => {
    const { user, profile } = useAuth();
    const [professionals, setProfessionals] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Carregar profissionais da clínica
    const loadProfessionals = async () => {
        const { data, error } = await supabase
            .from('users')
            .select('id, name, agenda_color, photo_url, specialty, cro')
            .eq('clinic_id', profile.clinic_id)
            .eq('is_clinical_provider', true)
            .eq('active', true)
            .order('name');

        if (error) {
            console.error('Erro ao carregar profissionais:', error);
            return;
        }

        setProfessionals(data);
    };

    // Carregar agendamentos do dia
    const loadAppointments = async () => {
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        const { data, error } = await supabase
            .from('appointments')
            .select(`
                *,
                doctor:users!doctor_id(
                    id,
                    name,
                    agenda_color,
                    photo_url
                ),
                patient:patients(
                    id,
                    name,
                    phone
                )
            `)
            .eq('clinic_id', profile.clinic_id)
            .gte('date', startOfDay.toISOString())
            .lte('date', endOfDay.toISOString())
            .order('date');

        if (error) {
            console.error('Erro ao carregar agendamentos:', error);
            return;
        }

        setAppointments(data);
    };

    useEffect(() => {
        loadProfessionals();
        loadAppointments();
    }, [selectedDate, profile.clinic_id]);

    return (
        <div className="agenda-view">
            {/* Renderizar agenda */}
        </div>
    );
};
```

### **B) Sincronização Google Calendar**

**Arquivo:** `services/googleCalendarService.ts`

```typescript
import { supabase } from '../lib/supabase';

export const syncGoogleCalendar = async (userId: string) => {
    try {
        // 1. Buscar integração do usuário
        const { data: integration, error: integrationError } = await supabase
            .from('user_integrations')
            .select('*')
            .eq('user_id', userId)  // ✅ Mesmo ID do auth
            .eq('provider', 'google_calendar')
            .maybeSingle();

        if (integrationError) throw integrationError;
        if (!integration) {
            throw new Error('Google Calendar não vinculado');
        }

        // 2. Buscar eventos do Google
        const googleEvents = await fetchGoogleEvents(integration.access_token);

        // 3. Sincronizar com banco local
        for (const event of googleEvents) {
            // Verificar se evento já existe
            const { data: existing } = await supabase
                .from('appointments')
                .select('id')
                .eq('google_event_id', event.id)
                .maybeSingle();

            if (existing) {
                // Atualizar evento existente
                await supabase
                    .from('appointments')
                    .update({
                        date: event.start.dateTime,
                        duration: calculateDuration(event),
                        notes: event.summary
                    })
                    .eq('id', existing.id);
            } else {
                // Criar novo bloqueio
                await supabase
                    .from('appointments')
                    .insert({
                        clinic_id: integration.clinic_id,
                        doctor_id: userId,  // ✅ Mesmo ID do auth
                        patient_id: null,
                        date: event.start.dateTime,
                        duration: calculateDuration(event),
                        type: 'BLOCKED',
                        status: 'CONFIRMED',
                        notes: `Google: ${event.summary}`,
                        google_event_id: event.id
                    });
            }
        }

        return { success: true };
    } catch (error) {
        console.error('Erro ao sincronizar Google Calendar:', error);
        return { success: false, error };
    }
};

const fetchGoogleEvents = async (accessToken: string) => {
    const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }
    );
    
    const data = await response.json();
    return data.items || [];
};

const calculateDuration = (event: any) => {
    const start = new Date(event.start.dateTime);
    const end = new Date(event.end.dateTime);
    return Math.round((end.getTime() - start.getTime()) / 60000); // minutos
};
```

### **C) Criação de Agendamento**

**Arquivo:** `components/agenda/AppointmentSheet.tsx`

```typescript
const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        toast.error('Usuário não autenticado');
        return;
    }

    const payload = {
        clinic_id: profile.clinic_id,
        patient_id: formData.patient_id,
        doctor_id: user.id,  // ✅ Mesmo ID do auth (não usar professional_id)
        date: new Date(`${formData.date}T${formData.time}`).toISOString(),
        duration: formData.duration,
        type: formData.type,
        status: formData.status,
        notes: formData.notes
    };

    const { error } = await supabase
        .from('appointments')
        .insert(payload);

    if (error) {
        toast.error('Erro ao criar agendamento');
        console.error(error);
        return;
    }

    toast.success('Agendamento criado com sucesso!');
    onSuccess();
};
```

### **D) AuthContext - Carregar Dados Corretos**

**Arquivo:** `contexts/AuthContext.tsx`

```typescript
const loadUserProfile = async (userId: string) => {
    try {
        // Buscar dados completos do usuário
        const { data: userProfile, error } = await supabase
            .from('users')
            .select(`
                *,
                professional:professionals!professional_id(
                    id,
                    name,
                    crc,
                    specialty,
                    council
                )
            `)
            .eq('id', userId)
            .single();

        if (error) throw error;

        setProfile(userProfile);
        setUser({
            ...userProfile,
            // Não inventar campos que não existem
            // Usar apenas o que vem do banco
        });

    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
    }
};
```

---

## 🚫 ANTI-PADRÕES (NUNCA FAZER)

### ❌ 1. Criar Professional com ID Diferente
```typescript
// ❌ ERRADO
const newProfessionalId = uuid();
await supabase.from('professionals').insert({
    id: newProfessionalId,  // ❌ ID diferente do user!
    name: 'Dr. João'
});
```

### ❌ 2. Usar professional_id como Referência Principal
```typescript
// ❌ ERRADO
const doctorId = user.professional_id;  // ❌ Pode ser NULL
await supabase.from('appointments').insert({
    doctor_id: doctorId  // ❌ Indireção desnecessária
});

// ✅ CORRETO
const doctorId = user.id;  // ✅ Direto
await supabase.from('appointments').insert({
    doctor_id: doctorId
});
```

### ❌ 3. Buscar em Professionals Separado
```typescript
// ❌ ERRADO
const { data: profs } = await supabase
    .from('professionals')
    .select('*')
    .eq('clinic_id', clinicId);

// ✅ CORRETO
const { data: profs } = await supabase
    .from('users')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('is_clinical_provider', true);
```

---

## ✅ CHECKLIST DE TESTE FINAL

### **Após Implementação, Validar:**

#### **1. Agenda:**
- [ ] Lista de profissionais aparece corretamente
- [ ] Nome "Dr. Marcelo Vilas Bôas" está visível
- [ ] Cor da agenda (`agenda_color`) está aplicada
- [ ] Foto de perfil (`photo_url`) aparece (se existir)

#### **2. Google Calendar:**
- [ ] Botão "Vincular Google" funciona
- [ ] Após vincular, eventos do Google aparecem na agenda
- [ ] Criar evento no Google bloqueia horário no ClinicPro
- [ ] Deletar evento no Google desbloqueia horário

#### **3. Agendamentos:**
- [ ] Criar novo agendamento funciona
- [ ] Agendamento aparece na agenda
- [ ] `doctor_id` está correto (mesmo ID do auth)
- [ ] Editar agendamento funciona
- [ ] Deletar agendamento funciona

#### **4. Integridade de Dados:**
- [ ] Nenhum erro 400 "usuário não encontrado"
- [ ] Nenhum erro de FK constraint
- [ ] Nenhum registro órfão em `appointments`
- [ ] `users.professional_id` aponta para si mesmo

---

## 📊 QUERIES DE VALIDAÇÃO

### **Validar Integridade Após Deploy:**

```sql
-- 1. Verificar que todos os profissionais têm user correspondente
SELECT 
    p.id,
    p.name,
    u.id as user_id,
    CASE 
        WHEN u.id IS NULL THEN '❌ SEM USER'
        WHEN p.id != u.id THEN '⚠️ ID DIFERENTE'
        ELSE '✅ OK'
    END as status
FROM professionals p
LEFT JOIN users u ON p.id = u.id;

-- 2. Verificar appointments órfãos
SELECT 
    a.id,
    a.doctor_id,
    u.name as doctor_name,
    CASE 
        WHEN u.id IS NULL THEN '❌ ÓRFÃO'
        ELSE '✅ OK'
    END as status
FROM appointments a
LEFT JOIN users u ON a.doctor_id = u.id
WHERE a.date >= CURRENT_DATE;

-- 3. Verificar user_integrations
SELECT 
    ui.id,
    ui.user_id,
    ui.provider,
    u.name as user_name,
    CASE 
        WHEN u.id IS NULL THEN '❌ ÓRFÃO'
        ELSE '✅ OK'
    END as status
FROM user_integrations ui
LEFT JOIN users u ON ui.user_id = u.id;

-- 4. Verificar auto-referência
SELECT 
    id,
    name,
    email,
    professional_id,
    CASE 
        WHEN professional_id = id THEN '✅ OK'
        WHEN professional_id IS NULL THEN '⚠️ NULL'
        ELSE '❌ DIFERENTE'
    END as status
FROM users
WHERE is_clinical_provider = true;
```

---

## 🎯 RESULTADO ESPERADO

### **Antes da Implementação:**
- ❌ Agenda vazia ou com erros
- ❌ Google Calendar não sincroniza
- ❌ Erro 400 ao criar agendamento
- ❌ Profissionais duplicados

### **Depois da Implementação:**
- ✅ Agenda mostra todos os profissionais
- ✅ Google Calendar sincroniza perfeitamente
- ✅ Criar agendamento funciona sem erros
- ✅ ID ÚNICO em todo o sistema
- ✅ Histórico clínico preservado
- ✅ High Ticket (lifting facial) amarrado ao CPF correto

---

## 📝 RESUMO EXECUTIVO

### **Regras de Ouro:**
1. ✅ `users.id` é a FONTE ÚNICA DA VERDADE
2. ✅ `professionals.id` DEVE SER IGUAL a `users.id`
3. ✅ `appointments.doctor_id` aponta para `users.id`
4. ✅ `user_integrations.user_id` aponta para `users.id`
5. ✅ Usar `is_clinical_provider = true` para filtrar profissionais
6. ✅ Usar `agenda_color` e `photo_url` de `users`

### **Nunca Fazer:**
1. ❌ Criar professional com ID diferente de user
2. ❌ Usar `professional_id` como referência principal
3. ❌ Buscar em `professionals` como fonte principal
4. ❌ Inventar campos que não existem no banco

---

**Status:** ✅ **INFRAESTRUTURA UNIFICADA - PRONTA PARA DEPLOY**

**Próximo Passo:** Implementar frontend e backend seguindo estas diretrizes rigorosamente.

---

**Assinado:**  
Dr. Marcelo Vilas Bôas & Engenheiro Sênior de Sistemas  
Data: 03/01/2026 08:20
