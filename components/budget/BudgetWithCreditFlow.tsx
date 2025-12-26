import React, { useState } from 'react';
import { CreditAnalysisWidget } from '../credit/CreditAnalysisWidget';
import { PaymentSimulator } from './PaymentSimulator';
import { CreditAnalysisResult, RiskTier } from '../../services/creditRiskService';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { ArrowRight, FileText } from 'lucide-react';

interface BudgetWithCreditFlowProps {
    patientId?: string;
    leadId?: string;
    budgetValue: number;
    onConfirm?: (config: any) => void;
}

/**
 * Complete Budget Flow with Credit Analysis + Payment Simulation
 * 
 * This component demonstrates the full integration:
 * 1. Credit Analysis (CPF check)
 * 2. Payment Simulation (Smart vs Crediário)
 * 3. Final confirmation
 */
export const BudgetWithCreditFlow: React.FC<BudgetWithCreditFlowProps> = ({
    patientId,
    leadId,
    budgetValue,
    onConfirm
}) => {
    const [step, setStep] = useState<'credit' | 'payment' | 'confirm'>('credit');
    const [creditResult, setCreditResult] = useState<CreditAnalysisResult | null>(null);
    const [paymentConfig, setPaymentConfig] = useState<any>(null);

    const handleCreditAnalysisComplete = (result: CreditAnalysisResult) => {
        setCreditResult(result);
        setStep('payment');
    };

    const handlePaymentSelect = (option: 'smart' | 'boleto', config: any) => {
        setPaymentConfig({ ...config, option });
    };

    const handleConfirm = () => {
        if (onConfirm && creditResult && paymentConfig) {
            onConfirm({
                creditAnalysis: creditResult,
                payment: paymentConfig,
                budgetValue
            });
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto p-6">
            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-4 mb-8">
                <div className={`flex items-center gap-2 ${step === 'credit' ? 'text-violet-600' : 'text-slate-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 'credit' ? 'bg-violet-600 text-white' : 'bg-slate-200'
                        }`}>
                        1
                    </div>
                    <span className="font-medium">Análise de Crédito</span>
                </div>
                <ArrowRight className="text-slate-300" size={20} />
                <div className={`flex items-center gap-2 ${step === 'payment' ? 'text-violet-600' : 'text-slate-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 'payment' ? 'bg-violet-600 text-white' : 'bg-slate-200'
                        }`}>
                        2
                    </div>
                    <span className="font-medium">Simulação de Pagamento</span>
                </div>
                <ArrowRight className="text-slate-300" size={20} />
                <div className={`flex items-center gap-2 ${step === 'confirm' ? 'text-violet-600' : 'text-slate-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 'confirm' ? 'bg-violet-600 text-white' : 'bg-slate-200'
                        }`}>
                        3
                    </div>
                    <span className="font-medium">Confirmação</span>
                </div>
            </div>

            {/* Step 1: Credit Analysis */}
            {step === 'credit' && (
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Passo 1: Análise de Crédito</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-slate-600 mb-4">
                                Para oferecer as melhores condições de pagamento, precisamos analisar o perfil de crédito do paciente.
                            </p>
                            <CreditAnalysisWidget
                                patientId={patientId}
                                leadId={leadId}
                                onAnalysisComplete={handleCreditAnalysisComplete}
                            />
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Step 2: Payment Simulation */}
            {step === 'payment' && creditResult && (
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Passo 2: Escolha a Forma de Pagamento</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <PaymentSimulator
                                baseValue={budgetValue}
                                creditTier={creditResult.tier}
                                onSelectOption={handlePaymentSelect}
                            />

                            <div className="flex gap-3 mt-6">
                                <Button
                                    variant="outline"
                                    onClick={() => setStep('credit')}
                                    className="flex-1"
                                >
                                    Voltar
                                </Button>
                                <Button
                                    onClick={() => setStep('confirm')}
                                    disabled={!paymentConfig}
                                    className="flex-1 bg-violet-600 hover:bg-violet-700"
                                >
                                    Continuar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Step 3: Confirmation */}
            {step === 'confirm' && creditResult && paymentConfig && (
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Passo 3: Confirmação do Orçamento</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Summary */}
                            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Perfil de Crédito:</span>
                                    <span className="font-bold">Tier {creditResult.tier} - {creditResult.profile.label}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Forma de Pagamento:</span>
                                    <span className="font-bold">
                                        {paymentConfig.option === 'smart' ? 'Valor Smart (Cartão/Pix)' : 'Valor Crediário (Boleto)'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Valor Total:</span>
                                    <span className="font-bold text-lg">
                                        R$ {paymentConfig.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                {paymentConfig.downPayment > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Entrada:</span>
                                        <span className="font-bold text-green-600">
                                            R$ {paymentConfig.downPayment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Parcelamento:</span>
                                    <span className="text-xl font-bold text-violet-600">
                                        {paymentConfig.installments}x de R$ {paymentConfig.installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setStep('payment')}
                                    className="flex-1"
                                >
                                    Voltar
                                </Button>
                                <Button
                                    onClick={handleConfirm}
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                >
                                    <FileText size={16} className="mr-2" />
                                    Gerar Contrato
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};
