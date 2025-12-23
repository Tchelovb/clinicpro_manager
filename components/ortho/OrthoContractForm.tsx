import React, { useState } from 'react';
import { Calendar, DollarSign, User, FileText, Loader2 } from 'lucide-react';
import { orthoService } from '../../services/orthoService';
import toast from 'react-hot-toast';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from "../ui/sheet";

interface OrthoContractFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    patientId: string;
    patientName: string;
    clinicId: string;
    budgetId?: string;
    onSuccess: () => void;
}

export const OrthoContractForm: React.FC<OrthoContractFormProps> = ({
    open,
    onOpenChange,
    patientId,
    patientName,
    clinicId,
    budgetId,
    onSuccess,
}) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        contract_type: 'ALIGNERS' as const,
        total_value: 15000,
        down_payment: 3000,
        number_of_months: 24,
        billing_day: 10,
        start_date: new Date().toISOString().split('T')[0],
        auto_charge: false,
        block_scheduling_if_overdue: true,
        overdue_tolerance_days: 10,
        notes: '',
    });

    const monthlyPayment = (formData.total_value - formData.down_payment) / formData.number_of_months;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const estimatedEndDate = new Date(formData.start_date);
            estimatedEndDate.setMonth(estimatedEndDate.getMonth() + formData.number_of_months);

            const contract = await orthoService.createContract({
                clinic_id: clinicId,
                patient_id: patientId,
                budget_id: budgetId,
                ...formData,
                monthly_payment: monthlyPayment,
                estimated_end_date: estimatedEndDate.toISOString().split('T')[0],
                status: 'ACTIVE',
            });

            // Create initial treatment plan
            await orthoService.createTreatmentPlan({
                contract_id: contract.id,
                total_aligners_upper: 0,
                total_aligners_lower: 0,
                current_aligner_upper: 0,
                current_aligner_lower: 0,
                change_frequency_days: 15,
                current_phase: 'DIAGNOSIS'
            });

            // Generate installments
            await orthoService.generateInstallments(contract.id);

            toast.success('Contrato ortodôntico criado com sucesso!');
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error('Erro ao criar contrato:', error);
            toast.error(error.message || 'Erro ao criar contrato');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
                <SheetHeader className="mb-6">
                    <SheetTitle>Novo Contrato Ortodôntico</SheetTitle>
                    <SheetDescription>
                        Configure o plano de tratamento e condições financeiras para {patientName}.
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Tipo de Tratamento */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Tipo de Tratamento
                        </label>
                        <select
                            value={formData.contract_type}
                            onChange={(e) => setFormData({ ...formData, contract_type: e.target.value as any })}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            required
                        >
                            <option value="ALIGNERS">Alinhadores (Invisalign)</option>
                            <option value="FIXED_BRACES">Aparelho Fixo</option>
                            <option value="CERAMIC">Aparelho Cerâmico</option>
                            <option value="LINGUAL">Aparelho Lingual</option>
                            <option value="ORTHOPEDIC">Ortopedia Funcional</option>
                        </select>
                    </div>

                    {/* Valores */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">
                                Valor Total
                            </label>
                            <div className="relative">
                                <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="number"
                                    value={formData.total_value}
                                    onChange={(e) => setFormData({ ...formData, total_value: parseFloat(e.target.value) })}
                                    className="flex h-10 w-full rounded-md border border-input bg-background pl-9 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    required
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">
                                Entrada
                            </label>
                            <div className="relative">
                                <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="number"
                                    value={formData.down_payment}
                                    onChange={(e) => setFormData({ ...formData, down_payment: parseFloat(e.target.value) })}
                                    className="flex h-10 w-full rounded-md border border-input bg-background pl-9 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    required
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Parcelamento */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">
                                Nº de Mensalidades
                            </label>
                            <input
                                type="number"
                                value={formData.number_of_months}
                                onChange={(e) => setFormData({ ...formData, number_of_months: parseInt(e.target.value) })}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                required
                                min="1"
                                max="60"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">
                                Dia vencimento
                            </label>
                            <input
                                type="number"
                                value={formData.billing_day}
                                onChange={(e) => setFormData({ ...formData, billing_day: parseInt(e.target.value) })}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                required
                                min="1"
                                max="31"
                            />
                        </div>
                    </div>

                    {/* Resumo Financeiro Card */}
                    <div className="rounded-lg border border-border bg-card text-card-foreground shadow-sm p-4">
                        <h3 className="font-semibold leading-none tracking-tight mb-3">Resumo Financeiro</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Valor Total:</span>
                                <span className="font-medium">
                                    R$ {formData.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Entrada:</span>
                                <span className="font-medium">
                                    R$ {formData.down_payment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-border mt-2">
                                <span className="text-muted-foreground">Mensalidade:</span>
                                <span className="font-bold text-primary text-lg">
                                    {formData.number_of_months}x de R$ {monthlyPayment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Data de Início */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none">
                            Data de Início
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input
                                type="date"
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                className="flex h-10 w-full rounded-md border border-input bg-background pl-9 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                required
                            />
                        </div>
                    </div>

                    {/* Configurações */}
                    <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-input p-4">
                        <input
                            type="checkbox"
                            checked={formData.block_scheduling_if_overdue}
                            onChange={(e) => setFormData({ ...formData, block_scheduling_if_overdue: e.target.checked })}
                            className="h-4 w-4 rounded border-primary text-primary focus:ring-primary"
                        />
                        <div className="space-y-1 leading-none">
                            <label className="text-sm font-medium leading-none">
                                Bloqueio Automático
                            </label>
                            <p className="text-sm text-muted-foreground">
                                Bloquear agendamento se houver inadimplência superior a {formData.overdue_tolerance_days} dias.
                            </p>
                        </div>
                    </div>

                    {/* Observações */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none">
                            Observações do Contrato
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Informações adicionais..."
                        />
                    </div>

                    <SheetFooter className="pt-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 w-full sm:w-auto"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Criando...
                                </>
                            ) : (
                                'Criar Contrato'
                            )}
                        </button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
};
