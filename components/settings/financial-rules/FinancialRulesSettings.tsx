import React, { useState, useEffect } from 'react';
import {
    DollarSign, Shield, AlertTriangle, Percent, CreditCard, Users, Save,
    CheckCircle2, AlertCircle, Plus, Edit, Trash2, X, Tag, TrendingUp, TrendingDown, Loader
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

interface FinancialRules {
    // Bloqueio de Inadimplentes
    block_debtors_scheduling: boolean;
    debtor_block_days: number;
    debtor_warning_message: string;

    // Limite de Desconto
    max_discount_without_approval: number;
    require_manager_password_for_discount: boolean;
    discount_approval_message: string;
}

interface PaymentFee {
    id: string;
    payment_method_name: string;
    payment_type: string;
    fee_percent: number;
    active: boolean;
}

interface SettingItem {
    id: string;
    name: string;
    active: boolean;
}

type TabType = 'debtor' | 'discount' | 'fees' | 'expense_categories' | 'revenue_categories' | 'payment_methods';

const FinancialRulesSettings: React.FC = () => {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('debtor');

    const [rules, setRules] = useState<FinancialRules>({
        block_debtors_scheduling: false,
        debtor_block_days: 30,
        debtor_warning_message: 'Paciente possui débitos em atraso. Regularize os pagamentos antes de agendar.',
        max_discount_without_approval: 5.00,
        require_manager_password_for_discount: true,
        discount_approval_message: 'Desconto acima do limite permitido. Solicite aprovação do gestor.'
    });

    const [paymentFees, setPaymentFees] = useState<PaymentFee[]>([]);

    // Novos estados para categorias
    const [categoryItems, setCategoryItems] = useState<SettingItem[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<SettingItem | null>(null);

    useEffect(() => {
        loadSettings();
        loadPaymentFees();
    }, [profile]);

    useEffect(() => {
        if (['expense_categories', 'revenue_categories', 'payment_methods'].includes(activeTab)) {
            loadCategoryItems(activeTab);
        }
    }, [activeTab, profile]);

    const loadSettings = async () => {
        if (!profile?.clinic_id) return;

        try {
            const { data, error } = await supabase
                .from('clinics')
                .select(`
          block_debtors_scheduling,
          debtor_block_days,
          debtor_warning_message,
          max_discount_without_approval,
          require_manager_password_for_discount,
          discount_approval_message
        `)
                .eq('id', profile.clinic_id)
                .single();

            if (error) throw error;

            if (data) {
                setRules({
                    block_debtors_scheduling: data.block_debtors_scheduling ?? false,
                    debtor_block_days: data.debtor_block_days || 30,
                    debtor_warning_message: data.debtor_warning_message || rules.debtor_warning_message,
                    max_discount_without_approval: data.max_discount_without_approval || 5.00,
                    require_manager_password_for_discount: data.require_manager_password_for_discount ?? true,
                    discount_approval_message: data.discount_approval_message || rules.discount_approval_message
                });
            }
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
            showMessage('error', 'Erro ao carregar configurações');
        } finally {
            setLoading(false);
        }
    };

    const loadPaymentFees = async () => {
        if (!profile?.clinic_id) return;

        try {
            const { data, error } = await supabase
                .from('payment_method_fees')
                .select('*')
                .eq('clinic_id', profile.clinic_id)
                .order('payment_method_name');

            if (error) throw error;

            setPaymentFees(data || []);
        } catch (error) {
            console.error('Erro ao carregar taxas:', error);
        }
    };

    const loadCategoryItems = async (tab: string) => {
        if (!profile?.clinic_id) return;

        const tableMap: Record<string, string> = {
            expense_categories: 'expense_category',
            revenue_categories: 'revenue_category',
            payment_methods: 'payment_method'
        };

        const table = tableMap[tab];
        if (!table) return;

        try {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .eq('clinic_id', profile.clinic_id)
                .order('name');

            if (error) throw error;
            setCategoryItems(data || []);
        } catch (error) {
            console.error('Erro ao carregar itens:', error);
        }
    };

    const handleSave = async () => {
        if (!profile?.clinic_id) return;

        setSaving(true);
        setMessage(null);

        try {
            const { error } = await supabase
                .from('clinics')
                .update({
                    block_debtors_scheduling: rules.block_debtors_scheduling,
                    debtor_block_days: rules.debtor_block_days,
                    debtor_warning_message: rules.debtor_warning_message,
                    max_discount_without_approval: rules.max_discount_without_approval,
                    require_manager_password_for_discount: rules.require_manager_password_for_discount,
                    discount_approval_message: rules.discount_approval_message
                })
                .eq('id', profile.clinic_id);

            if (error) throw error;

            showMessage('success', 'Configurações salvas com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar configurações:', error);
            showMessage('error', 'Erro ao salvar configurações');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateFee = async (feeId: string, newPercent: number) => {
        try {
            const { error } = await supabase
                .from('payment_method_fees')
                .update({ fee_percent: newPercent })
                .eq('id', feeId);

            if (error) throw error;

            setPaymentFees(fees => fees.map(f =>
                f.id === feeId ? { ...f, fee_percent: newPercent } : f
            ));

            showMessage('success', 'Taxa atualizada com sucesso!');
        } catch (error) {
            console.error('Erro ao atualizar taxa:', error);
            showMessage('error', 'Erro ao atualizar taxa');
        }
    };

    const handleToggleFee = async (feeId: string, active: boolean) => {
        try {
            const { error } = await supabase
                .from('payment_method_fees')
                .update({ active })
                .eq('id', feeId);

            if (error) throw error;

            setPaymentFees(fees => fees.map(f =>
                f.id === feeId ? { ...f, active } : f
            ));

            showMessage('success', active ? 'Taxa ativada' : 'Taxa desativada');
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            showMessage('error', 'Erro ao atualizar status');
        }
    };

    const handleSaveCategoryItem = async (itemData: Partial<SettingItem>) => {
        if (!itemData.name || !profile?.clinic_id) return;

        const tableMap: Record<string, string> = {
            expense_categories: 'expense_category',
            revenue_categories: 'revenue_category',
            payment_methods: 'payment_method'
        };

        const table = tableMap[activeTab];
        if (!table) return;

        setSaving(true);
        try {
            if (editingItem) {
                const { error } = await supabase
                    .from(table)
                    .update({ name: itemData.name, active: itemData.active })
                    .eq('id', editingItem.id);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from(table)
                    .insert({
                        clinic_id: profile.clinic_id,
                        name: itemData.name,
                        active: itemData.active ?? true
                    });

                if (error) throw error;
            }

            setModalOpen(false);
            setEditingItem(null);
            loadCategoryItems(activeTab);
            showMessage('success', 'Item salvo com sucesso!');
        } catch (error: any) {
            console.error('Erro ao salvar item:', error);
            showMessage('error', error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteCategoryItem = async (itemId: string) => {
        if (!confirm('Tem certeza que deseja excluir este item?')) return;

        const tableMap: Record<string, string> = {
            expense_categories: 'expense_category',
            revenue_categories: 'revenue_category',
            payment_methods: 'payment_method'
        };

        const table = tableMap[activeTab];
        if (!table) return;

        try {
            const { error } = await supabase.from(table).delete().eq('id', itemId);
            if (error) throw error;
            loadCategoryItems(activeTab);
            showMessage('success', 'Item excluído com sucesso!');
        } catch (error: any) {
            console.error('Erro ao excluir item:', error);
            showMessage('error', error.message);
        }
    };

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 5000);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const tabs = [
        { key: 'debtor' as TabType, label: 'Bloqueio de Inadimplentes', icon: AlertTriangle },
        { key: 'discount' as TabType, label: 'Limite de Desconto', icon: Percent },
        { key: 'fees' as TabType, label: 'Taxas de Maquininhas', icon: CreditCard },
        { key: 'expense_categories' as TabType, label: 'Categorias de Despesa', icon: TrendingDown },
        { key: 'revenue_categories' as TabType, label: 'Categorias de Receita', icon: TrendingUp },
        { key: 'payment_methods' as TabType, label: 'Formas de Pagamento', icon: DollarSign },
    ];

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Shield className="text-blue-600" size={28} />
                    Regras Financeiras Avançadas
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Configure proteções e automações financeiras
                </p>
            </div>

            {/* Message Alert */}
            {message && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                    {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    <span>{message.text}</span>
                </div>
            )}

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                <div className="flex gap-2 min-w-max">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === tab.key
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                }`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
                {/* Debtor Block Tab */}
                {activeTab === 'debtor' && (
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="text-orange-600" size={24} />
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Bloqueio Automático de Inadimplentes
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Impede agendamento de pacientes com débitos em atraso
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            Habilitar Bloqueio de Inadimplentes
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Sistema bloqueará automaticamente agendamentos
                                        </p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={rules.block_debtors_scheduling}
                                            onChange={(e) => setRules({ ...rules, block_debtors_scheduling: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-orange-600"></div>
                                    </label>
                                </div>

                                {rules.block_debtors_scheduling && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Dias de Atraso para Bloqueio
                                            </label>
                                            <div className="flex items-center gap-4">
                                                <input
                                                    type="range"
                                                    min="7"
                                                    max="90"
                                                    step="7"
                                                    value={rules.debtor_block_days}
                                                    onChange={(e) => setRules({ ...rules, debtor_block_days: Number(e.target.value) })}
                                                    className="flex-1"
                                                />
                                                <div className="w-24 text-center">
                                                    <span className="text-2xl font-bold text-orange-600">{rules.debtor_block_days}</span>
                                                    <span className="text-sm text-gray-500 ml-1">dias</span>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">
                                                Pacientes com débitos vencidos há mais de {rules.debtor_block_days} dias serão bloqueados
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Mensagem de Bloqueio
                                            </label>
                                            <textarea
                                                value={rules.debtor_warning_message}
                                                onChange={(e) => setRules({ ...rules, debtor_warning_message: e.target.value })}
                                                rows={3}
                                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                placeholder="Mensagem exibida ao tentar agendar..."
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Esta mensagem será exibida ao tentar agendar um paciente inadimplente
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Discount Limit Tab */}
                {activeTab === 'discount' && (
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
                            <div className="flex items-center gap-3">
                                <Percent className="text-green-600" size={24} />
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Controle de Descontos
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Limite máximo de desconto sem aprovação do gestor
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Desconto Máximo sem Aprovação
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="range"
                                            min="0"
                                            max="50"
                                            step="1"
                                            value={rules.max_discount_without_approval}
                                            onChange={(e) => setRules({ ...rules, max_discount_without_approval: Number(e.target.value) })}
                                            className="flex-1"
                                        />
                                        <div className="w-24 text-center">
                                            <span className="text-2xl font-bold text-green-600">{rules.max_discount_without_approval}%</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Descontos acima de {rules.max_discount_without_approval}% exigirão aprovação do gestor
                                    </p>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            Exigir Senha do Gestor
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Solicitar senha para aprovar descontos acima do limite
                                        </p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={rules.require_manager_password_for_discount}
                                            onChange={(e) => setRules({ ...rules, require_manager_password_for_discount: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                                    </label>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Mensagem de Aprovação
                                    </label>
                                    <textarea
                                        value={rules.discount_approval_message}
                                        onChange={(e) => setRules({ ...rules, discount_approval_message: e.target.value })}
                                        rows={2}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="Mensagem ao solicitar aprovação..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Payment Fees Tab */}
                {activeTab === 'fees' && (
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
                            <div className="flex items-center gap-3">
                                <CreditCard className="text-purple-600" size={24} />
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Taxas de Maquininhas
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Configure as taxas de cada método de pagamento
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {paymentFees.map((fee) => (
                                    <div key={fee.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {fee.payment_method_name}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {fee.payment_type}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="number"
                                                min="0"
                                                max="20"
                                                step="0.1"
                                                value={fee.fee_percent}
                                                onChange={(e) => handleUpdateFee(fee.id, Number(e.target.value))}
                                                className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
                                            />
                                            <span className="text-gray-500">%</span>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={fee.active}
                                                    onChange={(e) => handleToggleFee(fee.id, e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                                            </label>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                <p className="text-sm text-blue-800 dark:text-blue-300">
                                    💡 <strong>Dica:</strong> As taxas serão automaticamente descontadas no cálculo do DRE e relatórios financeiros
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* New Tabs: Categories & Payment Methods */}
                {['expense_categories', 'revenue_categories', 'payment_methods'].includes(activeTab) && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                                {tabs.find(t => t.key === activeTab)?.label}
                            </h3>
                            <button
                                onClick={() => {
                                    setEditingItem(null);
                                    setModalOpen(true);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                <Plus size={16} />
                                Novo Item
                            </button>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Nome
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Ações
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                        {categoryItems.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {item.name}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${item.active
                                                        ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                                                        : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
                                                        }`}>
                                                        {item.active ? "Ativo" : "Inativo"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setEditingItem(item);
                                                                setModalOpen(true);
                                                            }}
                                                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteCategoryItem(item.id)}
                                                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {categoryItems.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                                    Nenhum item cadastrado
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Save Button */}
            {(activeTab === 'debtor' || activeTab === 'discount') && (
                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {saving ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Salvar Configurações
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Modal */}
            {modalOpen && (
                <CategoryModal
                    item={editingItem}
                    onSave={handleSaveCategoryItem}
                    onClose={() => {
                        setModalOpen(false);
                        setEditingItem(null);
                    }}
                    saving={saving}
                    title={tabs.find(t => t.key === activeTab)?.label || ''}
                />
            )}
        </div>
    );
};

interface CategoryModalProps {
    item: SettingItem | null;
    onSave: (data: Partial<SettingItem>) => void;
    onClose: () => void;
    saving: boolean;
    title: string;
}

const CategoryModal: React.FC<CategoryModalProps> = ({ item, onSave, onClose, saving, title }) => {
    const [formData, setFormData] = useState({
        name: item?.name || "",
        active: item?.active ?? true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {item ? `Editar ${title}` : `Novo ${title}`}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Nome *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            required
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="active"
                            checked={formData.active}
                            onChange={(e) => setFormData((prev) => ({ ...prev, active: e.target.checked }))}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="active" className="text-sm text-gray-700 dark:text-gray-300">
                            Ativo
                        </label>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {saving ? (
                                <Loader className="animate-spin" size={16} />
                            ) : (
                                <Save size={16} />
                            )}
                            {saving ? "Salvando..." : "Salvar"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FinancialRulesSettings;
