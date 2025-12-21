import React from 'react';
import { Filter, X, Calendar, DollarSign, TrendingUp, Flame, Users } from 'lucide-react';
import { useStrategyFilter, STRATEGY_PRESETS } from '../hooks/useStrategyFilter';

interface StrategyFilterBarProps {
    onFilterChange?: () => void;
}

export const StrategyFilterBar: React.FC<StrategyFilterBarProps> = ({ onFilterChange }) => {
    const {
        filters,
        activePreset,
        activeFiltersCount,
        updateFilter,
        applyPreset,
        applyDatePreset,
        clearFilters,
    } = useStrategyFilter();

    const handlePresetClick = (presetId: string) => {
        applyPreset(presetId);
        onFilterChange?.();
    };

    const handleClearFilters = () => {
        clearFilters();
        onFilterChange?.();
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Filter className="text-purple-600" size={20} />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        Super Filtro Estratégico
                    </h3>
                    {activeFiltersCount > 0 && (
                        <span className="px-2 py-1 text-xs font-bold bg-purple-600 text-white rounded-full">
                            {activeFiltersCount}
                        </span>
                    )}
                </div>
                {activeFiltersCount > 0 && (
                    <button
                        onClick={handleClearFilters}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                        <X size={16} />
                        Limpar Filtros
                    </button>
                )}
            </div>

            {/* Presets Estratégicos */}
            <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    🎯 ANÁLISES RÁPIDAS
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                    {STRATEGY_PRESETS.map((preset) => (
                        <button
                            key={preset.id}
                            onClick={() => handlePresetClick(preset.id)}
                            className={`
                                relative p-3 rounded-lg border-2 text-left transition-all
                                ${activePreset === preset.id
                                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                                    : 'border-gray-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700'
                                }
                            `}
                            title={preset.description}
                        >
                            <div className="text-2xl mb-1">{preset.icon}</div>
                            <div className="text-xs font-medium text-gray-900 dark:text-white line-clamp-2">
                                {preset.name}
                            </div>
                            {activePreset === preset.id && (
                                <div className="absolute top-1 right-1">
                                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></div>
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Filtros de Data */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                        <Calendar size={14} />
                        Período Rápido
                    </label>
                    <div className="flex gap-2">
                        {['today', 'week', 'month', 'quarter', 'year'].map((preset) => (
                            <button
                                key={preset}
                                onClick={() => {
                                    applyDatePreset(preset as any);
                                    onFilterChange?.();
                                }}
                                className={`
                                    px-3 py-1.5 text-xs font-medium rounded-lg transition-colors
                                    ${filters.dateRange.preset === preset
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                                    }
                                `}
                            >
                                {preset === 'today' && 'Hoje'}
                                {preset === 'week' && '7 dias'}
                                {preset === 'month' && 'Mês'}
                                {preset === 'quarter' && 'Trimestre'}
                                {preset === 'year' && 'Ano'}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                        <Calendar size={14} />
                        Período Personalizado
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="date"
                            value={filters.dateRange.start}
                            onChange={(e) => {
                                updateFilter('dateRange', {
                                    ...filters.dateRange,
                                    start: e.target.value,
                                    preset: 'custom',
                                });
                                onFilterChange?.();
                            }}
                            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                        />
                        <input
                            type="date"
                            value={filters.dateRange.end}
                            onChange={(e) => {
                                updateFilter('dateRange', {
                                    ...filters.dateRange,
                                    end: e.target.value,
                                    preset: 'custom',
                                });
                                onFilterChange?.();
                            }}
                            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                        />
                    </div>
                </div>
            </div>

            {/* Filtros Avançados */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Faixa de Valor */}
                <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                        <DollarSign size={14} />
                        Faixa de Valor
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            placeholder="Mín. R$"
                            value={filters.minValue || ''}
                            onChange={(e) => {
                                updateFilter('minValue', e.target.value ? parseFloat(e.target.value) : undefined);
                                onFilterChange?.();
                            }}
                            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                        />
                        <input
                            type="number"
                            placeholder="Máx. R$"
                            value={filters.maxValue || ''}
                            onChange={(e) => {
                                updateFilter('maxValue', e.target.value ? parseFloat(e.target.value) : undefined);
                                onFilterChange?.();
                            }}
                            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                        />
                    </div>
                </div>

                {/* Margem de Lucro Mínima */}
                <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                        <TrendingUp size={14} />
                        Margem Mínima (%)
                    </label>
                    <input
                        type="number"
                        placeholder="Ex: 60"
                        value={filters.profitMarginMin || ''}
                        onChange={(e) => {
                            updateFilter('profitMarginMin', e.target.value ? parseFloat(e.target.value) : undefined);
                            onFilterChange?.();
                        }}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                    />
                </div>

                {/* Temperatura de Orçamento */}
                <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                        <Flame size={14} />
                        Temperatura
                    </label>
                    <select
                        value={filters.budgetTemperature?.[0] || ''}
                        onChange={(e) => {
                            updateFilter('budgetTemperature', e.target.value ? [e.target.value as any] : undefined);
                            onFilterChange?.();
                        }}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                    >
                        <option value="">Todas</option>
                        <option value="QUENTE">🔥 Quente (≤3 dias)</option>
                        <option value="MORNO">🌡️ Morno (4-10 dias)</option>
                        <option value="FRIO">❄️ Frio (&gt;10 dias)</option>
                    </select>
                </div>
            </div>

            {/* Indicador de Contexto Ativo */}
            {activeFiltersCount > 0 && (
                <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-l-4 border-purple-600">
                    <Users className="text-purple-600" size={20} />
                    <div>
                        <p className="text-sm font-medium text-purple-900 dark:text-purple-300">
                            Contexto de Análise Ativo
                        </p>
                        <p className="text-xs text-purple-700 dark:text-purple-400">
                            {activeFiltersCount} filtro{activeFiltersCount > 1 ? 's' : ''} aplicado{activeFiltersCount > 1 ? 's' : ''}
                            • O BOS analisará apenas os dados filtrados
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};
