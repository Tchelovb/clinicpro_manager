import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
    Calendar, User, DollarSign, TrendingDown, Wallet, PiggyBank,
    Download, CheckCircle, FileText, AlertTriangle, Calculator, Loader2, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

interface TreatmentItem {
    id: string;
    execution_date: string;
    procedure_name: string;
    unit_value: number;
    total_value: number;
    patient_id: string;
    patient_name: string;
    procedure_id?: string;
    budgets?: any;
}

interface FeeConfig {
    fee_type: 'FIXED' | 'PERCENTAGE';
    fee_value: number;
}

interface CalculatedItem extends TreatmentItem {
    taxes: number;
    cardFees: number;
    labCost: number;
    totalDeductions: number;
    netBase: number;
    professionalFee: number;
    clinicProfit: number;
    feeType: 'FIXED' | 'PERCENTAGE';
    // New fields for Proportional Payment
    baseFee: number;
    paymentProgress: number; // 0 to 1
    futureReceivable: number;
    totalPaid: number;
    totalDue: number;
}

interface ClinicConfig {
    federal_tax_rate: number;
    avg_card_fee: number;
}

interface ProfessionalClosingPanelProps {
    professionalId?: string;
    autoFilter?: boolean;
    embedded?: boolean;
}

export const ProfessionalClosingPanel: React.FC<ProfessionalClosingPanelProps> = ({
    professionalId: propProfessionalId,
    autoFilter = false,
    embedded = false
}) => {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [professionals, setProfessionals] = useState<any[]>([]);
    const [selectedProfessional, setSelectedProfessional] = useState<string>('');
    const [selectedMonth, setSelectedMonth] = useState<string>(
        new Date().toISOString().slice(0, 7) // YYYY-MM
    );

    const [treatments, setTreatments] = useState<CalculatedItem[]>([]);
    const [settling, setSettling] = useState(false);
    const [clinicConfig, setClinicConfig] = useState<ClinicConfig>({
        federal_tax_rate: 0.11,
        avg_card_fee: 0.03
    });

    // Summary totals
    const summary = {
        totalGross: treatments.reduce((sum, t) => sum + t.total_value, 0),
        totalDeductions: treatments.reduce((sum, t) => sum + t.totalDeductions, 0),
        totalNetPayable: treatments.reduce((sum, t) => sum + t.professionalFee, 0),
        totalClinicProfit: treatments.reduce((sum, t) => sum + t.clinicProfit, 0),
        totalFutureReceivable: treatments.reduce((sum, t) => sum + (t.futureReceivable || 0), 0)
    };

    // Load professionals on mount (skip if autoFilter is true)
    useEffect(() => {
        if (!autoFilter) {
            loadProfessionals();
        }
        loadClinicConfig();

        // If autoFilter and professionalId provided, set it and load data
        if (autoFilter && propProfessionalId) {
            setSelectedProfessional(propProfessionalId);
        }
    }, [profile, autoFilter, propProfessionalId]);

    const loadProfessionals = async () => {
        if (!profile?.clinic_id) return;

        try {
            const { data, error } = await supabase
                .from('users')
                .select(`
                    id, 
                    name, 
                    professional_id,
                    professionals (
                        payment_release_rule
                    )
                `)
                .eq('clinic_id', profile.clinic_id)
                .eq('role', 'PROFESSIONAL')
                .eq('is_active', true)
                .order('name');

            if (error) throw error;
            setProfessionals(data || []);
        } catch (error) {
            console.error('Error loading professionals:', error);
            toast.error('Erro ao carregar profissionais');
        }
    };

    const loadClinicConfig = async () => {
        if (!profile?.clinic_id) return;

        try {
            const { data, error } = await supabase
                .from('clinics')
                .select('tax_rate_percent') // Correct column
                .eq('id', profile.clinic_id)
                .single();

            if (error) throw error;
            if (data) {
                setClinicConfig({
                    federal_tax_rate: (data.tax_rate_percent || 0) / 100, // Convert percentage to decimal
                    avg_card_fee: 0.03 // Default to 3% as column doesn't exist
                });
            }
        } catch (error) {
            console.error('Error loading clinic config:', error);
        }
    };

    const loadProduction = async () => {
        if (!selectedProfessional || !selectedMonth) {
            toast.error('Selecione um profissional e um período');
            return;
        }

        setLoading(true);
        try {
            // Find release rule for selected professional
            const profData = professionals.find(p => p.id === selectedProfessional);
            const releaseRule = profData?.professionals?.payment_release_rule || 'FULL_ON_COMPLETION';

            // Parse month to get start and end dates
            const [year, month] = selectedMonth.split('-');
            const startDate = `${year}-${month}-01`;
            const endDate = new Date(Number(year), Number(month), 0).toISOString().split('T')[0];

            // 1. Fetch available procedures for mapping (to get ID and Lab Cost by name)
            const { data: proceduresList } = await supabase
                .from('procedure')
                .select('id, name, estimated_lab_cost');

            const procedureMap = new Map();
            if (proceduresList) {
                proceduresList.forEach(p => procedureMap.set(p.name, p));
            }

            // 2. Fetch completed treatments (Removed budgets join which caused 400)
            const { data: treatmentsData, error: treatmentsError } = await supabase
                .from('treatment_items')
                .select(`
                    id,
                    execution_date,
                    procedure_name,
                    unit_value,
                    total_value,
                    patient_id,
                    patients(name),
                    budget_id
                `)
                .eq('doctor_id', selectedProfessional) // Filter by the selected professional's user ID
                .eq('status', 'COMPLETED') // TRAVA DE CONCLUSÃO: Only completed items
                .gte('execution_date', startDate)
                .lte('execution_date', endDate)
                .order('execution_date', { ascending: false });

            if (treatmentsError) throw treatmentsError;

            if (!treatmentsData || treatmentsData.length === 0) {
                toast.error('Nenhum procedimento concluído encontrado no período');
                setTreatments([]);
                return;
            }

            // 3. Fetch payments (installments) for relevant budgets
            const budgetIds = [...new Set(treatmentsData.map(t => t.budget_id).filter(Boolean))];

            let budgetProgressMap: Record<string, number> = {};

            if (budgetIds.length > 0) {
                const { data: installmentsData } = await supabase
                    .from('installments')
                    .select('budget_id, amount, status')
                    .in('budget_id', budgetIds);

                if (installmentsData) {
                    // Group by budget and calculate progress
                    budgetIds.forEach(bid => {
                        const budgetInstallments = installmentsData.filter(i => i.budget_id === bid);
                        const totalDue = budgetInstallments.reduce((sum, i) => sum + Number(i.amount), 0);
                        const totalPaid = budgetInstallments
                            .filter(i => i.status === 'PAID' || i.status === 'COMPLETED')
                            .reduce((sum, i) => sum + Number(i.amount), 0);

                        budgetProgressMap[bid] = totalDue > 0 ? (totalPaid / totalDue) : 0;
                    });
                }
            }

            // 4. Calculate for each treatment
            const calculatedTreatments: CalculatedItem[] = [];

            for (const treatment of treatmentsData) {
                // Resolve procedure data by name
                const proc = procedureMap.get(treatment.procedure_name);
                const procedureId = proc?.id || null;
                const labCost = Number(proc?.estimated_lab_cost || 0);

                // Fetch fee configuration
                let feeConfig: FeeConfig = { fee_type: 'PERCENTAGE', fee_value: 30 }; // Default

                if (procedureId) {
                    const { data: feeData } = await supabase
                        .from('professional_procedure_fees')
                        .select('fee_type, fee_value')
                        .eq('professional_id', profData?.professional_id) // Use professional_id not user_id
                        .eq('procedure_id', procedureId)
                        .maybeSingle(); // Use maybeSingle to avoid errors

                    if (feeData) {
                        feeConfig = feeData as FeeConfig;
                    }
                }

                // Calculate deductions
                const salePrice = treatment.total_value;
                const taxes = salePrice * clinicConfig.federal_tax_rate;
                const cardFees = salePrice * clinicConfig.avg_card_fee;
                const totalDeductions = taxes + cardFees + labCost;
                const netBase = salePrice - totalDeductions;

                // Calculate BASE Base Fee (100%)
                let baseFee = 0;
                if (feeConfig.fee_type === 'FIXED') {
                    baseFee = feeConfig.fee_value;
                } else {
                    // PERCENTAGE
                    baseFee = netBase * (feeConfig.fee_value / 100);
                }

                // Determine Payment Progress
                let paymentProgress = 1; // Default to 100%
                if (treatment.budget_id && budgetProgressMap[treatment.budget_id] !== undefined) {
                    paymentProgress = budgetProgressMap[treatment.budget_id];
                }

                // Determine Actual Payable Fee based on Rule
                let professionalFee = 0;
                let futureReceivable = 0;

                if (releaseRule === 'PROPORTIONAL_TO_PAYMENT') {
                    professionalFee = baseFee * paymentProgress;
                    futureReceivable = baseFee - professionalFee;
                } else {
                    // FULL_ON_COMPLETION
                    professionalFee = baseFee;
                    futureReceivable = 0; // Risk is on clinic
                }

                // Calculate clinic profit
                const clinicProfit = salePrice - totalDeductions - professionalFee;

                calculatedTreatments.push({
                    ...treatment,
                    patient_name: (treatment.patients as any)?.name || 'Paciente não identificado',
                    taxes,
                    cardFees,
                    labCost,
                    totalDeductions,
                    netBase,
                    professionalFee,
                    clinicProfit,
                    feeType: feeConfig.fee_type,
                    baseFee,
                    paymentProgress,
                    futureReceivable,
                    totalPaid: 0, // Placeholder
                    totalDue: 0   // Placeholder
                });
            }

            setTreatments(calculatedTreatments);
            toast.success(`${calculatedTreatments.length} procedimentos carregados`);

        } catch (error) {
            console.error('Error loading production:', error);
            toast.error('Erro ao carregar produção');
        } finally {
            setLoading(false);
        }
    };

    const handleSettlement = async () => {
        if (!selectedProfessional || !selectedMonth || treatments.length === 0) {
            toast.error('Selecione um profissional e período com produção');
            return;
        }

        const [year, month] = selectedMonth.split('-');

        // Confirm action
        if (!confirm(`Confirmar liquidação do período ${month}/${year}?\n\nEsta ação registrará este fechamento no histórico permanente.`)) {
            return;
        }

        try {
            setSettling(true);

            const { error } = await supabase
                .from('professional_payment_history')
                .insert({
                    professional_id: selectedProfessional,
                    clinic_id: profile?.clinic_id,
                    period_month: parseInt(month),
                    period_year: parseInt(year),
                    total_gross: summary.totalGross,
                    total_deductions: summary.totalDeductions,
                    total_net_payable: summary.totalNetPayable,
                    total_clinic_profit: summary.totalClinicProfit,
                    items_detail: treatments,
                    clinic_config: clinicConfig,
                    settled_by: profile?.id
                });

            if (error) {
                if (error.code === '23505') { // Unique constraint violation
                    toast.error('Este período já foi liquidado anteriormente');
                } else {
                    throw error;
                }
                return;
            }

            toast.success('Período liquidado com sucesso!');
            // Clear treatments after successful settlement
            setTreatments([]);
        } catch (error) {
            console.error('Error settling period:', error);
            toast.error('Erro ao liquidar período');
        } finally {
            setSettling(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    return (
        <div className={embedded ? "space-y-6" : "max-w-7xl mx-auto p-6 space-y-6"}>
            {/* Header */}
            {!embedded && (
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-4">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                <Calculator className="text-blue-600" size={32} />
                                Fechamento Profissional
                            </h1>
                            {selectedProfessional && (
                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${(professionals.find(p => p.id === selectedProfessional)?.professionals as any)?.payment_release_rule === 'PROPORTIONAL_TO_PAYMENT'
                                    ? 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700'
                                    : 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700'
                                    }`}>
                                    {(professionals.find(p => p.id === selectedProfessional)?.professionals as any)?.payment_release_rule === 'PROPORTIONAL_TO_PAYMENT'
                                        ? 'Regra: Proporcional'
                                        : 'Regra: Execução'}
                                </span>
                            )}
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Cálculo de repasses e comissões mensais
                        </p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <User size={20} className="text-blue-600" />
                    Filtros de Produção
                </h3>
                <div className={`grid grid-cols-1 ${autoFilter ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-4`}>
                    {/* Professional Selector - Hidden if autoFilter */}
                    {!autoFilter && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Profissional
                            </label>
                            <select
                                value={selectedProfessional}
                                onChange={(e) => setSelectedProfessional(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="">Selecione um profissional</option>
                                {professionals.map(prof => (
                                    <option key={prof.id} value={prof.id}>
                                        {prof.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Month Selector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Mês/Ano
                        </label>
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            max={new Date().toISOString().slice(0, 7)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    {/* Load Button */}
                    <div className="flex items-end">
                        <button
                            onClick={loadProduction}
                            disabled={loading || !selectedProfessional}
                            className="w-full px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Carregando...
                                </>
                            ) : (
                                <>
                                    <Calculator size={18} />
                                    Carregar Produção
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            {treatments.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Total Gross */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-700 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <DollarSign className="text-blue-600 dark:text-blue-400" size={24} />
                            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">Bruto</span>
                        </div>
                        <p className="text-3xl font-black text-blue-700 dark:text-blue-300">
                            {formatCurrency(summary.totalGross)}
                        </p>
                        <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">
                            Total Produzido
                        </p>
                    </div>

                    {/* Total Deductions */}
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border border-orange-200 dark:border-orange-700 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingDown className="text-orange-600 dark:text-orange-400" size={24} />
                            <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase">Deduções</span>
                        </div>
                        <p className="text-3xl font-black text-orange-700 dark:text-orange-300">
                            {formatCurrency(summary.totalDeductions)}
                        </p>
                        <p className="text-xs text-orange-600/70 dark:text-orange-400/70 mt-1">
                            Impostos + Taxas + Lab
                        </p>
                    </div>

                    {/* Total Net Payable */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-800/20 border border-green-200 dark:border-green-700 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <Wallet className="text-green-600 dark:text-green-400" size={24} />
                            <span className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase">Repasse</span>
                        </div>
                        <p className="text-3xl font-black text-green-700 dark:text-green-300">
                            {formatCurrency(summary.totalNetPayable)}
                        </p>
                        <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-1">
                            A Pagar ao Profissional
                        </p>
                    </div>

                    {/* Future Receivable (Proportional Hold) */}
                    <div className="bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-900/20 dark:to-amber-800/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <Clock className="text-amber-600 dark:text-amber-400" size={24} />
                            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase">A Receber</span>
                        </div>
                        <p className="text-3xl font-black text-amber-700 dark:text-amber-300">
                            {formatCurrency(summary.totalFutureReceivable)}
                        </p>
                        <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-1">
                            Retido por Regra Proporcional
                        </p>
                    </div>

                    {/* Clinic Profit */}
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-700 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <PiggyBank className="text-purple-600 dark:text-purple-400" size={24} />
                            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase">Lucro</span>
                        </div>
                        <p className="text-3xl font-black text-purple-700 dark:text-purple-300">
                            {formatCurrency(summary.totalClinicProfit)}
                        </p>
                        <p className="text-xs text-purple-600/70 dark:text-purple-400/70 mt-1">
                            Lucro Líquido da Clínica
                        </p>
                    </div>
                </div>
            )}

            {/* Settlement Button */}
            {treatments.length > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border-2 border-green-200 dark:border-green-800 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-green-900 dark:text-green-100 flex items-center gap-2">
                                <CheckCircle size={24} />
                                Liquidar Período
                            </h3>
                            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                                Confirme o fechamento para registrar este repasse no histórico permanente
                            </p>
                        </div>
                        <button
                            onClick={handleSettlement}
                            disabled={settling}
                            className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold rounded-lg transition-colors flex items-center gap-2 shadow-lg"
                        >
                            {settling ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Processando...
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={20} />
                                    Confirmar e Liquidar
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Detailed Statement Table */}
            {treatments.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <FileText size={20} className="text-blue-600" />
                            Extrato Detalhado ({treatments.length} procedimentos)
                        </h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-900/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Data</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Paciente</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Procedimento</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Bruto</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Deduções</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Base Líquida</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Progresso</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Repasse</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Futuro</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {treatments.map((treatment) => (
                                    <tr key={treatment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                            {new Date(treatment.execution_date).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                            {treatment.patient_name}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                            {treatment.procedure_name}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right font-semibold text-blue-600 dark:text-blue-400">
                                            {formatCurrency(treatment.total_value)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right text-orange-600 dark:text-orange-400">
                                            {formatCurrency(treatment.totalDeductions)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-gray-100">
                                            {formatCurrency(treatment.netBase)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${treatment.feeType === 'FIXED'
                                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                                : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                                }`}>
                                                {treatment.feeType === 'FIXED' ? 'R$' : '%'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${treatment.paymentProgress >= 1
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                                : treatment.paymentProgress > 0
                                                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                                }`}>
                                                {Math.round(treatment.paymentProgress * 100)}%
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right font-bold text-green-600 dark:text-green-400">
                                            {formatCurrency(treatment.professionalFee)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right font-medium text-amber-600 dark:text-amber-400">
                                            {formatCurrency(treatment.futureReceivable)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-100 dark:bg-gray-900">
                                <tr className="font-bold">
                                    <td colSpan={3} className="px-4 py-4 text-sm text-gray-900 dark:text-white uppercase">
                                        TOTAIS
                                    </td>
                                    <td className="px-4 py-4 text-sm text-right text-blue-700 dark:text-blue-300">
                                        {formatCurrency(summary.totalGross)}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-right text-orange-700 dark:text-orange-300">
                                        {formatCurrency(summary.totalDeductions)}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-right text-gray-900 dark:text-white">
                                        {formatCurrency(summary.totalGross - summary.totalDeductions)}
                                    </td>
                                    <td className="px-4 py-4"></td>
                                    <td className="px-4 py-4 text-center text-sm text-gray-500">
                                        {/* Average Progress */}
                                        {summary.totalFutureReceivable + summary.totalNetPayable > 0
                                            ? Math.round((summary.totalNetPayable / (summary.totalNetPayable + summary.totalFutureReceivable)) * 100) + '%'
                                            : '-'
                                        }
                                    </td>
                                    <td className="px-4 py-4 text-sm text-right text-green-700 dark:text-green-300">
                                        {formatCurrency(summary.totalNetPayable)}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-right text-amber-700 dark:text-amber-300">
                                        {formatCurrency(summary.totalFutureReceivable)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!loading && treatments.length === 0 && selectedProfessional && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                    <Calculator size={48} className="text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">
                        Selecione um profissional e período para visualizar a produção
                    </p>
                </div>
            )}
        </div>
    );
};
