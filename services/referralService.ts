// =====================================================
// SERVICE: PROGRAMA DE INDICAÇÕES (REFERRAL PROGRAM)
// =====================================================

import { supabase } from '../src/lib/supabase';
import { ReferralStats, ReferralLeaderboard, ReferralDetail } from '../types/referrals';

export const ReferralService = {

    /**
     * Busca estatísticas gerais do programa de indicações
     */
    async getReferralStats(clinicId: string): Promise<ReferralStats[]> {
        const { data, error } = await supabase
            .from('patient_referral_stats')
            .select('*')
            .order('total_referrals', { ascending: false });

        if (error) throw error;
        return data as ReferralStats[];
    },

    /**
     * Busca o leaderboard de indicadores (Top 10)
     */
    async getLeaderboard(clinicId: string, limit: number = 10): Promise<ReferralLeaderboard[]> {
        // Buscar pacientes que indicaram outros
        const { data: referrers, error: referrersError } = await supabase
            .from('patients')
            .select(`
        id,
        name,
        phone,
        email,
        patient_score,
        created_at
      `)
            .eq('clinic_id', clinicId)
            .not('id', 'is', null);

        if (referrersError) throw referrersError;

        // Para cada referrer, contar quantos pacientes ele indicou
        const leaderboard: ReferralLeaderboard[] = [];

        for (const referrer of referrers || []) {
            const { data: referrals, error: referralsError } = await supabase
                .from('patients')
                .select('id, total_approved, created_at')
                .eq('clinic_id', clinicId)
                .eq('indication_patient_id', referrer.id);

            if (referralsError) continue;

            if (referrals && referrals.length > 0) {
                const totalRevenue = referrals.reduce((sum, r) => sum + (r.total_approved || 0), 0);
                const lastReferral = referrals.sort((a, b) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                )[0];

                leaderboard.push({
                    rank: 0, // Will be set after sorting
                    patient_id: referrer.id,
                    patient_name: referrer.name,
                    patient_phone: referrer.phone,
                    patient_email: referrer.email,
                    total_referrals: referrals.length,
                    total_revenue: totalRevenue,
                    patient_score: referrer.patient_score,
                    last_referral_date: lastReferral.created_at
                });
            }
        }

        // Ordenar por número de indicações e adicionar rank
        const sorted = leaderboard
            .sort((a, b) => b.total_referrals - a.total_referrals)
            .slice(0, limit)
            .map((item, index) => ({ ...item, rank: index + 1 }));

        return sorted;
    },

    /**
     * Busca detalhes de pacientes indicados por um paciente específico
     */
    async getReferralDetails(referrerId: string): Promise<ReferralDetail[]> {
        const { data, error } = await supabase
            .from('patients')
            .select('id, name, phone, total_approved, status, created_at')
            .eq('indication_patient_id', referrerId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map(p => ({
            referred_patient_id: p.id,
            referred_patient_name: p.name,
            referred_patient_phone: p.phone,
            referral_date: p.created_at,
            total_approved: p.total_approved || 0,
            status: p.status
        }));
    },

    /**
     * Busca total de receita gerada por indicações
     */
    async getTotalReferralRevenue(clinicId: string): Promise<number> {
        const { data, error } = await supabase
            .from('patients')
            .select('total_approved')
            .eq('clinic_id', clinicId)
            .not('indication_patient_id', 'is', null);

        if (error) throw error;

        return (data || []).reduce((sum, p) => sum + (p.total_approved || 0), 0);
    },

    /**
     * Busca total de pacientes que vieram por indicação
     */
    async getTotalReferredPatients(clinicId: string): Promise<number> {
        const { count, error } = await supabase
            .from('patients')
            .select('id', { count: 'exact', head: true })
            .eq('clinic_id', clinicId)
            .not('indication_patient_id', 'is', null);

        if (error) throw error;
        return count || 0;
    },

    /**
     * Registra uma indicação (vincula paciente indicado ao indicador)
     */
    async registerReferral(referredPatientId: string, referrerId: string): Promise<void> {
        const { error } = await supabase
            .from('patients')
            .update({ indication_patient_id: referrerId })
            .eq('id', referredPatientId);

        if (error) throw error;
    }
};
