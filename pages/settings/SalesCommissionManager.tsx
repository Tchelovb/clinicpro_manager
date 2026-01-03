import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import {
    Users,
    Edit,
    Percent,
    DollarSign,
    Save,
    X,
    CheckCircle,
    AlertCircle,
    TrendingUp,
    Filter
} from 'lucide-react';

interface SalesCommissionRule {
    id?: string;
    user_id: string;
    clinic_id: string;
    commission_type: 'PERCENTAGE' | 'FIXED';
    commission_value: number;
    applies_to_category: string | null;
    min_budget_value: number;
    is_active: boolean;
}

interface User {
    id: string;
    full_name: string;
    email: string;
    role: string;
}

const SalesCommissionManager: React.FC = () => {
    const { profile } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [rules, setRules] = useState<SalesCommissionRule[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [editingRule, setEditingRule] = useState<SalesCommissionRule | null>(null);

    // Form state
    const [commissionType, setCommissionType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
    const [commissionValue, setCommissionValue] = useState<number>(0);
    const [categoryFilter, setCategoryFilter] = useState<string>('');
    const [minBudgetValue, setMinBudgetValue] = useState<number>(0);
    const [isActive, setIsActive] = useState<boolean>(true);

    // Buscar usuários e regras
    useEffect(() => {
        if (profile?.clinics?.id) {
            fetchData();
        }
    }, [profile]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Buscar usuários da clínica
            const { data: usersData, error: usersError } = await supabase
                .from('users')
                .select('id, full_name, email, role')
                .eq('clinic_id', profile?.clinics?.id);

            if (usersError) throw usersError;
            setUsers(usersData || []);

            // Buscar regras existentes
            const { data: rulesData, error: rulesError } = await supabase
                .from('sales_commission_rules')
                .select('*')
                .eq('clinic_id', profile?.clinics?.id);

            if (rulesError) throw rulesError;
            setRules(rulesData || []);

            // Buscar categorias de receita
            const { data: categoriesData, error: categoriesError } = await supabase
                .from('revenue_categories')
                .select('id, name')
                .eq('clinic_id', profile?.clinics?.id)
                .order('name');

            if (categoriesError) throw categoriesError;
            setCategories(categoriesData || []);
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditRule = (user: User) => {
        setSelectedUser(user);

        // Buscar regra existente para este usuário
        const existingRule = rules.find(r => r.user_id === user.id && r.applies_to_category === null);

        if (existingRule) {
            setEditingRule(existingRule);
            setCommissionType(existingRule.commission_type);
            setCommissionValue(existingRule.commission_value);
            setCategoryFilter(existingRule.applies_to_category || '');
            setMinBudgetValue(existingRule.min_budget_value);
            setIsActive(existingRule.is_active);
        } else {
            setEditingRule(null);
            setCommissionType('PERCENTAGE');
            setCommissionValue(0);
            setCategoryFilter('');
            setMinBudgetValue(0);
            setIsActive(true);
        }

        setShowModal(true);
    };

    const handleSaveRule = async () => {
        if (!selectedUser || !profile?.clinics?.id) return;

        const ruleData: any = {
            user_id: selectedUser.id,
            clinic_id: profile.clinics.id,
            commission_type: commissionType,
            commission_value: commissionValue,
            applies_to_category: categoryFilter || null,
            min_budget_value: minBudgetValue,
            is_active: isActive
        };

        try {
            if (editingRule?.id) {
                // Atualizar regra existente
                const { error } = await supabase
                    .from('sales_commission_rules')
                    .update(ruleData)
                    .eq('id', editingRule.id);

                if (error) throw error;
            } else {
                // Criar nova regra
                const { error } = await supabase
                    .from('sales_commission_rules')
                    .insert([ruleData]);

                if (error) throw error;
            }

            // Recarregar dados
            await fetchData();
            setShowModal(false);
            setSelectedUser(null);
        } catch (error) {
            console.error('Erro ao salvar regra:', error);
            alert('Erro ao salvar regra de comissão');
        }
    };

    const getUserRule = (userId: string) => {
        return rules.find(r => r.user_id === userId && r.applies_to_category === null);
    };

    const formatCommission = (rule: SalesCommissionRule) => {
        if (rule.commission_type === 'PERCENTAGE') {
            return `${rule.commission_value}%`;
        }
        return `R$ ${rule.commission_value.toFixed(2)}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <TrendingUp className="w-6 h-6 text-blue-600" />
                        Regras de Comissão de Vendas
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Configure comissões para CRC, Recepcionistas e Consultores
                    </p>
                </div>
            </div>

            {/* Lista de Usuários */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map(user => {
                    const rule = getUserRule(user.id);
                    const hasRule = !!rule;

                    return (
                        <div
                            key={user.id}
                            className={`bg-white rounded-lg border-2 p-4 hover:shadow-md transition-shadow cursor-pointer ${hasRule && rule.is_active
                                ? 'border-green-200 bg-green-50'
                                : hasRule && !rule.is_active
                                    ? 'border-gray-200 bg-gray-50'
                                    : 'border-gray-200'
                                }`}
                            onClick={() => handleEditRule(user)}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-5 h-5 text-gray-600" />
                                        <h3 className="font-semibold text-gray-900">{user.full_name}</h3>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">{user.email}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{user.role}</p>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditRule(user);
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                >
                                    <Edit className="w-4 h-4 text-gray-600" />
                                </button>
                            </div>

                            {hasRule ? (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {rule.commission_type === 'PERCENTAGE' ? (
                                                <Percent className="w-4 h-4 text-blue-600" />
                                            ) : (
                                                <DollarSign className="w-4 h-4 text-green-600" />
                                            )}
                                            <span className="font-bold text-lg text-gray-900">
                                                {formatCommission(rule)}
                                            </span>
                                        </div>
                                        {rule.is_active ? (
                                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                                Ativa
                                            </span>
                                        ) : (
                                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                                                Inativa
                                            </span>
                                        )}
                                    </div>
                                    {rule.min_budget_value > 0 && (
                                        <p className="text-xs text-gray-500 mt-2">
                                            Mínimo: R$ {rule.min_budget_value.toFixed(2)}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <p className="text-sm text-gray-500 italic">Sem regra configurada</p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {users.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhum usuário encontrado</p>
                </div>
            )}

            {/* Modal de Edição */}
            {showModal && selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-900">
                                Configurar Comissão
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="font-semibold text-gray-900">{selectedUser.full_name}</p>
                            <p className="text-sm text-gray-600">{selectedUser.email}</p>
                        </div>

                        {/* Tipo de Comissão */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tipo de Comissão
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setCommissionType('PERCENTAGE')}
                                    className={`p-3 border-2 rounded-lg flex items-center justify-center gap-2 ${commissionType === 'PERCENTAGE'
                                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                        }`}
                                >
                                    <Percent className="w-5 h-5" />
                                    <span className="font-medium">Percentual</span>
                                </button>
                                <button
                                    onClick={() => setCommissionType('FIXED')}
                                    className={`p-3 border-2 rounded-lg flex items-center justify-center gap-2 ${commissionType === 'FIXED'
                                        ? 'border-green-600 bg-green-50 text-green-700'
                                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                        }`}
                                >
                                    <DollarSign className="w-5 h-5" />
                                    <span className="font-medium">Valor Fixo</span>
                                </button>
                            </div>
                        </div>

                        {/* Valor */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {commissionType === 'PERCENTAGE' ? 'Percentual (%)' : 'Valor Fixo (R$)'}
                            </label>
                            <input
                                type="number"
                                step={commissionType === 'PERCENTAGE' ? '0.1' : '0.01'}
                                value={commissionValue}
                                onChange={(e) => setCommissionValue(parseFloat(e.target.value) || 0)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder={commissionType === 'PERCENTAGE' ? 'Ex: 2.5' : 'Ex: 50.00'}
                            />
                        </div>

                        {/* Categoria (Opcional) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Categoria Específica (Opcional)
                            </label>
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Todas as categorias</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                Se selecionado, comissão só será paga nesta categoria
                            </p>
                        </div>

                        {/* Valor Mínimo */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Valor Mínimo do Orçamento (R$)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={minBudgetValue}
                                onChange={(e) => setMinBudgetValue(parseFloat(e.target.value) || 0)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="0.00"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Comissão só será paga se orçamento for maior que este valor
                            </p>
                        </div>

                        {/* Status */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">Regra Ativa</span>
                            <button
                                onClick={() => setIsActive(!isActive)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isActive ? 'bg-green-600' : 'bg-gray-300'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>

                        {/* Botões */}
                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveRule}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalesCommissionManager;
