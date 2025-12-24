import React, { useState, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { BaseSheet } from '../ui/BaseSheet';

interface Category {
    id?: string;
    name: string;
    type: 'INCOME' | 'EXPENSE';
    color: string;
    active: boolean;
}

interface CategorySheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    category: Category | null;
    clinicId: string;
    onSave: (data: Category) => Promise<void>;
}

export function CategorySheet({
    open,
    onOpenChange,
    category,
    clinicId,
    onSave
}: CategorySheetProps) {
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<Category>({
        name: '',
        type: 'EXPENSE',
        color: '#3B82F6',
        active: true
    });

    useEffect(() => {
        if (category) {
            setFormData({
                ...category,
                type: category.type || 'EXPENSE',
                color: category.color || '#3B82F6'
            });
        } else {
            setFormData({
                name: '',
                type: 'EXPENSE',
                color: '#3B82F6',
                active: true
            });
        }
    }, [category, open]);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!formData.name) {
            toast.error('Preencha o nome da categoria');
            return;
        }

        try {
            setSaving(true);
            await onSave(formData);
            onOpenChange(false);
        } catch (error) {
            console.error('Erro ao salvar:', error);
            toast.error('Erro ao salvar categoria');
        } finally {
            setSaving(false);
        }
    };

    return (
        <BaseSheet
            open={open}
            onOpenChange={onOpenChange}
            title={category ? 'Editar Categoria' : 'Nova Categoria'}
            description={category ? 'Alterar dados da categoria' : 'Cadastrar nova categoria financeira'}
            size="md"
            footer={
                <>
                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="w-full md:w-auto px-4 py-3 md:py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => handleSubmit()}
                        disabled={saving || !formData.name}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors shadow-sm"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-5 h-5 md:w-4 md:h-4 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5 md:w-4 md:h-4" />
                                Salvar Categoria
                            </>
                        )}
                    </button>
                </>
            }
        >
            <form id="category-form" onSubmit={handleSubmit} className="space-y-6">
                {/* Nome */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Nome da Categoria <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-3 md:py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-800 dark:text-white text-base md:text-sm"
                        placeholder="Ex: Consultas Particulares"
                        required
                        autoFocus
                    />
                </div>

                {/* Tipo */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                        Tipo de Categoria <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                        <label className={`
                            relative flex items-center justify-center px-4 py-4 md:py-3 border-2 rounded-xl cursor-pointer transition-all
                            ${formData.type === 'INCOME'
                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}
                        `}>
                            <input
                                type="radio"
                                name="type"
                                value="INCOME"
                                checked={formData.type === 'INCOME'}
                                onChange={() => setFormData(prev => ({ ...prev, type: 'INCOME' }))}
                                className="sr-only"
                            />
                            <div className="text-center">
                                <span className="block font-bold">Receita</span>
                                <span className="text-xs opacity-75">Entrada de dinheiro</span>
                            </div>
                            {formData.type === 'INCOME' && (
                                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-500"></div>
                            )}
                        </label>

                        <label className={`
                             relative flex items-center justify-center px-4 py-4 md:py-3 border-2 rounded-xl cursor-pointer transition-all
                            ${formData.type === 'EXPENSE'
                                ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}
                        `}>
                            <input
                                type="radio"
                                name="type"
                                value="EXPENSE"
                                checked={formData.type === 'EXPENSE'}
                                onChange={() => setFormData(prev => ({ ...prev, type: 'EXPENSE' }))}
                                className="sr-only"
                            />
                            <div className="text-center">
                                <span className="block font-bold">Despesa</span>
                                <span className="text-xs opacity-75">Saída de dinheiro</span>
                            </div>
                            {formData.type === 'EXPENSE' && (
                                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500"></div>
                            )}
                        </label>
                    </div>
                </div>

                {/* Cor */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Cor da Etiqueta
                    </label>
                    <div className="flex items-center gap-4 p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                        <input
                            type="color"
                            value={formData.color}
                            onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                            className="h-12 w-12 rounded-lg border-2 border-white shadow-sm cursor-pointer"
                        />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900 dark:text-white">Cor de Visualização</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Essa cor será usada em gráficos e relatórios</p>
                        </div>
                        <div
                            className="px-3 py-1 rounded text-xs font-bold text-white shadow-sm"
                            style={{ backgroundColor: formData.color }}
                        >
                            PREVIEW
                        </div>
                    </div>
                </div>
            </form>
        </BaseSheet>
    );
}

export default CategorySheet;
