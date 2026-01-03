import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, CheckCircle2, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { cfoService, DREData, PDDData, CashFlowData, FinancialHealthScore } from '../../services/cfoService';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../src/lib/utils';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

export const CFODashboard: React.FC = () => {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [dre, setDre] = useState<DREData | null>(null);
    const [pdd, setPdd] = useState<PDDData | null>(null);
    const [cashFlow, setCashFlow] = useState<CashFlowData[]>([]);
    const [healthScore, setHealthScore] = useState<FinancialHealthScore | null>(null);

    useEffect(() => {
        if (profile?.clinic_id) {
            loadData();
        }
    }, [profile?.clinic_id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const clinicId = profile?.clinic_id!;

            // Get current month dates
            const today = new Date();
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
            const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

            const [dreData, pddData, cashFlowData, healthData] = await Promise.all([
                cfoService.generateDRE(
                    clinicId,
                    firstDay.toISOString().split('T')[0],
                    lastDay.toISOString().split('T')[0]
                ),
                cfoService.calculatePDD(clinicId),
                cfoService.generateCashFlow(
                    clinicId,
                    firstDay.toISOString().split('T')[0],
                    lastDay.toISOString().split('T')[0]
                ),
                cfoService.calculateFinancialHealth(clinicId)
            ]);

            setDre(dreData);
            setPdd(pddData);
            setCashFlow(cashFlowData);
            setHealthScore(healthData);
        } catch (error) {
            console.error('Error loading CFO data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header with Financial Health Score */}
            <div className="grid grid-cols-5 gap-4">
                <Card className="col-span-2 border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-white">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-sm font-medium text-slate-600">Saúde Financeira</p>
                                <p className="text-4xl font-bold text-violet-600">
                                    {healthScore?.overall_score}
                                    <span className="text-lg text-slate-500">/100</span>
                                </p>
                            </div>
                            <Activity className="text-violet-600" size={48} />
                        </div>
                        <Progress value={healthScore?.overall_score} className="h-3 mb-4" />
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                                <span className="text-slate-500">Lucratividade:</span>
                                <span className="ml-1 font-bold">{healthScore?.profitability_score}</span>
                            </div>
                            <div>
                                <span className="text-slate-500">Liquidez:</span>
                                <span className="ml-1 font-bold">{healthScore?.liquidity_score}</span>
                            </div>
                            <div>
                                <span className="text-slate-500">Eficiência:</span>
                                <span className="ml-1 font-bold">{healthScore?.efficiency_score}</span>
                            </div>
                            <div>
                                <span className="text-slate-500">Crescimento:</span>
                                <span className="ml-1 font-bold">{healthScore?.growth_score}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <p className="text-sm text-slate-500">Receita Líquida</p>
                        <p className="text-2xl font-bold text-green-600">
                            R$ {dre?.net_revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">Mês atual</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <p className="text-sm text-slate-500">Lucro Líquido</p>
                        <p className={cn(
                            "text-2xl font-bold",
                            (dre?.net_profit || 0) >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                            R$ {dre?.net_profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                            Margem: {dre?.net_margin_percent.toFixed(1)}%
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <p className="text-sm text-slate-500">PDD Total</p>
                        <p className="text-2xl font-bold text-orange-600">
                            R$ {pdd?.total_provision.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                            Taxa: {pdd?.default_rate_percent.toFixed(1)}%
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Alerts */}
            {healthScore && healthScore.alerts.length > 0 && (
                <div className="space-y-2">
                    {healthScore.alerts.map((alert, idx) => (
                        <Card key={idx} className={cn(
                            "border-l-4",
                            alert.severity === 'critical' && "border-l-red-500 bg-red-50",
                            alert.severity === 'warning' && "border-l-orange-500 bg-orange-50",
                            alert.severity === 'info' && "border-l-blue-500 bg-blue-50"
                        )}>
                            <CardContent className="py-3">
                                <div className="flex items-center gap-3">
                                    <AlertTriangle className={cn(
                                        alert.severity === 'critical' && "text-red-600",
                                        alert.severity === 'warning' && "text-orange-600",
                                        alert.severity === 'info' && "text-blue-600"
                                    )} size={20} />
                                    <div className="flex-1">
                                        <p className="font-bold text-sm">{alert.category}</p>
                                        <p className="text-xs text-slate-600">{alert.message}</p>
                                    </div>
                                    {alert.value !== undefined && (
                                        <Badge variant="outline">
                                            {alert.value.toFixed(1)}% / {alert.threshold}%
                                        </Badge>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Tabs */}
            <Tabs defaultValue="dre" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="dre">DRE</TabsTrigger>
                    <TabsTrigger value="pdd">PDD</TabsTrigger>
                    <TabsTrigger value="cashflow">Fluxo de Caixa</TabsTrigger>
                </TabsList>

                {/* DRE Tab */}
                <TabsContent value="dre" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Demonstrativo de Resultados (DRE)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between py-2 border-b">
                                <span className="font-bold">Receita Bruta</span>
                                <span className="font-bold text-green-600">
                                    R$ {dre?.gross_revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="flex justify-between py-2 pl-4">
                                <span className="text-slate-600">(-) Deduções (Impostos)</span>
                                <span className="text-red-600">
                                    R$ {dre?.deductions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="flex justify-between py-2 border-b font-bold">
                                <span>= Receita Líquida</span>
                                <span className="text-green-600">
                                    R$ {dre?.net_revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="flex justify-between py-2 pl-4">
                                <span className="text-slate-600">(-) Custos Variáveis</span>
                                <span className="text-red-600">
                                    R$ {dre?.variable_costs.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="flex justify-between py-2 border-b font-bold">
                                <span>= Lucro Bruto</span>
                                <span className="text-green-600">
                                    R$ {dre?.gross_profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                                <Badge variant="outline">{dre?.gross_margin_percent.toFixed(1)}%</Badge>
                            </div>
                            <div className="flex justify-between py-2 pl-4">
                                <span className="text-slate-600">(-) Despesas Fixas</span>
                                <span className="text-red-600">
                                    R$ {dre?.fixed_costs.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="flex justify-between py-2 border-b font-bold bg-blue-50 px-2 rounded">
                                <span>= EBITDA</span>
                                <span className="text-blue-600">
                                    R$ {dre?.ebitda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                                <Badge variant="outline">{dre?.ebitda_margin_percent.toFixed(1)}%</Badge>
                            </div>
                            <div className="flex justify-between py-2 font-bold bg-violet-50 px-2 rounded">
                                <span>= Lucro Líquido</span>
                                <span className={cn(
                                    "text-xl",
                                    (dre?.net_profit || 0) >= 0 ? "text-green-600" : "text-red-600"
                                )}>
                                    R$ {dre?.net_profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                                <Badge variant="outline">{dre?.net_margin_percent.toFixed(1)}%</Badge>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* PDD Tab */}
                <TabsContent value="pdd" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Provisão para Devedores Duvidosos (PDD)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={[
                                    { name: '0-30 dias', value: pdd?.overdue_0_30_days, provision: pdd?.provision_0_30_days },
                                    { name: '31-60 dias', value: pdd?.overdue_31_60_days, provision: pdd?.provision_31_60_days },
                                    { name: '61-90 dias', value: pdd?.overdue_61_90_days, provision: pdd?.provision_61_90_days },
                                    { name: '90+ dias', value: pdd?.overdue_over_90_days, provision: pdd?.provision_over_90_days }
                                ]}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="value" fill="#8b5cf6" name="Valor em Atraso" />
                                    <Bar dataKey="provision" fill="#ef4444" name="Provisão" />
                                </BarChart>
                            </ResponsiveContainer>

                            <div className="mt-6 space-y-2">
                                <div className="flex justify-between py-2 border-b">
                                    <span className="font-bold">Total a Receber (Vencido)</span>
                                    <span className="font-bold">
                                        R$ {pdd?.total_receivables.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <div className="flex justify-between py-2 bg-red-50 px-2 rounded">
                                    <span className="font-bold">Total de Provisão (PDD)</span>
                                    <span className="font-bold text-red-600">
                                        R$ {pdd?.total_provision.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span>Taxa de Inadimplência</span>
                                    <Badge variant={
                                        (pdd?.default_rate_percent || 0) > 10 ? "destructive" : "outline"
                                    }>
                                        {pdd?.default_rate_percent.toFixed(2)}%
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Cash Flow Tab */}
                <TabsContent value="cashflow" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Fluxo de Caixa Projetado</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={cashFlow}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="cash_inflows" stroke="#10b981" name="Entradas" />
                                    <Line type="monotone" dataKey="cash_outflows" stroke="#ef4444" name="Saídas" />
                                    <Line type="monotone" dataKey="accumulated_balance" stroke="#8b5cf6" strokeWidth={2} name="Saldo Acumulado" />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};
