import { useState, useCallback, useMemo } from 'react';

// ========================================
// TYPES - Filtros Estratégicos
// ========================================
export interface StrategyFilter {
    // Temporal
    dateRange: {
        start: string;
        end: string;
        preset?: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
    };

    // Marketing & Comercial
    leadSource?: string[];
    leadStatus?: string[];
    conversionStatus?: 'CONVERTEU' | 'NÃO CONVERTEU' | 'ALL';

    // Financeiro
    minValue?: number;
    maxValue?: number;
    profitMarginMin?: number; // % mínima de margem
    paymentStatus?: string[];

    // Clínico/Operacional
    doctorId?: string[];
    procedureCategory?: string[];
    budgetTemperature?: ('QUENTE' | 'MORNO' | 'FRIO')[];

    // Análise de Fidelização
    patientInactivityDays?: number; // Pacientes sem retorno há X dias

    // Performance
    minConversionRate?: number; // % mínima de conversão
}

export interface FilterPreset {
    id: string;
    name: string;
    description: string;
    icon: string;
    filters: Partial<StrategyFilter>;
}

// ========================================
// PRESETS ESTRATÉGICOS
// ========================================
export const STRATEGY_PRESETS: FilterPreset[] = [
    {
        id: 'hot-opportunities',
        name: '🔥 Oportunidades Quentes',
        description: 'Orçamentos high-ticket com menos de 3 dias',
        icon: '🔥',
        filters: {
            budgetTemperature: ['QUENTE'],
            minValue: 5000,
        },
    },
    {
        id: 'cold-recovery',
        name: '❄️ Recuperação de Frios',
        description: 'Orçamentos parados há mais de 10 dias',
        icon: '❄️',
        filters: {
            budgetTemperature: ['FRIO'],
        },
    },
    {
        id: 'high-margin',
        name: '💎 Alta Margem',
        description: 'Procedimentos com margem > 60%',
        icon: '💎',
        filters: {
            profitMarginMin: 60,
        },
    },
    {
        id: 'inactive-patients',
        name: '⏰ Pacientes Inativos',
        description: 'Sem retorno há mais de 180 dias',
        icon: '⏰',
        filters: {
            patientInactivityDays: 180,
        },
    },
    {
        id: 'meta-ads-roi',
        name: '📱 ROI Meta Ads',
        description: 'Performance de leads do Facebook/Instagram',
        icon: '📱',
        filters: {
            leadSource: ['Facebook', 'Instagram', 'Meta Ads'],
        },
    },
    {
        id: 'google-roi',
        name: '🔍 ROI Google',
        description: 'Performance de leads do Google',
        icon: '🔍',
        filters: {
            leadSource: ['Google', 'Google Ads', 'Pesquisa Orgânica'],
        },
    },
    {
        id: 'high-conversion',
        name: '✅ Alta Conversão',
        description: 'Canais com taxa > 30%',
        icon: '✅',
        filters: {
            minConversionRate: 30,
        },
    },
];

// ========================================
// HOOK - useStrategyFilter
// ========================================
export const useStrategyFilter = () => {
    // Data atual
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split('T')[0];

    const [filters, setFilters] = useState<StrategyFilter>({
        dateRange: {
            start: firstDayOfMonth,
            end: today,
            preset: 'month',
        },
    });

    const [activePreset, setActivePreset] = useState<string | null>(null);

    // Aplicar preset
    const applyPreset = useCallback((presetId: string) => {
        const preset = STRATEGY_PRESETS.find(p => p.id === presetId);
        if (preset) {
            setFilters(prev => ({
                ...prev,
                ...preset.filters,
            }));
            setActivePreset(presetId);
        }
    }, []);

    // Atualizar filtro individual
    const updateFilter = useCallback(<K extends keyof StrategyFilter>(
        key: K,
        value: StrategyFilter[K]
    ) => {
        setFilters(prev => ({
            ...prev,
            [key]: value,
        }));
        setActivePreset(null); // Desativa preset ao filtrar manualmente
    }, []);

    // Aplicar preset de data
    const applyDatePreset = useCallback((preset: 'today' | 'week' | 'month' | 'quarter' | 'year') => {
        const end = new Date().toISOString().split('T')[0];
        let start = end;

        switch (preset) {
            case 'today':
                start = end;
                break;
            case 'week':
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                start = weekAgo.toISOString().split('T')[0];
                break;
            case 'month':
                start = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                    .toISOString()
                    .split('T')[0];
                break;
            case 'quarter':
                const quarter = Math.floor(new Date().getMonth() / 3);
                start = new Date(new Date().getFullYear(), quarter * 3, 1)
                    .toISOString()
                    .split('T')[0];
                break;
            case 'year':
                start = new Date(new Date().getFullYear(), 0, 1)
                    .toISOString()
                    .split('T')[0];
                break;
        }

        updateFilter('dateRange', { start, end, preset });
    }, [updateFilter]);

    // Limpar filtros
    const clearFilters = useCallback(() => {
        setFilters({
            dateRange: {
                start: firstDayOfMonth,
                end: today,
                preset: 'month',
            },
        });
        setActivePreset(null);
    }, [firstDayOfMonth, today]);

    // Contar filtros ativos
    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (filters.leadSource?.length) count++;
        if (filters.leadStatus?.length) count++;
        if (filters.conversionStatus && filters.conversionStatus !== 'ALL') count++;
        if (filters.minValue !== undefined) count++;
        if (filters.maxValue !== undefined) count++;
        if (filters.profitMarginMin !== undefined) count++;
        if (filters.paymentStatus?.length) count++;
        if (filters.doctorId?.length) count++;
        if (filters.procedureCategory?.length) count++;
        if (filters.budgetTemperature?.length) count++;
        if (filters.patientInactivityDays !== undefined) count++;
        if (filters.minConversionRate !== undefined) count++;
        return count;
    }, [filters]);

    // Gerar query SQL para views
    const buildWhereClause = useCallback(() => {
        const conditions: string[] = [];

        // Data range
        if (filters.dateRange) {
            conditions.push(`date >= '${filters.dateRange.start}'`);
            conditions.push(`date <= '${filters.dateRange.end}'`);
        }

        // Lead source
        if (filters.leadSource?.length) {
            const sources = filters.leadSource.map(s => `'${s}'`).join(', ');
            conditions.push(`source IN (${sources})`);
        }

        // Min/Max value
        if (filters.minValue !== undefined) {
            conditions.push(`total_value >= ${filters.minValue}`);
        }
        if (filters.maxValue !== undefined) {
            conditions.push(`total_value <= ${filters.maxValue}`);
        }

        // Budget temperature
        if (filters.budgetTemperature?.length) {
            const temps = filters.budgetTemperature.map(t => `'${t}'`).join(', ');
            conditions.push(`temperature IN (${temps})`);
        }

        return conditions.length > 0 ? conditions.join(' AND ') : '';
    }, [filters]);

    return {
        filters,
        activePreset,
        activeFiltersCount,
        updateFilter,
        applyPreset,
        applyDatePreset,
        clearFilters,
        buildWhereClause,
    };
};

// ========================================
// UTILITY - Filtrar dados no cliente
// ========================================
export const applyClientSideFilter = <T extends Record<string, any>>(
    data: T[],
    filters: StrategyFilter,
    config: {
        dateField?: keyof T;
        valueField?: keyof T;
        sourceField?: keyof T;
        temperatureField?: keyof T;
    }
): T[] => {
    return data.filter(item => {
        // Date range
        if (filters.dateRange && config.dateField) {
            const itemDate = new Date(item[config.dateField] as string);
            const start = new Date(filters.dateRange.start);
            const end = new Date(filters.dateRange.end);
            if (itemDate < start || itemDate > end) return false;
        }

        // Value range
        if (filters.minValue !== undefined && config.valueField) {
            if ((item[config.valueField] as number) < filters.minValue) return false;
        }
        if (filters.maxValue !== undefined && config.valueField) {
            if ((item[config.valueField] as number) > filters.maxValue) return false;
        }

        // Source
        if (filters.leadSource?.length && config.sourceField) {
            if (!filters.leadSource.includes(item[config.sourceField] as string)) return false;
        }

        // Temperature
        if (filters.budgetTemperature?.length && config.temperatureField) {
            if (!filters.budgetTemperature.includes(item[config.temperatureField] as string)) return false;
        }

        return true;
    });
};
