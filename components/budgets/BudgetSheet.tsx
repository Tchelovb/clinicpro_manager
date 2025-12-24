import React, { useState, useEffect } from 'react';
import { BaseSheet } from '../shared/BaseSheet';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';
import { Button } from '../ui/button';
import {
    Plus,
    Trash2,
    Search,
    TrendingUp,
    AlertTriangle,
    DollarSign,
    Package,
    Clock,
    Users
} from 'lucide-react';
import { profitAnalysisService } from '../../services/profitAnalysisService';
import { procedureRecipeService } from '../../services/procedureRecipeService';
import { BudgetProfitSummary } from '../profit/BudgetProfitSummary';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

import { BudgetApprovalSheet } from './BudgetApprovalSheet';

interface BudgetItem {
    id: string;
    procedure_id: string;
    procedure_name: string;
    quantity: number;
    unit_price: number;
    discount_percent: number;
    total: number;
    // Profit data
    margin_percent?: number;
    profit?: number;
    costs?: any;
}

interface Budget {
    id?: string;
    patient_id: string;
    doctor_id: string;
    sales_rep_id?: string;
    price_table_id?: string;
    items: BudgetItem[];
    total_value: number;
    discount: number;
    final_value: number;
    status: 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED';
}

interface Patient {
    id: string;
    full_name: string;
    cpf?: string;
}

interface Professional {
    id: string;
    name: string;
    role: string;
}

interface Procedure {
    id: string;
    name: string;
    category: string;
    base_price: number;
    estimated_duration: number;
    estimated_lab_cost: number;
}

interface PriceTable {
    id: string;
    name: string;
    is_standard: boolean;
}

interface PriceTableItem {
    price_table_id: string;
    procedure_id: string;
    price: number;
}

interface BudgetSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    budget: Budget | null;
    patients: Patient[];
    professionals: Professional[];
    procedures: Procedure[];
    priceTables: PriceTable[];
    clinicId: string;
    onSave: (data: Budget) => Promise<void>;
}

export const BudgetSheet: React.FC<BudgetSheetProps> = ({
    open,
    onOpenChange,
    budget,
    patients,
    professionals,
    procedures,
    priceTables,
    clinicId,
    onSave
}) => {
    const [formData, setFormData] = useState<Budget>({
        patient_id: '',
        doctor_id: '',
        sales_rep_id: '',
        price_table_id: '',
        items: [],
        total_value: 0,
        discount: 0,
        final_value: 0,
        status: 'DRAFT'
    });

    const [selectedProcedureId, setSelectedProcedureId] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [costPerMinute, setCostPerMinute] = useState(0);
    const [budgetMarginAnalysis, setBudgetMarginAnalysis] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [patientSearch, setPatientSearch] = useState('');
    const [priceTableItems, setPriceTableItems] = useState<PriceTableItem[]>([]);
    const [approvalSheetOpen, setApprovalSheetOpen] = useState(false);

    useEffect(() => {
        if (budget) {
            setFormData(budget);
        } else {
            // Buscar tabela padrão
            const standardTable = priceTables.find(t => t.is_standard);
            setFormData({
                patient_id: '',
                doctor_id: '',
                sales_rep_id: '',
                price_table_id: standardTable?.id || '',
                items: [],
                total_value: 0,
                discount: 0,
                final_value: 0,
                status: 'DRAFT'
            });
        }
        loadCostPerMinute();
        if (formData.price_table_id) {
            loadPriceTableItems(formData.price_table_id);
        }
    }, [budget, open]);

    useEffect(() => {
        if (formData.price_table_id) {
            loadPriceTableItems(formData.price_table_id);
        }
    }, [formData.price_table_id]);

    useEffect(() => {
        calculateTotals();
        calculateMarginAnalysis();
    }, [formData.items, formData.discount]);

    const loadCostPerMinute = async () => {
        const cost = await profitAnalysisService.getCostPerMinute(clinicId);
        setCostPerMinute(cost);
    };

    const loadPriceTableItems = async (priceTableId: string) => {
        try {
            const { data, error } = await supabase
                .from('price_table_items')
                .select('price_table_id, procedure_id, price')
                .eq('price_table_id', priceTableId);

            if (!error && data) {
                setPriceTableItems(data);
            }
        } catch (error) {
            console.error('Erro ao carregar itens da tabela:', error);
        }
    };

    const getPriceForProcedure = (procedureId: string): number => {
        // Buscar preço na tabela selecionada
        const tableItem = priceTableItems.find(item => item.procedure_id === procedureId);
        if (tableItem) {
            return tableItem.price;
        }

        // Fallback: usar base_price do procedimento
        const procedure = procedures.find(p => p.id === procedureId);
        return procedure?.base_price || 0;
    };

    const handlePriceTableChange = async (newTableId: string) => {
        const oldTableId = formData.price_table_id;

        // Se já tem itens, perguntar se quer atualizar preços
        if (formData.items.length > 0 && oldTableId !== newTableId) {
            const confirm = window.confirm(
                'Deseja atualizar os preços dos itens já adicionados para a nova tabela de preços?'
            );

            if (confirm) {
                // Carregar novos preços
                await loadPriceTableItems(newTableId);

                // Atualizar preços dos itens
                const updatedItems = await Promise.all(
                    formData.items.map(async (item) => {
                        const newPrice = getPriceForProcedure(item.procedure_id);
                        const subtotal = newPrice * item.quantity;
                        const discountAmount = (subtotal * item.discount_percent) / 100;
                        const total = subtotal - discountAmount;

                        // Recalcular margem
                        const margin = await profitAnalysisService.calculateItemMargin(
                            item.procedure_id,
                            newPrice,
                            costPerMinute,
                            0,
                            0,
                            formData.sales_rep_id || undefined,
                            clinicId
                        );

                        return {
                            ...item,
                            unit_price: newPrice,
                            total,
                            margin_percent: margin.marginPercent,
                            profit: margin.profit,
                            costs: margin.costs
                        };
                    })
                );

                setFormData(prev => ({
                    ...prev,
                    price_table_id: newTableId,
                    items: updatedItems
                }));
            } else {
                setFormData(prev => ({ ...prev, price_table_id: newTableId }));
            }
        } else {
            setFormData(prev => ({ ...prev, price_table_id: newTableId }));
        }
    };

    const calculateTotals = () => {
        const total = formData.items.reduce((sum, item) => sum + item.total, 0);
        const finalValue = Math.max(0, total - formData.discount);

        setFormData(prev => ({
            ...prev,
            total_value: total,
            final_value: finalValue
        }));
    };

    const calculateMarginAnalysis = async () => {
        if (formData.items.length === 0 || costPerMinute === 0) {
            setBudgetMarginAnalysis(null);
            return;
        }

        const itemsForAnalysis = formData.items.map(item => ({
            procedure_id: item.procedure_id,
            procedure_name: item.procedure_name,
            unit_price: item.unit_price,
            quantity: item.quantity
        }));

        const analysis = await profitAnalysisService.calculateBudgetMargin(
            itemsForAnalysis,
            costPerMinute,
            0, // taxRate
            0, // cardFeeRate
            formData.sales_rep_id || undefined,
            clinicId,
            undefined // categoryId
        );

        setBudgetMarginAnalysis(analysis);
    };

    const handleAddProcedure = async () => {
        if (!selectedProcedureId || quantity <= 0) {
            toast.error('Selecione um procedimento e quantidade válida');
            return;
        }

        if (!formData.price_table_id) {
            toast.error('Selecione uma tabela de preços');
            return;
        }

        const procedure = procedures.find(p => p.id === selectedProcedureId);
        if (!procedure) return;

        // Buscar preço da tabela selecionada
        const unitPrice = getPriceForProcedure(selectedProcedureId);
        const total = unitPrice * quantity;

        // Calcular margem do item
        const margin = await profitAnalysisService.calculateItemMargin(
            procedure.id,
            unitPrice,
            costPerMinute,
            0,
            0,
            formData.sales_rep_id || undefined,
            clinicId
        );

        const newItem: BudgetItem = {
            id: `temp-${Date.now()}`,
            procedure_id: procedure.id,
            procedure_name: procedure.name,
            quantity,
            unit_price: unitPrice,
            discount_percent: 0,
            total,
            margin_percent: margin.marginPercent,
            profit: margin.profit,
            costs: margin.costs
        };

        setFormData(prev => ({
            ...prev,
            items: [...prev.items, newItem]
        }));

        // Reset
        setSelectedProcedureId('');
        setQuantity(1);
    };

    const handleRemoveItem = (itemId: string) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter(item => item.id !== itemId)
        }));
    };

    const handleItemChange = (itemId: string, field: keyof BudgetItem, value: any) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.map(item => {
                if (item.id === itemId) {
                    const updated = { ...item, [field]: value };

                    // Recalcular total
                    if (field === 'quantity' || field === 'unit_price' || field === 'discount_percent') {
                        const subtotal = updated.unit_price * updated.quantity;
                        const discountAmount = (subtotal * updated.discount_percent) / 100;
                        updated.total = subtotal - discountAmount;
                    }

                    return updated;
                }
                return item;
            })
        }));
    };

    const handleSubmit = async () => {
        if (!formData.patient_id || !formData.doctor_id || formData.items.length === 0) {
            toast.error('Preencha paciente, profissional e adicione pelo menos um procedimento');
            return;
        }

        try {
            setSaving(true);
            await onSave(formData);
            toast.success('Orçamento salvo com sucesso!');
            onOpenChange(false);
        } catch (error) {
            console.error('Erro ao salvar:', error);
            toast.error('Erro ao salvar orçamento');
        } finally {
            setSaving(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const getMarginColor = (margin: number) => {
        if (margin >= 30) return 'text-green-600 bg-green-50';
        if (margin >= 15) return 'text-yellow-600 bg-yellow-50';
        return 'text-red-600 bg-red-50';
    };

    const filteredPatients = patients.filter(p =>
        p.full_name.toLowerCase().includes(patientSearch.toLowerCase()) ||
        p.cpf?.includes(patientSearch)
    );

    return (
        <BaseSheet
            open={open}
            onOpenChange={onOpenChange}
            title={budget ? `Editar Orçamento #${budget.id}` : 'Novo Orçamento'}
            description="Configure o orçamento e acompanhe a margem de lucro em tempo real"
            size="4xl"
            onSave={handleSubmit}
            saving={saving}
            saveDisabled={!formData.patient_id || !formData.doctor_id || formData.items.length === 0}
        >
            <div className="space-y-6">
                {/* Cabeçalho - Paciente, Profissional, Tabela, Vendedor */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Paciente */}
                    <div>
                        <Label htmlFor="patient" className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" />
                            Paciente *
                        </Label>
                        <div className="relative mt-1.5">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar paciente..."
                                value={patientSearch}
                                onChange={(e) => setPatientSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        {patientSearch && (
                            <div className="mt-2 max-h-40 overflow-y-auto border rounded-lg">
                                {filteredPatients.map(patient => (
                                    <button
                                        key={patient.id}
                                        onClick={() => {
                                            setFormData(prev => ({ ...prev, patient_id: patient.id }));
                                            setPatientSearch(patient.full_name);
                                        }}
                                        className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                                    >
                                        <div className="font-medium">{patient.full_name}</div>
                                        {patient.cpf && (
                                            <div className="text-xs text-muted-foreground">{patient.cpf}</div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Profissional */}
                    <div>
                        <Label htmlFor="doctor">Profissional Executante *</Label>
                        <Select
                            value={formData.doctor_id}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, doctor_id: value }))}
                        >
                            <SelectTrigger className="mt-1.5">
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                                {professionals
                                    .filter(p => p.role === 'DENTIST' || p.role === 'DOCTOR')
                                    .map(prof => (
                                        <SelectItem key={prof.id} value={prof.id}>
                                            {prof.name}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Tabela de Preços */}
                    <div>
                        <Label htmlFor="priceTable">Tabela de Preços *</Label>
                        <Select
                            value={formData.price_table_id}
                            onValueChange={handlePriceTableChange}
                        >
                            <SelectTrigger className="mt-1.5">
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                                {priceTables.map(table => (
                                    <SelectItem key={table.id} value={table.id}>
                                        {table.name} {table.is_standard && '(Padrão)'}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                            Define os preços dos procedimentos
                        </p>
                    </div>

                    {/* Vendedor/Consultor */}
                    <div>
                        <Label htmlFor="salesRep">Vendedor/Consultor (Opcional)</Label>
                        <Select
                            value={formData.sales_rep_id || ''}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, sales_rep_id: value }))}
                        >
                            <SelectTrigger className="mt-1.5">
                                <SelectValue placeholder="Nenhum" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">Nenhum</SelectItem>
                                {professionals.map(prof => (
                                    <SelectItem key={prof.id} value={prof.id}>
                                        {prof.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                            Para cálculo de comissão de venda
                        </p>
                    </div>
                </div>

                {/* Adicionar Procedimento */}
                <div className="border rounded-lg p-4 bg-muted/50">
                    <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Adicionar Procedimento
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="md:col-span-2">
                            <Select
                                value={selectedProcedureId}
                                onValueChange={setSelectedProcedureId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o procedimento..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {procedures.map(proc => (
                                        <SelectItem key={proc.id} value={proc.id}>
                                            {proc.name} - {formatCurrency(proc.base_price)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex gap-2">
                            <Input
                                type="number"
                                min="1"
                                value={quantity}
                                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                placeholder="Qtd"
                                className="w-20"
                            />
                            <Button
                                onClick={handleAddProcedure}
                                className="flex-1"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Adicionar
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Lista de Itens */}
                <div className="border rounded-lg overflow-hidden">
                    <div className="bg-muted px-4 py-2 font-medium text-sm grid grid-cols-12 gap-2">
                        <div className="col-span-4">Procedimento</div>
                        <div className="col-span-1 text-center">Qtd</div>
                        <div className="col-span-2 text-right">Valor Unit.</div>
                        <div className="col-span-1 text-center">Desc%</div>
                        <div className="col-span-2 text-right">Total</div>
                        <div className="col-span-2 text-center">Margem</div>
                    </div>

                    {formData.items.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>Nenhum procedimento adicionado</p>
                            <p className="text-sm mt-1">Adicione procedimentos para começar</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {formData.items.map(item => (
                                <div key={item.id} className="px-4 py-3 grid grid-cols-12 gap-2 items-center hover:bg-muted/50">
                                    <div className="col-span-4">
                                        <div className="font-medium text-sm">{item.procedure_name}</div>
                                    </div>
                                    <div className="col-span-1">
                                        <Input
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 1)}
                                            className="h-8 text-center"
                                        />
                                    </div>
                                    <div className="col-span-2 text-right text-sm">
                                        {formatCurrency(item.unit_price)}
                                    </div>
                                    <div className="col-span-1">
                                        <Input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={item.discount_percent}
                                            onChange={(e) => handleItemChange(item.id, 'discount_percent', parseFloat(e.target.value) || 0)}
                                            className="h-8 text-center"
                                        />
                                    </div>
                                    <div className="col-span-2 text-right font-bold text-sm">
                                        {formatCurrency(item.total)}
                                    </div>
                                    <div className="col-span-2 flex items-center gap-2">
                                        {item.margin_percent !== undefined && (
                                            <div className={`flex-1 text-center px-2 py-1 rounded text-xs font-bold ${getMarginColor(item.margin_percent)}`}>
                                                {item.margin_percent.toFixed(1)}%
                                            </div>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemoveItem(item.id)}
                                            className="h-8 w-8 p-0"
                                        >
                                            <Trash2 className="w-4 h-4 text-red-600" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Resumo Financeiro */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Bruto:</span>
                            <span className="font-bold">{formatCurrency(formData.total_value)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Descontos:</span>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.discount}
                                onChange={(e) => setFormData(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                                className="w-32 h-8 text-right"
                            />
                        </div>
                        <div className="flex justify-between pt-3 border-t">
                            <span className="font-bold">Total Líquido:</span>
                            <span className="text-2xl font-bold text-blue-600">
                                {formatCurrency(formData.final_value)}
                            </span>
                        </div>
                    </div>

                    {/* Profit Breakdown */}
                    {budgetMarginAnalysis && (
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg p-4 border">
                            <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" />
                                Análise de Lucro
                            </h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Custos Totais:</span>
                                    <span className="font-bold text-red-600">
                                        {formatCurrency(budgetMarginAnalysis.totalCosts)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Lucro Líquido:</span>
                                    <span className="font-bold text-green-600">
                                        {formatCurrency(budgetMarginAnalysis.totalProfit)}
                                    </span>
                                </div>
                                <div className="flex justify-between pt-2 border-t">
                                    <span className="font-bold">Margem:</span>
                                    <span className={`text-xl font-bold ${budgetMarginAnalysis.marginPercent >= 30 ? 'text-green-600' :
                                        budgetMarginAnalysis.marginPercent >= 15 ? 'text-yellow-600' :
                                            'text-red-600'
                                        }`}>
                                        {budgetMarginAnalysis.marginPercent.toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Alerta de Margem Baixa */}
                {budgetMarginAnalysis && budgetMarginAnalysis.marginPercent < 20 && (
                    <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-bold text-yellow-900 dark:text-yellow-100">
                                ⚠️ Margem Abaixo do Ideal
                            </h4>
                            <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                                A margem de lucro está em {budgetMarginAnalysis.marginPercent.toFixed(1)}%.
                                Recomendamos manter acima de 30% para garantir sustentabilidade.
                            </p>
                        </div>
                    </div>
                )}

                {/* Footer Actions override to include Approve Button */}
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-4 -mx-6 -mb-6">
                    {budget?.status === 'DRAFT' && (
                        <Button
                            variant="outline"
                            onClick={() => setApprovalSheetOpen(true)}
                            className="border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/20"
                            disabled={!formData.id} // Só pode aprovar se tiver salvo (ID existe). Ou salvar antes.
                        >
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Aprovar Orçamento
                        </Button>
                    )}
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={saving || !formData.patient_id || !formData.doctor_id || formData.items.length === 0}>
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <DollarSign className="w-4 h-4 mr-2" />}
                        Salvar
                    </Button>
                </div>
            </div>

            <BudgetApprovalSheet
                open={approvalSheetOpen}
                onOpenChange={setApprovalSheetOpen}
                budget={budget || formData}
                clinicId={clinicId}
                onSuccess={() => {
                    onOpenChange(false);
                }}
            />
        </BaseSheet>
    );
};

export default BudgetSheet;
