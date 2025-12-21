import { supabase } from '../lib/supabase';

// =====================================================
// MULTI-TENANT TYCOON - 3 CLINIC SIMULATION
// Versão: BOS 19.6
// Objetivo: Criar 3 clínicas com cenários distintos
// =====================================================

// Cores para logs
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

const log = {
    info: (msg: string) => console.log(`${colors.cyan}ℹ ${msg}${colors.reset}`),
    success: (msg: string) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
    warning: (msg: string) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
    error: (msg: string) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
    diamond: (msg: string) => console.log(`${colors.blue}💎 ${msg}${colors.reset}`),
    gold: (msg: string) => console.log(`${colors.yellow}🥇 ${msg}${colors.reset}`),
    silver: (msg: string) => console.log(`${colors.magenta}🥈 ${msg}${colors.reset}`),
    crisis: (msg: string) => console.log(`${colors.red}🚨 ${msg}${colors.reset}`),
    clinic: (msg: string) => console.log(`${colors.bright}${colors.cyan}🏥 ${msg}${colors.reset}`)
};

// =====================================================
// HELPERS
// =====================================================

function daysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
}

function daysFromNow(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
}

// =====================================================
// CLINIC CONFIGURATIONS
// =====================================================

const CLINICS = [
    {
        name: 'Instituto Vilas - Matriz',
        code: 'MATRIZ',
        email: 'matriz@institutovilas.com.br',
        phone: '(11) 3000-1000',
        difficulty: '🔥 DIFÍCIL',
        scenario: 'CRISE FINANCEIRA',
        description: 'Clínica tradicional que fatura bem, mas gasta mal. Dívidas vencendo em 48h.'
    },
    {
        name: 'Vilas Prime - Jardins',
        code: 'PRIME',
        email: 'prime@institutovilas.com.br',
        phone: '(11) 3000-2000',
        difficulty: '⚖️ MÉDIA',
        scenario: 'RECORRÊNCIA/LTV',
        description: 'Unidade focada em HOF e Ortodontia. Caixa estável, mas LTV baixo.'
    },
    {
        name: 'Vilas Franchise - Unidade 01',
        code: 'START',
        email: 'start@institutovilas.com.br',
        phone: '(11) 3000-3000',
        difficulty: '🛡️ TÁTICA',
        scenario: 'STARTUP',
        description: 'Clínica recém-inaugurada. Zero pacientes, agenda vazia, custo fixo alto.'
    }
];

// =====================================================
// MAIN SEED FUNCTION
// =====================================================

async function seedMultiTenantTycoon() {
    console.log(`\n${colors.bright}${colors.magenta}╔════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.bright}${colors.magenta}║  🌍 MULTI-TENANT TYCOON - SIMULATION v19.6  ║${colors.reset}`);
    console.log(`${colors.bright}${colors.magenta}╚════════════════════════════════════════════════╝${colors.reset}\n`);

    const clinicIds: Record<string, string> = {};
    const procedureIds: Record<string, Record<string, string>> = {};

    try {
        // =====================================================
        // PASSO 1: CRIAR AS 3 CLÍNICAS
        // =====================================================
        log.clinic('PASSO 1: Criando as 3 Clínicas Tycoon...\n');

        for (const clinic of CLINICS) {
            const { data, error } = await supabase
                .from('clinics')
                .upsert({
                    name: clinic.name,
                    email: clinic.email,
                    phone: clinic.phone,
                    active: true
                }, { onConflict: 'email' })
                .select()
                .single();

            if (error) throw error;

            clinicIds[clinic.code] = data.id;
            log.success(`${clinic.name} (${clinic.difficulty})`);
            log.info(`   Cenário: ${clinic.scenario}`);
            log.info(`   ${clinic.description}\n`);
        }

        // =====================================================
        // PASSO 2: CRIAR PROCEDIMENTOS PARA CADA CLÍNICA
        // =====================================================
        log.info('PASSO 2: Criando Procedimentos Inteligentes...\n');

        const baseProcedures = [
            { name: 'Cervicoplastia Premium', category: 'CIRURGIA', price: 22000, is_recurring: false, recurrence_period_days: null },
            { name: 'Protocolo All-on-4', category: 'IMPLANTE', price: 35000, is_recurring: false, recurrence_period_days: null },
            { name: 'Toxina Botulínica', category: 'HOF', price: 1500, is_recurring: true, recurrence_period_days: 120 },
            { name: 'Manutenção Ortodôntica', category: 'ORTODONTIA', price: 200, is_recurring: true, recurrence_period_days: 30 },
            { name: 'Lentes de Contato Dental', category: 'ESTETICA', price: 8000, is_recurring: false, recurrence_period_days: null }
        ];

        for (const [code, clinicId] of Object.entries(clinicIds)) {
            procedureIds[code] = {};

            for (const proc of baseProcedures) {
                const { data, error } = await supabase
                    .from('procedures')
                    .upsert({
                        clinic_id: clinicId,
                        ...proc
                    }, { onConflict: 'clinic_id,name' })
                    .select()
                    .single();

                if (!error && data) {
                    procedureIds[code][proc.name] = data.id;
                }
            }

            log.success(`Procedimentos criados para ${code}`);
        }

        // =====================================================
        // PASSO 3: POPULAR CLÍNICA A - MATRIZ (CRISE)
        // =====================================================
        log.crisis('\n\nPASSO 3: Populando CLÍNICA A - MATRIZ (CRISE FINANCEIRA)...\n');

        const matrizId = clinicIds.MATRIZ;

        // Criar equipe Matriz
        const matrizTeam = [
            { name: 'Dr. House Matriz', email: 'dr.house@matriz.vilas.com', role: 'PROFESSIONAL', color: '#3B82F6' },
            { name: 'Ana Hunter Matriz', email: 'crc.matriz@vilas.com', role: 'CRC', color: '#F59E0B' },
            { name: 'Julia Matriz', email: 'recep.matriz@vilas.com', role: 'RECEPTIONIST', color: '#8B5CF6' }
        ];

        const matrizUserIds: Record<string, string> = {};

        for (const member of matrizTeam) {
            const { data } = await supabase
                .from('users')
                .upsert({
                    clinic_id: matrizId,
                    ...member,
                    active: true
                }, { onConflict: 'email' })
                .select()
                .single();

            if (data) matrizUserIds[member.name] = data.id;
        }

        log.success('Equipe Matriz criada');

        // Injetar CRISE FINANCEIRA
        const matrizExpenses = [
            { description: 'Fornecedor de Implantes', value: 10000, due_date: daysFromNow(2) },
            { description: 'Laboratório de Próteses', value: 7000, due_date: daysFromNow(2) },
            { description: 'Aluguel da Clínica', value: 5000, due_date: daysFromNow(3) },
            { description: 'Energia Elétrica', value: 2000, due_date: daysFromNow(3) },
            { description: 'Materiais Odontológicos', value: 1000, due_date: daysFromNow(1) }
        ];

        for (const expense of matrizExpenses) {
            await supabase.from('expenses').insert({
                clinic_id: matrizId,
                ...expense,
                category: 'FORNECEDORES',
                status: 'PENDING',
                payment_method: 'BOLETO'
            });
        }

        log.crisis(`Dívidas injetadas: R$ ${matrizExpenses.reduce((sum, e) => sum + e.value, 0).toLocaleString('pt-BR')}`);

        // Criar 5 OPORTUNIDADES DIAMANTE
        log.diamond('Criando 5 Oportunidades DIAMANTE...');

        for (let i = 1; i <= 5; i++) {
            const { data: patient } = await supabase
                .from('patients')
                .insert({
                    clinic_id: matrizId,
                    name: `Paciente Diamante Matriz ${i}`,
                    phone: `(11) 9${Math.floor(Math.random() * 10000)}-${Math.floor(Math.random() * 10000)}`,
                    email: `diamante.matriz${i}@email.com`,
                    status: 'Em Tratamento'
                })
                .select()
                .single();

            if (patient) {
                const { data: budget } = await supabase
                    .from('budgets')
                    .insert({
                        clinic_id: matrizId,
                        patient_id: patient.id,
                        doctor_id: matrizUserIds['Dr. House Matriz'],
                        created_by_user_id: matrizUserIds['Ana Hunter Matriz'],
                        status: 'DRAFT',
                        total_value: 22000,
                        final_value: 22000,
                        discount: 0,
                        updated_at: daysAgo(3),
                        created_at: daysAgo(3)
                    })
                    .select()
                    .single();

                if (budget) {
                    await supabase.from('budget_items').insert({
                        budget_id: budget.id,
                        procedure_id: procedureIds.MATRIZ['Cervicoplastia Premium'],
                        procedure_name: 'Cervicoplastia Premium',
                        quantity: 1,
                        unit_value: 22000,
                        total_value: 22000
                    });
                }
            }
        }

        log.diamond('5 Diamantes criados (R$ 110k em potencial)');

        // =====================================================
        // PASSO 4: POPULAR CLÍNICA B - PRIME (RECORRÊNCIA)
        // =====================================================
        log.gold('\n\nPASSO 4: Populando CLÍNICA B - PRIME (RECORRÊNCIA/LTV)...\n');

        const primeId = clinicIds.PRIME;

        // Criar equipe Prime
        const primeTeam = [
            { name: 'Dra. Novata Prime', email: 'dra.novata@prime.vilas.com', role: 'PROFESSIONAL', color: '#EC4899' },
            { name: 'Ana Prime', email: 'crc.prime@vilas.com', role: 'CRC', color: '#F59E0B' }
        ];

        const primeUserIds: Record<string, string> = {};

        for (const member of primeTeam) {
            const { data } = await supabase
                .from('users')
                .upsert({
                    clinic_id: primeId,
                    ...member,
                    active: true
                }, { onConflict: 'email' })
                .select()
                .single();

            if (data) primeUserIds[member.name] = data.id;
        }

        log.success('Equipe Prime criada');

        // Criar 30 OPORTUNIDADES PRATA (Botox)
        log.silver('Criando 30 Oportunidades PRATA (Botox Vencido)...');

        for (let i = 1; i <= 30; i++) {
            const { data: patient } = await supabase
                .from('patients')
                .insert({
                    clinic_id: primeId,
                    name: `Paciente Botox Prime ${i}`,
                    phone: `(11) 9${Math.floor(Math.random() * 10000)}-${Math.floor(Math.random() * 10000)}`,
                    email: `botox.prime${i}@email.com`,
                    status: 'Em Tratamento'
                })
                .select()
                .single();

            if (patient) {
                await supabase.from('treatment_items').insert({
                    clinic_id: primeId,
                    patient_id: patient.id,
                    procedure_id: procedureIds.PRIME['Toxina Botulínica'],
                    procedure_name: 'Toxina Botulínica',
                    execution_date: daysAgo(125),
                    status: 'COMPLETED',
                    value: 1500
                });
            }
        }

        log.silver('30 Botox vencidos criados (R$ 45k em potencial)');

        // Criar 20 OPORTUNIDADES PRATA (Ortodontia)
        log.silver('Criando 20 Oportunidades PRATA (Ortodontia Atrasada)...');

        for (let i = 1; i <= 20; i++) {
            const { data: patient } = await supabase
                .from('patients')
                .insert({
                    clinic_id: primeId,
                    name: `Paciente Orto Prime ${i}`,
                    phone: `(11) 9${Math.floor(Math.random() * 10000)}-${Math.floor(Math.random() * 10000)}`,
                    email: `orto.prime${i}@email.com`,
                    status: 'Em Tratamento'
                })
                .select()
                .single();

            if (patient) {
                await supabase.from('treatment_items').insert({
                    clinic_id: primeId,
                    patient_id: patient.id,
                    procedure_id: procedureIds.PRIME['Manutenção Ortodôntica'],
                    procedure_name: 'Manutenção Ortodôntica',
                    execution_date: daysAgo(45),
                    status: 'COMPLETED',
                    value: 200
                });
            }
        }

        log.silver('20 Ortodontias atrasadas criadas (R$ 4k em potencial)');

        // =====================================================
        // PASSO 5: POPULAR CLÍNICA C - START (STARTUP)
        // =====================================================
        log.info('\n\nPASSO 5: Populando CLÍNICA C - START (STARTUP)...\n');

        const startId = clinicIds.START;

        // Criar equipe Start (mínima)
        const startTeam = [
            { name: 'Julia Start', email: 'recep.start@vilas.com', role: 'RECEPTIONIST', color: '#8B5CF6' },
            { name: 'CRC Start', email: 'crc.start@vilas.com', role: 'CRC', color: '#F59E0B' }
        ];

        for (const member of startTeam) {
            await supabase
                .from('users')
                .upsert({
                    clinic_id: startId,
                    ...member,
                    active: true
                }, { onConflict: 'email' })
                .select()
                .single();
        }

        log.success('Equipe Start criada (mínima)');

        // Criar 20 LEADS NOVOS (CRM)
        log.gold('Criando 20 Leads Novos (CRM)...');

        for (let i = 1; i <= 20; i++) {
            await supabase.from('patients').insert({
                clinic_id: startId,
                name: `Lead Start ${i}`,
                phone: `(11) 9${Math.floor(Math.random() * 10000)}-${Math.floor(Math.random() * 10000)}`,
                email: `lead.start${i}@email.com`,
                status: 'Lead',
                source: i % 2 === 0 ? 'Instagram' : 'Google Ads'
            });
        }

        log.gold('20 Leads criados (Agenda vazia, precisa converter)');

        // =====================================================
        // RESUMO FINAL
        // =====================================================
        console.log(`\n${colors.bright}${colors.green}╔════════════════════════════════════════════════╗${colors.reset}`);
        console.log(`${colors.bright}${colors.green}║     ✅ MULTI-TENANT TYCOON PRONTO - v19.6     ║${colors.reset}`);
        console.log(`${colors.bright}${colors.green}╚════════════════════════════════════════════════╝${colors.reset}\n`);

        console.log(`${colors.bright}🌍 3 CLÍNICAS CRIADAS:${colors.reset}\n`);

        console.log(`${colors.red}🏥 CLÍNICA A - MATRIZ (🔥 DIFÍCIL)${colors.reset}`);
        console.log(`   Cenário: CRISE FINANCEIRA`);
        console.log(`   Dívidas: R$ 25.000 (vencendo em 2-3 dias)`);
        console.log(`   Radar: 5 Diamantes (R$ 110k potencial)`);
        console.log(`   Objetivo: Converter 1 Diamante para salvar o caixa\n`);

        console.log(`${colors.yellow}🏥 CLÍNICA B - PRIME (⚖️ MÉDIA)${colors.reset}`);
        console.log(`   Cenário: RECORRÊNCIA/LTV`);
        console.log(`   Caixa: Estável`);
        console.log(`   Radar: 50 Pratas (30 Botox + 20 Orto)`);
        console.log(`   Objetivo: Ativar recorrência para aumentar LTV\n`);

        console.log(`${colors.cyan}🏥 CLÍNICA C - START (🛡️ TÁTICA)${colors.reset}`);
        console.log(`   Cenário: STARTUP`);
        console.log(`   Agenda: Vazia`);
        console.log(`   CRM: 20 Leads novos`);
        console.log(`   Objetivo: Converter leads em primeiros agendamentos\n`);

        console.log(`${colors.bright}${colors.magenta}🎮 COMO JOGAR:${colors.reset}`);
        console.log(`  1. Login como ADMIN`);
        console.log(`  2. Trocar de clínica no seletor (header)`);
        console.log(`  3. Cada clínica = 1 desafio diferente`);
        console.log(`  4. Use o Radar e War Room para vencer!\n`);

    } catch (error) {
        log.error(`Erro durante a simulação: ${error}`);
        throw error;
    }
}

// Executar
seedMultiTenantTycoon()
    .then(() => {
        console.log(`${colors.green}${colors.bright}✓ Script concluído com sucesso!${colors.reset}\n`);
        process.exit(0);
    })
    .catch((error) => {
        console.error(`${colors.red}✗ Erro fatal:${colors.reset}`, error);
        process.exit(1);
    });

// =====================================================
// CLINIC TYCOON - SIMULATION SEED SCRIPT
// Versão: BOS 19.5
// Objetivo: Popular banco com cenário de crise + oportunidades
// =====================================================

const SIMULATION_CLINIC_NAME = 'Instituto Vilas - Simulação Tycoon';

// Cores para logs
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

const log = {
    info: (msg: string) => console.log(`${colors.cyan}ℹ ${msg}${colors.reset}`),
    success: (msg: string) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
    warning: (msg: string) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
    error: (msg: string) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
    diamond: (msg: string) => console.log(`${colors.blue}💎 ${msg}${colors.reset}`),
    gold: (msg: string) => console.log(`${colors.yellow}🥇 ${msg}${colors.reset}`),
    silver: (msg: string) => console.log(`${colors.magenta}🥈 ${msg}${colors.reset}`),
    crisis: (msg: string) => console.log(`${colors.red}🚨 ${msg}${colors.reset}`)
};

// =====================================================
// HELPERS
// =====================================================

function daysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
}

function daysFromNow(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
}

// =====================================================
// MAIN SEED FUNCTION
// =====================================================

async function seedSimulationChaos() {
    console.log(`\n${colors.bright}${colors.magenta}╔════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.bright}${colors.magenta}║   🎮 CLINIC TYCOON - SIMULATION MODE v19.5   ║${colors.reset}`);
    console.log(`${colors.bright}${colors.magenta}╚════════════════════════════════════════════════╝${colors.reset}\n`);

    try {
        // 1. CRIAR/BUSCAR CLÍNICA
        log.info('Fase 1: Preparando Clínica de Simulação...');

        let clinicId: string;
        const { data: existingClinic } = await supabase
            .from('clinics')
            .select('id')
            .eq('name', SIMULATION_CLINIC_NAME)
            .single();

        if (existingClinic) {
            clinicId = existingClinic.id;
            log.warning(`Clínica de simulação já existe (ID: ${clinicId})`);
        } else {
            const { data: newClinic, error } = await supabase
                .from('clinics')
                .insert({
                    name: SIMULATION_CLINIC_NAME,
                    email: 'simulacao@institutovilas.com.br',
                    phone: '(11) 99999-9999',
                    active: true
                })
                .select()
                .single();

            if (error) throw error;
            clinicId = newClinic.id;
            log.success(`Clínica criada (ID: ${clinicId})`);
        }

        // 2. CRIAR PROCEDIMENTOS INTELIGENTES
        log.info('\nFase 2: Criando Procedimentos Inteligentes...');

        const procedures = [
            { name: 'Cervicoplastia Premium', category: 'CIRURGIA', price: 20000, is_recurring: false, recurrence_period_days: null },
            { name: 'Protocolo All-on-4', category: 'IMPLANTE', price: 35000, is_recurring: false, recurrence_period_days: null },
            { name: 'Toxina Botulínica', category: 'HOF', price: 1500, is_recurring: true, recurrence_period_days: 120 },
            { name: 'Manutenção Ortodôntica', category: 'ORTODONTIA', price: 200, is_recurring: true, recurrence_period_days: 30 },
            { name: 'Lentes de Contato Dental', category: 'ESTETICA', price: 8000, is_recurring: false, recurrence_period_days: null }
        ];

        const procedureIds: Record<string, string> = {};

        for (const proc of procedures) {
            const { data, error } = await supabase
                .from('procedures')
                .upsert({
                    clinic_id: clinicId,
                    ...proc
                }, { onConflict: 'clinic_id,name' })
                .select()
                .single();

            if (!error && data) {
                procedureIds[proc.name] = data.id;
                log.success(`Procedimento: ${proc.name} (${proc.is_recurring ? 'Recorrente' : 'Único'})`);
            }
        }

        // 3. CRIAR EQUIPE (CASTING)
        log.info('\nFase 3: Montando o Casting (Equipe com Personalidade)...');

        const team = [
            { name: 'Dr. House', email: 'dr.house@simulacao.com', role: 'PROFESSIONAL', color: '#3B82F6' },
            { name: 'Dra. Novata', email: 'dra.novata@simulacao.com', role: 'PROFESSIONAL', color: '#EC4899' },
            { name: 'Dr. Apressado', email: 'dr.apressado@simulacao.com', role: 'PROFESSIONAL', color: '#10B981' },
            { name: 'Ana Hunter', email: 'ana.hunter@simulacao.com', role: 'CRC', color: '#F59E0B' },
            { name: 'Julia Organizada', email: 'julia@simulacao.com', role: 'RECEPTIONIST', color: '#8B5CF6' }
        ];

        const userIds: Record<string, string> = {};

        for (const member of team) {
            const { data, error } = await supabase
                .from('users')
                .upsert({
                    clinic_id: clinicId,
                    ...member,
                    active: true
                }, { onConflict: 'email' })
                .select()
                .single();

            if (!error && data) {
                userIds[member.name] = data.id;
                log.success(`${member.role}: ${member.name}`);
            }
        }

        // 4. CRIAR CRISE FINANCEIRA
        log.crisis('\nFase 4: Injetando Crise Financeira (War Room)...');

        // Despesas vencendo
        const expenses = [
            { description: 'Fornecedor de Implantes', value: 8000, due_date: daysFromNow(2) },
            { description: 'Laboratório de Próteses', value: 4500, due_date: daysFromNow(3) },
            { description: 'Aluguel da Clínica', value: 3500, due_date: daysFromNow(5) },
            { description: 'Energia Elétrica', value: 1200, due_date: daysFromNow(4) },
            { description: 'Materiais Odontológicos', value: 800, due_date: daysFromNow(1) }
        ];

        for (const expense of expenses) {
            await supabase.from('expenses').insert({
                clinic_id: clinicId,
                ...expense,
                category: 'FORNECEDORES',
                status: 'PENDING',
                payment_method: 'BOLETO'
            });
        }

        log.crisis(`Contas a pagar: R$ ${expenses.reduce((sum, e) => sum + e.value, 0).toLocaleString('pt-BR')}`);

        // 5. CRIAR PACIENTES DIAMANTE (High-Ticket Parado)
        log.diamond('\nFase 5: Criando 5 Oportunidades DIAMANTE (High-Ticket Parado)...');

        const diamondPatients = [
            'Maria Diamante Silva',
            'João Diamante Oliveira',
            'Ana Diamante Costa',
            'Carlos Diamante Santos',
            'Beatriz Diamante Ferreira'
        ];

        for (const patientName of diamondPatients) {
            // Criar paciente
            const { data: patient } = await supabase
                .from('patients')
                .insert({
                    clinic_id: clinicId,
                    name: patientName,
                    phone: `(11) 9${Math.floor(Math.random() * 10000)}-${Math.floor(Math.random() * 10000)}`,
                    email: `${patientName.toLowerCase().replace(/\s/g, '.')}@email.com`,
                    status: 'Em Tratamento'
                })
                .select()
                .single();

            if (patient) {
                // Criar orçamento parado
                const { data: budget } = await supabase
                    .from('budgets')
                    .insert({
                        clinic_id: clinicId,
                        patient_id: patient.id,
                        doctor_id: userIds['Dr. House'],
                        created_by_user_id: userIds['Ana Hunter'],
                        status: 'DRAFT',
                        total_value: 22000,
                        final_value: 22000,
                        discount: 0,
                        updated_at: daysAgo(3), // 3 dias parado
                        created_at: daysAgo(3)
                    })
                    .select()
                    .single();

                if (budget) {
                    // Adicionar item (Cervicoplastia)
                    await supabase.from('budget_items').insert({
                        budget_id: budget.id,
                        procedure_id: procedureIds['Cervicoplastia Premium'],
                        procedure_name: 'Cervicoplastia Premium',
                        quantity: 1,
                        unit_value: 22000,
                        total_value: 22000
                    });

                    log.diamond(`${patientName} - R$ 22.000 (3 dias parado)`);
                }
            }
        }

        // 6. CRIAR PACIENTES OURO (Avaliação sem Orçamento)
        log.gold('\nFase 6: Criando 15 Oportunidades OURO (Limbo de Avaliação)...');

        const goldPatients = Array.from({ length: 15 }, (_, i) => `Paciente Ouro ${i + 1}`);

        for (const patientName of goldPatients) {
            const { data: patient } = await supabase
                .from('patients')
                .insert({
                    clinic_id: clinicId,
                    name: patientName,
                    phone: `(11) 9${Math.floor(Math.random() * 10000)}-${Math.floor(Math.random() * 10000)}`,
                    email: `${patientName.toLowerCase().replace(/\s/g, '.')}@email.com`,
                    status: 'Lead'
                })
                .select()
                .single();

            if (patient) {
                // Criar avaliação concluída (sem orçamento)
                await supabase.from('appointments').insert({
                    clinic_id: clinicId,
                    patient_id: patient.id,
                    professional_id: userIds['Dra. Novata'],
                    date: daysAgo(Math.floor(Math.random() * 10) + 1), // 1-10 dias atrás
                    type: 'EVALUATION',
                    status: 'COMPLETED',
                    duration: 60
                });

                log.gold(`${patientName} - Avaliação concluída (SEM orçamento)`);
            }
        }

        // 7. CRIAR PACIENTES PRATA (Recorrência Vencida)
        log.silver('\nFase 7: Criando 50 Oportunidades PRATA (Recorrência Vencida)...');

        // Grupo Botox (20 pacientes)
        for (let i = 1; i <= 20; i++) {
            const { data: patient } = await supabase
                .from('patients')
                .insert({
                    clinic_id: clinicId,
                    name: `Paciente Botox ${i}`,
                    phone: `(11) 9${Math.floor(Math.random() * 10000)}-${Math.floor(Math.random() * 10000)}`,
                    email: `botox${i}@email.com`,
                    status: 'Em Tratamento'
                })
                .select()
                .single();

            if (patient) {
                // Criar tratamento de Botox há 125 dias
                await supabase.from('treatment_items').insert({
                    clinic_id: clinicId,
                    patient_id: patient.id,
                    procedure_id: procedureIds['Toxina Botulínica'],
                    procedure_name: 'Toxina Botulínica',
                    execution_date: daysAgo(125),
                    status: 'COMPLETED',
                    value: 1500
                });

                if (i % 5 === 0) log.silver(`Botox ${i}/20 - Vencido há 5 dias`);
            }
        }

        // Grupo Ortodontia (30 pacientes)
        for (let i = 1; i <= 30; i++) {
            const { data: patient } = await supabase
                .from('patients')
                .insert({
                    clinic_id: clinicId,
                    name: `Paciente Orto ${i}`,
                    phone: `(11) 9${Math.floor(Math.random() * 10000)}-${Math.floor(Math.random() * 10000)}`,
                    email: `orto${i}@email.com`,
                    status: 'Em Tratamento'
                })
                .select()
                .single();

            if (patient) {
                // Criar manutenção ortodôntica há 45 dias
                await supabase.from('treatment_items').insert({
                    clinic_id: clinicId,
                    patient_id: patient.id,
                    procedure_id: procedureIds['Manutenção Ortodôntica'],
                    procedure_name: 'Manutenção Ortodôntica',
                    execution_date: daysAgo(45),
                    status: 'COMPLETED',
                    value: 200
                });

                if (i % 10 === 0) log.silver(`Ortodontia ${i}/30 - Atrasado 15 dias`);
            }
        }

        // 8. RESUMO FINAL
        console.log(`\n${colors.bright}${colors.green}╔════════════════════════════════════════════════╗${colors.reset}`);
        console.log(`${colors.bright}${colors.green}║        ✅ SIMULAÇÃO PRONTA - BOS 19.5         ║${colors.reset}`);
        console.log(`${colors.bright}${colors.green}╚════════════════════════════════════════════════╝${colors.reset}\n`);

        console.log(`${colors.bright}📊 RESUMO DO CENÁRIO:${colors.reset}\n`);
        console.log(`  🏥 Clínica: ${SIMULATION_CLINIC_NAME}`);
        console.log(`  👥 Equipe: 5 membros (3 Profissionais, 1 CRC, 1 Recepcionista)`);
        console.log(`  📦 Procedimentos: 5 (2 recorrentes configurados)\n`);

        console.log(`  ${colors.red}🚨 CRISE FINANCEIRA:${colors.reset}`);
        console.log(`     💸 Contas a pagar (5 dias): R$ 18.000,00`);
        console.log(`     💰 Objetivo: Gerar R$ 13.500+ em vendas urgentes\n`);

        console.log(`  ${colors.blue}💎 OPORTUNIDADES DIAMANTE: 5${colors.reset}`);
        console.log(`     Orçamentos de R$ 22k parados há 3 dias\n`);

        console.log(`  ${colors.yellow}🥇 OPORTUNIDADES OURO: 15${colors.reset}`);
        console.log(`     Avaliações concluídas sem orçamento\n`);

        console.log(`  ${colors.magenta}🥈 OPORTUNIDADES PRATA: 50${colors.reset}`);
        console.log(`     20 Botox vencidos + 30 Ortodontia atrasadas\n`);

        console.log(`${colors.bright}${colors.cyan}🎮 PRÓXIMOS PASSOS:${colors.reset}`);
        console.log(`  1. Acesse o Dashboard como ADMIN`);
        console.log(`  2. Veja o War Room em VERMELHO (crise financeira)`);
        console.log(`  3. Abra o Radar de Oportunidades (70 leads!)`);
        console.log(`  4. Use o WhatsApp para converter Diamantes`);
        console.log(`  5. Salve a clínica antes de sexta-feira! 🚀\n`);

    } catch (error) {
        log.error(`Erro durante a simulação: ${error}`);
        throw error;
    }
}

// Executar
seedSimulationChaos()
    .then(() => {
        console.log(`${colors.green}${colors.bright}✓ Script concluído com sucesso!${colors.reset}\n`);
        process.exit(0);
    })
    .catch((error) => {
        console.error(`${colors.red}✗ Erro fatal:${colors.reset}`, error);
        process.exit(1);
    });
