import React, { useState, useEffect } from 'react';
import { Save, Loader2, Building, CreditCard, Hash, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { BaseSheet } from '../ui/BaseSheet';

interface BankAccount {
    id?: string;
    name: string;
    bank_name: string;
    agency: string;
    account_number: string;
    initial_balance: number;
}

interface BankAccountSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    account: BankAccount | null;
    clinicId: string;
    onSave: (data: BankAccount) => Promise<void>;
}

export function BankAccountSheet({
    open,
    onOpenChange,
    account,
    clinicId,
    onSave
}: BankAccountSheetProps) {
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<BankAccount>({
        name: '',
        bank_name: '',
        agency: '',
        account_number: '',
        initial_balance: 0
    });

    useEffect(() => {
        if (account) {
            setFormData({ ...account });
        } else {
            setFormData({
                name: '',
                bank_name: '',
                agency: '',
                account_number: '',
                initial_balance: 0
            });
        }
    }, [account, open]);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!formData.name || !formData.bank_name) {
            toast.error('Preencha o nome da conta e o banco');
            return;
        }

        try {
            setSaving(true);
            await onSave(formData);
            onOpenChange(false);
        } catch (error) {
            console.error('Erro ao salvar:', error);
            toast.error('Erro ao salvar conta bancária');
        } finally {
            setSaving(false);
        }
    };

    return (
        <BaseSheet
            open={open}
            onOpenChange={onOpenChange}
            title={account ? 'Editar Conta Bancária' : 'Nova Conta Bancária'}
            description={account ? 'Atualize os dados da conta' : 'Cadastre uma nova conta ou caixa'}
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
                                Salvar Conta
                            </>
                        )}
                    </button>
                </>
            }
        >
            <form id="bank-account-form" onSubmit={handleSubmit} className="space-y-6">
                {/* Nome de Referência */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        <CreditCard size={16} className="text-slate-400" />
                        Nome da Conta (Apelido) <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-3 md:py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-800 dark:text-white"
                        placeholder="Ex: Conta Principal - Itaú"
                        required
                        autoFocus
                    />
                </div>

                {/* Nome do Banco */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        <Building size={16} className="text-slate-400" />
                        Instituição Financeira <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={formData.bank_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, bank_name: e.target.value }))}
                        className="w-full px-4 py-3 md:py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-800 dark:text-white"
                        placeholder="Ex: Banco Itaú, Nubank, Caixa..."
                        required
                    />
                </div>

                {/* Agência e Conta */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            <Hash size={16} className="text-slate-400" />
                            Agência
                        </label>
                        <input
                            type="text"
                            value={formData.agency}
                            onChange={(e) => setFormData(prev => ({ ...prev, agency: e.target.value }))}
                            className="w-full px-4 py-3 md:py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-800 dark:text-white"
                            placeholder="0000"
                        />
                    </div>
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            <Hash size={16} className="text-slate-400" />
                            Conta
                        </label>
                        <input
                            type="text"
                            value={formData.account_number}
                            onChange={(e) => setFormData(prev => ({ ...prev, account_number: e.target.value }))}
                            className="w-full px-4 py-3 md:py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-800 dark:text-white"
                            placeholder="00000-0"
                        />
                    </div>
                </div>

                {/* Saldo Inicial */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        <DollarSign size={16} className="text-slate-400" />
                        Saldo Inicial (R$)
                    </label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">R$</span>
                        <input
                            type="number"
                            step="0.01"
                            value={formData.initial_balance}
                            onChange={(e) => setFormData(prev => ({ ...prev, initial_balance: parseFloat(e.target.value) || 0 }))}
                            className="w-full pl-10 pr-4 py-3 md:py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-800 dark:text-white font-mono"
                            placeholder="0,00"
                        />
                    </div>
                    <p className="text-xs text-slate-500 mt-1.5 ml-1">
                        Saldo de abertura da conta no sistema
                    </p>
                </div>
            </form>
        </BaseSheet>
    );
}

export default BankAccountSheet;
