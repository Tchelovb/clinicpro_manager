import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import {
    BarChart3, Calendar, DollarSign, Users, TrendingUp, Download,
    Filter, Loader2, Target, Activity, Printer, FileText, CheckCircle, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Intelligence360Data {
    clinic_id: string;
    clinic_name: string;
    // Marketing
    total_leads: number;
    taxa_qualificacao: number;
    // Sales
    valor_pipeline: number;
    ticket_medio: number;
    taxa_conversao_orcamentos: number;
    ltv_medio: number;
    taxa_fidelizacao: number;
    // Clinical
    procedimentos_concluidos: number;
    valor_producao_total: number;
    margem_media_procedimento: number;
    // Operational
    total_agendamentos: number;
    taxa_no_show: number;
    taxa_conclusao: number;
    // Financial
    faturamento_realizado: number;
    despesas_totais: number;
    resultado_liquido: number;
    margem_ebitda: number;
    inadimplencia_total: number;
}

const Reports: React.FC = () => {
    const { profile } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const componentRef = useRef<HTMLDivElement>(null);

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<Intelligence360Data | null>(null);
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'ALL');
    const [highlightId, setHighlightId] = useState(searchParams.get('highlight') || '');

    // Handle Print
    const handlePrint = useReactToPrint({
        // @ts-ignore - content IS supported but types might be mismatching in this version
        content: () => componentRef.current,
        documentTitle: `Relatorio_Auditoria_${new Date().toISOString().split('T')[0]}`,
    });

    useEffect(() => {
        loadData();
    }, [profile?.clinic_id]);

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab) setActiveTab(tab.toUpperCase());
        const highlight = searchParams.get('highlight');
        if (highlight) setHighlightId(highlight);
    }, [searchParams]);

    const loadData = async () => {
        try {
            setLoading(true);
            // Fetch from the Single Source of Truth View
            const { data: viewData, error } = await supabase
                .from('view_intelligence_360')
                .select('*')
                .eq('clinic_id', profile?.clinic_id)
                .single();

            if (error) {
                // If view doesn't exist or empty, maybe fallback or just show error.
                // Assuming view exists as per instructions.
                console.error('Error fetching view_intelligence_360', error);

                // Fallback mock data if view is missing (for safety during dev)
                // Remove in production
                /*
                setData({
                    clinic_id: profile?.clinic_id || '',
                    clinic_name: profile?.clinic_name || 'Clínica',
                    total_leads: 145, taxa_qualificacao: 68,
                    valor_pipeline: 250000, ticket_medio: 4500, taxa_conversao_orcamentos: 28, ltv_medio: 12000, taxa_fidelizacao: 45,
                    procedimentos_concluidos: 32, valor_producao_total: 180000, margem_media_procedimento: 35,
                    total_agendamentos: 85, taxa_no_show: 5, taxa_conclusao: 92,
                    faturamento_realizado: 150000, despesas_totais: 90000, resultado_liquido: 60000, margem_ebitda: 40, inadimplencia_total: 5000
                });
                */
                // toast.error('Erro ao carregar dados consolidados.');
            }

            if (viewData) {
                setData(viewData);
            }
        } catch (error) {
            console.error('Erro geral:', error);
        } finally {
            setLoading(false);
        }
    };

    const StatusBadge = ({ value, type }: { value: number, type: 'PERCENT' | 'CURRENCY' | 'NUMBER' }) => {
        // Simple logic for color
        const isGood = type === 'PERCENT' ? value > 20 : value > 0;
        return (
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${isGood ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {type === 'PERCENT' ? `${value}%` : type === 'CURRENCY' ? `R$ ${value}` : value}
            </span>
        );
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-100">
                <Loader2 className="w-12 h-12 text-slate-800 animate-spin mb-4" />
                <p className="text-slate-600 font-medium">Gerando Relatório de Auditoria...</p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-100">
                <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
                <p className="text-slate-600 font-medium">Nenhum dado consolidado disponível para auditoria.</p>
                <button onClick={loadData} className="mt-4 text-blue-600 hover:underline">Tentar novamente</button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-200 p-8 print:p-0 print:bg-white overflow-auto flex flex-col items-center">

            {/* Control Bar (Hidden on Print) */}
            <div className="w-full max-w-[210mm] mb-6 flex justify-between items-center print:hidden">
                <div className="flex gap-2">
                    <button
                        onClick={() => { setSearchParams({ tab: 'ALL' }); setActiveTab('ALL'); }}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'ALL' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
                    >
                        Visão Geral
                    </button>
                    <button
                        onClick={() => { setSearchParams({ tab: 'FINANCIAL' }); setActiveTab('FINANCIAL'); }}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'FINANCIAL' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
                    >
                        Financeiro
                    </button>
                    <button
                        onClick={() => { setSearchParams({ tab: 'MARKETING' }); setActiveTab('MARKETING'); }}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'MARKETING' ? 'bg-violet-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
                    >
                        Marketing & Vendas
                    </button>
                    <button
                        onClick={() => { setSearchParams({ tab: 'CEO' }); setActiveTab('CEO'); }}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'CEO' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
                    >
                        Checklist CEO
                    </button>
                </div>

                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors font-medium shadow-lg"
                >
                    <Printer size={18} />
                    Imprimir Auditoria (A4)
                </button>
            </div>

            {/* A4 Paper Container */}
            <div ref={componentRef} className="bg-white w-full md:w-[210mm] min-h-screen md:min-h-[297mm] shadow-sm md:shadow-2xl print:shadow-none p-6 md:p-[20mm] relative rounded-xl md:rounded-none">

                {/* Header */}
                <div className="border-b-2 border-slate-800 pb-6 mb-8 flex flex-col md:flex-row justify-between md:items-end gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter">Relatório de Auditoria</h1>
                        <p className="text-slate-500 font-medium mt-1">Torre de Controle Operacional • {data?.clinic_name || profile?.clinics?.name || 'Clínica'}</p>
                    </div>
                    <div className="text-left md:text-right">
                        <p className="text-xs text-slate-400 uppercase font-bold">Data de Emissão</p>
                        <p className="text-lg font-bold text-slate-800">{new Date().toLocaleDateString('pt-BR')}</p>
                    </div>
                </div>

                {/* Executive Summary (Health Score) */}
                {(activeTab === 'ALL') && (
                    <div className="mb-12 bg-slate-50 p-6 rounded-xl border border-slate-100 print:border-slate-200">
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Resumo Executivo (IVC)</h2>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-4 text-center">
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Marketing</p>
                                <p className="text-xl md:text-2xl font-black text-slate-800">{data.total_leads}</p>
                                <p className="text-[10px] text-green-600 font-bold">Leads Totais</p>
                            </div>
                            <div className="border-l border-slate-200 md:border-l">
                                <p className="text-xs text-slate-500 mb-1">Vendas</p>
                                <p className="text-xl md:text-2xl font-black text-slate-800">{data.taxa_conversao_orcamentos}%</p>
                                <p className="text-[10px] text-blue-600 font-bold">Conversão</p>
                            </div>
                            <div className="col-span-2 md:col-span-1 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0">
                                <p className="text-xs text-slate-500 mb-1">Financeiro</p>
                                <p className="text-xl md:text-2xl font-black text-slate-800">{data.margem_ebitda}%</p>
                                <p className="text-[10px] text-slate-600 font-bold">Margem EBITDA</p>
                            </div>
                            <div className="border-l border-slate-200">
                                <p className="text-xs text-slate-500 mb-1">Operacional</p>
                                <p className="text-xl md:text-2xl font-black text-slate-800">{data.taxa_no_show}%</p>
                                <p className="text-[10px] text-red-600 font-bold">No-Show</p>
                            </div>
                            <div className="border-l border-slate-200">
                                <p className="text-xs text-slate-500 mb-1">Produção</p>
                                <p className="text-xl md:text-2xl font-black text-slate-800">
                                    {new Intl.NumberFormat('pt-BR', { notation: 'compact', style: 'currency', currency: 'BRL' }).format(data.valor_producao_total)}
                                </p>
                                <p className="text-[10px] text-slate-600 font-bold">Realizada</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Financial Section */}
                {(activeTab === 'ALL' || activeTab === 'FINANCIAL') && (
                    <div className="mb-8 break-inside-avoid">
                        <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
                            <DollarSign className="text-slate-800" size={24} />
                            <h2 className="text-xl font-bold text-slate-800">Auditoria Financeira</h2>
                        </div>

                        <table className="w-full text-sm">
                            <tbody className="divide-y divide-slate-100">
                                <tr className="bg-slate-50">
                                    <td className="py-3 px-4 font-bold text-slate-700">Faturamento Realizado</td>
                                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.faturamento_realizado)}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="py-3 px-4 text-slate-600">(-) Despesas Totais</td>
                                    <td className="py-3 px-4 text-right font-mono text-red-600">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.despesas_totais)}
                                    </td>
                                </tr>
                                <tr className="bg-slate-100 print:bg-slate-50">
                                    <td className="py-3 px-4 font-black text-slate-800 uppercase">Resultado Líquido</td>
                                    <td className="py-3 px-4 text-right font-mono font-black text-blue-600 text-lg">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.resultado_liquido)}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="py-3 px-4 text-slate-600">Margem EBITDA</td>
                                    <td className="py-3 px-4 text-right">
                                        <StatusBadge value={data.margem_ebitda} type="PERCENT" />
                                    </td>
                                </tr>
                                <tr>
                                    <td className="py-3 px-4 text-slate-600">Inadimplência Total</td>
                                    <td className="py-3 px-4 text-right font-mono text-red-500">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.inadimplencia_total)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Commercial Section */}
                {(activeTab === 'ALL' || activeTab === 'MARKETING') && (
                    <div className="mb-8 break-inside-avoid">
                        <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
                            <TrendingUp className="text-slate-800" size={24} />
                            <h2 className="text-xl font-bold text-slate-800">Performance Comercial</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <table className="w-full text-sm">
                                <thead className="text-xs text-slate-400 uppercase font-bold text-left">
                                    <tr><th className="pb-2">KPI Marketing</th><th className="pb-2 text-right">Valor</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    <tr>
                                        <td className="py-2 text-slate-600">Total Leads</td>
                                        <td className="py-2 text-right font-bold">{data.total_leads}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 text-slate-600">Taxa Qualificação</td>
                                        <td className="py-2 text-right">{data.taxa_qualificacao}%</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 text-slate-600">Pipeline</td>
                                        <td className="py-2 text-right font-mono">
                                            {new Intl.NumberFormat('pt-BR', { notation: 'compact', style: 'currency', currency: 'BRL' }).format(data.valor_pipeline)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            <table className="w-full text-sm">
                                <thead className="text-xs text-slate-400 uppercase font-bold text-left">
                                    <tr><th className="pb-2">KPI Vendas</th><th className="pb-2 text-right">Valor</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    <tr>
                                        <td className="py-2 text-slate-600">Ticket Médio</td>
                                        <td className="py-2 text-right">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.ticket_medio)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 text-slate-600">Conversão</td>
                                        <td className="py-2 text-right font-bold text-green-600">{data.taxa_conversao_orcamentos}%</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 text-slate-600">LTV Médio</td>
                                        <td className="py-2 text-right">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.ltv_medio)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* CEO Checklist Section */}
                {activeTab === 'CEO' && (
                    <div className="mb-8 break-inside-avoid">
                        <div className="flex items-center gap-2 mb-6 border-b-2 border-slate-900 pb-4">
                            <Activity className="text-slate-900" size={32} />
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 uppercase">Checklist de Auditoria Mensal</h2>
                                <p className="text-sm text-slate-500 font-medium">Protocolo de Governança 2026 • Executar todo dia 01</p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            {/* Bloco 1 */}
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <span className="bg-slate-800 text-white w-6 h-6 rounded flex items-center justify-center text-xs">1</span>
                                    Saúde Financeira (O Combustível)
                                </h3>
                                <ul className="space-y-3 pl-8">
                                    <li className="flex items-start gap-3">
                                        <div className="w-4 h-4 rounded border-2 border-slate-400 mt-1"></div>
                                        <div>
                                            <span className="font-bold text-slate-700">Faturamento vs Meta (+30%)</span>
                                            <p className="text-xs text-slate-500">Abaixo da meta? "War Room" imediata com vendas.</p>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-4 h-4 rounded border-2 border-slate-400 mt-1"></div>
                                        <div>
                                            <span className="font-bold text-slate-700">Margem EBITDA ({`> 25%`})</span>
                                            <p className="text-xs text-slate-500">Atual: <span className="font-bold text-slate-900">{data.margem_ebitda}%</span>. Se &lt; 20%, auditar custos.</p>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-4 h-4 rounded border-2 border-slate-400 mt-1"></div>
                                        <div>
                                            <span className="font-bold text-slate-700">Ponto de Equilíbrio (Breakeven)</span>
                                            <p className="text-xs text-slate-500">Passou do dia 20? Cortar gastos não-essenciais.</p>
                                        </div>
                                    </li>
                                </ul>
                            </div>

                            {/* Bloco 2 */}
                            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                                <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                                    <span className="bg-blue-600 text-white w-6 h-6 rounded flex items-center justify-center text-xs">2</span>
                                    Máquina de Vendas (O Motor)
                                </h3>
                                <ul className="space-y-3 pl-8">
                                    <li className="flex items-start gap-3">
                                        <div className="w-4 h-4 rounded border-2 border-blue-300 mt-1"></div>
                                        <div>
                                            <span className="font-bold text-blue-800">Conversão High-Ticket ({`> 30%`})</span>
                                            <p className="text-xs text-blue-600">Atual: <span className="font-bold">{data.taxa_conversao_orcamentos}%</span>. Auditar leads perdidos &gt; 15k.</p>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-4 h-4 rounded border-2 border-blue-300 mt-1"></div>
                                        <div>
                                            <span className="font-bold text-blue-800">Qualidade de Leads (CPL)</span>
                                            <p className="text-xs text-blue-600">Abaixo de 50% de qualificação? Ajustar público para 'Lookalike VIP'.</p>
                                        </div>
                                    </li>
                                </ul>
                            </div>

                            {/* Bloco 3 */}
                            <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100">
                                <h3 className="text-lg font-bold text-emerald-900 mb-4 flex items-center gap-2">
                                    <span className="bg-emerald-600 text-white w-6 h-6 rounded flex items-center justify-center text-xs">3</span>
                                    Eficiência Operacional (A Engrenagem)
                                </h3>
                                <ul className="space-y-3 pl-8">
                                    <li className="flex items-start gap-3">
                                        <div className="w-4 h-4 rounded border-2 border-emerald-300 mt-1"></div>
                                        <div>
                                            <span className="font-bold text-emerald-800">Ocupação da Cadeira ({`> 85%`})</span>
                                            <p className="text-xs text-emerald-600">Se &lt; 70%, ativar 'Encaixe Express'.</p>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-4 h-4 rounded border-2 border-emerald-300 mt-1"></div>
                                        <div>
                                            <span className="font-bold text-emerald-800">Performance Profissional</span>
                                            <p className="text-xs text-emerald-600">Verificar alerta no BOS. Ticket &lt; Média = Treinamento.</p>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="mt-12 border-t-2 border-slate-300 pt-8 flex gap-8">
                            <div className="flex-1">
                                <p className="text-sm font-bold text-slate-400 uppercase mb-8">Assinatura CEO</p>
                                <div className="border-b border-slate-900 w-full"></div>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-slate-400 uppercase mb-8">Data da Auditoria</p>
                                <div className="border-b border-slate-900 w-full"></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="absolute bottom-10 left-[20mm] right-[20mm] text-center border-t border-slate-100 pt-4 print:block hidden">
                    <p className="text-xs text-slate-400">Documento gerado eletronicamente pelo sistema BOS (Business Operating System). A autenticidade pode ser verificada no Intelligence Gateway.</p>
                </div>

            </div>
        </div>
    );
};

export default Reports;
