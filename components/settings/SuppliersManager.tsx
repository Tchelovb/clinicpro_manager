import React, { useState, useEffect } from 'react';
import { supabase, getCurrentClinicId } from '../../lib/supabase';
import { Plus, Edit, Trash2, Loader2, Truck, Phone, Mail } from 'lucide-react';
import { SupplierSheet } from './SupplierSheet';
import toast from 'react-hot-toast';

interface Supplier {
    id?: string;
    name: string;
    cnpj_cpf: string;
    contact_name: string;
    phone: string;
    email: string;
    is_active: boolean;
}

const SuppliersManager: React.FC = () => {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
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
            await loadSuppliers(currentClinicId);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            toast.error('Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    const loadSuppliers = async (clinicId: string) => {
        const { data, error } = await supabase
            .from('suppliers')
            .select('*')
            .eq('clinic_id', clinicId)
            .order('name');

        if (error) {
            console.error('Erro ao carregar fornecedores:', error);
            toast.error('Erro ao carregar fornecedores');
            return;
        }

        setSuppliers(data || []);
    };

    const handleNew = () => {
        setSelectedSupplier(null);
        setSheetOpen(true);
    };

    const handleEdit = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setSheetOpen(true);
    };

    const handleSave = async (data: Supplier) => {
        try {
            const payload = {
                name: data.name,
                cnpj_cpf: data.cnpj_cpf,
                contact_name: data.contact_name,
                phone: data.phone,
                email: data.email,
                is_active: data.is_active
            };

            if (data.id) {
                // Update
                const { error } = await supabase
                    .from('suppliers')
                    .update(payload)
                    .eq('id', data.id);

                if (error) throw error;
            } else {
                // Create
                const { error } = await supabase
                    .from('suppliers')
                    .insert([{
                        clinic_id: clinicId,
                        ...payload
                    }]);

                if (error) throw error;
            }

            await loadSuppliers(clinicId);
            toast.success('Fornecedor salvo com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar:', error);
            toast.error('Erro ao salvar fornecedor');
        }
    };

    const handleDelete = async (supplierId: string) => {
        if (!confirm('Tem certeza que deseja excluir este fornecedor?')) return;

        try {
            const { error } = await supabase
                .from('suppliers')
                .delete()
                .eq('id', supplierId);

            if (error) throw error;

            await loadSuppliers(clinicId);
            toast.success('Fornecedor excluído com sucesso!');
        } catch (error) {
            console.error('Erro ao excluir:', error);
            toast.error('Erro ao excluir fornecedor');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-3 text-gray-600">Carregando fornecedores...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Fornecedores
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Gerencie fornecedores, laboratórios e parceiros
                    </p>
                </div>
                <button
                    onClick={handleNew}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Novo Fornecedor
                </button>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Nome / Empresa
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    CNPJ / CPF
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Contato
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Telefone
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Ações
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                            {suppliers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Truck className="w-12 h-12 text-gray-400" />
                                            <p className="text-gray-600 dark:text-gray-400">
                                                Nenhum fornecedor cadastrado
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                suppliers.map((supplier) => (
                                    <tr
                                        key={supplier.id}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <span className="block text-sm font-medium text-gray-900 dark:text-white">
                                                    {supplier.name}
                                                </span>
                                                {supplier.email && (
                                                    <span className="flex items-center gap-1 text-xs text-gray-500">
                                                        <Mail className="w-3 h-3" />
                                                        {supplier.email}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                            {supplier.cnpj_cpf || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                            {supplier.contact_name || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                            {supplier.phone ? (
                                                <span className="flex items-center gap-1">
                                                    <Phone className="w-3 h-3 text-gray-400" />
                                                    {supplier.phone}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(supplier)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(supplier.id!)}
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

            <SupplierSheet
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                supplier={selectedSupplier}
                clinicId={clinicId}
                onSave={handleSave}
            />
        </div>
    );
};

export default SuppliersManager;
