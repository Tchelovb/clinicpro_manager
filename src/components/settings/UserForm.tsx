import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Mail, Shield, Stethoscope, DollarSign, Calendar, Lock, AlertCircle, Save, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../src/lib/supabase';

// Schema Validation with Zod (Refined for User Prompt)
const userSchema = z.object({
    name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
    email: z.string().email("Email inválido"),
    cpf: z.string().min(11, "CPF inválido").optional(),
    password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
    roles: z.array(z.string()).min(1, "Selecione pelo menos uma função"),

    // Professional Data
    cro: z.string().optional(),
    specialty: z.string().optional(),
    color: z.string().optional(),
    commission_technical_percent: z.number().optional(),

    // Sales Data
    sales_commission_percent: z.number().optional(),

    // Manager Data
    transaction_pin: z.string().optional(),
}).superRefine((data, ctx) => {
    // Conditional Validation: CRO is required if 'professional' is selected
    if (data.roles.includes('professional')) {
        if (!data.cro || data.cro.length < 2) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "CRO é obrigatório para profissionais de saúde",
                path: ["cro"]
            });
        }
        if (!data.specialty) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Especialidade é obrigatória",
                path: ["specialty"]
            });
        }
    }

    // Conditional Validation: PIN is required if 'manager' is selected
    if (data.roles.includes('manager')) {
        if (!data.transaction_pin || data.transaction_pin.length < 4 || data.transaction_pin.length > 6) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "PIN de 4 a 6 dígitos é obrigatório para Gerentes",
                path: ["transaction_pin"]
            });
        }
    }
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormProps {
    onCancel: () => void;
    onSave: (data: UserFormData) => Promise<void>;
    onError?: (message: string) => void;
    loading?: boolean;
}

export const UserForm: React.FC<UserFormProps> = ({ onCancel, onSave, onError, loading = false }) => {
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    // We can also sync simple local state with form state safely using useEffect or direct handle
    // But using RHF's setValue is enough.

    const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<UserFormData>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            roles: [],
            commission_technical_percent: 0,
            sales_commission_percent: 0,
            color: '#3B82F6'
        }
    });

    const currentRoles = watch('roles');

    const handleRoleToggle = (roleId: string) => {
        const newRoles = currentRoles.includes(roleId)
            ? currentRoles.filter(r => r !== roleId)
            : [...currentRoles, roleId];

        setValue('roles', newRoles);
        setSelectedRoles(newRoles);
    };

    const isProfessional = currentRoles.includes('professional');
    const isSales = currentRoles.includes('salesperson');
    const isReception = currentRoles.includes('secretary');
    const isManager = currentRoles.includes('manager');
    const isReceptionOrSales = isSales || isReception;

    const [isSubmitting, setIsSubmitting] = useState(false);

    const onSubmit = async (data: UserFormData) => {
        try {
            setIsSubmitting(true);

            // Prepare payload
            const payload = {
                email: data.email,
                password: data.password,
                name: data.name,
                cpf: data.cpf,
                roles: data.roles,
                pin: data.transaction_pin,
                salesCommission: data.sales_commission_percent,
                professionalData: {
                    cro: data.cro,
                    specialty: data.specialty,
                    color: data.color,
                    commission_technical_percent: data.commission_technical_percent
                }
            };

            const { data: result, error } = await supabase.functions.invoke('create-user', {
                body: payload
            });

            if (error) throw error;

            // Notify parent
            onSave(result);

        } catch (error: any) {
            console.error("Error creating user:", error);
            const msg = error.message || "Erro desconhecido";

            if (onError) {
                onError(msg);
            } else {
                alert("Erro ao criar usuário: " + msg);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col w-full max-w-4xl max-h-[90vh]">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <User className="text-blue-600" />
                        Novo Usuário da Equipe
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Preencha os dados e permissions do colaborador</p>
                </div>
                <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                    ✕
                </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar space-y-8 flex-1">
                <form id="user-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                    {/* A. DADOS BÁSICOS */}
                    <section className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider flex items-center gap-2 border-b pb-2 border-gray-100 dark:border-gray-700">
                            <Lock className="w-4 h-4 text-blue-500" /> Credenciais de Acesso
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nome Completo</label>
                                <input {...register('name')} className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Ex: Dr. Marcelo Amorim" />
                                {errors.name && <span className="text-red-500 text-xs font-medium">{errors.name.message}</span>}
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Corporativo</label>
                                <input {...register('email')} className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 transition-all" placeholder="email@clinica.com" />
                                {errors.email && <span className="text-red-500 text-xs font-medium">{errors.email.message}</span>}
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">CPF</label>
                                <input {...register('cpf')} className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 transition-all" placeholder="000.000.000-00" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Senha Provisória</label>
                                <input type="password" {...register('password')} className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 transition-all" placeholder="••••••" />
                                {errors.password && <span className="text-red-500 text-xs font-medium">{errors.password.message}</span>}
                            </div>
                        </div>
                    </section>

                    {/* B. SELETOR DE FUNÇÕES */}
                    <section className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider flex items-center gap-2 border-b pb-2 border-gray-100 dark:border-gray-700">
                            <Shield className="w-4 h-4 text-purple-500" /> Funções e Permissões
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {[
                                { id: 'admin', label: 'Admin', icon: Shield, color: 'text-red-600 bg-red-50 border-red-200' },
                                { id: 'professional', label: 'Dentista', icon: Stethoscope, color: 'text-blue-600 bg-blue-50 border-blue-200' },
                                { id: 'salesperson', label: 'Comercial', icon: DollarSign, color: 'text-green-600 bg-green-50 border-green-200' },
                                { id: 'secretary', label: 'Recepção', icon: User, color: 'text-purple-600 bg-purple-50 border-purple-200' },
                                { id: 'manager', label: 'Gerente', icon: Lock, color: 'text-orange-600 bg-orange-50 border-orange-200' },
                            ].map((role) => (
                                <label
                                    key={role.id}
                                    className={`
                    relative flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg
                    ${currentRoles.includes(role.id)
                                            ? `${role.color} border-current ring-1 ring-offset-1 transform scale-[1.02]`
                                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500'}
                  `}
                                >
                                    <input
                                        type="checkbox"
                                        value={role.id}
                                        className="sr-only"
                                        onChange={() => handleRoleToggle(role.id)}
                                        checked={currentRoles.includes(role.id)}
                                    />
                                    <role.icon className={`w-8 h-8 mb-3 ${currentRoles.includes(role.id) ? 'text-current' : 'text-gray-400'}`} />
                                    <span className={`text-xs font-bold text-center ${currentRoles.includes(role.id) ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>{role.label}</span>
                                    {currentRoles.includes(role.id) && <div className="absolute top-2 right-2 text-current"><CheckCircle2 size={16} /></div>}
                                </label>
                            ))}
                        </div>
                        {errors.roles && <span className="text-red-500 text-xs block mt-2 text-center font-bold bg-red-50 p-2 rounded">{errors.roles.message}</span>}
                    </section>

                    {/* C. PAINÉIS CONDICIONAIS */}

                    <div className="grid grid-cols-1 gap-6">

                        {/* PIN DE GERENTE */}
                        {isManager && (
                            <div className="animate-in slide-in-from-top-4 duration-500 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-lg p-5 shadow-sm">
                                <h4 className="font-bold text-orange-800 dark:text-orange-300 flex items-center gap-2 mb-4">
                                    <Lock className="w-5 h-5" /> Configuração de Gerente
                                </h4>
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-orange-900 dark:text-orange-200 uppercase">PIN de Autorização (4 a 6 dígitos) *</label>
                                    <input
                                        type="password"
                                        maxLength={6}
                                        {...register('transaction_pin')}
                                        className={`w-full max-w-xs p-3 text-center tracking-[1em] font-mono text-xl rounded-lg border focus:ring-orange-500 transition-colors ${errors.transaction_pin ? 'border-red-300 bg-red-50' : 'border-orange-200 bg-white dark:border-orange-800 dark:bg-gray-900'}`}
                                        placeholder="••••"
                                    />
                                    {errors.transaction_pin && <span className="text-red-500 text-xs font-bold block mt-1">{errors.transaction_pin.message}</span>}
                                    <p className="text-xs text-orange-700 dark:text-orange-400 mt-2">
                                        Este PIN será usado para autorizar descontos acima do limite e estornos no caixa.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* CENÁRIO 1: Profissional de Saúde */}
                            {isProfessional && (
                                <div className="animate-in slide-in-from-left-4 duration-500 bg-white dark:bg-gray-800 border-l-4 border-l-blue-500 border border-gray-200 dark:border-gray-700 rounded-lg p-5 shadow-sm space-y-4 md:col-span-1">
                                    <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-700">
                                        <Stethoscope className="w-5 h-5 text-blue-500" /> Dados Clínicos (Execução)
                                    </h4>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-gray-500 uppercase">CRO *</label>
                                                <input {...register('cro')} className={`w-full p-2 bg-gray-50 dark:bg-gray-900 border rounded-lg focus:ring-blue-500 transition-colors ${errors.cro ? 'border-red-300' : 'border-gray-200 dark:border-gray-700'}`} placeholder="UF-00000" />
                                                {errors.cro && <span className="text-red-500 text-[10px]">{errors.cro.message}</span>}
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-gray-500 uppercase">Cor na Agenda</label>
                                                <div className="flex items-center gap-2 h-[38px] p-1 border border-gray-200 dark:border-gray-700 rounded-lg">
                                                    <input type="color" {...register('color')} className="h-full w-8 rounded cursor-pointer border-0 bg-transparent p-0" />
                                                    <span className="text-xs text-gray-500 font-mono">{watch('color')}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-gray-500 uppercase">Especialidade *</label>
                                            <input {...register('specialty')} className="w-full p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg" placeholder="Ex: Ortodontia, Implantodontia" />
                                            {errors.specialty && <span className="text-red-500 text-[10px]">{errors.specialty.message}</span>}
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-gray-500 uppercase">Comissão Técnica (%)</label>
                                            <div className="relative">
                                                <input type="number" step="0.5" {...register('commission_technical_percent', { valueAsNumber: true })} className="w-full p-2 pl-8 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg font-mono font-bold text-blue-700" />
                                                <span className="absolute left-3 top-2 text-blue-400 font-bold">%</span>
                                            </div>
                                            <span className="text-[10px] text-blue-500 block text-right">Recebida por executar procedimentos</span>
                                        </div>

                                        <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-md flex items-start gap-2 text-xs text-blue-800 dark:text-blue-200 border border-blue-100 dark:border-blue-800">
                                            <Calendar className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                            <p>A sincronização com <strong>Google Agenda</strong> será configurada individualmente no perfil do usuário após o cadastro.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* CENÁRIO 2: Comercial / Vendas */}
                            {isReceptionOrSales && (
                                <div className="animate-in slide-in-from-right-4 duration-500 bg-white dark:bg-gray-800 border-l-4 border-l-green-500 border border-gray-200 dark:border-gray-700 rounded-lg p-5 shadow-sm space-y-4 md:col-span-1">
                                    <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-700">
                                        <DollarSign className="w-5 h-5 text-green-500" /> Dados Comerciais (Vendas)
                                    </h4>

                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-gray-500 uppercase">Comissão de Venda (%)</label>
                                            <div className="relative">
                                                <input type="number" step="0.5" {...register('sales_commission_percent', { valueAsNumber: true })} className="w-full p-4 pl-8 bg-green-50/50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-lg font-mono text-xl font-bold text-green-700" />
                                                <span className="absolute left-3 top-4 text-green-500 font-bold text-lg">%</span>
                                            </div>
                                        </div>
                                        <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-md flex items-center gap-2 text-xs text-green-800 dark:text-green-200 border border-green-100 dark:border-green-800">
                                            <AlertCircle className="w-4 h-4" />
                                            <p>Esta comissão incide sobre o <strong>Lucro Líquido</strong> de orçamentos fechados (Vendas).</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                </form>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-900/50">
                <button onClick={onCancel} className="px-5 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors">
                    Cancelar
                </button>
                <button
                    form="user-form"
                    type="submit"
                    disabled={loading || isSubmitting}
                    className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-bold shadow-md hover:shadow-lg transform transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {loading ? (
                        <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Salvando...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" /> Confirmar Cadastro
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
