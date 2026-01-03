import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DollarSign, Calendar, FileText, X, Save, AlertCircle, Loader2, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../src/lib/supabase';
import toast from 'react-hot-toast';
import { QuickAddDialog } from './shared/QuickAddDialog';
import { useQuickAdd } from '../hooks/useQuickAdd';
import { QUICK_ADD_CONFIGS } from '../types/quickAdd';

const ExpenseForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { profile } = useAuth();

    const isEditing = !!id;
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        description: '',
        category: 'FIXED' as 'FIXED' | 'VARIABLE' | 'TAXES' | 'LAB' | 'PERSONNEL',
        provider: '',
        amount: '',
        due_date: '',
        payment_date: '',
        status: 'PENDING' as 'PAID' | 'PENDING' | 'OVERDUE',
        notes: ''
    });

    // Lists for dropdowns
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [expenseCategories, setExpenseCategories] = useState<any[]>([]);

    // Quick Add Hooks
    const quickAddSupplier = useQuickAdd({
        tableName: 'suppliers',
        clinicId: profile?.clinic_id || '',
        successMessage: 'Fornecedor criado com sucesso!',
        onSuccess: (newSupplier) => {
            setFormData({ ...formData, provider: newSupplier.name });
            fetchSuppliers();
        }
    });

    const quickAddCategory = useQuickAdd({
        tableName: 'expense_category',
        clinicId: profile?.clinic_id || '',
        successMessage: 'Categoria criada com sucesso!',
        onSuccess: (newCategory) => {
            setFormData({ ...formData, category: newCategory.name as any });
            fetchExpenseCategories();
        }
    });

    useEffect(() => {
        fetchSuppliers();
        fetchExpenseCategories();
        if (isEditing) {
            loadExpense();
        }
    }, [id]);

    const loadExpense = async () => {
        try {
            const { data, error } = await supabase
                .from('expenses')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            setFormData({
                description: data.description,
                category: data.category,
                provider: data.provider || '',
                amount: data.amount.toString(),
                due_date: data.due_date,
                payment_date: data.payment_date || '',
                status: data.status,
                notes: data.notes || ''
            });
        } catch (error) {
            console.error('Erro ao carregar despesa:', error);
            toast.error('Erro ao carregar despesa');
        }
    };

    const fetchSuppliers = async () => {
        if (!profile?.clinic_id) return;
        const { data } = await supabase
            .from('suppliers')
            .select('*')
            .eq('clinic_id', profile.clinic_id)
            .eq('is_active', true)
            .order('name', { ascending: true });
        if (data) setSuppliers(data);
    };

    const fetchExpenseCategories = async () => {
        if (!profile?.clinic_id) return;
        const { data } = await supabase
            .from('expense_category')
            .select('*')
            .eq('clinic_id', profile.clinic_id)
            .eq('active', true)
            .order('name', { ascending: true });
        if (data) setExpenseCategories(data);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const expenseData = {
                clinic_id: profile?.clinic_id,
                description: formData.description,
                category: formData.category,
                provider: formData.provider || null,
                amount: parseFloat(formData.amount),
                due_date: formData.due_date,
                payment_date: formData.payment_date || null,
                status: formData.status,
                notes: formData.notes || null,
                updated_at: new Date().toISOString()
            };

            if (isEditing) {
                const { error } = await supabase
                    .from('expenses')
                    .update(expenseData)
                    .eq('id', id);

                if (error) throw error;
                toast.success('Despesa atualizada com sucesso!');
            } else {
                const { error } = await supabase
                    .from('expenses')
                    .insert([{
                        ...expenseData,
                        created_at: new Date().toISOString()
                    }]);

                if (error) throw error;
                toast.success('Despesa registrada com sucesso!');
            }

            navigate('/financial');
        } catch (error: any) {
            console.error('Erro ao salvar despesa:', error);
            toast.error(error.message || 'Erro ao salvar despesa');
        } finally {
            setLoading(false);
        }
    };

    const categoryLabels = {
        FIXED: 'Fixa (Aluguel, Salários...)',
        VARIABLE: 'Variável (Materiais, Serviços...)',
        TAXES: 'Impostos',
        LAB: 'Laboratório',
        PERSONNEL: 'Pessoal'
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                        <DollarSign className="text-rose-600" size={32} />
                        {isEditing ? 'Editar Despesa' : 'Nova Despesa'}
                    </h1>
                    <p className="text-slate-500 mt-2">Registre uma despesa da clínica</p>
                </div>
                <button
                    onClick={() => navigate('/financial')}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                    <X size={24} className="text-slate-400" />
                </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">

                {/* Description */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        <FileText size={16} className="inline mr-2" />
                        Descrição *
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                        placeholder="Ex: Aluguel, Energia, Material Odontológico..."
                    />
                </div>

                {/* Category & Provider */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            Categoria *
                        </label>
                        <div className="flex gap-2">
                            <select
                                required
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                            >
                                <option value="">Selecione...</option>
                                {expenseCategories.map(cat => (
                                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={() => quickAddCategory.setIsOpen(true)}
                                className="px-3 h-10 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors flex items-center justify-center"
                                title="Adicionar nova categoria"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            Fornecedor
                        </label>
                        <div className="flex gap-2">
                            <select
                                value={formData.provider}
                                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                            >
                                <option value="">Nenhum</option>
                                {suppliers.map(supplier => (
                                    <option key={supplier.id} value={supplier.name}>{supplier.name}</option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={() => quickAddSupplier.setIsOpen(true)}
                                className="px-3 h-10 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors flex items-center justify-center"
                                title="Adicionar novo fornecedor"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Amount */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        <DollarSign size={16} className="inline mr-2" />
                        Valor *
                    </label>
                    <input
                        type="number"
                        required
                        step="0.01"
                        min="0"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                        placeholder="0,00"
                    />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            <Calendar size={16} className="inline mr-2" />
                            Data de Vencimento *
                        </label>
                        <input
                            type="date"
                            required
                            value={formData.due_date}
                            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            Data de Pagamento
                        </label>
                        <input
                            type="date"
                            value={formData.payment_date}
                            onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                    </div>
                </div>

                {/* Status */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        Status
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        {(['PENDING', 'PAID', 'OVERDUE'] as const).map(status => (
                            <button
                                key={status}
                                type="button"
                                onClick={() => setFormData({ ...formData, status })}
                                className={`px-4 py-2 rounded-lg border-2 transition-all ${formData.status === status
                                    ? status === 'PAID'
                                        ? 'border-green-500 bg-green-50 text-green-700 font-bold'
                                        : status === 'OVERDUE'
                                            ? 'border-rose-500 bg-rose-50 text-rose-700 font-bold'
                                            : 'border-amber-500 bg-amber-50 text-amber-700 font-bold'
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                    }`}
                            >
                                {status === 'PAID' ? 'Pago' : status === 'OVERDUE' ? 'Atrasado' : 'Pendente'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Notes */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        Observações
                    </label>
                    <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 min-h-[100px]"
                        placeholder="Informações adicionais sobre a despesa..."
                    />
                </div>

                {/* Alert */}
                {formData.status === 'OVERDUE' && (
                    <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-lg">
                        <AlertCircle className="text-rose-600 flex-shrink-0 mt-0.5" size={20} />
                        <div>
                            <p className="text-sm font-bold text-rose-800">Despesa Atrasada</p>
                            <p className="text-xs text-rose-600 mt-1">Esta despesa está vencida. Regularize o pagamento o quanto antes.</p>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={() => navigate('/financial')}
                        disabled={loading}
                        className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors font-medium disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                {isEditing ? 'Salvar Alterações' : 'Registrar Despesa'}
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* Quick Add Dialogs */}
            <QuickAddDialog
                open={quickAddSupplier.isOpen}
                onOpenChange={quickAddSupplier.setIsOpen}
                config={QUICK_ADD_CONFIGS.supplier}
                onSave={quickAddSupplier.createItem}
                isLoading={quickAddSupplier.isLoading}
            />
            <QuickAddDialog
                open={quickAddCategory.isOpen}
                onOpenChange={quickAddCategory.setIsOpen}
                config={QUICK_ADD_CONFIGS.expense_category}
                onSave={quickAddCategory.createItem}
                isLoading={quickAddCategory.isLoading}
            />
        </div>
    );
};

export default ExpenseForm;
