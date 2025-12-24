import React, { useState, useEffect } from 'react';
import { Save, Loader2, Building, User, Phone, Mail, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { BaseSheet } from '../ui/BaseSheet';

interface Supplier {
    id?: string;
    name: string;
    cnpj_cpf: string;
    contact_name: string;
    phone: string;
    email: string;
    is_active: boolean;
}

interface SupplierSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    supplier: Supplier | null;
    clinicId: string;
    onSave: (data: Supplier) => Promise<void>;
}

export function SupplierSheet({
    open,
    onOpenChange,
    supplier,
    clinicId,
    onSave
}: SupplierSheetProps) {
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<Supplier>({
        name: '',
        cnpj_cpf: '',
        contact_name: '',
        phone: '',
        email: '',
        is_active: true
    });

    useEffect(() => {
        if (supplier) {
            setFormData({ ...supplier });
        } else {
            setFormData({
                name: '',
                cnpj_cpf: '',
                contact_name: '',
                phone: '',
                email: '',
                is_active: true
            });
        }
    }, [supplier, open]);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!formData.name) {
            toast.error('Preencha o nome do fornecedor');
            return;
        }

        try {
            setSaving(true);
            await onSave(formData);
            onOpenChange(false);
        } catch (error) {
            console.error('Erro ao salvar:', error);
            toast.error('Erro ao salvar fornecedor');
        } finally {
            setSaving(false);
        }
    };

    return (
        <BaseSheet
            open={open}
            onOpenChange={onOpenChange}
            title={supplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
            description={supplier ? 'Gerencie os dados do fornecedor' : 'Cadastre um novo fornecedor ou parceiro'}
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
                                Salvar Fornecedor
                            </>
                        )}
                    </button>
                </>
            }
        >
            <form id="supplier-form" onSubmit={handleSubmit} className="space-y-6">
                {/* Nome */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        <Building size={16} className="text-slate-400" />
                        Nome da Empresa / Fornecedor <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-3 md:py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-800 dark:text-white"
                        placeholder="Ex: Dental Cremer"
                        required
                        autoFocus
                    />
                </div>

                {/* CNPJ / CPF */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        <FileText size={16} className="text-slate-400" />
                        CNPJ / CPF
                    </label>
                    <input
                        type="text"
                        value={formData.cnpj_cpf}
                        onChange={(e) => setFormData(prev => ({ ...prev, cnpj_cpf: e.target.value }))}
                        className="w-full px-4 py-3 md:py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-800 dark:text-white"
                        placeholder="00.000.000/0000-00"
                    />
                </div>

                {/* Separator */}
                <div className="border-t border-slate-100 dark:border-slate-800 my-4"></div>

                {/* Nome de Contato */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        <User size={16} className="text-slate-400" />
                        Nome do Contato / Vendedor
                    </label>
                    <input
                        type="text"
                        value={formData.contact_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
                        className="w-full px-4 py-3 md:py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-800 dark:text-white"
                        placeholder="Ex: João Silva"
                    />
                </div>

                {/* Telefone e Email */}
                <div className="grid grid-cols-1 gap-6">
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            <Phone size={16} className="text-slate-400" />
                            Telefone / WhatsApp
                        </label>
                        <input
                            type="text"
                            value={formData.phone}
                            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full px-4 py-3 md:py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-800 dark:text-white"
                            placeholder="(00) 00000-0000"
                        />
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            <Mail size={16} className="text-slate-400" />
                            Email
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full px-4 py-3 md:py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-800 dark:text-white"
                            placeholder="contato@empresa.com"
                        />
                    </div>
                </div>
            </form>
        </BaseSheet>
    );
}

export default SupplierSheet;
