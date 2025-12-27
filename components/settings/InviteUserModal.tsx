import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from '../ui/dialog';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { Mail, User, Shield, Loader2 } from 'lucide-react';

interface InviteUserModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export const InviteUserModal: React.FC<InviteUserModalProps> = ({ open, onOpenChange, onSuccess }) => {
    const { clinicId } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'PROFESSIONAL'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Call Edge Function to create user securely
            // Note: This requires the 'create-user' edge function to be deployed
            const { data, error } = await supabase.functions.invoke('create-user', {
                body: {
                    email: formData.email,
                    name: formData.name,
                    role: formData.role,
                    clinic_id: clinicId
                }
            });

            if (error) throw error;

            // Fallback: If Edge Function is not set up, we can't create Auth User easily from client 
            // without exposing service_role. 
            // For MVP/Demo purposes, we might just insert into public.users if Auth is handled externally,
            // but correctly we need the Edge Function.

            // Checking response
            if (!data?.user && !data?.id) {
                // If function returned specific logic error
                throw new Error(data?.message || 'Erro ao criar usuário via função.');
            }

            toast.success(`Convite enviado para ${formData.email}!`);
            onSuccess();
            onOpenChange(false);
            setFormData({ name: '', email: '', role: 'PROFESSIONAL' });

        } catch (error: any) {
            console.error('Invite Error:', error);

            // Fallback friendly message if Edge Function is missing (404)
            if (error.message?.includes('FunctionsFetchError') || error.status === 404) {
                toast.error("Erro: Função 'create-user' não encontrada. Verifique se as Edge Functions foram deployadas.");
            } else {
                toast.error(`Erro ao convidar: ${error.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Convidar Novo Membro</DialogTitle>
                    <DialogDescription>
                        Enviaremos um email com instruções de acesso para o novo colaborador.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                            <User size={16} /> Nome Completo
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="Ex: Dr. João Silva"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full rounded-md border border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                            <Mail size={16} /> Email Corporativo
                        </label>
                        <input
                            type="email"
                            required
                            placeholder="email@clinica.com"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            className="w-full rounded-md border border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                            <Shield size={16} /> Função / Permissão
                        </label>
                        <select
                            value={formData.role}
                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                            className="w-full rounded-md border border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        >
                            <option value="PROFESSIONAL">Dentista / Profissional de Saúde</option>
                            <option value="SECRETARY">Secretária / Recepção</option>
                            <option value="ADMIN">Administrador (Gerente)</option>
                            {/* MASTER usually shouldn't be invited casually */}
                        </select>
                        <p className="text-xs text-slate-500 mt-1">
                            {formData.role === 'PROFESSIONAL' && 'Acesso a prontuários e agenda.'}
                            {formData.role === 'SECRETARY' && 'Acesso a agenda e cadastro básico.'}
                            {formData.role === 'ADMIN' && 'Acesso total exceto financeiro avançado.'}
                        </p>
                    </div>

                    <DialogFooter className="mt-6">
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Enviar Convite'}
                        </button>
                    </DialogFooter>

                </form>
            </DialogContent>
        </Dialog>
    );
};
