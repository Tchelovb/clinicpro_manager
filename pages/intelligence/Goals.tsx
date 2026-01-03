import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Target, TrendingUp, DollarSign, Users, Calendar, Plus, Edit2, Trash2, Loader2, X, Save, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFinancial } from '../../contexts/FinancialContext';
import { supabase } from '../../src/lib/supabase';
import toast from 'react-hot-toast';

interface Goal {
    id: string;
    title: string;
    target_value: number;
    current_value: number;
    deadline: string;
    category: 'REVENUE' | 'PATIENTS' | 'PROCEDURES' | 'CONVERSION';
    status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
}

const Goals: React.FC = () => {
    const navigate = useNavigate();
    const { profile } = useAuth();
    const { expenses } = useFinancial();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [showForm, setShowForm] = useState(false);

    // Calculate monthly revenue and expenses
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyExpenses = expenses
        .filter(e => {
            const expenseDate = new Date(e.dueDate);
            return expenseDate.getMonth() === currentMonth &&
                expenseDate.getFullYear() === currentYear &&
                e.status === 'Pago';
        })
        .reduce((sum, e) => sum + e.amount, 0);

    const monthlyRevenue = monthlyExpenses * 2.5; // Simplified calculation

    useEffect(() => {
        // Só carregar metas quando o perfil estiver disponível
        if (profile?.clinic_id) {
            loadGoals();
        }
    }, [profile?.clinic_id]); // Dependência: só executa quando clinic_id mudar

    const loadGoals = async () => {
        try {
            setLoading(true);

            // Verificar se o perfil está carregado
            if (!profile?.clinic_id) {
                console.warn('Perfil não carregado ou clinic_id ausente');
                setGoals([]);
                return;
            }

            const { data, error } = await supabase
                .from('business_goals')
                .select('*')
                .eq('clinic_id', profile.clinic_id)
                .order('deadline', { ascending: true });

            if (error) throw error;
            setGoals(data || []);
        } catch (error) {
            console.error('Erro ao carregar metas:', error);
            setGoals([]);
        } finally {
            setLoading(false);
        }
    };

    const getCategoryConfig = (category: string) => {
        const configs: Record<string, any> = {
            REVENUE: { label: 'Faturamento', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
            PATIENTS: { label: 'Pacientes', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
            PROCEDURES: { label: 'Procedimentos', icon: Target, color: 'text-violet-600', bg: 'bg-violet-50' },
            CONVERSION: { label: 'Conversão', icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' }
        };
        return configs[category] || configs.REVENUE;
    };

    const calculateProgress = (current: number, target: number) => {
        return Math.min((current / target) * 100, 100);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
                <Loader2 className="w-12 h-12 text-violet-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Carregando metas...</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/intelligence')}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <ChevronLeft size={24} className="text-slate-400 dark:text-slate-500" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                            <Target className="text-violet-600 dark:text-violet-400" size={32} />
                            Metas Estratégicas
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">Defina e acompanhe os objetivos da clínica</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors font-medium shadow-sm"
                >
                    <Plus size={18} />
                    Nova Meta
                </button>
            </div>

            {/* Current Month Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 transition-all hover:shadow-md">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <DollarSign className="text-green-600 dark:text-green-400" size={20} />
                        </div>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Faturamento (Mês)</p>
                    </div>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthlyRevenue)}
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 transition-all hover:shadow-md">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
                            <TrendingUp className="text-rose-600 dark:text-rose-400" size={20} />
                        </div>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Despesas (Mês)</p>
                    </div>
                    <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthlyExpenses)}
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 transition-all hover:shadow-md">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
                            <Target className="text-violet-600 dark:text-violet-400" size={20} />
                        </div>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Metas Ativas</p>
                    </div>
                    <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                        {goals.filter(g => g.status === 'ACTIVE').length}
                    </p>
                </div>
            </div>

            {/* Goals List */}
            {goals.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-12 text-center">
                    <Target size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Nenhuma meta cadastrada</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">Defina metas estratégicas para acompanhar o crescimento da clínica</p>
                    <button
                        onClick={() => setShowForm(true)}
                        className="px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors font-medium"
                    >
                        Criar Primeira Meta
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {goals.map(goal => {
                        const config = getCategoryConfig(goal.category);
                        const Icon = config.icon;
                        const progress = calculateProgress(goal.current_value, goal.target_value);
                        const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

                        // Ajuste dinâmico de cores para dark mode no card
                        const iconBg = config.bg.replace('bg-', 'bg-').replace('-50', '-50 dark:bg-slate-700/50'); // Simplificação, ideal seria map completo

                        return (
                            <div key={goal.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 ${config.bg} dark:bg-slate-700/50 rounded-lg`}>
                                            <Icon className={`${config.color} dark:text-slate-200`} size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 dark:text-white">{goal.title}</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{config.label}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors">
                                            <Edit2 size={16} className="text-slate-400 dark:text-slate-500" />
                                        </button>
                                        <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors">
                                            <Trash2 size={16} className="text-slate-400 dark:text-slate-500" />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Progresso</p>
                                            <p className="text-2xl font-bold text-slate-800 dark:text-white">
                                                {goal.category === 'REVENUE'
                                                    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(goal.current_value)
                                                    : goal.current_value.toLocaleString('pt-BR')
                                                }
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Meta</p>
                                            <p className="text-lg font-bold text-slate-600 dark:text-slate-300">
                                                {goal.category === 'REVENUE'
                                                    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(goal.target_value)
                                                    : goal.target_value.toLocaleString('pt-BR')
                                                }
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs text-slate-500 dark:text-slate-400">{progress.toFixed(0)}% concluído</span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                                {daysLeft > 0 ? `${daysLeft} dias restantes` : 'Prazo expirado'}
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${progress >= 100 ? 'bg-green-600' : 'bg-violet-600'} transition-all`}
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                        <Calendar size={12} />
                                        Prazo: {new Date(goal.deadline).toLocaleDateString('pt-BR')}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal de Nova Meta */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in duration-300">
                        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between z-10">
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Nova Meta Estratégica</h2>
                            <button
                                onClick={() => setShowForm(false)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <X size={24} className="text-slate-400 dark:text-slate-500" />
                            </button>
                        </div>

                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            setSaving(true);

                            // Verificar se o perfil está carregado
                            if (!profile?.clinic_id) {
                                toast.error('Erro: Perfil não carregado. Recarregue a página.');
                                setSaving(false);
                                return;
                            }

                            const formData = new FormData(e.currentTarget);
                            const goalData = {
                                clinic_id: profile.clinic_id,
                                title: formData.get('title') as string,
                                category: formData.get('category') as string,
                                target_value: parseFloat(formData.get('target_value') as string),
                                current_value: 0,
                                deadline: formData.get('deadline') as string,
                                status: 'ACTIVE',
                                created_at: new Date().toISOString(),
                                updated_at: new Date().toISOString()
                            };

                            try {
                                const { error } = await supabase
                                    .from('business_goals')
                                    .insert([goalData]);

                                if (error) throw error;

                                toast.success('Meta criada com sucesso!');
                                setShowForm(false);
                                loadGoals();
                            } catch (error: any) {
                                console.error('Erro ao criar meta:', error);
                                toast.error(error.message || 'Erro ao criar meta');
                            } finally {
                                setSaving(false);
                            }
                        }} className="p-6 space-y-6">
                            {/* Título */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    Título da Meta *
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    required
                                    className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white"
                                    placeholder="Ex: Aumentar faturamento mensal"
                                />
                            </div>

                            {/* Categoria */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    Categoria *
                                </label>
                                <select
                                    name="category"
                                    required
                                    className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white"
                                >
                                    <option value="REVENUE">💰 Faturamento</option>
                                    <option value="PATIENTS">👥 Pacientes</option>
                                    <option value="PROCEDURES">🦷 Procedimentos</option>
                                    <option value="CONVERSION">📈 Conversão</option>
                                </select>
                            </div>

                            {/* Valor Alvo */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    Valor Alvo *
                                </label>
                                <input
                                    type="number"
                                    name="target_value"
                                    required
                                    min="0"
                                    step="0.01"
                                    className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white"
                                    placeholder="Ex: 50000 (para R$ 50.000) ou 100 (para 100 pacientes)"
                                />
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Para faturamento, use o valor em reais. Para outras categorias, use números inteiros.
                                </p>
                            </div>

                            {/* Prazo */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    Prazo *
                                </label>
                                <input
                                    type="date"
                                    name="deadline"
                                    required
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white dark:[color-scheme:dark]"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    disabled={saving}
                                    className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors font-medium shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Salvando...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            Criar Meta
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Goals;
