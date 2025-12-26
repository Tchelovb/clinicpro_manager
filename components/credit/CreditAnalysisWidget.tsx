import React, { useState } from 'react';
import { Search, Shield, AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { creditRiskService, CreditAnalysisResult, RiskTier } from '../../services/creditRiskService';
import { cn } from '../../lib/utils';

interface CreditAnalysisWidgetProps {
    patientId?: string;
    leadId?: string;
    onAnalysisComplete?: (result: CreditAnalysisResult) => void;
    compact?: boolean;
}

const TIER_CONFIG: Record<RiskTier, { icon: any; color: string; bgColor: string; borderColor: string }> = {
    A: { icon: CheckCircle, color: 'text-green-700', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
    B: { icon: CheckCircle, color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
    C: { icon: AlertTriangle, color: 'text-orange-700', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
    D: { icon: XCircle, color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200' }
};

export const CreditAnalysisWidget: React.FC<CreditAnalysisWidgetProps> = ({
    patientId,
    leadId,
    onAnalysisComplete,
    compact = false
}) => {
    const [cpf, setCpf] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<CreditAnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const formatCPF = (value: string) => {
        const numbers = value.replace(/\D/g, '');
        if (numbers.length <= 11) {
            return numbers
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        }
        return value;
    };

    const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatCPF(e.target.value);
        setCpf(formatted);
        setError(null);
    };

    const handleAnalyze = async () => {
        const cleanCPF = cpf.replace(/\D/g, '');

        if (cleanCPF.length !== 11) {
            setError('CPF inválido. Digite 11 dígitos.');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const analysis = await creditRiskService.analyzeCreditRisk(cleanCPF, patientId, leadId);
            setResult(analysis);

            if (onAnalysisComplete) {
                onAnalysisComplete(analysis);
            }
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleAnalyze();
        }
    };

    if (compact && result) {
        const config = TIER_CONFIG[result.tier];
        const Icon = config.icon;

        return (
            <div className={cn(
                "flex items-center gap-2 p-3 rounded-lg border",
                config.bgColor,
                config.borderColor
            )}>
                <Icon className={config.color} size={20} />
                <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800">
                        Score: {result.score} - Tier {result.tier}
                    </p>
                    <p className="text-xs text-slate-600">{result.profile.label}</p>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setResult(null)}
                    className="text-xs"
                >
                    Nova Análise
                </Button>
            </div>
        );
    }

    return (
        <Card className="w-full">
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="text-violet-600" size={20} />
                    Análise de Crédito
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Input Section */}
                {!result && (
                    <div className="flex gap-2">
                        <Input
                            placeholder="Digite o CPF"
                            value={cpf}
                            onChange={handleCPFChange}
                            onKeyPress={handleKeyPress}
                            maxLength={14}
                            className="flex-1"
                        />
                        <Button
                            onClick={handleAnalyze}
                            disabled={loading || cpf.replace(/\D/g, '').length !== 11}
                            className="bg-violet-600 hover:bg-violet-700"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={16} />
                            ) : (
                                <Search size={16} />
                            )}
                        </Button>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                        <XCircle className="text-red-600 shrink-0 mt-0.5" size={16} />
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                {/* Results Section */}
                {result && (
                    <div className="space-y-3">
                        {/* Score Card */}
                        <div className={cn(
                            "p-4 rounded-lg border-2",
                            TIER_CONFIG[result.tier].bgColor,
                            TIER_CONFIG[result.tier].borderColor
                        )}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    {React.createElement(TIER_CONFIG[result.tier].icon, {
                                        className: TIER_CONFIG[result.tier].color,
                                        size: 24
                                    })}
                                    <div>
                                        <p className="text-sm font-bold text-slate-600">Score de Crédito</p>
                                        <p className="text-2xl font-bold text-slate-800">{result.score}</p>
                                    </div>
                                </div>
                                <Badge className={cn(
                                    "text-lg font-bold px-3 py-1",
                                    TIER_CONFIG[result.tier].bgColor,
                                    TIER_CONFIG[result.tier].color
                                )}>
                                    Tier {result.tier}
                                </Badge>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Classificação:</span>
                                    <span className="font-bold text-slate-800">{result.profile.label}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Parcelas Máx:</span>
                                    <span className="font-bold text-slate-800">{result.profile.maxInstallments}x</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Entrada Mín:</span>
                                    <span className="font-bold text-slate-800">{result.profile.minDownPayment}%</span>
                                </div>
                                {result.profile.requiresGuarantor && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Avalista:</span>
                                        <span className="font-bold text-orange-600">Obrigatório</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Boleto/Carnê:</span>
                                    <span className={cn(
                                        "font-bold",
                                        result.profile.allowBoleto ? "text-green-600" : "text-red-600"
                                    )}>
                                        {result.profile.allowBoleto ? 'Permitido' : 'Bloqueado'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Recommendation */}
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Recomendação</p>
                            <p className="text-sm text-slate-700">{result.recommendation}</p>
                        </div>

                        {/* Actions */}
                        <Button
                            variant="outline"
                            onClick={() => {
                                setResult(null);
                                setCpf('');
                            }}
                            className="w-full"
                        >
                            Nova Análise
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
