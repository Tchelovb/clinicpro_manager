import React, { useState, useEffect } from 'react';
import { supabase, getCurrentClinicId } from '../../lib/supabase';
import { Plus, Edit, Trash2, Loader2, TrendingUp } from 'lucide-react';
import { ProcedureSheet } from '../procedures/ProcedureSheet';
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

interface PriceTable {
    id: string;
    name: string;
    is_standard: boolean;
}

const ProceduresManager: React.FC = () => {
    const [procedures, setProcedures] = useState<Procedure[]>([]);
    const [priceTables, setPriceTables] = useState<PriceTable[]>([]);
    const [loading, setLoading] = useState(true);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null);
    const [clinicId, setClinicId] = useState<string>('');

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

            await Promise.all([
                loadProcedures(currentClinicId),
                loadPriceTables(currentClinicId)
            ]);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            toast.error('Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    const loadProcedures = async (clinicId: string) => {
        const { data, error } = await supabase
            .from('procedure')
            .select('*')
            .eq('clinic_id', clinicId)
            .order('name');

        if (error) {
            console.error('Erro ao carregar procedimentos:', error);
            return;
        }

        setProcedures(data || []);
    };

    const loadPriceTables = async (clinicId: string) => {
        // Tabela price_tables ainda não configurada
        // Será implementada quando o módulo de tabelas de preço estiver ativo
        setPriceTables([]);
    };

    const handleNew = () => {
        setSelectedProcedure(null);
        setSheetOpen(true);
    };

    const handleEdit = (procedure: Procedure) => {
        setSelectedProcedure(procedure);
        setSheetOpen(true);
    };

    const handleSave = async (data: Procedure) => {
        try {
            if (data.id) {
                // Update
                const { error } = await supabase
                    .from('procedure')
                    .update({
                        name: data.name,
                        category: data.category,
                        base_price: data.base_price,
                        duration: data.duration,
                        commission_type: data.commission_type,
                        commission_base_value: data.commission_base_value,
                        estimated_lab_cost: data.estimated_lab_cost || 0
                    })
                    .eq('id', data.id);

                if (error) throw error;
            } else {
                // Create
                const { error } = await supabase
                    .from('procedure')
                    .insert([{
                        clinic_id: clinicId,
                        name: data.name,
                        category: data.category,
                        base_price: data.base_price,
                        duration: data.duration || 30,
                        commission_type: data.commission_type || 'PERCENTAGE',
                        commission_base_value: data.commission_base_value || 0,
                        estimated_lab_cost: data.estimated_lab_cost || 0
                    }]);

                if (error) throw error;
            }

            await loadProcedures(clinicId);
            toast.success('Procedimento salvo com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar:', error);
            throw error;
        }
    };

    const handleDelete = async (procedureId: string) => {
        if (!confirm('Tem certeza que deseja excluir este procedimento?')) return;

        try {
            const { error } = await supabase
                .from('procedure')
                .delete()
                .eq('id', procedureId);

            if (error) throw error;

            await loadProcedures(clinicId);
            toast.success('Procedimento excluído com sucesso!');
        } catch (error) {
            console.error('Erro ao excluir:', error);
            toast.error('Erro ao excluir procedimento');
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-3 text-gray-600">Carregando procedimentos...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Procedimentos & Preços
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Gerencie procedimentos com análise de margem e kit de materiais
                    </p>
                </div>
                <button
                    onClick={handleNew}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Novo Procedimento
                </button>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Nome
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Categoria
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Tempo
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Preço Base
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Comissão
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Ações
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                            {procedures.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <TrendingUp className="w-12 h-12 text-gray-400" />
                                            <p className="text-gray-600 dark:text-gray-400">
                                                Nenhum procedimento cadastrado
                                            </p>
                                            <button
                                                onClick={handleNew}
                                                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                            >
                                                Criar primeiro procedimento
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                procedures.map((procedure) => (
                                    <tr
                                        key={procedure.id}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                {procedure.name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                            {procedure.category || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                            {procedure.duration || 0} min
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-bold text-green-600 dark:text-green-400">
                                                {formatCurrency(procedure.base_price)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                            {procedure.commission_type === 'PERCENTAGE'
                                                ? `${procedure.commission_base_value}%`
                                                : formatCurrency(procedure.commission_base_value)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(procedure)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(procedure.id)}
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

            {/* ProcedureSheet */}
            <ProcedureSheet
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                procedure={selectedProcedure}
                clinicId={clinicId}
                onSave={handleSave}
            />
        </div>
    );
}

export default ProceduresManager;
