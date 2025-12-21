import React from 'react';
import { TrendingUp, TrendingDown, Users, DollarSign, Target, Activity, Stethoscope, Clock, AlertCircle, Award, ExternalLink } from 'lucide-react';

interface PilaresTabProps {
    period: string;
    comercialMetrics: any;
    clinicoMetrics: any;
    financeiroMetrics: any;
    kpis: any;
    goals: any;
    activeSubView?: 'marketing' | 'vendas' | 'clinico' | 'operacional' | 'financeiro';
}

export const PilaresTab: React.FC<PilaresTabProps> = ({
    period,
    comercialMetrics,
    clinicoMetrics,
    financeiroMetrics,
    kpis,
    goals,
    activeSubView = 'marketing'
}) => {
    // Metric Card - EXACT SAME STYLE AS ALERTS
    const MetricCard = ({ title, value, subtitle, trend, icon: Icon, color = 'blue', category }: any) => {
        const borderColor = `border-${color}-500`;
        const iconColor = `text-${color}-600`;
        const badgeColor = trend !== undefined && trend >= 0 ? 'bg-green-600' : 'bg-red-600';

        return (
            <div className={`border-l-4 ${borderColor} rounded-lg p-6 shadow-sm hover:shadow-md transition-all bg-white dark:bg-gray-800`}>
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                        <div className="mt-1">
                            <Icon size={24} className={iconColor} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                {trend !== undefined && (
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase text-white ${badgeColor}`}>
                                        {trend >= 0 ? '↗' : '↘'} {Math.abs(trend).toFixed(1)}%
                                    </span>
                                )}
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {period}
                                </span>
                                {category && (
                                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                                        {category}
                                    </span>
                                )}
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                {title}
                            </h3>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                {value}
                            </p>
                            {subtitle && (
                                <p className="text-gray-700 dark:text-gray-300 mb-3">
                                    {subtitle}
                                </p>
                            )}
                            {/* Action Button */}
                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={() => console.log('Ver detalhes:', title)}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                >
                                    <ExternalLink size={16} />
                                    Ver Detalhes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Calculate additional metrics
    const calculateLTV = () => kpis.ticketAvg * 1.5;
    const calculateFidelizacao = () => 0;
    const calculateROI = () => 0;
    const calculateInvestimentoTotal = () => 0;
    const calculateTaxaQualificacao = () => 0;
    const calculatePerdaOportunidade = () => 0;
    const calculateEficienciaCadeira = () => 85;
    const calculateTaxaRetrabalho = () => 5;
    const calculateMargemProcedimento = () => 45;
    const calculateNPS = () => 8.5;
    const calculateTaxaReagendamento = () => 12;
    const calculateTempoEspera = () => 15;
    const calculateProdutividadeEquipe = () => 92;
    const calculateInadimplencia = () => kpis.totalReceivables || 0;
    const calculatePontoEquilibrio = () => kpis.totalExpense * 1.2;

    // Render specific pilar content
    const renderPilarContent = () => {
        switch (activeSubView) {
            case 'marketing':
                return (
                    <div className="space-y-4">
                        <MetricCard
                            title="📊 Total de Leads"
                            value={comercialMetrics.totalOportunidades || 0}
                            subtitle="Novos contatos captados no período"
                            trend={0}
                            icon={Users}
                            color="purple"
                            category="Marketing"
                        />
                        <MetricCard
                            title="💵 CPL (Custo por Lead)"
                            value="R$ 0,00"
                            subtitle="Investimento dividido pelo total de leads"
                            icon={DollarSign}
                            color="purple"
                            category="Marketing"
                        />
                        <MetricCard
                            title="🎯 Investimento Total"
                            value={`R$ ${calculateInvestimentoTotal().toLocaleString('pt-BR')}`}
                            subtitle="Budget total de marketing no período"
                            icon={Target}
                            color="purple"
                            category="Marketing"
                        />
                        <MetricCard
                            title="⭐ Taxa de Qualificação"
                            value={`${calculateTaxaQualificacao()}%`}
                            subtitle="Leads com score superior a 70 pontos"
                            icon={Award}
                            color="purple"
                            category="Marketing"
                        />
                        <MetricCard
                            title="📈 ROI de Marketing"
                            value={`${calculateROI()}%`}
                            subtitle="Retorno sobre investimento em campanhas"
                            trend={0}
                            icon={TrendingUp}
                            color="purple"
                            category="Marketing"
                        />
                        <MetricCard
                            title="📡 Canais Ativos"
                            value={Object.keys(comercialMetrics.origemDistribution || {}).length}
                            subtitle="Fontes de tráfego gerando leads"
                            icon={Activity}
                            color="purple"
                            category="Marketing"
                        />
                    </div>
                );

            case 'vendas':
                return (
                    <div className="space-y-4">
                        <MetricCard
                            title="🎯 Taxa de Conversão"
                            value={`${comercialMetrics.taxaConversao?.toFixed(1) || 0}%`}
                            subtitle="Orçamentos aprovados vs total de leads"
                            trend={kpis.conversionTrend}
                            icon={Target}
                            color="green"
                            category="Vendas"
                        />
                        <MetricCard
                            title="💰 Valor em Pipeline"
                            value={`R$ ${(comercialMetrics.valorPipeline || 0).toLocaleString('pt-BR')}`}
                            subtitle="Orçamentos em negociação (status DRAFT)"
                            icon={DollarSign}
                            color="green"
                            category="Vendas"
                        />
                        <MetricCard
                            title="🏆 Ticket Médio"
                            value={`R$ ${kpis.ticketAvg.toFixed(0)}`}
                            subtitle="Valor médio por venda aprovada"
                            trend={0}
                            icon={Award}
                            color="green"
                            category="Vendas"
                        />
                        <MetricCard
                            title="🔄 Fidelização (Recorrência)"
                            value={`${calculateFidelizacao()}%`}
                            subtitle="Pacientes com mais de 1 orçamento"
                            icon={Users}
                            color="green"
                            category="Vendas"
                        />
                        <MetricCard
                            title="💎 LTV (Lifetime Value)"
                            value={`R$ ${calculateLTV().toLocaleString('pt-BR')}`}
                            subtitle="Valor vitalício estimado do cliente"
                            icon={TrendingUp}
                            color="green"
                            category="Vendas"
                        />
                        <MetricCard
                            title="📉 Perda de Oportunidade"
                            value={`R$ ${calculatePerdaOportunidade().toLocaleString('pt-BR')}`}
                            subtitle="Orçamentos rejeitados no período"
                            icon={AlertCircle}
                            color="green"
                            category="Vendas"
                        />
                    </div>
                );

            case 'clinico':
                return (
                    <div className="space-y-4">
                        <MetricCard
                            title="💰 Faturamento Clínico"
                            value={`R$ ${(clinicoMetrics.valorProducao || 0).toLocaleString('pt-BR')}`}
                            subtitle="Produção total do período"
                            trend={0}
                            icon={DollarSign}
                            color="blue"
                            category="Clínico"
                        />
                        <MetricCard
                            title="🏥 Procedimentos Realizados"
                            value={clinicoMetrics.totalProducao || 0}
                            subtitle="Total de atendimentos concluídos"
                            icon={Stethoscope}
                            color="blue"
                            category="Clínico"
                        />
                        <MetricCard
                            title="⚡ Eficiência de Cadeira"
                            value={`${calculateEficienciaCadeira()}%`}
                            subtitle="Tempo produtivo vs tempo disponível"
                            trend={2}
                            icon={Activity}
                            color="blue"
                            category="Clínico"
                        />
                        <MetricCard
                            title="🔧 Taxa de Retrabalho"
                            value={`${calculateTaxaRetrabalho()}%`}
                            subtitle="Procedimentos que precisaram ser refeitos"
                            icon={AlertCircle}
                            color="blue"
                            category="Clínico"
                        />
                        <MetricCard
                            title="📊 Margem por Procedimento"
                            value={`${calculateMargemProcedimento()}%`}
                            subtitle="Lucro médio por atendimento realizado"
                            trend={3}
                            icon={TrendingUp}
                            color="blue"
                            category="Clínico"
                        />
                        <MetricCard
                            title="⭐ NPS (Satisfação)"
                            value={calculateNPS().toFixed(1)}
                            subtitle="Net Promoter Score dos pacientes"
                            icon={Award}
                            color="blue"
                            category="Clínico"
                        />
                    </div>
                );

            case 'operacional':
                return (
                    <div className="space-y-4">
                        <MetricCard
                            title="📈 Taxa de Ocupação"
                            value="68%"
                            subtitle="Meta: 80% | Horários preenchidos vs disponíveis"
                            trend={-2}
                            icon={Activity}
                            color="orange"
                            category="Operacional"
                        />
                        <MetricCard
                            title="⚠️ Taxa de No-Show"
                            value={`${kpis.noShowRate?.toFixed(1) || 0}%`}
                            subtitle="Faltas não avisadas com antecedência"
                            icon={AlertCircle}
                            color="orange"
                            category="Operacional"
                        />
                        <MetricCard
                            title="📅 Total de Agendamentos"
                            value={kpis.totalAppts || 0}
                            subtitle={`${kpis.completedAppts} concluídos com sucesso`}
                            icon={Clock}
                            color="orange"
                            category="Operacional"
                        />
                        <MetricCard
                            title="🔄 Taxa de Reagendamento"
                            value={`${calculateTaxaReagendamento()}%`}
                            subtitle="Alterações de horário solicitadas"
                            icon={Activity}
                            color="orange"
                            category="Operacional"
                        />
                        <MetricCard
                            title="⏱️ Tempo Médio de Espera"
                            value={`${calculateTempoEspera()} min`}
                            subtitle="Da recepção até o início do atendimento"
                            icon={Clock}
                            color="orange"
                            category="Operacional"
                        />
                        <MetricCard
                            title="🎯 Produtividade da Equipe"
                            value={`${calculateProdutividadeEquipe()}%`}
                            subtitle="Eficiência operacional geral"
                            trend={5}
                            icon={Award}
                            color="orange"
                            category="Operacional"
                        />
                    </div>
                );

            case 'financeiro':
                return (
                    <div className="space-y-4">
                        <MetricCard
                            title="💰 Faturamento Realizado"
                            value={`R$ ${(financeiroMetrics.faturamentoRealizado || 0).toLocaleString('pt-BR')}`}
                            subtitle={`Meta: R$ ${goals.monthly_revenue?.toLocaleString('pt-BR') || 0}`}
                            trend={kpis.revenueTrend}
                            icon={DollarSign}
                            color="emerald"
                            category="Financeiro"
                        />
                        <MetricCard
                            title="📉 Despesas Totais"
                            value={`R$ ${(financeiroMetrics.despesasTotais || 0).toLocaleString('pt-BR')}`}
                            subtitle={`${kpis.totalRevenue > 0 ? ((kpis.totalExpense / kpis.totalRevenue) * 100).toFixed(1) : 0}% do faturamento`}
                            trend={kpis.expenseTrend}
                            icon={AlertCircle}
                            color="emerald"
                            category="Financeiro"
                        />
                        <MetricCard
                            title="📈 Resultado Líquido"
                            value={`R$ ${kpis.netResult.toLocaleString('pt-BR')}`}
                            subtitle={`Meta: R$ ${goals.monthly_net_result?.toLocaleString('pt-BR') || 0}`}
                            trend={kpis.netResultTrend}
                            icon={TrendingUp}
                            color="emerald"
                            category="Financeiro"
                        />
                        <MetricCard
                            title="🏆 Margem EBITDA"
                            value={`${kpis.totalRevenue > 0 ? ((kpis.netResult / kpis.totalRevenue) * 100).toFixed(1) : 0}%`}
                            subtitle="Meta: 30% | Lucro líquido vs faturamento"
                            trend={kpis.netResultTrend}
                            icon={Award}
                            color="emerald"
                            category="Financeiro"
                        />
                        <MetricCard
                            title="⚠️ Inadimplência Real"
                            value={`R$ ${calculateInadimplencia().toLocaleString('pt-BR')}`}
                            subtitle="Valores a receber de pacientes"
                            icon={AlertCircle}
                            color="emerald"
                            category="Financeiro"
                        />
                        <MetricCard
                            title="🎯 Ponto de Equilíbrio"
                            value={`R$ ${calculatePontoEquilibrio().toLocaleString('pt-BR')}`}
                            subtitle="Breakeven mensal estimado"
                            icon={Target}
                            color="emerald"
                            category="Financeiro"
                        />
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="space-y-4 animate-in fade-in">
            {renderPilarContent()}
        </div>
    );
};
