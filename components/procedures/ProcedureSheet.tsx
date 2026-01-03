import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, Plus, RefreshCw } from 'lucide-react';
import { profitAnalysisService } from '../../services/profitAnalysisService';
import { supabase } from '../../src/lib/supabase';
import { CategorySheet } from '../settings/CategorySheet'; // Verify path
import toast from 'react-hot-toast';

interface Procedure {
    id?: string;
    name: string;
    category: string;
    base_price: number;
    duration: number;
    commission_type: 'PERCENTAGE' | 'FIXED_AMOUNT';
    commission_base_value: number;
    estimated_lab_cost?: number;
}

interface ProcedureSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    procedure: Procedure | null;
    clinicId: string;
    onSave: (data: Procedure) => Promise<void>;
}

export function ProcedureSheet({
    open,
    onOpenChange,
    procedure,
    clinicId,
    onSave
}: ProcedureSheetProps) {
    const [activeTab, setActiveTab] = useState<'dados' | 'kit'>('dados');
    const [saving, setSaving] = useState(false);
    const [costPerMinute, setCostPerMinute] = useState(0);

    // Dynamic Categories
    const [categories, setCategories] = useState<any[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [categorySheetOpen, setCategorySheetOpen] = useState(false);

    const [formData, setFormData] = useState<Procedure>({
        name: '',
        category: '',
        base_price: 0,
        duration: 30,
        commission_type: 'PERCENTAGE',
        commission_base_value: 0,
        estimated_lab_cost: 0
    });

    useEffect(() => {
        if (open && clinicId) {
            loadCategories();
            loadCostPerMinute();
        }
    }, [open, clinicId]);

    useEffect(() => {
        if (procedure) {
            setFormData({
                ...procedure,
                estimated_lab_cost: procedure.estimated_lab_cost || 0
            });
        } else {
            setFormData({
                name: '',
                category: '',
                base_price: 0,
                duration: 30,
                commission_type: 'PERCENTAGE',
                commission_base_value: 0,
                estimated_lab_cost: 0
            });
        }
    }, [procedure, open]);

    const loadCategories = async () => {
        setLoadingCategories(true);
        try {
            const { data, error } = await supabase
                .from('expense_category')
                .select('*')
                .eq('clinic_id', clinicId)
                .eq('type', 'INCOME') // Assuming procedure categories are INCOME types
                .order('name');

            if (error) throw error;
            setCategories(data || []);
        } catch (error) {
            console.error('Erro ao carregar categorias:', error);
            toast.error('Erro ao carregar lista de categorias');
        } finally {
            setLoadingCategories(false);
        }
    };

    const loadCostPerMinute = async () => {
        const cost = await profitAnalysisService.getCostPerMinute(clinicId);
        setCostPerMinute(cost);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.category) {
            toast.error('Preencha nome e categoria');
            return;
        }

        try {
            setSaving(true);
            await onSave(formData);
            onOpenChange(false);
        } catch (error) {
            console.error('Erro ao salvar:', error);
            toast.error('Erro ao salvar procedimento');
        } finally {
            setSaving(false);
        }
    };

    const handleQuickAddCategory = async (newCategoryData: any) => {
        try {
            // Logic to save new category handled by CategorySheet via onSave prop
            // But CategorySheet expects onSave to handle DB. 
            // We need to wrap it.

            // Actually CategorySheet implementation differs slightly in 'CategorySheet.tsx' view (Ref 1720)
            // It calls `onSave` with data.
            // We should use the existing logic from CategoriesManager if possible, or implement simple insert here.

            const payload = {
                clinic_id: clinicId,
                name: newCategoryData.name,
                type: 'INCOME', // Force INCOME for procedures
                color: newCategoryData.color,
                active: true
            };

            const { data, error } = await supabase
                .from('expense_category')
                .insert([payload])
                .select()
                .single();

            if (error) throw error;

            toast.success('Categoria criada com sucesso!');
            await loadCategories(); // Refresh list
            setFormData(prev => ({ ...prev, category: newCategoryData.name })); // Auto-select? Or use ID if we switch to IDs
            // Note: Current formData uses category name (string). It should probably use ID, but adhering to existing interface.

        } catch (error) {
            console.error('Error creating category:', error);
            toast.error('Erro ao criar categoria');
            throw error; // Let CategorySheet know?
        }
    };

    const calculateBaseCost = (): number => {
        const timeCost = formData.duration * costPerMinute;
        return timeCost + (formData.estimated_lab_cost || 0);
    };

    const calculateMargin = (): number => {
        if (formData.base_price === 0) return 0;
        const baseCost = calculateBaseCost();
        return ((formData.base_price - baseCost) / formData.base_price) * 100;
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    if (!open) return null;

    const margin = calculateMargin();
    const marginColor = margin >= 30 ? 'text-green-600' : margin >= 15 ? 'text-yellow-600' : 'text-red-600';

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-40"
                onClick={() => onOpenChange(false)}
            />

            {/* Sheet Panel */}
            <div className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-2xl bg-white dark:bg-gray-800 shadow-xl overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {procedure ? 'Editar Procedimento' : 'Novo Procedimento'}
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Configure dados e análise de margem
                        </p>
                    </div>
                    <button
                        onClick={() => onOpenChange(false)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 dark:border-gray-700 px-6">
                    <div className="flex gap-4">
                        <button
                            onClick={() => setActiveTab('dados')}
                            className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors ${activeTab === 'dados'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Dados & Lucro
                        </button>
                        <button
                            onClick={() => setActiveTab('kit')}
                            disabled={!procedure?.id}
                            className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors ${activeTab === 'kit'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                                } ${!procedure?.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            Kit de Materiais
                            {!procedure?.id && <span className="text-xs ml-1">(Salve primeiro)</span>}
                        </button>
                    </div>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6">
                    {activeTab === 'dados' && (
                        <div className="space-y-6">
                            {/* Nome */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Nome do Procedimento *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    placeholder="Ex: Restauração em Resina"
                                    required
                                />
                            </div>

                            {/* Categoria SUB-SHEET INTEGRATION */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Categoria *
                                </label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white appearance-none"
                                            required
                                            disabled={loadingCategories}
                                        >
                                            <option value="">Selecione uma categoria</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                                            ))}
                                        </select>
                                        {loadingCategories && (
                                            <div className="absolute right-8 top-1/2 -translate-y-1/2">
                                                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setCategorySheetOpen(true)}
                                        className="px-3 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
                                        title="Nova Categoria"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Tempo, Lab e Preço */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        Tempo (min) *
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.duration}
                                        onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        {formatCurrency(formData.duration * costPerMinute)}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        Preço (R$) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.base_price}
                                        onChange={(e) => setFormData(prev => ({ ...prev, base_price: parseFloat(e.target.value) || 0 }))}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Custo Laboratório */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Custo Estimado de Laboratório (R$)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.estimated_lab_cost}
                                    onChange={(e) => setFormData(prev => ({ ...prev, estimated_lab_cost: parseFloat(e.target.value) || 0 }))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    placeholder="0,00"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Custo médio pago ao protético para este procedimento
                                </p>
                            </div>

                            {/* Comissão */}
                            {/* Commission Configuration Note */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                <p className="text-sm text-blue-800 dark:text-blue-300">
                                    <span className="font-semibold block mb-1">ℹ️ Configuração de Comissões</span>
                                    As regras de comissão (percentual ou fixo) são definidas individualmente na ficha de cada profissional (Menu Configurações {'>'} Profissionais {'>'} Aba Honorários).
                                </p>
                            </div>

                            {/* Análise de Margem */}
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg p-5 border border-blue-200 dark:border-blue-800">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4">
                                    📊 Análise de Custo e Margem
                                </h4>

                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-700 dark:text-gray-300">Custo Base (Tempo + Lab):</span>
                                        <span className="font-bold text-gray-900 dark:text-white">
                                            {formatCurrency(calculateBaseCost())}
                                        </span>
                                    </div>

                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-700 dark:text-gray-300">Preço de Venda:</span>
                                        <span className="font-bold text-blue-700 dark:text-blue-400">
                                            {formatCurrency(formData.base_price)}
                                        </span>
                                    </div>

                                    <div className="pt-3 border-t border-blue-300 dark:border-blue-700">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <span className="font-bold text-gray-900 dark:text-white block">Margem de Contribuição:</span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">Disponível para comissão e lucro</span>
                                            </div>
                                            <span className={`text-2xl font-bold ${marginColor}`}>
                                                {margin.toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'kit' && (
                        <div className="text-center py-12 text-gray-500">
                            <p>Kit de Materiais será implementado em breve</p>
                            <p className="text-sm mt-2">Integração com estoque em desenvolvimento</p>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving || !formData.name || !formData.category}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Salvar Procedimento
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Quick Add Sub-Sheet */}
            <CategorySheet
                open={categorySheetOpen}
                onOpenChange={setCategorySheetOpen}
                category={null}
                clinicId={clinicId}
                onSave={handleQuickAddCategory}
            />
        </>
    );
}

export default ProcedureSheet;
