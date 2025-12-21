import { supabase } from '../lib/supabase';

// =====================================================
// TIPOS E INTERFACES
// =====================================================

export interface XPGain {
    amount: number;
    reason: string;
    tier: 'DIAMOND' | 'GOLD' | 'SILVER' | 'STANDARD';
    timestamp: string;
}

export interface UserProgression {
    user_id: string;
    total_xp: number;
    current_level: number;
    xp_to_next_level: number;
    level_progress_percent: number;
    recent_gains: XPGain[];
}

export interface LevelUpNotification {
    new_level: number;
    total_xp: number;
    rewards_unlocked: string[];
}

// =====================================================
// CONSTANTES
// =====================================================

const LEVEL_THRESHOLDS = [
    { level: 1, xp: 0, title: 'Gestor de Fluxo' },
    { level: 2, xp: 5000, title: 'Estrategista High-Ticket' },
    { level: 3, xp: 15000, title: 'Arquiteto do Instituto' },
    { level: 4, xp: 30000, title: 'Diretor Exponencial' },
    { level: 5, xp: 50000, title: 'Lenda do Instituto Vilas' }
];

const TIER_CONFIG = {
    DIAMOND: {
        color: 'from-blue-600 to-cyan-600',
        icon: '💎',
        label: 'DIAMANTE',
        animation: 'animate-bounce'
    },
    GOLD: {
        color: 'from-yellow-600 to-amber-600',
        icon: '🥇',
        label: 'OURO',
        animation: 'animate-pulse'
    },
    SILVER: {
        color: 'from-gray-500 to-slate-500',
        icon: '🥈',
        label: 'PRATA',
        animation: 'animate-ping'
    },
    STANDARD: {
        color: 'from-green-600 to-emerald-600',
        icon: '✅',
        label: 'PADRÃO',
        animation: 'animate-pulse'
    }
};

// =====================================================
// SERVICE
// =====================================================

export const gamificationService = {

    // Buscar progressão do usuário
    async getUserProgression(userId: string): Promise<UserProgression | null> {
        try {
            // 1. Buscar dados de progressão
            const { data: progression, error: progError } = await supabase
                .from('user_progression')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (progError) {
                // Se não existe, criar registro inicial
                if (progError.code === 'PGRST116') {
                    await this.initializeProgression(userId);
                    return this.getUserProgression(userId);
                }
                throw progError;
            }

            // 2. Buscar logs recentes de XP
            const { data: recentLogs } = await supabase
                .from('xp_logs')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(10);

            // 3. Calcular XP para próximo nível
            const currentLevel = progression.current_level;
            const nextLevelThreshold = LEVEL_THRESHOLDS.find(l => l.level > currentLevel);
            const xpToNextLevel = nextLevelThreshold
                ? nextLevelThreshold.xp - progression.total_xp
                : 0;

            const currentLevelThreshold = LEVEL_THRESHOLDS.find(l => l.level === currentLevel)?.xp || 0;
            const nextLevelXp = nextLevelThreshold?.xp || progression.total_xp;
            const levelProgressPercent = nextLevelThreshold
                ? ((progression.total_xp - currentLevelThreshold) / (nextLevelXp - currentLevelThreshold)) * 100
                : 100;

            return {
                user_id: userId,
                total_xp: progression.total_xp,
                current_level: progression.current_level,
                xp_to_next_level: xpToNextLevel,
                level_progress_percent: Math.min(100, levelProgressPercent),
                recent_gains: recentLogs?.map(log => ({
                    amount: log.xp_amount,
                    reason: log.reason,
                    tier: this.extractTierFromReason(log.reason),
                    timestamp: log.created_at
                })) || []
            };
        } catch (error) {
            console.error('Erro ao buscar progressão:', error);
            return null;
        }
    },

    // Inicializar progressão de novo usuário
    async initializeProgression(userId: string): Promise<void> {
        const { error } = await supabase
            .from('user_progression')
            .insert({
                user_id: userId,
                total_xp: 0,
                current_level: 1
            });

        if (error) throw error;
    },

    // Extrair tier da razão do log
    extractTierFromReason(reason: string): XPGain['tier'] {
        if (reason.includes('DIAMOND')) return 'DIAMOND';
        if (reason.includes('GOLD')) return 'GOLD';
        if (reason.includes('SILVER')) return 'SILVER';
        return 'STANDARD';
    },

    // Buscar conquistas do usuário
    async getUserAchievements(userId: string) {
        const { data, error } = await supabase
            .from('user_achievements')
            .select(`
        *,
        achievement:achievements(*)
      `)
            .eq('user_id', userId)
            .order('earned_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    // Verificar se usuário subiu de nível recentemente
    async checkRecentLevelUp(userId: string): Promise<LevelUpNotification | null> {
        const { data } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .eq('type', 'LEVEL_UP')
            .eq('read', false)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (!data) return null;

        // Marcar como lida
        await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', data.id);

        // Extrair nível da mensagem
        const levelMatch = data.message.match(/Nível (\d+)/);
        const newLevel = levelMatch ? parseInt(levelMatch[1]) : 0;

        return {
            new_level: newLevel,
            total_xp: 0, // TODO: Extrair do contexto
            rewards_unlocked: this.getRewardsForLevel(newLevel)
        };
    },

    // Obter recompensas desbloqueadas por nível
    getRewardsForLevel(level: number): string[] {
        const rewards: Record<number, string[]> = {
            2: ['ROI Analysis', 'Upsell Intelligence', 'Simulador de Cenários'],
            3: ['PIPE Dashboard', 'Torre de Controle', 'Automações Avançadas'],
            4: ['All Features', 'AI Mentorship', 'Benchmarking', 'Scaling Strategies']
        };

        return rewards[level] || [];
    },

    // Obter configuração visual do tier
    getTierConfig(tier: XPGain['tier']) {
        return TIER_CONFIG[tier];
    },

    // Obter informações do nível
    getLevelInfo(level: number) {
        return LEVEL_THRESHOLDS.find(l => l.level === level) || LEVEL_THRESHOLDS[0];
    },

    // Calcular XP estimado para uma oportunidade
    estimateXP(opportunityValue: number, tier: 'DIAMOND' | 'GOLD' | 'SILVER'): number {
        const xpMap = {
            DIAMOND: 500,
            GOLD: 250,
            SILVER: 100
        };

        return xpMap[tier] || 50;
    },

    // Registrar conversão manual (fallback se trigger não funcionar)
    async recordConversion(
        userId: string,
        budgetId: string,
        tier: 'DIAMOND' | 'GOLD' | 'SILVER',
        value: number
    ): Promise<void> {
        const xpAmount = this.estimateXP(value, tier);
        const reason = `Conversão ${tier} - Orçamento #${budgetId} (R$ ${value.toFixed(2)})`;

        // Chamar função SQL de atualização
        const { error } = await supabase.rpc('update_user_progression', {
            p_user_id: userId,
            p_xp_gained: xpAmount,
            p_reason: reason
        });

        if (error) throw error;
    },

    // Buscar ranking de usuários por XP
    async getLeaderboard(clinicId: string, limit: number = 10) {
        const { data, error } = await supabase
            .from('user_progression')
            .select(`
        *,
        user:users(name, role)
      `)
            .eq('user.clinic_id', clinicId)
            .order('total_xp', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    },

    // Buscar logs de XP com paginação
    async getXPLogs(userId: string, page: number = 1, pageSize: number = 20) {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, error, count } = await supabase
            .from('xp_logs')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error;

        return {
            logs: data || [],
            total: count || 0,
            page,
            pageSize,
            totalPages: Math.ceil((count || 0) / pageSize)
        };
    }
};
