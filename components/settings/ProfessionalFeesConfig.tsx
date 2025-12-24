import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { X, Search, Save, Loader2, DollarSign, Percent, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ProfessionalFeesConfigProps {
    open?: boolean;
    onClose?: () => void;
    professionalId?: string;
    professionalName?: string;
    embedded?: boolean; // If true, renders without modal wrapper
}

interface ProcedureFeeItem {
    procedure_id: string;
    procedure_name: string;
    category_name: string;
    standard_commission: number;
    fee_type: 'FIXED' | 'PERCENTAGE';
    fee_value: number;
    is_custom: boolean; // true if record exists in professional_procedure_fees
    lab_cost?: number; // optional lab cost for the procedure
    minute_cost?: number; // optional estimated minute cost for the procedure
}

export const ProfessionalFeesConfig: React.FC<ProfessionalFeesConfigProps> = ({ open = true, onClose, professionalId, professionalName, embedded = false }) => {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [items, setItems] = useState<ProcedureFeeItem[]>([]);
    // Clinic configuration for fee suggestion
    const [clinicConfig, setClinicConfig] = useState<{ tax_rate: number; target_profit_margin: number; avg_card_fee: number }>({
        tax_rate: 0,
        target_profit_margin: 0.3,
        avg_card_fee: 0,
    });

    useEffect(() => {
        if ((open || embedded) && professionalId) {
            loadData();
        }
        // fetch clinic configuration for fee suggestion
        if (profile?.clinic_id) {
            (async () => {
                const { data, error } = await supabase
                    .from('clinics')
                    .select('federal_tax_rate, target_profit_margin, avg_card_fee')
                    .eq('id', profile.clinic_id)
                    .single();
                if (!error && data) {
                    setClinicConfig({
                        tax_rate: Number(data.federal_tax_rate ?? 0),
                        target_profit_margin: Number(data.target_profit_margin ?? 0.3),
                        avg_card_fee: Number(data.avg_card_fee ?? 0),
                    });
                }
            })();
        }
    }, [open, professionalId, profile]);

    const loadData = async () => {
        if (!profile?.clinic_id) return;
        setLoading(true);
        try {
            // 1. Fetch all active procedures
            const { data: procedures, error: procError } = await supabase
                .from('procedure')
                .select('id, name, category, commission_base_value, estimated_lab_cost, estimated_time_minutes')
                .eq('clinic_id', profile.clinic_id)
                .order('name');

            if (procError) throw procError;

            // 2. Fetch existing custom fees for this professional
            const { data: fees, error: feesError } = await supabase
                .from('professional_procedure_fees')
                .select('procedure_id, fee_type, fee_value')
                .eq('professional_id', professionalId);

            if (feesError) throw feesError;

            // 3. Merge data
            const feesMap = new Map(fees?.map(f => [f.procedure_id, f]));

            const mergedItems: ProcedureFeeItem[] = (procedures || []).map(p => {
                const customFee = feesMap.get(p.id);
                return {
                    procedure_id: p.id,
                    procedure_name: p.name,
                    category_name: p.category || 'CLINICA_GERAL',
                    standard_commission: p.commission_base_value || 0,
                    fee_type: (customFee?.fee_type as 'FIXED' | 'PERCENTAGE') || 'FIXED',
                    fee_value: customFee?.fee_value ?? 0,
                    is_custom: !!customFee,
                    lab_cost: p.estimated_lab_cost ?? 0,
                    minute_cost: ((p.estimated_time_minutes ?? 60) * (clinicConfig.tax_rate / 60)) ?? 0,
                } as ProcedureFeeItem;
            });

            setItems(mergedItems);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar dados de honorários");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveItem = async (item: ProcedureFeeItem) => {
        // Validation: percentage cannot exceed 100%
        if (item.fee_type === 'PERCENTAGE' && item.fee_value > 100) {
            toast.error('Valor percentual não pode ser maior que 100%');
            return;
        }
        try {
            // Upsert to professional_procedure_fees
            const { error } = await supabase
                .from('professional_procedure_fees')
                .upsert({
                    clinic_id: profile!.clinic_id,
                    professional_id: professionalId,
                    procedure_id: item.procedure_id,
                    fee_type: item.fee_type,
                    fee_value: item.fee_value,
                    is_active: true,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'professional_id, procedure_id' });

            if (error) throw error;

            setItems(prev => prev.map(p => p.procedure_id === item.procedure_id ? { ...p, is_custom: true } : p));
            toast.success('Honorário salvo');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao salvar');
        }
    };

    const handleUpdateLocal = (id: string, field: keyof ProcedureFeeItem, value: any) => {
        setItems(prev => prev.map(p => p.procedure_id === id ? { ...p, [field]: value } : p));
    };

    const filteredItems = items.filter(i =>
        i.procedure_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.category_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate suggested fee to maintain target profit margin
    const calculateSuggestedFee = (item: ProcedureFeeItem): number => {
        const salePrice = item.standard_commission;
        const taxes = salePrice * clinicConfig.tax_rate;
        const cardFees = salePrice * clinicConfig.avg_card_fee;
        const labCost = item.lab_cost ?? 0;
        const minuteCost = item.minute_cost ?? 0;
        const targetMargin = salePrice * (clinicConfig.target_profit_margin / 100);

        const suggested = salePrice - (taxes + cardFees + labCost + minuteCost + targetMargin);
        return Math.max(0, suggested); // Cannot be negative
    };

    // Calculate actual margin percentage based on current fee
    const calculateActualMargin = (item: ProcedureFeeItem): number => {
        const salePrice = item.standard_commission;
        if (salePrice === 0) return 0;

        const taxes = salePrice * clinicConfig.tax_rate;
        const cardFees = salePrice * clinicConfig.avg_card_fee;
        const labCost = item.lab_cost ?? 0;
        const minuteCost = item.minute_cost ?? 0;

        let professionalFee = 0;
        if (item.fee_type === 'FIXED') {
            professionalFee = item.fee_value;
        } else {
            professionalFee = salePrice * (item.fee_value / 100);
        }

        const clinicProfit = salePrice - (taxes + cardFees + labCost + minuteCost + professionalFee);
        return (clinicProfit / salePrice) * 100; // Return percentage
    };

    // Check if current fee puts margin at risk
    const isMarginAtRisk = (item: ProcedureFeeItem): boolean => {
        if (item.fee_value === 0) return false; // Not configured yet
        const actualMargin = calculateActualMargin(item);
        const targetMarginPercent = clinicConfig.target_profit_margin;
        return actualMargin < targetMarginPercent;
    };

    if (!open && !embedded) return null;

    const tableContent = (
        <div className="bg-white dark:bg-slate-800 w-full max-w-4xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-slate-800">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Tabela de Honorários</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Configurando valores para <span className="font-semibold text-blue-600">{professionalName}</span>
                    </p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                    <X size={20} className="text-gray-500" />
                </button>
            </div>

            {/* Toolbar */}
            <div className="p-4 bg-gray-50 dark:bg-slate-900/50 flex gap-4 border-b border-gray-100 dark:border-gray-700">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 text-gray-400 h-4 w-4" />
                    <input
                        type="text"
                        placeholder="Buscar procedimento..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            </div>

            {/* Table Content */}
            <div className="flex-1 overflow-y-auto p-0">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-400">
                        <Loader2 className="animate-spin" size={32} />
                        <p>Carregando procedimentos...</p>
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-slate-900/50 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Procedimento</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Base Padrão</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo Honorário</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Valor Honorário</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sugestão p/ Saúde</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-100 dark:divide-gray-700">
                            {filteredItems.map(item => (
                                <tr key={item.procedure_id} className={`hover:bg-blue-50/50 dark:hover:bg-slate-700/30 transition-colors ${item.is_custom ? 'bg-blue-50/10 dark:bg-blue-900/10' : ''}`}>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900 dark:text-gray-200">{item.procedure_name}</div>
                                        <div className="text-xs text-gray-500">{item.category_name}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.standard_commission)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1 w-fit">
                                            <button
                                                onClick={() => handleUpdateLocal(item.procedure_id, 'fee_type', 'FIXED')}
                                                className={`p-1.5 rounded-md transition-all ${item.fee_type === 'FIXED' ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                                                title="Valor Fixo"
                                            >
                                                <DollarSign size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleUpdateLocal(item.procedure_id, 'fee_type', 'PERCENTAGE')}
                                                className={`p-1.5 rounded-md transition-all ${item.fee_type === 'PERCENTAGE' ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                                                title="Porcentagem"
                                            >
                                                <Percent size={14} />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="relative w-32">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                                                {item.fee_type === 'FIXED' ? 'R$' : '%'}
                                            </span>
                                            <input
                                                type="number"
                                                value={item.fee_value}
                                                onChange={(e) => handleUpdateLocal(item.procedure_id, 'fee_value', parseFloat(e.target.value) || 0)}
                                                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-transparent"
                                            />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    const suggested = calculateSuggestedFee(item);
                                                    handleUpdateLocal(item.procedure_id, 'fee_type', 'FIXED');
                                                    handleUpdateLocal(item.procedure_id, 'fee_value', suggested);
                                                }}
                                                className="px-3 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 dark:hover:from-green-900/30 dark:hover:to-emerald-900/30 border border-green-200 dark:border-green-700 rounded-lg transition-all group"
                                                title="Clique para aplicar este valor"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <DollarSign size={14} className="text-green-600 dark:text-green-400" />
                                                    <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                                                        {new Intl.NumberFormat('pt-BR', {
                                                            style: 'currency',
                                                            currency: 'BRL'
                                                        }).format(calculateSuggestedFee(item))}
                                                    </span>
                                                </div>
                                            </button>
                                            {isMarginAtRisk(item) && (
                                                <div
                                                    className="flex items-center gap-1 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-md border border-orange-200 dark:border-orange-700"
                                                    title={`Margem atual: ${calculateActualMargin(item).toFixed(1)}% (abaixo do alvo de ${clinicConfig.target_profit_margin}%)`}
                                                >
                                                    <AlertTriangle size={14} />
                                                    <span className="text-xs font-medium">
                                                        {calculateActualMargin(item).toFixed(1)}%
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleSaveItem(item)}
                                            className={`p-2 rounded-lg transition-colors ${item.is_custom
                                                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300'
                                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-400'
                                                }`}
                                            title="Salvar"
                                        >
                                            <Save size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-gray-700 text-right">
                <button
                    onClick={onClose}
                    className="px-6 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-all"
                >
                    Fechar
                </button>
            </div>
        </div>
    );

    // Return with or without modal wrapper
    if (embedded) {
        return tableContent;
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-200">
            {tableContent}
        </div>
    );
};
