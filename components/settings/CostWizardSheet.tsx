import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent } from '../ui/sheet'; // Usando Sheet base
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import { supabase } from '../../src/lib/supabase';
import { costEngineService, FixedCostItem, ClinicCostStructure } from '../../services/costEngineService';
import {
    Calculator,
    ArrowRight,
    ArrowLeft,
    CheckCircle2,
    Plus,
    Trash2,
    DollarSign,
    Clock,
    Users,
    TrendingUp,
    Building2,
    Lightbulb
} from 'lucide-react';
import toast from 'react-hot-toast';

interface CostWizardSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clinicId: string;
}

export const CostWizardSheet: React.FC<CostWizardSheetProps> = ({ open, onOpenChange, clinicId }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Data State
    const [items, setItems] = useState<FixedCostItem[]>([]);
    const [capacity, setCapacity] = useState({
        chairs: 1,
        hours: 40,
        efficiency: 0.8
    });
    const [result, setResult] = useState<ClinicCostStructure | null>(null);

    // New Item State
    const [newItem, setNewItem] = useState<{ name: string, amount: string, category: string }>({
        name: '',
        amount: '',
        category: 'OTHER'
    });

    useEffect(() => {
        if (open && clinicId) {
            loadInitialData();
            setStep(1);
        }
    }, [open, clinicId]);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            const [fetchedItems, structure] = await Promise.all([
                costEngineService.getFixedCostItems(clinicId),
                costEngineService.getCostStructure(clinicId)
            ]);

            setItems(fetchedItems);
            if (structure) {
                setCapacity({
                    chairs: structure.productive_chairs || 1,
                    hours: structure.weekly_hours || 40,
                    efficiency: structure.efficiency_rate || 0.8
                });
                setResult(structure);
            }
        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = async () => {
        if (!newItem.name || !newItem.amount) return;

        try {
            const added = await costEngineService.saveFixedCostItem({
                clinic_id: clinicId,
                name: newItem.name,
                amount: parseFloat(newItem.amount),
                category: newItem.category as any,
                is_active: true
            });
            setItems([...items, added]);
            setNewItem({ name: '', amount: '', category: 'OTHER' }); // Reset form
        } catch (error) {
            toast.error('Erro ao adicionar item');
        }
    };

    const handleDeleteItem = async (id: string) => {
        try {
            await costEngineService.deleteFixedCostItem(id);
            setItems(items.filter(i => i.id !== id));
        } catch (error) {
            toast.error('Erro ao remover item');
        }
    };

    const handleCalculate = async () => {
        try {
            setLoading(true);
            const newStructure = await costEngineService.updateStructureAndCalculate(clinicId, capacity);
            setResult(newStructure);
            setStep(3); // Go to results
            toast.success('Custo Minuto Atualizado!');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao calcular');
        } finally {
            setLoading(false);
        }
    };

    const totalExpenses = items.reduce((sum, i) => sum + i.amount, 0);

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="sm:max-w-4xl p-0 border-l border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shadow-2xl flex flex-col">

                {/* Header Estilizado */}
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-8 text-white relative overflow-hidden shrinkage-0">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Calculator size={120} />
                    </div>
                    <div className="relative z-10">
                        <h2 className="text-3xl font-bold mb-2">Wizard de Custos</h2>
                        <p className="text-violet-100 max-w-lg">
                            Descubra o verdadeiro custo de operação da sua clínica para garantir lucro em cada procedimento.
                        </p>
                    </div>

                    {/* Progress Steps */}
                    <div className="flex items-center gap-4 mt-8">
                        {[1, 2, 3].map(s => (
                            <div key={s} className={`flex items-center gap-2 ${step >= s ? 'opacity-100' : 'opacity-40'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 ${step === s ? 'bg-white text-violet-600 border-white' :
                                    step > s ? 'bg-indigo-500 text-white border-indigo-500' : 'border-white text-white'
                                    }`}>
                                    {step > s ? <CheckCircle2 size={16} /> : s}
                                </div>
                                <span className="text-sm font-medium hidden sm:inline">
                                    {s === 1 && 'Despesas'}
                                    {s === 2 && 'Capacidade'}
                                    {s === 3 && 'Resultado'}
                                </span>
                                {s < 3 && <div className="w-8 h-0.5 bg-white/20" />}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content Body */}
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-3xl mx-auto">

                        {/* STEP 1: DESPESAS */}
                        {step === 1 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                            <DollarSign className="text-violet-500" />
                                            Custos Fixos Mensais
                                        </h3>
                                        <div className="text-right">
                                            <span className="text-xs uppercase font-bold text-slate-400">Total Atual</span>
                                            <div className="text-2xl font-bold text-slate-800 dark:text-white">
                                                {formatCurrency(totalExpenses)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Add Item Form */}
                                    <div className="grid grid-cols-12 gap-3 mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                                        <div className="col-span-5">
                                            <Label className="text-xs mb-1 block">Nome da Despesa</Label>
                                            <Input
                                                placeholder="Ex: Aluguel"
                                                value={newItem.name}
                                                onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-span-3">
                                            <Label className="text-xs mb-1 block">Valor (R$)</Label>
                                            <Input
                                                type="number"
                                                placeholder="0,00"
                                                value={newItem.amount}
                                                onChange={e => setNewItem({ ...newItem, amount: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-span-3">
                                            <Label className="text-xs mb-1 block">Categoria</Label>
                                            <Select
                                                value={newItem.category}
                                                onValueChange={v => setNewItem({ ...newItem, category: v })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="INFRASTRUCTURE">Infraestrutura</SelectItem>
                                                    <SelectItem value="STAFF">Pessoal</SelectItem>
                                                    <SelectItem value="MARKETING">Marketing</SelectItem>
                                                    <SelectItem value="PROLABORE">Prolabore</SelectItem>
                                                    <SelectItem value="ADMINISTRATIVE">Administrativo</SelectItem>
                                                    <SelectItem value="OTHER">Outros</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="col-span-1 flex items-end">
                                            <Button size="icon" className="w-full bg-violet-600 hover:bg-violet-700" onClick={handleAddItem}>
                                                <Plus size={18} />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* List */}
                                    <div className="space-y-2">
                                        {items.length === 0 && (
                                            <div className="text-center py-8 text-slate-400 text-sm">
                                                Nenhuma despesa cadastrada.
                                            </div>
                                        )}
                                        {items.map(item => (
                                            <div key={item.id} className="flex justify-between items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg group transition-colors border border-transparent hover:border-slate-100">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                                        {item.category === 'PROLABORE' ? <Users size={14} /> : <Building2 size={14} />}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-slate-700 dark:text-slate-200">{item.name}</div>
                                                        <div className="text-xs text-slate-400 uppercase tracking-wider">{item.category}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="font-bold text-slate-700 dark:text-slate-300">{formatCurrency(item.amount)}</span>
                                                    <button
                                                        onClick={() => handleDeleteItem(item.id)}
                                                        className="text-slate-300 hover:text-red-500 transition-colors p-2"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 2: CAPACIDADE */}
                        {step === 2 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                        <Clock className="text-violet-500" />
                                        Capacidade Produtiva
                                    </h3>

                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <Label className="text-base">Cadeiras Ativas</Label>
                                            <Input
                                                type="number"
                                                className="h-12 text-lg"
                                                value={capacity.chairs}
                                                onChange={e => setCapacity({ ...capacity, chairs: parseInt(e.target.value) || 0 })}
                                            />
                                            <p className="text-xs text-slate-500">Quantos atendimentos simultâneos podem ocorrer?</p>
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-base">Horas Semanais</Label>
                                            <Input
                                                type="number"
                                                className="h-12 text-lg"
                                                value={capacity.hours}
                                                onChange={e => setCapacity({ ...capacity, hours: parseInt(e.target.value) || 0 })}
                                            />
                                            <p className="text-xs text-slate-500">Carga horária semanal de funcionamento.</p>
                                        </div>

                                        <div className="col-span-2 space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                                            <div className="flex justify-between">
                                                <Label className="text-base">Taxa de Eficiência (Ocupação)</Label>
                                                <span className="font-bold text-violet-600">{(capacity.efficiency * 100).toFixed(0)}%</span>
                                            </div>
                                            <Slider
                                                defaultValue={[capacity.efficiency * 100]}
                                                max={100}
                                                step={5}
                                                onValueChange={(v) => setCapacity({ ...capacity, efficiency: v[0] / 100 })}
                                            />
                                            <p className="text-xs text-slate-500">
                                                Dificilmente uma clínica opera a 100% do tempo. Recomendamos 80% para cálculos realistas de "quebra técnica" e faltas.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-8 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex gap-4 items-start">
                                        <Lightbulb className="text-indigo-600 shrink-0 mt-1" />
                                        <div>
                                            <h4 className="font-bold text-indigo-900 dark:text-indigo-200">Por que isso importa?</h4>
                                            <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-1">
                                                Custo Minuto = (Total Despesas) ÷ (Minutos Disponíveis).
                                                Quanto maior sua eficiência e horas, menor seu custo por procedimento.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: RESULTADO */}
                        {step === 3 && result && (
                            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">

                                {/* BIG NUMBER */}
                                <div className="text-center space-y-2 py-8">
                                    <h3 className="text-slate-500 text-lg font-medium">Seu Custo Operacional é</h3>
                                    <div className="text-6xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 pb-2">
                                        {formatCurrency(result.cost_per_minute)}
                                        <span className="text-3xl text-slate-400 font-medium ml-2">/min</span>
                                    </div>
                                    <p className="text-slate-400">
                                        Baseado em {result.available_minutes_month.toLocaleString()} minutos produtivos/mês
                                    </p>
                                </div>

                                {/* CARDS */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <ResultCard
                                        label="Custo Fixo/Mês"
                                        value={formatCurrency(result.fixed_costs_monthly)}
                                        icon={Building2}
                                    />
                                    <ResultCard
                                        label="Prolabore Desejado"
                                        value={formatCurrency(result.desired_prolabore)}
                                        icon={Users}
                                        highlight
                                    />
                                    <ResultCard
                                        label="Break-even Diário"
                                        value={formatCurrency((result.fixed_costs_monthly + result.desired_prolabore) / 22)}
                                        icon={TrendingUp}
                                    />
                                </div>

                                <div className="bg-green-50 border border-green-200 p-6 rounded-xl text-center">
                                    <h4 className="font-bold text-green-800 text-lg mb-2">🚀 Profit Engine Atualizado!</h4>
                                    <p className="text-green-700">
                                        A partir de agora, todos os orçamentos considerarão <strong>{formatCurrency(result.cost_per_minute)}</strong> por minuto de procedimento para calcular o Lucro Real.
                                    </p>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                {/* Footer Navigation */}
                <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center z-20">
                    {step > 1 ? (
                        <Button variant="outline" onClick={() => setStep(step - 1)} className="gap-2">
                            <ArrowLeft size={16} /> Voltar
                        </Button>
                    ) : (
                        <div />
                    )}

                    {step < 2 && (
                        <Button className="bg-violet-600 hover:bg-violet-700 gap-2 px-8" onClick={() => setStep(2)}>
                            Próximo: Capacidade <ArrowRight size={16} />
                        </Button>
                    )}

                    {step === 2 && (
                        <Button className="bg-green-600 hover:bg-green-700 gap-2 px-8 shadow-lg shadow-green-600/20" onClick={handleCalculate} disabled={loading}>
                            {loading ? 'Calculando...' : <>Calcular Custo Minuto <Calculator size={16} /></>}
                        </Button>
                    )}

                    {step === 3 && (
                        <Button className="bg-slate-900 text-white gap-2 px-8" onClick={() => onOpenChange(false)}>
                            Concluir Configuração <CheckCircle2 size={16} />
                        </Button>
                    )}
                </div>

            </SheetContent>
        </Sheet>
    );
};

const ResultCard = ({ label, value, icon: Icon, highlight }: any) => (
    <div className={`p-4 rounded-xl border ${highlight ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100'} shadow-sm`}>
        <div className="flex items-center gap-2 mb-2 text-slate-500">
            <Icon size={16} />
            <span className="text-xs font-bold uppercase">{label}</span>
        </div>
        <div className={`text-xl font-bold ${highlight ? 'text-indigo-700' : 'text-slate-800'}`}>
            {value}
        </div>
    </div>
);
