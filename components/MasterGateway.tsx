import React, { useEffect, useState } from 'react';
import { Activity, DollarSign, BrainCircuit, AlertTriangle, Building2, Users, TrendingUp, Loader2 } from 'lucide-react';
import { MasterIntelligence } from '../services/MasterIntelligenceService';

interface Metrics {
    revenue: number;
    units: number;
    productionUnits: number;
    simulations: number;
    patients: number;
    alerts: number;
}

interface Alert {
    id: number;
    type: string;
    message: string;
    action: string;
}

export function MasterGateway() {
    const [metrics, setMetrics] = useState<Metrics>({
        revenue: 0,
        units: 0,
        productionUnits: 0,
        simulations: 0,
        patients: 0,
        alerts: 0
    });
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMasterData();
    }, []);

    const loadMasterData = async () => {
        try {
            const [metricsData, alertsData] = await Promise.all([
                MasterIntelligence.getHoldingMetrics(),
                MasterIntelligence.getStrategicAlerts()
            ]);

            setMetrics(metricsData);
            setAlerts(alertsData);
        } catch (error) {
            console.error('Erro ao carregar dados Master:', error);
        } finally {
            setLoading(false);
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
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">Carregando Intelligence Gateway...</p>
                </div>
            </div>
        );
    }
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* CABEÇALHO BOAS VINDAS */}
                <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 rounded-2xl p-10 text-white shadow-2xl relative overflow-hidden">
                    <div className="relative z-10">
                        <h1 className="text-5xl font-black mb-3">
                            Intelligence Gateway <span className="text-yellow-400">Master</span>
                        </h1>
                        <p className="text-blue-200 text-xl">
                            Visão consolidada de todas as operações e inteligência estratégica
                        </p>
                    </div>
                    <BrainCircuit className="absolute right-0 top-0 text-white/10 w-80 h-80 -mr-20 -mt-10" />
                </div>

                {/* KPI CARDS (COFRE GLOBAL) */}
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Cofre Global</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-8 rounded-2xl border-2 border-gray-200 shadow-lg hover:shadow-xl transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-gray-600 font-semibold text-lg">Receita Global (Mês)</span>
                                <div className="p-3 bg-green-100 rounded-xl">
                                    <DollarSign className="w-8 h-8 text-green-600" />
                                </div>
                            </div>
                            <h2 className="text-5xl font-black text-gray-900 mb-2">{formatCurrency(metrics.revenue)}</h2>
                            {metrics.revenue === 0 && (
                                <p className="text-xs text-gray-500 mt-1">Sem transações financeiras registradas</p>
                            )}
                            <span className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full font-medium">
                                Consolidado da Rede
                            </span>
                        </div>

                        <div className="bg-white p-8 rounded-2xl border-2 border-gray-200 shadow-lg hover:shadow-xl transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-gray-600 font-semibold text-lg">Unidades Ativas</span>
                                <div className="p-3 bg-blue-100 rounded-xl">
                                    <Building2 className="w-8 h-8 text-blue-600" />
                                </div>
                            </div>
                            <h2 className="text-5xl font-black text-gray-900 mb-2">{metrics.units}</h2>
                            <p className="text-xs text-gray-500 mt-1">{metrics.productionUnits} produção | {metrics.simulations} simulação</p>
                            <span className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full font-medium">
                                Real Time
                            </span>
                        </div>

                        <div className="bg-white p-8 rounded-2xl border-2 border-gray-200 shadow-lg hover:shadow-xl transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-gray-600 font-semibold text-lg">Alertas Críticos</span>
                                <div className="p-3 bg-red-100 rounded-xl">
                                    <AlertTriangle className="w-8 h-8 text-red-600" />
                                </div>
                            </div>
                            <h2 className="text-5xl font-black text-gray-900 mb-2">{metrics.alerts}</h2>
                            <span className={`text-sm px-3 py-1 rounded-full font-medium ${metrics.alerts > 0 ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'
                                }`}>
                                Requer Atenção
                            </span>
                        </div>
                    </div>
                </div>

                {/* PERFORMANCE OVERVIEW */}
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Performance da Rede</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                            <div className="flex items-center gap-3 mb-3">
                                <Users className="w-5 h-5 text-purple-600" />
                                <span className="text-sm font-medium text-gray-600">Pacientes Ativos</span>
                            </div>
                            <p className="text-3xl font-black text-gray-900">{metrics.patients.toLocaleString('pt-BR')}</p>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                            <div className="flex items-center gap-3 mb-3">
                                <TrendingUp className="w-5 h-5 text-green-600" />
                                <span className="text-sm font-medium text-gray-600">Taxa de Conversão</span>
                            </div>
                            <p className="text-3xl font-black text-gray-900">--%</p>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                            <div className="flex items-center gap-3 mb-3">
                                <Activity className="w-5 h-5 text-blue-600" />
                                <span className="text-sm font-medium text-gray-600">Ticket Médio</span>
                            </div>
                            <p className="text-3xl font-black text-gray-900">R$ --</p>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                            <div className="flex items-center gap-3 mb-3">
                                <DollarSign className="w-5 h-5 text-orange-600" />
                                <span className="text-sm font-medium text-gray-600">LTV Médio</span>
                            </div>
                            <p className="text-3xl font-black text-gray-900">R$ --</p>
                        </div>
                    </div>
                </div>

                {/* BOS ESTRATÉGICO & AÇÕES */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* BOS Estratégico */}
                    <div className="bg-white rounded-2xl shadow-lg border-2 border-purple-200 p-8">
                        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <BrainCircuit className="w-6 h-6 text-purple-600" />
                            </div>
                            BOS Estratégico
                        </h3>

                        <div className="space-y-4">
                            {alerts.length === 0 ? (
                                <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                                    <p className="text-green-900 font-medium italic">
                                        "Doutor Marcelo, sistema operando normalmente. Todas as métricas estão saudáveis."
                                    </p>
                                </div>
                            ) : (
                                alerts.map((alert) => (
                                    <div
                                        key={alert.id}
                                        className={`p-4 rounded-xl border ${alert.type === 'CRITICAL' ? 'bg-red-50 border-red-200' :
                                                alert.type === 'WARNING' ? 'bg-yellow-50 border-yellow-200' :
                                                    'bg-blue-50 border-blue-200'
                                            }`}
                                    >
                                        <p className={`font-medium italic mb-2 ${alert.type === 'CRITICAL' ? 'text-red-900' :
                                                alert.type === 'WARNING' ? 'text-yellow-900' :
                                                    'text-blue-900'
                                            }`}>
                                            "{alert.message}"
                                        </p>
                                        <button className="text-sm font-bold text-purple-600 hover:underline">
                                            {alert.action} →
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        <button className="mt-6 w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg">
                            Conversar com BOS Global →
                        </button>
                    </div>

                    {/* Atalhos Rápidos */}
                    <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8">
                        <h3 className="text-2xl font-bold text-gray-900 mb-6">Atalhos Rápidos</h3>

                        <div className="space-y-3">
                            <a
                                href="/dashboard/network"
                                className="block p-4 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Building2 className="w-5 h-5 text-blue-600" />
                                        <span className="font-bold text-blue-900">Gerenciar Rede Real</span>
                                    </div>
                                    <span className="text-blue-600">→</span>
                                </div>
                            </a>

                            <a
                                href="/dashboard/game"
                                className="block p-4 bg-purple-50 hover:bg-purple-100 rounded-xl border border-purple-200 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Activity className="w-5 h-5 text-purple-600" />
                                        <span className="font-bold text-purple-900">Tycoon Game</span>
                                    </div>
                                    <span className="text-purple-600">→</span>
                                </div>
                            </a>

                            <a
                                href="/settings"
                                className="block p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Activity className="w-5 h-5 text-gray-600" />
                                        <span className="font-bold text-gray-900">Configurações da Plataforma</span>
                                    </div>
                                    <span className="text-gray-600">→</span>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                    <div className="flex items-start gap-4">
                        <AlertTriangle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                        <div>
                            <h4 className="text-blue-900 font-bold mb-2">Bem-vindo ao Intelligence Gateway</h4>
                            <p className="text-blue-700 leading-relaxed">
                                Este é seu painel de controle consolidado. Aqui você visualiza métricas globais
                                de todas as unidades, recebe alertas estratégicos do BOS e acessa rapidamente
                                as principais áreas de gestão. Os dados serão populados automaticamente conforme
                                você criar unidades e elas gerarem movimentações.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
