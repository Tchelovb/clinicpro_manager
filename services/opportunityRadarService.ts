import { supabase } from '../lib/supabase';

// =====================================================
// TIPOS E INTERFACES
// =====================================================

export type OpportunityTier = 'DIAMOND' | 'GOLD' | 'SILVER';

export interface OpportunityBase {
    id: string;
    tier: OpportunityTier;
    score: number;
    patient_id: string;
    patient_name: string;
    patient_phone: string;
    patient_email?: string;
    estimated_value: number;
    days_waiting: number;
    category: string;
    action_label: string;
    whatsapp_script: string;
    created_at: string;
}

export interface DiamondOpportunity extends OpportunityBase {
    tier: 'DIAMOND';
    budget_id: string;
    budget_value: number;
    procedures: string[];
    last_update: string;
}

export interface GoldOpportunity extends OpportunityBase {
    tier: 'GOLD';
    appointment_id: string;
    appointment_date: string;
    appointment_type: string;
    specialty: string;
}

export interface SilverOpportunity extends OpportunityBase {
    tier: 'SILVER';
    subtype: 'BOTOX_RENEWAL' | 'ORTHO_MAINTENANCE' | 'REACTIVATION';
    last_visit?: string;
    last_procedure?: string;
}

export type Opportunity = DiamondOpportunity | GoldOpportunity | SilverOpportunity;

export interface RadarStats {
    totalOpportunities: number;
    totalEstimatedValue: number;
    diamondCount: number;
    goldCount: number;
    silverCount: number;
    urgentCount: number; // > 7 dias esperando
}

// =====================================================
// CONSTANTES
// =====================================================

const TIER_SCORES = {
    DIAMOND: 100,
    GOLD: 50,
    SILVER: 20
};

const DIAMOND_THRESHOLD = 10000; // R$ 10.000
const DIAMOND_STALE_HOURS = 48;
const GOLD_EVALUATION_DAYS = 15;
const BOTOX_RENEWAL_DAYS = 120; // 4 meses
const ORTHO_MAINTENANCE_DAYS = 30;
const REACTIVATION_MONTHS = 6;

// =====================================================
// SERVICE
// =====================================================

export const opportunityRadarService = {

    // 💎 CAMADA DIAMANTE: High-Ticket Parados
    async getDiamondOpportunities(clinicId: string): Promise<DiamondOpportunity[]> {
        const staleDate = new Date();
        staleDate.setHours(staleDate.getHours() - DIAMOND_STALE_HOURS);

        const { data, error } = await supabase
            .from('budgets')
            .select(`
        id,
        patient_id,
        total_value,
        final_value,
        updated_at,
        created_at,
        patient:patients(name, phone, email),
        items:budget_items(procedure_name)
      `)
            .eq('clinic_id', clinicId)
            .gte('total_value', DIAMOND_THRESHOLD)
            .in('status', ['DRAFT', 'SENT'])
            .lte('updated_at', staleDate.toISOString())
            .order('total_value', { ascending: false });

        if (error) throw error;

        return data?.map(budget => {
            const daysWaiting = Math.floor(
                (Date.now() - new Date(budget.updated_at).getTime()) / (1000 * 60 * 60 * 24)
            );

            const procedures = budget.items?.map((i: any) => i.procedure_name) || [];
            const category = this.categorizeProcedures(procedures);

            return {
                id: `diamond-${budget.id}`,
                tier: 'DIAMOND',
                score: TIER_SCORES.DIAMOND + (daysWaiting * 2), // Urgência aumenta score
                patient_id: budget.patient_id,
                patient_name: budget.patient?.name || 'N/A',
                patient_phone: budget.patient?.phone || '',
                patient_email: budget.patient?.email,
                estimated_value: budget.final_value,
                days_waiting: daysWaiting,
                category,
                action_label: 'Resgatar Orçamento High-Ticket',
                whatsapp_script: this.generateDiamondScript(
                    budget.patient?.name || 'paciente',
                    procedures,
                    budget.final_value
                ),
                budget_id: budget.id,
                budget_value: budget.final_value,
                procedures,
                last_update: budget.updated_at,
                created_at: budget.created_at
            };
        }) || [];
    },

    // 🥇 CAMADA OURO: Avaliação sem Orçamento
    async getGoldOpportunities(clinicId: string): Promise<GoldOpportunity[]> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - GOLD_EVALUATION_DAYS);

        // 1. Buscar consultas de avaliação concluídas
        const { data: appointments, error: apptError } = await supabase
            .from('appointments')
            .select(`
        id,
        patient_id,
        date,
        type,
        patient:patients(id, name, phone, email)
      `)
            .eq('clinic_id', clinicId)
            .eq('status', 'COMPLETED')
            .in('type', ['EVALUATION', 'CONSULTA'])
            .gte('date', cutoffDate.toISOString())
            .order('date', { ascending: false });

        if (apptError) throw apptError;

        // 2. Filtrar apenas pacientes SEM orçamento
        const opportunities: GoldOpportunity[] = [];

        for (const appt of appointments || []) {
            const { data: budgets } = await supabase
                .from('budgets')
                .select('id')
                .eq('patient_id', appt.patient_id)
                .limit(1);

            if (!budgets || budgets.length === 0) {
                const daysWaiting = Math.floor(
                    (Date.now() - new Date(appt.date).getTime()) / (1000 * 60 * 60 * 24)
                );

                opportunities.push({
                    id: `gold-${appt.id}`,
                    tier: 'GOLD',
                    score: TIER_SCORES.GOLD + daysWaiting,
                    patient_id: appt.patient_id,
                    patient_name: appt.patient?.name || 'N/A',
                    patient_phone: appt.patient?.phone || '',
                    patient_email: appt.patient?.email,
                    estimated_value: 5000, // Estimativa média
                    days_waiting: daysWaiting,
                    category: 'Avaliação Pendente',
                    action_label: 'Converter em Orçamento',
                    whatsapp_script: this.generateGoldScript(
                        appt.patient?.name || 'paciente',
                        appt.type
                    ),
                    appointment_id: appt.id,
                    appointment_date: appt.date,
                    appointment_type: appt.type,
                    specialty: 'Multidisciplinar',
                    created_at: appt.date
                });
            }
        }

        return opportunities.sort((a, b) => b.score - a.score);
    },

    // 🥈 CAMADA PRATA: Recorrência e Reativação
    async getSilverOpportunities(clinicId: string): Promise<SilverOpportunity[]> {
        const opportunities: SilverOpportunity[] = [];
        const hoje = new Date();

        // 1. RECORRÊNCIA INTELIGENTE (usando procedure.is_recurring)
        // Buscar últimos tratamentos concluídos com procedimentos recorrentes
        const { data: treatmentItems, error: treatmentError } = await supabase
            .from('treatment_items')
            .select(`
                id,
                patient_id,
                procedure_id,
                execution_date,
                status,
                patient:patients(id, name, phone, email),
                procedure:procedures(id, name, is_recurring, recurrence_period_days)
            `)
            .eq('status', 'COMPLETED')
            .not('procedure_id', 'is', null)
            .order('execution_date', { ascending: false })
            .limit(200); // Limitar para performance

        if (treatmentError) {
            console.error('Erro ao buscar treatment_items:', treatmentError);
        }

        // Filtrar no código: procedimentos recorrentes que atingiram o período
        const recurrentMap = new Map<string, any>(); // Evitar duplicatas por paciente

        treatmentItems?.forEach(item => {
            // Verificar se é recorrente
            // Cast or check if procedure is array because Supabase might return it as such
            const procedure = Array.isArray(item.procedure) ? item.procedure[0] : item.procedure;

            if (!procedure?.is_recurring) return;
            if (!procedure?.recurrence_period_days) return;

            // Calcular dias passados
            const dataTratamento = new Date(item.execution_date);
            const diasPassados = Math.floor((hoje.getTime() - dataTratamento.getTime()) / (1000 * 60 * 60 * 24));

            // Verificar se atingiu o período de recorrência
            if (diasPassados >= procedure.recurrence_period_days) {
                // Evitar duplicatas (pegar apenas o mais recente por paciente)
                const key = `${item.patient_id}-${item.procedure_id}`;
                if (!recurrentMap.has(key) || recurrentMap.get(key).execution_date < item.execution_date) {
                    recurrentMap.set(key, { ...item, procedure }); // Normalize procedure structure
                }
            }
        });

        // Converter map em oportunidades
        recurrentMap.forEach((item, key) => {
            const procedureName = item.procedure?.name || 'Procedimento';
            const isBotox = procedureName.toLowerCase().includes('botox') || procedureName.toLowerCase().includes('toxina');
            const isOrtho = procedureName.toLowerCase().includes('ortodontia') || procedureName.toLowerCase().includes('manutenção');

            opportunities.push({
                id: `silver-recurrent-${item.id}`,
                tier: 'SILVER',
                score: TIER_SCORES.SILVER,
                patient_id: item.patient_id,
                patient_name: item.patient?.name || 'N/A',
                patient_phone: item.patient?.phone || '',
                patient_email: item.patient?.email,
                estimated_value: isBotox ? 1500 : isOrtho ? 800 : 1000,
                days_waiting: Math.floor((hoje.getTime() - new Date(item.execution_date).getTime()) / (1000 * 60 * 60 * 24)),
                category: `Renovação ${procedureName}`,
                action_label: 'Agendar Manutenção',
                whatsapp_script: this.generateSilverScript(
                    item.patient?.name || 'paciente',
                    isBotox ? 'BOTOX_RENEWAL' : isOrtho ? 'ORTHO_MAINTENANCE' : 'BOTOX_RENEWAL'
                ),
                subtype: isBotox ? 'BOTOX_RENEWAL' : isOrtho ? 'ORTHO_MAINTENANCE' : 'BOTOX_RENEWAL',
                last_visit: item.execution_date,
                last_procedure: procedureName,
                created_at: item.execution_date
            });
        });

        // 2. REATIVAÇÃO (6 meses sem visita)
        const reactivationDate = new Date();
        reactivationDate.setMonth(reactivationDate.getMonth() - REACTIVATION_MONTHS);

        const { data: inactivePatients } = await supabase
            .from('patients')
            .select('id, name, phone, email, updated_at')
            .eq('clinic_id', clinicId)
            .eq('status', 'Em Tratamento')
            .lt('updated_at', reactivationDate.toISOString())
            .limit(20);

        inactivePatients?.forEach(patient => {
            opportunities.push({
                id: `silver-reactivation-${patient.id}`,
                tier: 'SILVER',
                score: TIER_SCORES.SILVER - 5, // Menor prioridade
                patient_id: patient.id,
                patient_name: patient.name,
                patient_phone: patient.phone,
                patient_email: patient.email,
                estimated_value: 2000,
                days_waiting: Math.floor((hoje.getTime() - new Date(patient.updated_at).getTime()) / (1000 * 60 * 60 * 24)),
                category: 'Reativação',
                action_label: 'Reativar Paciente',
                whatsapp_script: this.generateSilverScript(patient.name, 'REACTIVATION'),
                subtype: 'REACTIVATION',
                created_at: new Date().toISOString()
            });
        });

        return opportunities.sort((a, b) => b.score - a.score);
    },

    // 📊 Consolidar todas as oportunidades
    async getAllOpportunities(clinicId: string): Promise<Opportunity[]> {
        const [diamond, gold, silver] = await Promise.all([
            this.getDiamondOpportunities(clinicId),
            this.getGoldOpportunities(clinicId),
            this.getSilverOpportunities(clinicId)
        ]);

        return [...diamond, ...gold, ...silver].sort((a, b) => b.score - a.score);
    },

    // 📈 Estatísticas do Radar
    async getRadarStats(clinicId: string): Promise<RadarStats> {
        const opportunities = await this.getAllOpportunities(clinicId);

        return {
            totalOpportunities: opportunities.length,
            totalEstimatedValue: opportunities.reduce((sum, o) => sum + o.estimated_value, 0),
            diamondCount: opportunities.filter(o => o.tier === 'DIAMOND').length,
            goldCount: opportunities.filter(o => o.tier === 'GOLD').length,
            silverCount: opportunities.filter(o => o.tier === 'SILVER').length,
            urgentCount: opportunities.filter(o => o.days_waiting > 7).length
        };
    },

    // 🏷️ Categorizar procedimentos
    categorizeProcedures(procedures: string[]): string {
        const procedureText = procedures.join(' ').toLowerCase();

        if (procedureText.includes('cervicoplastia') || procedureText.includes('lifting')) {
            return 'Cirurgia Facial';
        }
        if (procedureText.includes('implante') || procedureText.includes('protocolo')) {
            return 'Implantodontia';
        }
        if (procedureText.includes('lente') || procedureText.includes('faceta')) {
            return 'Reabilitação Estética';
        }
        if (procedureText.includes('ortodontia') || procedureText.includes('alinhador')) {
            return 'Ortodontia';
        }
        if (procedureText.includes('botox') || procedureText.includes('preenchimento')) {
            return 'HOF';
        }

        return 'Multidisciplinar';
    },

    // 💬 SCRIPTS DE ABORDAGEM

    generateDiamondScript(patientName: string, procedures: string[], value: number): string {
        const firstName = patientName.split(' ')[0];
        const procedureList = procedures.slice(0, 2).join(' e ');

        return `Olá ${firstName}! 😊

Dr. Marcelo solicitou que eu revisasse sua proposta de *${procedureList}* para garantirmos sua vaga na agenda dele.

Seu orçamento de *R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}* está reservado, mas precisamos confirmar os próximos passos.

Podemos conversar agora sobre as condições especiais de pagamento? 💎`;
    },

    generateGoldScript(patientName: string, appointmentType: string): string {
        const firstName = patientName.split(' ')[0];

        return `Olá ${firstName}! 😊

Notei que sua avaliação com o Dr. Marcelo está concluída. 

Para não perdermos o momento ideal do seu tratamento, vamos formalizar os próximos passos?

Posso enviar uma proposta personalizada para você hoje mesmo! ✨`;
    },

    generateSilverScript(patientName: string, subtype: SilverOpportunity['subtype']): string {
        const firstName = patientName.split(' ')[0];

        if (subtype === 'BOTOX_RENEWAL') {
            return `Olá ${firstName}! 😊

Está na hora de renovar seu Botox! 💉

Já faz 4 meses desde seu último procedimento e sabemos que você adora manter aquele resultado impecável.

Quer agendar para esta semana? Tenho horários especiais reservados! ✨`;
        }

        if (subtype === 'ORTHO_MAINTENANCE') {
            return `Olá ${firstName}! 😊

Seu sorriso está evoluindo lindamente! 😁

Mas notei que está na hora da sua manutenção de ortodontia. Vamos agendar para garantir que tudo continue perfeito?

Quando você prefere: manhã ou tarde? 📅`;
        }

        // REACTIVATION
        return `Olá ${firstName}! 😊

Sentimos sua falta aqui no Instituto Vilas! 💙

O Dr. Marcelo gostaria de saber como você está e se há algo que possamos fazer para continuar cuidando do seu sorriso.

Que tal agendarmos uma avaliação de cortesia? Sem compromisso! ✨`;
    }
};
