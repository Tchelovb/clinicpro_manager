import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, Clock, DollarSign, Percent, Package } from 'lucide-react';
import { ProcedureKitBuilder } from './ProcedureKitBuilder';
import { profitAnalysisService } from '../../services/profitAnalysisService';

interface Procedure {
    id?: string;
    name: string;
    category: string;
    specialty?: string;
    base_price: number;
    estimated_duration: number; // minutos
    estimated_lab_cost: number;
    commission_type: 'PERCENTAGE' | 'FIXED_AMOUNT';
    commission_base_value: number;
}

interface ProcedureEditorModalProps {
    procedure: Procedure | null;
    clinicId: string;
    onSave: (data: Procedure) => Promise<void>;
    onClose: () => void;
}

export const ProcedureEditorModal: React.FC<ProcedureEditorModalProps> = ({
    procedure,
    clinicId,
    onSave,
    onClose
}) => {
    const [formData, setFormData] = useState<Procedure>({
        name: '',
        category: '',
        specialty: '',
        base_price: 0,
        estimated_duration: 30,
        estimated_lab_cost: 0,
        commission_type: 'PERCENTAGE',
        commission_base_value: 0
    });

    const [kitCost, setKitCost] = useState(0);
    const [costPerMinute, setCostPerMinute] = useState(0);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'basic' | 'kit'>('basic');

    useEffect(() => {
        if (procedure) {
            setFormData(procedure);
        }
        loadCostPerMinute();
    }, [procedure]);

    const loadCostPerMinute = async () => {
        const cost = await profitAnalysisService.getCostPerMinute(clinicId);
        setCostPerMinute(cost);
    };

    const handleChange = (field: keyof Procedure, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        try {
            setSaving(true);
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error('Erro ao salvar:', error);
            alert('Erro ao salvar procedimento');
        } finally {
            setSaving(false);
        }
    };

    const calculateBaseCost = (): number => {
        const timeCost = formData.estimated_duration * costPerMinute;
        return timeCost + kitCost + formData.estimated_lab_cost;
    };

    const calculateSuggestedPrice = (targetMargin: number): number => {
        const baseCost = calculateBaseCost();
        const commissionRate = formData.commission_type === 'PERCENTAGE' ? formData.commission_base_value : 0;

        // Preço sugerido = Custo Base / (1 - (Margem + Comissão%) / 100)
        const suggestedPrice = baseCost / (1 - (targetMargin + commissionRate) / 100);
        return Math.ceil(suggestedPrice);
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {procedure ? 'Editar Procedimento' : 'Novo Procedimento'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('basic')}
                        className={`flex-1 px-6 py-3 font-medium ${activeTab === 'basic'
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Dados Básicos
                    </button>
                    <button
                        onClick={() => setActiveTab('kit')}
                        className={`flex-1 px-6 py-3 font-medium flex items-center justify-center gap-2 ${activeTab === 'kit'
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                        disabled={!procedure?.id}
                    >
                        <Package className="w-4 h-4" />
                        Kit de Materiais
                        {!procedure?.id && <span className="text-xs">(Salve primeiro)</span>}
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'basic' ? (
                        <div className="space-y-6">
                            {/* Nome e Categoria */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nome do Procedimento *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => handleChange('name', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Ex: Restauração em Resina"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Categoria *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.category}
                                        onChange={(e) => handleChange('category', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Ex: Dentística"
                                    />
                                </div>
                            </div>

                            {/* Tempo e Preço */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        Tempo Estimado (min) *
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.estimated_duration}
                                        onChange={(e) => handleChange('estimated_duration', parseInt(e.target.value) || 0)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Custo: {formatCurrency(formData.estimated_duration * costPerMinute)}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                        <DollarSign className="w-4 h-4" />
                                        Custo Lab (R$)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.estimated_lab_cost}
                                        onChange={(e) => handleChange('estimated_lab_cost', parseFloat(e.target.value) || 0)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Preço Base (R$) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.base_price}
                                        onChange={(e) => handleChange('base_price', parseFloat(e.target.value) || 0)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Comissão */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <Percent className="w-4 h-4" />
                                    Comissão do Profissional
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <select
                                        value={formData.commission_type}
                                        onChange={(e) => handleChange('commission_type', e.target.value)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="PERCENTAGE">Percentual (%)</option>
                                        <option value="FIXED_AMOUNT">Valor Fixo (R$)</option>
                                    </select>

                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.commission_base_value}
                                        onChange={(e) => handleChange('commission_base_value', parseFloat(e.target.value) || 0)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder={formData.commission_type === 'PERCENTAGE' ? 'Ex: 30' : 'Ex: 150.00'}
                                    />
                                </div>
                            </div>

                            {/* Análise de Custo */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                                <h4 className="text-sm font-bold text-gray-900 mb-4">
                                    💰 Análise de Custo e Margem
                                </h4>

                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-700">Custo Base (Tempo + Kit + Lab):</span>
                                        <span className="font-bold text-gray-900">{formatCurrency(calculateBaseCost())}</span>
                                    </div>

                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-700">Preço de Venda:</span>
                                        <span className="font-bold text-blue-700">{formatCurrency(formData.base_price)}</span>
                                    </div>

                                    <div className="pt-3 border-t border-blue-300">
                                        <div className="flex justify-between">
                                            <span className="font-bold text-gray-900">Margem Bruta:</span>
                                            <span className={`text-lg font-bold ${formData.base_price > calculateBaseCost() ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                {formData.base_price > 0
                                                    ? `${(((formData.base_price - calculateBaseCost()) / formData.base_price) * 100).toFixed(1)}%`
                                                    : '0%'
                                                }
                                            </span>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                                        <p className="text-xs font-medium text-gray-700 mb-2">💡 Preços Sugeridos:</p>
                                        <div className="grid grid-cols-3 gap-2 text-xs">
                                            <div>
                                                <span className="text-gray-600">Margem 20%:</span>
                                                <span className="ml-1 font-bold text-yellow-700">{formatCurrency(calculateSuggestedPrice(20))}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Margem 30%:</span>
                                                <span className="ml-1 font-bold text-green-700">{formatCurrency(calculateSuggestedPrice(30))}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Margem 40%:</span>
                                                <span className="ml-1 font-bold text-blue-700">{formatCurrency(calculateSuggestedPrice(40))}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <ProcedureKitBuilder
                            procedureId={procedure?.id || ''}
                            clinicId={clinicId}
                            estimatedDuration={formData.estimated_duration}
                            estimatedLabCost={formData.estimated_lab_cost}
                            costPerMinute={costPerMinute}
                            onKitCostChange={setKitCost}
                        />
                    )}
                </div>

                {/* Footer */}
                {activeTab === 'basic' && (
                    <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={saving || !formData.name || !formData.category}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Salvar Procedimento
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProcedureEditorModal;
