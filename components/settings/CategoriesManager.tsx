import React, { useState, useEffect } from 'react';
import { supabase, getCurrentClinicId } from '../../src/lib/supabase';
import { Plus, Edit, Trash2, Loader2, Tag, TrendingUp, TrendingDown } from 'lucide-react';
import { CategorySheet } from './CategorySheet';
import toast from 'react-hot-toast';

interface Category {
    id?: string;
    name: string;
    type: 'INCOME' | 'EXPENSE';
    color: string;
    active: boolean;
}

const CategoriesManager: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [clinicId, setClinicId] = useState<string>('');
    const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const currentClinicId = await getCurrentClinicId();
            if (!currentClinicId) {
                toast.error('Clínica não encontrada');
                return;
            }
            setClinicId(currentClinicId);
            await loadCategories(currentClinicId);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            toast.error('Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    const loadCategories = async (clinicId: string) => {
        const { data, error } = await supabase
            .from('expense_category')
            .select('*')
            .eq('clinic_id', clinicId)
            .order('name');

        if (error) {
            console.error('Erro ao carregar categorias:', error);
            toast.error('Erro ao carregar categorias');
            return;
        }

        // Map data to handle missing type/color if schema wasn't updated
        const mappedData = data?.map(item => ({
            ...item,
            type: item.type || (item.is_variable_cost ? 'EXPENSE' : 'EXPENSE'), // Fallback if type column missing
            color: item.color || '#94A3B8' // Fallback
        })) || [];

        setCategories(mappedData);
    };

    const handleNew = () => {
        setSelectedCategory(null);
        setSheetOpen(true);
    };

    const handleEdit = (category: Category) => {
        setSelectedCategory(category);
        setSheetOpen(true);
    };

    const handleSave = async (data: Category) => {
        try {
            const payload = {
                name: data.name,
                type: data.type,
                color: data.color,
                active: data.active
            };

            if (data.id) {
                // Update
                const { error } = await supabase
                    .from('expense_category')
                    .update(payload)
                    .eq('id', data.id);

                if (error) throw error;
            } else {
                // Create
                const { error } = await supabase
                    .from('expense_category')
                    .insert([{
                        clinic_id: clinicId,
                        ...payload
                    }]);

                if (error) throw error;
            }

            await loadCategories(clinicId);
            toast.success('Categoria salva com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar:', error);
            toast.error('Erro ao salvar categoria');
        }
    };

    const handleDelete = async (categoryId: string) => {
        if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;

        try {
            const { error } = await supabase
                .from('expense_category')
                .delete()
                .eq('id', categoryId);

            if (error) throw error;

            await loadCategories(clinicId);
            toast.success('Categoria excluída com sucesso!');
        } catch (error) {
            console.error('Erro ao excluir:', error);
            toast.error('Erro ao excluir categoria');
        }
    };

    const filteredCategories = categories.filter(c =>
        filterType === 'ALL' ? true : c.type === filterType
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-3 text-gray-600">Carregando categorias...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Categorias Financeiras
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Gerencie categorias de receitas e despesas
                    </p>
                </div>
                <button
                    onClick={handleNew}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Nova Categoria
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-1">
                <button
                    onClick={() => setFilterType('ALL')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${filterType === 'ALL'
                        ? 'bg-white dark:bg-gray-800 text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Todas
                </button>
                <button
                    onClick={() => setFilterType('INCOME')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${filterType === 'INCOME'
                        ? 'bg-white dark:bg-gray-800 text-green-600 border-b-2 border-green-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Receitas
                </button>
                <button
                    onClick={() => setFilterType('EXPENSE')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${filterType === 'EXPENSE'
                        ? 'bg-white dark:bg-gray-800 text-red-600 border-b-2 border-red-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Despesas
                </button>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Cor
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Nome da Categoria
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Tipo
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Ações
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                            {filteredCategories.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Tag className="w-12 h-12 text-gray-400" />
                                            <p className="text-gray-600 dark:text-gray-400">
                                                Nenhuma categoria encontrada
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredCategories.map((category) => (
                                    <tr
                                        key={category.id}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div
                                                className="w-6 h-6 rounded-full border border-gray-200 shadow-sm"
                                                style={{ backgroundColor: category.color }}
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                {category.name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {category.type === 'INCOME' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                    <TrendingUp className="w-3 h-3" />
                                                    Receita
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                                    <TrendingDown className="w-3 h-3" />
                                                    Despesa
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(category)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(category.id!)}
                                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <CategorySheet
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                category={selectedCategory}
                clinicId={clinicId}
                onSave={handleSave}
            />
        </div>
    );
};

export default CategoriesManager;
