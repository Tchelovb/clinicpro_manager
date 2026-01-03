import { supabase } from '../src/lib/supabase';

export const MasterIntelligence = {
    // 1. O RAIO-X GLOBAL (Metrics)
    getHoldingMetrics: async () => {
        try {
            // Busca contagem real de clínicas
            const { data: clinics, error: cErr } = await supabase
                .from('clinics')
                .select('id, type, status')
                .eq('status', 'ACTIVE');

            if (cErr) {
                console.error('Erro ao buscar clínicas:', cErr);
            }

            // Busca contagem real de pacientes (Global)
            const { count: patientCount } = await supabase
                .from('patients')
                .select('*', { count: 'exact', head: true });

            // Busca soma financeira (Simplificada)
            // Tentando buscar da tabela transactions
            const { data: financials } = await supabase
                .from('transactions')
                .select('amount, type');

            let totalRevenue = 0;
            if (financials && financials.length > 0) {
                totalRevenue = financials
                    .filter(t => t.type === 'INCOME' || t.type === 'REVENUE')
                    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
            }

            // Já filtrado por status='ACTIVE' na query
            const activeClinics = clinics || [];
            const productionUnits = activeClinics.filter(c => c.type === 'PRODUCTION' || c.type === 'REAL').length;
            const simUnits = activeClinics.filter(c => c.type === 'SIMULATION').length;
            const totalUnits = activeClinics.length;

            // Calcular alertas (simplificado por enquanto)
            let criticalAlerts = 0;

            // Verificar clínicas sem movimento recente (exemplo)
            if (totalRevenue === 0 && totalUnits > 0) {
                criticalAlerts += 1; // Alerta: Nenhuma receita registrada
            }

            return {
                revenue: totalRevenue,
                units: totalUnits,
                productionUnits: productionUnits,
                simulations: simUnits,
                patients: patientCount || 0,
                alerts: criticalAlerts
            };
        } catch (error) {
            console.error('Erro no MasterIntelligence:', error);
            return {
                revenue: 0,
                units: 0,
                productionUnits: 0,
                simulations: 0,
                patients: 0,
                alerts: 0
            };
        }
    },

    // 2. O ALERTA ESTRATÉGICO (Sentinelas)
    getStrategicAlerts: async () => {
        try {
            const metrics = await MasterIntelligence.getHoldingMetrics();
            const alerts: Array<{ id: number, type: string, message: string, action: string }> = [];

            // Alerta 1: Sem receita registrada
            if (metrics.revenue === 0 && metrics.units > 0) {
                alerts.push({
                    id: 1,
                    type: 'CRITICAL',
                    message: `Detectamos ${metrics.units} unidade(s) ativa(s) mas nenhuma receita registrada. Sistema financeiro precisa ser ativado.`,
                    action: 'Configurar Financeiro'
                });
            }

            // Alerta 2: Sem pacientes
            if (metrics.patients === 0 && metrics.productionUnits > 0) {
                alerts.push({
                    id: 2,
                    type: 'WARNING',
                    message: 'Nenhum paciente cadastrado nas unidades de produção. Iniciar captação de leads.',
                    action: 'Ativar CRM'
                });
            }

            // Alerta 3: Oportunidade de treinamento
            if (metrics.simulations === 0) {
                alerts.push({
                    id: 3,
                    type: 'OPPORTUNITY',
                    message: 'Nenhuma simulação criada. Recomendo criar cenários de treinamento no Tycoon Game.',
                    action: 'Criar Simulação'
                });
            }

            // Alerta 4: Expansão disponível
            if (metrics.productionUnits > 0 && metrics.revenue > 50000) {
                alerts.push({
                    id: 4,
                    type: 'OPPORTUNITY',
                    message: 'Faturamento saudável detectado. Momento ideal para expansão de rede.',
                    action: 'Planejar Expansão'
                });
            }

            return alerts;
        } catch (error) {
            console.error('Erro ao gerar alertas:', error);
            return [];
        }
    },

    // 3. Performance Comparativa (Futuro)
    getUnitPerformance: async () => {
        try {
            const { data: clinics } = await supabase
                .from('clinics')
                .select('id, name, type')
                .eq('status', 'ACTIVE')
                .in('type', ['PRODUCTION', 'REAL']);

            if (!clinics) return [];

            // Para cada clínica, buscar métricas básicas
            const performance = await Promise.all(
                clinics.map(async (clinic) => {
                    const { count: patientCount } = await supabase
                        .from('patients')
                        .select('*', { count: 'exact', head: true })
                        .eq('clinic_id', clinic.id);

                    return {
                        clinicId: clinic.id,
                        clinicName: clinic.name,
                        patients: patientCount || 0,
                        revenue: 0, // TODO: Implementar quando tiver tabela financeira
                        health: patientCount && patientCount > 10 ? 'HEALTHY' : 'NEEDS_ATTENTION'
                    };
                })
            );

            return performance;
        } catch (error) {
            console.error('Erro ao calcular performance:', error);
            return [];
        }
    }
};
