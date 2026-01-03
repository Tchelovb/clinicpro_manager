import React, { useState, useEffect } from 'react';
import { supabase, getCurrentClinicId } from '../../src/lib/supabase';
import { Plus, Edit, Trash2, Loader2, Building, Layers } from 'lucide-react';
import { BankAccountSheet } from './BankAccountSheet';
import toast from 'react-hot-toast';

interface BankAccount {
    id?: string;
    name: string;
    bank_name: string;
    agency: string;
    account_number: string;
    initial_balance: number;
    current_balance?: number;
}

const BankAccountsManager: React.FC = () => {
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
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
            await loadAccounts(currentClinicId);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            toast.error('Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    const loadAccounts = async (clinicId: string) => {
        const { data, error } = await supabase
            .from('bank_accounts')
            .select('*')
            .eq('clinic_id', clinicId)
            .order('name');

        if (error) {
            console.error('Erro ao carregar contas:', error);
            toast.error('Erro ao carregar contas');
            return;
        }

        setAccounts(data || []);
    };

    const handleNew = () => {
        setSelectedAccount(null);
        setSheetOpen(true);
    };

    const handleEdit = (account: BankAccount) => {
        setSelectedAccount(account);
        setSheetOpen(true);
    };

    const handleSave = async (data: BankAccount) => {
        try {
            const payload = {
                name: data.name,
                bank_name: data.bank_name,
                agency: data.agency,
                account_number: data.account_number,
                initial_balance: data.initial_balance
            };

            if (data.id) {
                // Update
                const { error } = await supabase
                    .from('bank_accounts')
                    .update(payload)
                    .eq('id', data.id);

                if (error) throw error;
            } else {
                // Create
                const { error } = await supabase
                    .from('bank_accounts')
                    .insert([{
                        clinic_id: clinicId,
                        ...payload,
                        current_balance: data.initial_balance // Initialize current balance same as initial
                    }]);

                if (error) throw error;
            }

            await loadAccounts(clinicId);
            toast.success('Conta salva com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar:', error);
            toast.error('Erro ao salvar conta');
        }
    };

    const handleDelete = async (accountId: string) => {
        if (!confirm('Tem certeza que deseja excluir esta conta?')) return;

        try {
            const { error } = await supabase
                .from('bank_accounts')
                .delete()
                .eq('id', accountId);

            if (error) throw error;

            await loadAccounts(clinicId);
            toast.success('Conta excluída com sucesso!');
        } catch (error) {
            console.error('Erro ao excluir:', error);
            toast.error('Erro ao excluir conta');
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
                <span className="ml-3 text-gray-600">Carregando contas...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Contas Bancárias
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Gerencie contas correntes e caixas
                    </p>
                </div>
                <button
                    onClick={handleNew}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Nova Conta
                </button>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Nome / Banco
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Dados Bancários
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Saldo Inicial
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Saldo Atual
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Ações
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                            {accounts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Building className="w-12 h-12 text-gray-400" />
                                            <p className="text-gray-600 dark:text-gray-400">
                                                Nenhuma conta bancária cadastrada
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                accounts.map((account) => (
                                    <tr
                                        key={account.id}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <span className="block text-sm font-medium text-gray-900 dark:text-white">
                                                    {account.name}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {account.bank_name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                            Ag: {account.agency || '-'} / CC: {account.account_number || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                            {formatCurrency(account.initial_balance || 0)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`text-sm font-bold ${(account.current_balance || 0) >= 0
                                                ? 'text-green-600 dark:text-green-400'
                                                : 'text-red-600 dark:text-red-400'
                                                }`}>
                                                {formatCurrency(account.current_balance || 0)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(account)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(account.id!)}
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

            <BankAccountSheet
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                account={selectedAccount}
                clinicId={clinicId}
                onSave={handleSave}
            />
        </div>
    );
};

export default BankAccountsManager;
