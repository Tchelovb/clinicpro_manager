import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, DollarSign, Users, Activity, Calendar, Save, RotateCcw } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface BusinessGoals {
    monthly_revenue: number;
    monthly_net_result: number;
    conversion_rate: number;
    no_show_rate: number;
    average_ticket: number;
    new_patients: number;
    occupancy_rate: number;
}

const DEFAULT_GOALS: BusinessGoals = {
    monthly_revenue: 50000,
    monthly_net_result: 25000,
    conversion_rate: 30,
    no_show_rate: 5,
    average_ticket: 2000,
    new_patients: 20,
    occupancy_rate: 80,
};

const BusinessGoalsSettings: React.FC = () => {
    const [goals, setGoals] = useState<BusinessGoals>(DEFAULT_GOALS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        loadGoals();
    }, []);

    const loadGoals = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('clinics')
                .select('goals')
                .eq('id', user.user_metadata.clinic_id)
                .single();

            if (error) throw error;

            if (data?.goals) {
                setGoals({ ...DEFAULT_GOALS, ...data.goals });
            }
        } catch (error) {
            console.error('Erro ao carregar metas:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');

            const { error } = await supabase
                .from('clinics')
                .update({ goals })
                .eq('id', user.user_metadata.clinic_id);

            if (error) throw error;

            setMessage({ type: 'success', text: 'Metas salvas com sucesso!' });
            setTimeout(() => setMessage(null), 3000);
        } catch (error: any) {
            console.error('Erro ao salvar metas:', error);
            setMessage({ type: 'error', text: error.message || 'Erro ao salvar metas' });
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        if (confirm('Tem certeza que deseja restaurar as metas padrão?')) {
            setGoals(DEFAULT_GOALS);
        }
    };

    const GoalInput = ({
        label,
        value,
        onChange,
        icon: Icon,
        prefix = '',
        suffix = '',
        color = 'blue'
    }: any) => (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
            <div className="flex items-center gap-2 mb-3">
                <div className={`p-2 bg-${color}-100 dark:bg-${color}-900/30 rounded-lg`}>
                    <Icon size={18} className={`text-${color}-600 dark:text-${color}-400`} />
                </div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
            </div>
            <div className="relative">
                {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">{prefix}</span>}
                <input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                    className={`w-full ${prefix ? 'pl-10' : 'pl-4'} ${suffix ? 'pr-12' : 'pr-4'} py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                    min="0"
                    step={prefix === 'R$' ? '100' : '1'}
                />
                {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">{suffix}</span>}
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Target className="text-blue-600 dark:text-blue-400" />
                        Metas de Negócio
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Configure as metas que serão usadas como referência nos relatórios
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    >
                        <RotateCcw size={16} />
                        Restaurar Padrão
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save size={16} />
                        {saving ? 'Salvando...' : 'Salvar Metas'}
                    </button>
                </div>
            </div>

            {/* Message */}
            {message && (
                <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-400'}`}>
                    {message.text}
                </div>
            )}

            {/* Goals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <GoalInput
                    label="Faturamento Mensal"
                    value={goals.monthly_revenue}
                    onChange={(v: number) => setGoals({ ...goals, monthly_revenue: v })}
                    icon={DollarSign}
                    prefix="R$"
                    color="green"
                />

                <GoalInput
                    label="Resultado Líquido Mensal"
                    value={goals.monthly_net_result}
                    onChange={(v: number) => setGoals({ ...goals, monthly_net_result: v })}
                    icon={TrendingUp}
                    prefix="R$"
                    color="blue"
                />

                <GoalInput
                    label="Ticket Médio"
                    value={goals.average_ticket}
                    onChange={(v: number) => setGoals({ ...goals, average_ticket: v })}
                    icon={DollarSign}
                    prefix="R$"
                    color="purple"
                />

                <GoalInput
                    label="Taxa de Conversão"
                    value={goals.conversion_rate}
                    onChange={(v: number) => setGoals({ ...goals, conversion_rate: v })}
                    icon={Target}
                    suffix="%"
                    color="green"
                />

                <GoalInput
                    label="Taxa de No-Show (Máxima)"
                    value={goals.no_show_rate}
                    onChange={(v: number) => setGoals({ ...goals, no_show_rate: v })}
                    icon={Activity}
                    suffix="%"
                    color="red"
                />

                <GoalInput
                    label="Ocupação da Agenda"
                    value={goals.occupancy_rate}
                    onChange={(v: number) => setGoals({ ...goals, occupancy_rate: v })}
                    icon={Calendar}
                    suffix="%"
                    color="blue"
                />

                <GoalInput
                    label="Novos Pacientes/Mês"
                    value={goals.new_patients}
                    onChange={(v: number) => setGoals({ ...goals, new_patients: v })}
                    icon={Users}
                    color="orange"
                />
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
                    <Target size={16} />
                    Como as metas são usadas
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                    <li>• <strong>Relatórios:</strong> Exibidas como referência nos dashboards</li>
                    <li>• <strong>Insights:</strong> Usadas para gerar alertas automáticos quando não atingidas</li>
                    <li>• <strong>Comparação:</strong> Mostram o quanto você está próximo ou distante da meta</li>
                    <li>• <strong>Motivação:</strong> Ajudam a equipe a ter clareza sobre os objetivos</li>
                </ul>
            </div>
        </div>
    );
};

export default BusinessGoalsSettings;
