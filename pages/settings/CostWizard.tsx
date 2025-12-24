import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { costCalculatorService, ExpenseCategory } from '../../services/costCalculatorService';
import {
    DollarSign,
    Loader2,
    ArrowRight,
    ArrowLeft,
    CheckCircle,
    Calculator,
    TrendingUp,
    Building
} from 'lucide-react';
import toast from 'react-hot-toast';

interface CostItem {
    categoryId: string;
    categoryName: string;
    amount: number;
}

const CostWizard: React.FC = () => {
    const navigate = useNavigate();
    const { profile } = useAuth();

    // Wizard state
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Step 1: Custos Fixos
    const [categories, setCategories] = useState<ExpenseCategory[]>([]);
    const [costItems, setCostItems] = useState<CostItem[]>([]);
    const [totalFixedCosts, setTotalFixedCosts] = useState(0);

    // Step 2: Pró-labore
    const [prolabore, setProlabore] = useState(0);

    // Step 3: Capacidade Produtiva
    const [productiveChairs, setProductiveChairs] = useState(1);
    const [weeklyHours, setWeeklyHours] = useState(40);
    const [efficiency, setEfficiency] = useState(80);

    // Step 4: Resultado
    const [costPerMinute, setCostPerMinute] = useState(0);

    useEffect(() => {
        if (profile?.clinic_id) {
            loadData();
        }
    }, [profile?.clinic_id]);

    useEffect(() => {
        // Calcular total de custos fixos
        const total = costItems.reduce((sum, item) => sum + item.amount, 0);
        setTotalFixedCosts(total);
    }, [costItems]);

    const loadData = async () => {
        try {
            setLoading(true);

            // Buscar categorias de custo fixo
            const categoriesData = await costCalculatorService.getFixedCostCategories(profile!.clinic_id);
            setCategories(categoriesData);

            // Inicializar costItems com as categorias
            const initialCostItems: CostItem[] = categoriesData.map(cat => ({
                categoryId: cat.id,
                categoryName: cat.name,
                amount: 0
            }));

            // Buscar itens já cadastrados
            const existingItems = await costCalculatorService.getFixedCostItems(profile!.clinic_id);

            // Mesclar com valores existentes
            existingItems.forEach(existing => {
                const index = initialCostItems.findIndex(item => item.categoryName === existing.name);
                if (index !== -1) {
                    initialCostItems[index].amount = existing.amount;
                }
            });

            setCostItems(initialCostItems);

            // Buscar estrutura de custos existente
            const structure = await costCalculatorService.getCostStructure(profile!.clinic_id);
            if (structure) {
                setProlabore(structure.desired_prolabore);
                setProductiveChairs(structure.productive_chairs);
                setWeeklyHours(structure.weekly_hours);
                setCostPerMinute(structure.cost_per_minute);
            }

        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            toast.error('Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    const handleCostItemChange = (categoryId: string, value: number) => {
        setCostItems(prev => prev.map(item =>
            item.categoryId === categoryId
                ? { ...item, amount: value }
                : item
        ));
    };

    const handleNextStep = () => {
        if (currentStep === 1) {
            if (totalFixedCosts === 0) {
                toast.error('Adicione pelo menos um custo fixo');
                return;
            }
        }

        if (currentStep === 2) {
            if (prolabore === 0) {
                toast.error('Defina o valor do pró-labore');
                return;
            }
        }

        if (currentStep === 3) {
            if (productiveChairs < 1) {
                toast.error('Defina pelo menos 1 cadeira produtiva');
                return;
            }
            if (weeklyHours < 1) {
                toast.error('Defina as horas semanais de trabalho');
                return;
            }

            // Calcular custo por minuto
            const result = costCalculatorService.calculateCostBreakdown(
                totalFixedCosts,
                prolabore,
                productiveChairs,
                weeklyHours,
                efficiency / 100
            );
            setCostPerMinute(result.costPerMinute);
        }

        setCurrentStep(prev => Math.min(prev + 1, 4));
    };

    const handlePreviousStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            // Salvar itens de custo fixo
            const itemsToSave = costItems
                .filter(item => item.amount > 0)
                .map(item => ({
                    name: item.categoryName,
                    amount: item.amount,
                    category: 'ADMINISTRATIVE'
                }));

            await costCalculatorService.saveFixedCostItems(profile!.clinic_id, itemsToSave);

            // Salvar estrutura de custos
            await costCalculatorService.saveCostStructure(profile!.clinic_id, {
                fixed_costs_monthly: totalFixedCosts,
                desired_prolabore: prolabore,
                productive_chairs: productiveChairs,
                weekly_hours: weeklyHours
            });

            toast.success('Configuração de custos salva com sucesso!');
            navigate('/settings');
        } catch (error) {
            console.error('Erro ao salvar:', error);
            toast.error('Erro ao salvar configuração');
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

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
                <Loader2 className="w-12 h-12 text-violet-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Carregando configuração de custos...</p>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                        <Calculator className="text-violet-600" size={32} />
                        Wizard de Custos
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">
                        Configure a estrutura de custos da clínica
                    </p>
                </div>
                <button
                    onClick={() => navigate('/settings')}
                    className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                >
                    Cancelar
                </button>
            </div>

            {/* Progress Steps */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-center justify-between">
                    {[1, 2, 3, 4].map((step) => (
                        <React.Fragment key={step}>
                            <div className="flex flex-col items-center">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${step === currentStep
                                            ? 'bg-violet-600 text-white scale-110'
                                            : step < currentStep
                                                ? 'bg-green-500 text-white'
                                                : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                                        }`}
                                >
                                    {step < currentStep ? <CheckCircle size={20} /> : step}
                                </div>
                                <span className={`text-xs mt-2 font-medium ${step === currentStep ? 'text-violet-600' : 'text-slate-500'
                                    }`}>
                                    {step === 1 && 'Custos Fixos'}
                                    {step === 2 && 'Pró-labore'}
                                    {step === 3 && 'Capacidade'}
                                    {step === 4 && 'Resumo'}
                                </span>
                            </div>
                            {step < 4 && (
                                <div className={`flex-1 h-1 mx-4 rounded ${step < currentStep ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'
                                    }`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Step Content */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8">
                {/* Step 1: Custos Fixos */}
                {currentStep === 1 && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                                Custos Fixos Mensais
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400">
                                Informe os valores mensais de cada categoria de custo fixo
                            </p>
                        </div>

                        <div className="space-y-3">
                            {costItems.map((item) => (
                                <div
                                    key={item.categoryId}
                                    className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700"
                                >
                                    <div className="flex-1">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            {item.categoryName}
                                        </label>
                                    </div>
                                    <div className="w-48">
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={item.amount || ''}
                                                onChange={(e) => handleCostItemChange(item.categoryId, parseFloat(e.target.value) || 0)}
                                                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                placeholder="0,00"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Total */}
                        <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between p-4 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
                                <span className="text-lg font-bold text-slate-800 dark:text-white">
                                    Total de Custos Fixos Mensais:
                                </span>
                                <span className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                                    {formatCurrency(totalFixedCosts)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Pró-labore */}
                {currentStep === 2 && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                                Pró-labore Desejado
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400">
                                Defina o valor mensal de pró-labore que deseja retirar
                            </p>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                            <h4 className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-2">
                                💡 O que é Pró-labore?
                            </h4>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                É a remuneração dos sócios/proprietários pelo trabalho realizado na clínica.
                                Diferente do lucro, o pró-labore é um custo operacional que deve ser considerado
                                no cálculo do custo por minuto.
                            </p>
                        </div>

                        <div className="max-w-md">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                Valor Mensal do Pró-labore
                            </label>
                            <div className="relative">
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={prolabore || ''}
                                    onChange={(e) => setProlabore(parseFloat(e.target.value) || 0)}
                                    className="w-full pl-14 pr-4 py-4 text-2xl border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                                    placeholder="0,00"
                                />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Custos Fixos</p>
                                    <p className="text-lg font-bold text-slate-700 dark:text-slate-300">
                                        {formatCurrency(totalFixedCosts)}
                                    </p>
                                </div>
                                <div className="text-2xl text-slate-400">+</div>
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Pró-labore</p>
                                    <p className="text-lg font-bold text-slate-700 dark:text-slate-300">
                                        {formatCurrency(prolabore)}
                                    </p>
                                </div>
                                <div className="text-2xl text-slate-400">=</div>
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Total de Custos</p>
                                    <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                                        {formatCurrency(totalFixedCosts + prolabore)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Capacidade Produtiva */}
                {currentStep === 3 && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                                Capacidade Produtiva
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400">
                                Configure a capacidade de atendimento da clínica
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    Número de Cadeiras Produtivas
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={productiveChairs}
                                    onChange={(e) => setProductiveChairs(parseInt(e.target.value) || 1)}
                                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-lg font-bold"
                                />
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Cadeiras que geram receita
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    Horas Semanais de Trabalho
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="168"
                                    value={weeklyHours}
                                    onChange={(e) => setWeeklyHours(parseInt(e.target.value) || 40)}
                                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-lg font-bold"
                                />
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Por cadeira, por semana
                                </p>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    Taxa de Eficiência: {efficiency}%
                                </label>
                                <input
                                    type="range"
                                    min="50"
                                    max="100"
                                    value={efficiency}
                                    onChange={(e) => setEfficiency(parseInt(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                                />
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Percentual de tempo efetivamente produtivo (recomendado: 80%)
                                </p>
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">
                                Cálculo de Horas Mensais
                            </h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-600 dark:text-slate-400">Cadeiras × Horas Semanais × 4 semanas:</span>
                                    <span className="font-bold text-slate-800 dark:text-white">
                                        {productiveChairs} × {weeklyHours} × 4 = {productiveChairs * weeklyHours * 4}h
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600 dark:text-slate-400">Aplicando eficiência de {efficiency}%:</span>
                                    <span className="font-bold text-violet-600 dark:text-violet-400">
                                        {Math.round(productiveChairs * weeklyHours * 4 * (efficiency / 100))}h mensais
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 4: Resumo */}
                {currentStep === 4 && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                                Resumo da Configuração
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400">
                                Revise os dados antes de salvar
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                                    <DollarSign size={16} />
                                    Custos Mensais
                                </h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600 dark:text-slate-400">Custos Fixos:</span>
                                        <span className="font-bold text-slate-800 dark:text-white">
                                            {formatCurrency(totalFixedCosts)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600 dark:text-slate-400">Pró-labore:</span>
                                        <span className="font-bold text-slate-800 dark:text-white">
                                            {formatCurrency(prolabore)}
                                        </span>
                                    </div>
                                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                                        <div className="flex justify-between">
                                            <span className="font-bold text-slate-700 dark:text-slate-300">Total:</span>
                                            <span className="font-bold text-lg text-violet-600 dark:text-violet-400">
                                                {formatCurrency(totalFixedCosts + prolabore)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                                    <Building size={16} />
                                    Capacidade Produtiva
                                </h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600 dark:text-slate-400">Cadeiras:</span>
                                        <span className="font-bold text-slate-800 dark:text-white">
                                            {productiveChairs}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600 dark:text-slate-400">Horas Semanais:</span>
                                        <span className="font-bold text-slate-800 dark:text-white">
                                            {weeklyHours}h
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600 dark:text-slate-400">Eficiência:</span>
                                        <span className="font-bold text-slate-800 dark:text-white">
                                            {efficiency}%
                                        </span>
                                    </div>
                                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                                        <div className="flex justify-between">
                                            <span className="font-bold text-slate-700 dark:text-slate-300">Horas Mensais:</span>
                                            <span className="font-bold text-lg text-violet-600 dark:text-violet-400">
                                                {Math.round(productiveChairs * weeklyHours * 4 * (efficiency / 100))}h
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Resultado Final */}
                        <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl p-8 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-violet-100 text-sm mb-2">Custo por Minuto de Cadeira</p>
                                    <p className="text-5xl font-bold">
                                        {formatCurrency(costPerMinute)}
                                    </p>
                                    <p className="text-violet-100 text-sm mt-2">
                                        Este é o valor mínimo que você precisa gerar por minuto de atendimento
                                    </p>
                                </div>
                                <TrendingUp size={64} className="text-violet-200 opacity-50" />
                            </div>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                            <h4 className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-2">
                                💡 Como usar este valor?
                            </h4>
                            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                                <li>• Use para calcular o custo de cada procedimento</li>
                                <li>• Multiplique pelo tempo do procedimento para saber o custo mínimo</li>
                                <li>• Adicione margem de lucro para definir o preço de venda</li>
                                <li>• Este valor será usado automaticamente no Orçamento Profit</li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between">
                <button
                    onClick={handlePreviousStep}
                    disabled={currentStep === 1}
                    className="flex items-center gap-2 px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ArrowLeft size={18} />
                    Voltar
                </button>

                {currentStep < 4 ? (
                    <button
                        onClick={handleNextStep}
                        className="flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium shadow-sm"
                    >
                        Próximo
                        <ArrowRight size={18} />
                    </button>
                ) : (
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm disabled:opacity-50"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="animate-spin" size={18} />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <CheckCircle size={18} />
                                Salvar Configuração
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};

export default CostWizard;
