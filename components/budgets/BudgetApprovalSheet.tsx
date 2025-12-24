
import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '../ui/sheet';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { supabase } from '../../lib/supabase';
import { receivablesService, ApprovalSimulationResult } from '../../services/receivablesService';
import { Loader2, CreditCard, Calendar, Calculator, CheckCircle2, TrendingDown, TrendingUp, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { auditService } from '../../services/auditService';

interface BudgetApprovalSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    budget: any; // Tipar melhor depois
    clinicId: string;
    onSuccess: () => void;
}

export const BudgetApprovalSheet: React.FC<BudgetApprovalSheetProps> = ({
    open,
    onOpenChange,
    budget,
    clinicId,
    onSuccess
}) => {
    const [loading, setLoading] = useState(false);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [
        selectedProfile, setSelectedProfile
    ] = useState<string>('');

    // Form State
    const [installments, setInstallments] = useState(1);
    const [downPayment, setDownPayment] = useState(0);
    const [firstDueDate, setFirstDueDate] = useState<string>(new Date().toISOString().split('T')[0]);

    // Simulation State
    const [simulation, setSimulation] = useState<ApprovalSimulationResult | null>(null);

    useEffect(() => {
        if (open) {
            loadMachineProfiles();
            // Reset form
            setInstallments(1);
            setDownPayment(0);
            setSimulation(null);
            setFirstDueDate(new Date().toISOString().split('T')[0]);
        }
    }, [open, clinicId]);

    useEffect(() => {
        if (budget && selectedProfile) {
            runSimulation();
        }
    }, [budget, selectedProfile, installments, downPayment]);

    const loadMachineProfiles = async () => {
        try {
            const { data, error } = await supabase
                .from('card_machine_profiles')
                .select('*')
                .eq('clinic_id', clinicId)
                .eq('active', true);

            if (data) setProfiles(data);
            // Auto select default
            const defaultProfile = data?.find(p => p.is_default);
            if (defaultProfile) setSelectedProfile(defaultProfile.id);
            else if (data && data.length > 0) setSelectedProfile(data[0].id);

        } catch (err) {
            console.error(err);
        }
    };

    const runSimulation = async () => {
        if (!budget) return;

        try {
            const result = await receivablesService.simulateApproval({
                totalValue: budget.final_value,
                installments,
                cardProfileId: selectedProfile,
                downPayment,
                clinicId
            });
            setSimulation(result);
        } catch (err) {
            console.error('Simulation error', err);
        }
    };

    const handleApprove = async () => {
        if (!budget || !selectedProfile || !simulation) return;

        // PROFIT GUARDIAN S1: BLOCK LOSS
        if (simulation.netValue < 0) {
            toast.error('PROFIT GUARDIAN: Operação Bloqueada! Venda com prejuízo real.');

            // Log Auditoria
            auditService.log({
                action_type: 'UPDATE', // Attempted update
                entity_type: 'BUDGET',
                entity_id: budget.id,
                entity_name: `Orçamento #${budget.id}`,
                changes_summary: `TENTATIVA DE APROVAÇÃO COM PREJUÍZO: Valor Bruto ${simulation.grossValue}, Líquido ${simulation.netValue}`
            });
            return;
        }

        // PROFIT GUARDIAN S1: WARNING LOW MARGIN (< 20%)
        const marginPercent = (simulation.netValue / simulation.grossValue) * 100;
        if (marginPercent < 20) {
            // Just Log for now, allowing proceed with visual warning already shown
            auditService.log({
                action_type: 'UPDATE',
                entity_type: 'BUDGET',
                entity_id: budget.id,
                entity_name: `Orçamento #${budget.id}`,
                changes_summary: `Aprovação com margem baixa (${marginPercent.toFixed(1)}%)`
            });
        }

        try {
            setLoading(true);
            await receivablesService.approveBudgetAndGenerateInstallments(budget.id, {
                totalValue: budget.final_value,
                installments,
                cardProfileId: selectedProfile,
                downPayment,
                clinicId,
                firstDueDate: new Date(firstDueDate),
                patientId: budget.patient_id
            });

            // Log Success
            auditService.logBudgetApproved(budget.id, budget.patient?.name || 'Paciente', budget.final_value);

            toast.success('Orçamento Aprovado e Financeiro Gerado!');
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao aprovar orçamento');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="sm:max-w-md p-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl">
                {/* Header Estilizado */}
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-white text-center">
                    <div className="mx-auto bg-white/20 w-12 h-12 rounded-full flex items-center justify-center mb-3 backdrop-blur-sm">
                        <CheckCircle2 size={24} className="text-white" />
                    </div>
                    <SheetTitle className="text-white text-2xl font-bold">Aprovar Orçamento</SheetTitle>
                    <SheetDescription className="text-violet-100 mt-1">
                        Configure as condições de pagamento
                    </SheetDescription>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-180px)]">

                    {/* Resumo do Valor */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <span className="text-sm font-medium text-slate-500">Valor Final</span>
                        <span className="text-2xl font-bold text-slate-900 dark:text-white">
                            {budget ? formatCurrency(budget.final_value) : '...'}
                        </span>
                    </div>

                    {/* Seleção de Maquininha */}
                    <div className="space-y-2">
                        <Label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Processador de Pagamento</Label>
                        <Select value={selectedProfile} onValueChange={setSelectedProfile}>
                            <SelectTrigger className="h-12 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                                <SelectValue placeholder="Selecione a maquininha" />
                            </SelectTrigger>
                            <SelectContent>
                                {profiles.map(p => (
                                    <SelectItem key={p.id} value={p.id}>
                                        <div className="flex items-center gap-2">
                                            <CreditCard size={16} className="text-slate-400" />
                                            <span>{p.name}</span>
                                            {p.is_default && <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">Padrão</span>}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Entrada */}
                        <div className="space-y-2">
                            <Label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Entrada (Dinheiro/Pix)</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
                                <Input
                                    type="number"
                                    className="pl-9 h-11 border-slate-200"
                                    placeholder="0,00"
                                    value={downPayment}
                                    onChange={e => setDownPayment(parseFloat(e.target.value) || 0)}
                                />
                            </div>
                        </div>

                        {/* Parcelas */}
                        <div className="space-y-2">
                            <Label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Parcelas (Crédito)</Label>
                            <Select value={String(installments)} onValueChange={v => setInstallments(Number(v))}>
                                <SelectTrigger className="h-11 border-slate-200">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="max-h-60">
                                    {Array.from({ length: 18 }, (_, i) => i + 1).map(num => (
                                        <SelectItem key={num} value={String(num)}>
                                            {num}x {num === 1 ? '(À vista)' : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Data 1º Vencimento */}
                    <div className="space-y-2">
                        <Label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Data 1º Vencimento</Label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <Input
                                type="date"
                                className="pl-9 h-11 border-slate-200"
                                value={firstDueDate}
                                onChange={e => setFirstDueDate(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* SIMULAÇÃO DE RECEBIMENTOS */}
                    {simulation && (
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                            <div className="flex items-center gap-2 mb-2">
                                <Calculator className="w-4 h-4 text-violet-600" />
                                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Simulação de Recebíveis</h4>
                            </div>

                            {/* PROFIT GUARDIAN ALERTS */}
                            {simulation.netValue < 0 ? (
                                <div className="mb-3 p-3 bg-red-100 border border-red-200 rounded-lg flex items-start gap-2">
                                    <div className="p-1 bg-red-200 rounded-full">
                                        <TrendingDown className="w-4 h-4 text-red-600 shrink-0" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-red-800">⛔ Operação Bloqueada</h4>
                                        <p className="text-xs text-red-700 leading-relaxed">
                                            Esta venda gera <strong>PREJUÍZO REAL</strong> de {formatCurrency(simulation.netValue)}.
                                            Aumente o valor ou altere as condições.
                                        </p>
                                    </div>
                                </div>
                            ) : ((simulation.netValue / simulation.grossValue) * 100 < 20) && (
                                <div className="mb-3 p-3 bg-yellow-100 border border-yellow-200 rounded-lg flex items-start gap-2">
                                    <div className="p-1 bg-yellow-200 rounded-full">
                                        <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-yellow-800">⚠️ Margem de Risco</h4>
                                        <p className="text-xs text-yellow-700 leading-relaxed">
                                            Margem de <strong>{((simulation.netValue / simulation.grossValue) * 100).toFixed(1)}%</strong> é inferior ao ideal (20%).
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between text-slate-500">
                                    <span>Taxas Maquininha ({simulation.rates.card}%)</span>
                                    <span className="text-red-500 font-medium">- {formatCurrency(simulation.cardFeeAmount)}</span>
                                </div>
                                <div className="flex justify-between text-slate-500">
                                    <span>Impostos ({simulation.rates.tax}%)</span>
                                    <span className="text-red-500 font-medium">- {formatCurrency(simulation.taxAmount)}</span>
                                </div>
                                <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between items-center">
                                    <span className="font-bold text-slate-700 dark:text-slate-300">Líquido Estimado</span>
                                    <div className="text-right">
                                        <span className="block text-xl font-bold text-green-600 break-words max-w-[150px]">
                                            {formatCurrency(simulation.netValue)}
                                        </span>
                                        <span className="text-xs text-slate-400">
                                            Margem Real: {((simulation.netValue / simulation.grossValue) * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <SheetFooter className="absolute bottom-0 left-0 right-0 p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex gap-3 w-full">
                        <Button variant="outline" className="flex-1 h-12" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button
                            className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white font-bold text-base shadow-lg shadow-green-600/20"
                            onClick={handleApprove}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Processando...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-5 h-5 mr-2" />
                                    Confirmar Aprovação
                                </>
                            )}
                        </Button>
                    </div>
                </SheetFooter>

            </SheetContent>
        </Sheet>
    );
};
