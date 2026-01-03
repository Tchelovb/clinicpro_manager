import React, { useState, useEffect } from 'react';
import { AlertTriangle, Lock, Unlock, DollarSign, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { receivablesService } from '../../services/receivablesService';
import { cn } from '../../src/lib/utils';

interface LabOrderLockProps {
    patientId: string;
    budgetId: string;
    estimatedLabCost: number;
    onProceed?: () => void;
    className?: string;
}

/**
 * Lab Order Lock Component
 * 
 * Prevents sending lab orders until patient has paid enough to cover the lab cost.
 * This protects the clinic from spending money on third-party services before receiving payment.
 */
export const LabOrderLock: React.FC<LabOrderLockProps> = ({
    patientId,
    budgetId,
    estimatedLabCost,
    onProceed,
    className
}) => {
    const [loading, setLoading] = useState(true);
    const [lockStatus, setLockStatus] = useState<{
        allowed: boolean;
        reason?: string;
        amountPaid: number;
        amountNeeded: number;
    } | null>(null);

    useEffect(() => {
        checkLockStatus();
    }, [patientId, budgetId, estimatedLabCost]);

    const checkLockStatus = async () => {
        try {
            setLoading(true);
            const status = await receivablesService.canSendLabOrder(
                patientId,
                budgetId,
                estimatedLabCost
            );
            setLockStatus(status);
        } catch (error) {
            console.error('Error checking lab lock status:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !lockStatus) {
        return (
            <Card className={className}>
                <CardContent className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
                </CardContent>
            </Card>
        );
    }

    const paymentProgress = (lockStatus.amountPaid / lockStatus.amountNeeded) * 100;
    const remaining = lockStatus.amountNeeded - lockStatus.amountPaid;

    return (
        <Card className={cn(
            "border-2",
            lockStatus.allowed ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50",
            className
        )}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        {lockStatus.allowed ? (
                            <>
                                <Unlock className="text-green-600" size={20} />
                                <span className="text-green-800">Liberado para Laboratório</span>
                            </>
                        ) : (
                            <>
                                <Lock className="text-orange-600" size={20} />
                                <span className="text-orange-800">Aguardando Pagamento</span>
                            </>
                        )}
                    </CardTitle>
                    <Badge variant={lockStatus.allowed ? "default" : "destructive"}>
                        {lockStatus.allowed ? 'Liberado' : 'Bloqueado'}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Progresso de Pagamento</span>
                        <span className="font-bold text-slate-800">
                            {paymentProgress.toFixed(0)}%
                        </span>
                    </div>
                    <Progress
                        value={paymentProgress}
                        className={cn(
                            "h-3",
                            lockStatus.allowed ? "bg-green-200" : "bg-orange-200"
                        )}
                    />
                </div>

                {/* Financial Details */}
                <div className="bg-white rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Custo Estimado do Lab:</span>
                        <span className="font-bold text-slate-800">
                            R$ {lockStatus.amountNeeded.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Valor Já Pago:</span>
                        <span className="font-bold text-green-600">
                            R$ {lockStatus.amountPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                    {!lockStatus.allowed && (
                        <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                            <span className="text-slate-600">Falta Receber:</span>
                            <span className="font-bold text-orange-600">
                                R$ {remaining.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    )}
                </div>

                {/* Status Message */}
                {lockStatus.allowed ? (
                    <div className="bg-green-100 border border-green-300 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                            <CheckCircle2 className="text-green-600 shrink-0 mt-0.5" size={16} />
                            <div className="text-sm text-green-800">
                                <p className="font-bold mb-1">✅ Liberado para Envio</p>
                                <p>
                                    O paciente já pagou o suficiente para cobrir o custo do laboratório.
                                    Você pode prosseguir com segurança.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-orange-100 border border-orange-300 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="text-orange-600 shrink-0 mt-0.5" size={16} />
                            <div className="text-sm text-orange-800">
                                <p className="font-bold mb-1">⚠️ Bloqueado</p>
                                <p>{lockStatus.reason}</p>
                                <p className="mt-2 text-xs">
                                    <strong>Proteção Financeira:</strong> Não gaste com laboratório antes de receber o pagamento.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Button */}
                {onProceed && (
                    <Button
                        onClick={onProceed}
                        disabled={!lockStatus.allowed}
                        className={cn(
                            "w-full",
                            lockStatus.allowed
                                ? "bg-green-600 hover:bg-green-700"
                                : "bg-slate-300 cursor-not-allowed"
                        )}
                    >
                        {lockStatus.allowed ? (
                            <>
                                <Unlock size={16} className="mr-2" />
                                Enviar para Laboratório
                            </>
                        ) : (
                            <>
                                <Lock size={16} className="mr-2" />
                                Aguardando Pagamento
                            </>
                        )}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
};
