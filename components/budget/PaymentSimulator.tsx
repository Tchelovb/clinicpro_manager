import React, { useState, useEffect } from 'react';
import { CreditCard, FileText, AlertCircle, CheckCircle2, TrendingUp, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { creditRiskService, RiskTier } from '../../services/creditRiskService';
import { cn } from '../../lib/utils';

interface PaymentSimulatorProps {
    baseValue: number;
    creditTier?: RiskTier;
    onSelectOption?: (option: 'smart' | 'boleto', config: PaymentConfig) => void;
    className?: string;
}

interface PaymentConfig {
    paymentType: 'smart' | 'boleto';
    totalValue: number;
    downPayment: number;
    installments: number;
    installmentValue: number;
    requiresGuarantor?: boolean;
}

export const PaymentSimulator: React.FC<PaymentSimulatorProps> = ({
    baseValue,
    creditTier = 'B', // Default tier if not analyzed
    onSelectOption,
    className
}) => {
    const [selectedOption, setSelectedOption] = useState<'smart' | 'boleto' | null>(null);
    const [installments, setInstallments] = useState(1);
    const [downPaymentPercent, setDownPaymentPercent] = useState(0);

    // Get payment options based on credit tier
    const options = creditRiskService.getPaymentOptions(creditTier, baseValue);
    const profile = creditRiskService.RISK_MATRIX[creditTier];

    // Calculate values
    const smartTotal = options.smart.price;
    const boletoTotal = options.boleto?.price || 0;
    const savings = boletoTotal - smartTotal;

    const downPaymentValue = selectedOption === 'boleto'
        ? (boletoTotal * downPaymentPercent / 100)
        : (smartTotal * downPaymentPercent / 100);

    const financedAmount = (selectedOption === 'boleto' ? boletoTotal : smartTotal) - downPaymentValue;
    const installmentValue = installments > 0 ? financedAmount / installments : 0;

    // Update installments when option changes
    useEffect(() => {
        if (selectedOption === 'smart') {
            setInstallments(Math.min(installments, 12));
            setDownPaymentPercent(0);
        } else if (selectedOption === 'boleto' && options.boleto) {
            setInstallments(Math.min(installments, options.boleto.maxInstallments));
            setDownPaymentPercent(Math.max(downPaymentPercent, options.boleto.minDownPayment));
        }
    }, [selectedOption]);

    const handleSelectOption = (option: 'smart' | 'boleto') => {
        setSelectedOption(option);

        if (onSelectOption) {
            const config: PaymentConfig = {
                paymentType: option,
                totalValue: option === 'smart' ? smartTotal : boletoTotal,
                downPayment: downPaymentValue,
                installments,
                installmentValue,
                requiresGuarantor: option === 'boleto' ? profile.requiresGuarantor : false
            };
            onSelectOption(option, config);
        }
    };

    return (
        <div className={cn("space-y-4", className)}>
            {/* Header with Tier Badge */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800">Simulador de Pagamento</h3>
                <Badge variant="outline" className="flex items-center gap-1">
                    <Shield size={12} />
                    Tier {creditTier} - {profile.label}
                </Badge>
            </div>

            {/* Two Options Side by Side */}
            <div className="grid md:grid-cols-2 gap-4">
                {/* SMART OPTION (Cartão/Pix) */}
                <Card
                    className={cn(
                        "cursor-pointer transition-all border-2",
                        selectedOption === 'smart'
                            ? "border-blue-500 bg-blue-50 shadow-lg"
                            : "border-slate-200 hover:border-blue-300"
                    )}
                    onClick={() => handleSelectOption('smart')}
                >
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <CreditCard className="text-blue-600" size={20} />
                                </div>
                                <div>
                                    <CardTitle className="text-sm font-bold text-slate-800">
                                        Valor Smart
                                    </CardTitle>
                                    <p className="text-xs text-slate-500">Cartão ou Pix</p>
                                </div>
                            </div>
                            {selectedOption === 'smart' && (
                                <CheckCircle2 className="text-blue-600" size={20} />
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div>
                            <p className="text-3xl font-bold text-blue-600">
                                R$ {smartTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">Preço à vista ou parcelado</p>
                        </div>

                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-600">Parcelas Máx:</span>
                                <span className="font-bold">12x no cartão</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600">Entrada:</span>
                                <span className="font-bold text-green-600">Não obrigatória</span>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200">
                            <div className="flex items-center gap-2 text-xs text-blue-600">
                                <TrendingUp size={14} />
                                <span className="font-medium">Melhor custo-benefício</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* BOLETO OPTION (Crediário) */}
                {options.boleto ? (
                    <Card
                        className={cn(
                            "cursor-pointer transition-all border-2",
                            selectedOption === 'boleto'
                                ? "border-violet-500 bg-violet-50 shadow-lg"
                                : "border-slate-200 hover:border-violet-300"
                        )}
                        onClick={() => handleSelectOption('boleto')}
                    >
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-violet-100 rounded-lg">
                                        <FileText className="text-violet-600" size={20} />
                                    </div>
                                    <div>
                                        <CardTitle className="text-sm font-bold text-slate-800">
                                            Valor Crediário
                                        </CardTitle>
                                        <p className="text-xs text-slate-500">Boleto ou Carnê</p>
                                    </div>
                                </div>
                                {selectedOption === 'boleto' && (
                                    <CheckCircle2 className="text-violet-600" size={20} />
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-3xl font-bold text-violet-600">
                                    R$ {boletoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-xs text-orange-600 mt-1">
                                    +R$ {savings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({profile.markupPercent}% markup)
                                </p>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Parcelas Máx:</span>
                                    <span className="font-bold">{options.boleto.maxInstallments}x</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Entrada Mín:</span>
                                    <span className="font-bold">{options.boleto.minDownPayment}%</span>
                                </div>
                                {options.boleto.requiresGuarantor && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Avalista:</span>
                                        <span className="font-bold text-orange-600">Obrigatório</span>
                                    </div>
                                )}
                            </div>

                            <div className="pt-2 border-t border-slate-200">
                                <div className="flex items-center gap-2 text-xs text-violet-600">
                                    <FileText size={14} />
                                    <span className="font-medium">Facilita o acesso</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="border-2 border-red-200 bg-red-50">
                        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                            <AlertCircle className="text-red-600 mb-3" size={32} />
                            <p className="font-bold text-red-800 mb-1">Boleto Não Disponível</p>
                            <p className="text-sm text-red-600">
                                Score de crédito insuficiente.<br />
                                Apenas Cartão ou Pix.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Installment Configuration (Only when option selected) */}
            {selectedOption && (
                <Card className="border-2 border-slate-200">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Configurar Parcelamento</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Down Payment */}
                        {selectedOption === 'boleto' && options.boleto && options.boleto.minDownPayment > 0 && (
                            <div className="space-y-2">
                                <Label className="text-sm">
                                    Entrada: {downPaymentPercent}%
                                    <span className="ml-2 text-slate-500">
                                        (R$ {downPaymentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                                    </span>
                                </Label>
                                <Slider
                                    value={[downPaymentPercent]}
                                    onValueChange={(value) => setDownPaymentPercent(value[0])}
                                    min={options.boleto.minDownPayment}
                                    max={100}
                                    step={5}
                                    className="w-full"
                                />
                            </div>
                        )}

                        {/* Installments */}
                        <div className="space-y-2">
                            <Label className="text-sm">Número de Parcelas</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    value={installments}
                                    onChange={(e) => {
                                        const value = parseInt(e.target.value) || 1;
                                        const max = selectedOption === 'smart'
                                            ? 12
                                            : options.boleto?.maxInstallments || 1;
                                        setInstallments(Math.min(Math.max(1, value), max));
                                    }}
                                    min={1}
                                    max={selectedOption === 'smart' ? 12 : options.boleto?.maxInstallments}
                                    className="flex-1"
                                />
                                <span className="flex items-center text-sm text-slate-500">
                                    / {selectedOption === 'smart' ? 12 : options.boleto?.maxInstallments}x
                                </span>
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Valor Total:</span>
                                <span className="font-bold text-slate-800">
                                    R$ {(selectedOption === 'smart' ? smartTotal : boletoTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            {downPaymentValue > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Entrada:</span>
                                    <span className="font-bold text-green-600">
                                        R$ {downPaymentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Valor Financiado:</span>
                                <span className="font-bold text-slate-800">
                                    R$ {financedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="pt-2 border-t border-slate-200">
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-600">Parcela:</span>
                                    <span className="text-xl font-bold text-violet-600">
                                        {installments}x de R$ {installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Legal Notice for Boleto */}
                        {selectedOption === 'boleto' && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={16} />
                                    <div className="text-xs text-amber-800">
                                        <p className="font-bold mb-1">Importante:</p>
                                        <p>
                                            O contrato incluirá cláusula de confissão de dívida,
                                            constituindo título executivo extrajudicial conforme Art. 784, III do CPC.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
