import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../src/lib/supabase';
import {
    FileText, Calendar, Users, AlertCircle, CheckCircle, DollarSign, Clock,
    Filter, Download, Search, RefreshCw, Smartphone, ArrowUpRight, BarChart2,
    CalendarDays, Power
} from 'lucide-react';
import * as XLSX from 'xlsx';

// --- TYPES FOR RADAR 7.0 ---
type EntityType = 'Pacientes' | 'Orçamentos' | 'Financeiro' | 'Leads' | 'Comissões' | 'Produção' | 'Operacional' | 'Todos';
type CategoryType = 'all' | 'Cirurgias Estéticas da Face' | 'Harmonização Facial' | 'Implantodontia' | 'Ortodontia' | 'Clínica Geral' | 'Marketing' | 'Comercial' | 'Clínico' | 'Financeiro' | 'Operacional' | string;
type OriginType = 'all' | 'Instagram' | 'Google Ads' | 'Indicação' | 'Facebook' | 'Orgânico' | 'WhatsApp';

const Reports: React.FC = () => {
    // Basic data hooks - in a real "Big Data" scenario we would fetch based on filters
    const { patients, appointments, leads, globalFinancials, expenses = [] } = useData();
    const { profile, updateProfileSettings } = useAuth();

    // --- STATE ---
    const [entity, setEntity] = useState<EntityType>('Orçamentos');
    const [viewData, setViewData] = useState<any[]>([]);
    const [isLoadingView, setIsLoadingView] = useState(false);
    const [insights, setInsights] = useState<any[]>([]);
    const [isLoadingInsights, setIsLoadingInsights] = useState(false);

    // --- FETCH AI INSIGHTS ---
    useEffect(() => {
        const fetchInsights = async () => {
            setIsLoadingInsights(true);
            const { data } = await supabase
                .from('ai_insights')
                .select('*')
                .eq('status', 'open')
                .order('created_at', { ascending: false });

            if (data) {
                // Sort by priority manually if needed, or rely on DB
                const priorityOrder: any = { 'high': 3, 'medium': 2, 'low': 1 };
                const sorted = data.sort((a, b) => (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0));
                setInsights(sorted);
            }
            setIsLoadingInsights(false);
        };
        fetchInsights();
    }, [entity]); // Refresh on context switch

    // --- INTELLIGENCE CENTER: FETCH FROM VIEWS ---
    useEffect(() => {
        const fetchViewData = async () => {
            let viewName = '';
            switch (entity) {
                case 'Todos': viewName = 'view_radar_360'; break;
                case 'Produção': viewName = 'view_radar_producao'; break;
                case 'Financeiro': viewName = 'view_radar_financeiro'; break;
                case 'Orçamentos': viewName = 'view_radar_comercial'; break;
                case 'Operacional': viewName = 'view_radar_operacional'; break;
                default: setViewData([]); return;
            }

            setIsLoadingView(true);
            const { data, error } = await supabase.from(viewName).select('*').order('data_referencia', { ascending: false });

            if (error) {
                console.error('Error fetching Intelligence View:', viewName, error);
                setViewData([]); // Fallback to client-side logic
            } else {
                // MAP VIEW COLUMNS TO UI
                const mapped = data?.map(item => ({
                    id: item.production_id || item.transaction_id || item.budget_id || Math.random().toString(),
                    entity: item.departamento || entity,
                    description: item.descricao || item.description || item.procedure_name || 'Item',
                    patientName: item.paciente || item.description, // Fallback
                    status: item.status || item.status_clinico || item.kpi_status,
                    value: item.valor || item.montante || item.montante_bruto || item.amount || 0,
                    date: item.data_referencia,
                    professional: item.profissional || 'Sistema',
                    category: item.unidade_negocio || 'Geral',
                    origin: item.origem || 'N/A',
                    rawDate: new Date(item.data_referencia).getTime()
                })) || [];
                setViewData(mapped);
            }
            setIsLoadingView(false);
        };

        fetchViewData();
    }, [entity]);
    const [category, setCategory] = useState<CategoryType>('all');
    const [professional, setProfessional] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [origin, setOrigin] = useState<OriginType>('all');

    // Date Filters (Defaults to current month)
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]);

    const [searchTerm, setSearchTerm] = useState('');

    // --- MOCK PROFESSIONALS (Should come from DB) ---
    const professionals = ['Dr. Marcelo', 'Dra. Filha', 'Dr. Associado 1'];

    // --- FILTER ENGINE (7 LEVELS) ---
    const filteredData = useMemo(() => {
        let data: any[] = [];
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();

        // 1. PREFER INTELLIGENCE VIEW DATA (SERVER-SIDE)
        if (viewData && viewData.length > 0) {
            data = viewData;
        } else {
            // 2. FALLBACK TO LEGACY CLIENT-SIDE MAPPING
            if (entity === 'Orçamentos') {
                data = patients.flatMap(p => p.budgets?.map(b => ({
                    id: b.id,
                    entity: 'Orçamento',
                    description: `Orçamento #${b.id.substr(0, 4)} - ${p.name}`,
                    patientName: p.name,
                    phone: p.phone,
                    origin: p.origin || 'Não Informado',
                    category: b.categoryId || 'Clínica Geral',
                    professional: b.doctorName || 'Não Informado', // Mock joining simple string
                    status: b.status,
                    value: b.totalValue, // Gross Value
                    cost: 0, // Would need procedure_costs join
                    date: b.createdAt,
                    rawDate: new Date(b.createdAt).getTime()
                })) || []);
            }
            else if (entity === 'Produção') {
                data = patients.flatMap(p => p.treatments?.map(t => {
                    // Financial Cross-Check logic
                    let derivedStatus = 'Não Iniciado';
                    const isPaid = p.balance_due <= 0;

                    if (t.status === 'Concluído') {
                        derivedStatus = isPaid ? 'Concluído (Pago)' : 'Concluído (Inadimplente)';
                    } else if (t.status === 'Em Andamento') {
                        derivedStatus = 'Em Andamento';
                    } else {
                        derivedStatus = isPaid ? 'Pendente (Pago)' : 'Pendente (Inadimplente)';
                    }

                    return {
                        id: t.id,
                        entity: 'Produção',
                        description: `${t.procedure} (${t.region}) - ${p.name}`,
                        patientName: p.name,
                        phone: p.phone,
                        origin: p.origin || 'Não Informado',
                        category: 'Clínica Geral', // Need to map procedure to category in real DB
                        professional: t.doctorName || 'Não Informado',
                        status: derivedStatus,
                        value: 0,
                        date: t.executionDate || p.created_at,
                        rawDate: new Date(t.executionDate || p.created_at).getTime()
                    };
                }) || []);
            }
            else if (entity === 'Pacientes') {
                data = patients.map(p => {
                    // Determine inactivity based on last appointment
                    const lastAppt = appointments
                        .filter(a => a.patientId === p.id)
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                    const lastDate = lastAppt ? new Date(lastAppt.date).getTime() : 0;

                    return {
                        id: p.id,
                        entity: 'Paciente',
                        description: p.name,
                        patientName: p.name,
                        phone: p.phone,
                        origin: p.origin || 'Não Informado',
                        category: p.budgets?.[0]?.categoryId || 'Clínica Geral',
                        professional: lastAppt?.doctorName || 'Todos',
                        status: p.status, // "Em Tratamento", etc.
                        date: p.created_at, // Cadastro date
                        lastVisit: lastDate,
                        value: p.total_approved || 0,
                        rawDate: new Date(p.created_at).getTime()
                    };
                });
            }
            else if (entity === 'Financeiro') {
                // Transactions (Received) + Expenses (Paid)
                // Simplified to Transactions for Revenue Analysis
                data = globalFinancials.map(f => ({
                    id: f.id,
                    entity: f.type === 'income' ? 'Receita' : 'Despesa',
                    description: f.description,
                    category: f.category,
                    professional: 'Todos', // Financial often generic unless split
                    status: f.status,
                    origin: 'Não Informado',
                    value: f.amount,
                    date: f.date,
                    rawDate: new Date(f.date).getTime()
                }));
            }
            else if (entity === 'Leads') {
                data = leads.map(l => ({
                    id: l.id,
                    entity: 'Lead',
                    description: `${l.name} - ${l.status}`,
                    patientName: l.name,
                    phone: l.phone,
                    origin: l.source,
                    category: 'Clínica Geral',
                    professional: 'Todos',
                    status: l.status,
                    value: 0,
                    date: l.createdAt,
                    rawDate: new Date(l.createdAt).getTime()
                }));
            }
            else if (entity === 'Operacional') {
                data = appointments.map(a => ({
                    id: a.id,
                    entity: 'Agenda',
                    description: `${a.type} - ${a.patientName}`,
                    patientName: a.patientName,
                    phone: 'N/A', // Usually appointment obj has patientId, need to lookup if phone needed, simplified for now
                    origin: 'Não Informado',
                    category: 'Clínica Geral',
                    professional: a.doctorName,
                    status: a.status, // "Confirmado", "Faltou", etc.
                    value: 0,
                    date: a.date,
                    rawDate: new Date(a.date).getTime()
                }));
            }
            else if (entity === 'Todos') {
                // UNION of all critical events
                const budgetsData = patients.flatMap(p => p.budgets?.map(b => ({
                    id: b.id,
                    entity: 'Venda',
                    description: `Orçamento Aprovado #${b.id.substr(0, 4)}`,
                    patientName: p.name,
                    phone: p.phone,
                    origin: p.origin || 'Não Informado',
                    category: b.categoryId || 'Clínica Geral',
                    professional: b.doctorName || 'Não Informado',
                    status: b.status,
                    value: b.totalValue,
                    date: b.createdAt,
                    rawDate: new Date(b.createdAt).getTime()
                })) || []);

                const financialData = globalFinancials.map(f => ({
                    id: f.id,
                    entity: f.type === 'income' ? 'Receita' : 'Despesa',
                    description: f.description,
                    category: f.category,
                    professional: 'Todos',
                    status: f.status,
                    origin: 'Não Informado',
                    value: f.amount,
                    date: f.date,
                    rawDate: new Date(f.date).getTime()
                    // Assuming patientName is undefined for generic financials
                }));

                const agendaData = appointments.map(a => ({
                    id: a.id,
                    entity: 'Agenda',
                    description: `${a.type} - ${a.patientName}`,
                    patientName: a.patientName,
                    category: 'Clínica Geral',
                    professional: a.doctorName,
                    status: a.status,
                    value: 0,
                    date: a.date,
                    rawDate: new Date(a.date).getTime(),
                    origin: 'Não Informado'
                }));

                // Combine and Sort
                data = [...budgetsData, ...financialData, ...agendaData].sort((a, b) => b.rawDate - a.rawDate);
            }
        }

        // --- APPLY FILTERS ---
        return data.filter(item => {
            // 2. CATEGORY
            if (category !== 'all' && item.category !== category) return false;

            // 3. PROFESSIONAL
            if (professional !== 'all' && item.professional !== professional) return false;

            // 4. KPI/STATUS
            if (statusFilter !== 'all') {
                // Custom Logic for 'Churn' or specific KPIs could go here
                if (item.status !== statusFilter) return false;
            }

            // 5. ORIGIN
            if (origin !== 'all' && item.origin !== origin) return false;

            // 6 & 7. DATE RANGE
            if (startDate && item.rawDate < start) return false;
            if (endDate && item.rawDate > end) return false;

            // SEARCH
            const searchStr = searchTerm.toLowerCase();
            const nameMatch = item.patientName ? item.patientName.toLowerCase().includes(searchStr) : false;
            const descMatch = item.description ? item.description.toLowerCase().includes(searchStr) : false;
            if (searchTerm && !nameMatch && !descMatch) return false;

            return true;
        });
    }, [entity, category, professional, statusFilter, origin, startDate, endDate, searchTerm, patients, leads, globalFinancials, appointments]);

    // --- CARDS CALCULATIONS ---
    const metrics = useMemo(() => {
        if (entity === 'Todos') {
            const revenue = filteredData.filter(i => i.entity === 'Receita' && i.status === 'Pago').reduce((a, b) => a + (b.value || 0), 0);
            const budgetsCount = filteredData.filter(i => i.entity === 'Venda').length;
            const agendaCount = filteredData.filter(i => i.entity === 'Agenda' && i.status !== 'Cancelado').length;
            return {
                totalVal: revenue,
                avgTicket: budgetsCount, // Repurposed: Total Budgets
                margin: agendaCount,     // Repurposed: Agenda Volume
                count: filteredData.length
            };
        }

        const count = filteredData.length;
        const totalVal = filteredData.reduce((acc, item) => acc + (item.value || 0), 0);
        const avgTicket = count > 0 ? totalVal / count : 0;

        // Mock Margin (EBITDA) - in real app would sum (Income - Expenses)
        // Here we just take 30% of total as "Estimated Margin" for demo
        const margin = totalVal * 0.30;

        return { count, totalVal, avgTicket, margin };
    }, [filteredData, entity]);

    // --- DYNAMIC OPTIONS HELPERS (CONTEXTUAL FILTERS) ---
    const getCategoryOptions = () => {
        switch (entity) {
            case 'Todos': return ['Marketing', 'Comercial', 'Clínico', 'Financeiro', 'Operacional'];
            case 'Orçamentos': return ['Cirurgias Estéticas da Face', 'Harmonização Facial', 'Implantodontia', 'Ortodontia', 'Clínica Geral'];
            case 'Produção': return ['Cirurgias Estéticas da Face', 'Harmonização Facial', 'Implantodontia', 'Ortodontia', 'Clínica Geral'];
            case 'Pacientes': return ['Novo Paciente', 'Recorrente', 'Indicação', 'VIP (High-Ticket)'];
            case 'Financeiro': return ['Receitas', 'Despesas Fixas', 'Despesas Variáveis', 'Impostos', 'Laboratório', 'Pessoal'];
            case 'Leads': return ['Instagram', 'Google Ads', 'Indicação', 'Facebook', 'Orgânico', 'WhatsApp'];
            case 'Operacional': return ['Consultório 1', 'Consultório 2', 'Sala de Cirurgia'];
            default: return [];
        }
    };

    const getStatusOptions = () => {
        // Dynamic status for 360 view based on selected Department (Category)
        if (entity === 'Todos' && category === 'Operacional') {
            return ['Taxa de No-Show', 'Ocupação de Agenda', 'Status de Agendamentos'];
        }

        switch (entity) {
            case 'Todos': return ['Saúde do Negócio', 'Faturamento', 'Conversão', 'Novos Pacientes'];
            case 'Orçamentos': return ['Em Análise', 'Aprovado', 'Reprovado', 'Em Negociação', 'Perdido por Preço'];
            case 'Produção': return ['Concluído (Pago)', 'Concluído (Inadimplente)', 'Pendente (Pago)', 'Pendente (Inadimplente)', 'Em Andamento'];
            case 'Pacientes': return ['Em Tratamento', 'Finalizado', 'Manutenção', 'Arquivo', 'Churn'];
            case 'Financeiro': return ['Pago', 'Pendente', 'Atrasado', 'Conciliado'];
            case 'Leads': return ['Nova Oportunidade', 'Em Contato', 'Qualificação', 'Avaliação Agendada', 'Negociação', 'Aprovado', 'Perdido'];
            case 'Operacional': return ['Confirmado', 'Pendente', 'Concluído', 'Cancelado', 'Faltou'];
            default: return [];
        }
    };

    const handleInsightAction = (insight: any) => {
        // Deep Links Logic
        const routes: Record<string, string> = {
            'COMERCIAL': '/dashboard/orcamentos',
            'FINANCEIRO': '/dashboard/financeiro',
            'OPERACIONAL': '/dashboard/agenda',
            'PRODUÇÃO': '/dashboard/pacientes',
            'MARKETING': '/dashboard/leads'
        };

        const basePath = routes[insight.category] || '/dashboard';
        const targetUrl = `${basePath}?ref=${insight.related_entity_id}&action=${insight.action_type}`;

        // Simulação
        alert(`🚀 BOS Action Triggered!\n\nCategoria: ${insight.category}\nAção: ${insight.action_label}\nDestino: ${targetUrl}`);
        // window.location.href = targetUrl;
    };

    const exportExcel = () => {
        const ws = XLSX.utils.json_to_sheet(filteredData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Radar_Dados_7.0");
        XLSX.writeFile(wb, `Radar_${entity}_${startDate}_${endDate}.xlsx`);
    };

    return (
        <div className="space-y-6 pb-20 md:pb-0 animate-in fade-in">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <BarChart2 className="text-blue-600 dark:text-blue-400" />
                        Radar de Dados 7.0
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Inteligência Preditiva: Cruzamento de 7 Eixos (Marketing, Clínico, Financeiro).</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={exportExcel} className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors text-sm font-bold">
                        <Download size={16} /> Excel
                    </button>
                    <button
                        onClick={() => {
                            setCategory('all'); setStatusFilter('all'); setOrigin('all'); setProfessional('all');
                            setSearchTerm('');
                        }}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Resetar Filtros"
                    >
                        <RefreshCw size={20} />
                    </button>
                </div>
            </div>

            {/* DATE RANGE BAR (FILTERS 6 & 7) */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row items-center gap-4">
                <div className="flex items-center gap-2 text-primary-700 dark:text-primary-400 font-bold uppercase text-xs">
                    <CalendarDays size={18} />
                    <span>Período de Análise:</span>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                    />
                    <span className="text-gray-400">até</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                    />
                </div>
            </div>

            {/* 4 BI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-4 rounded-xl text-white shadow-lg">
                    <p className="text-blue-100 text-xs font-bold uppercase mb-1">
                        {entity === 'Todos' && category === 'Operacional'
                            ? 'Taxa de Ocupação (%)'
                            : entity === 'Todos' ? 'Faturamento Realizado' : 'Volume Financeiro'}
                    </p>
                    <h3 className="text-2xl font-bold">
                        {entity === 'Todos' && category === 'Operacional'
                            ? '85%' // Mock occupancy for now until metrics updated
                            : `R$ ${metrics.totalVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    </h3>
                    <p className="text-xs text-blue-200 mt-1">{metrics.count} registros</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase mb-1">{entity === 'Todos' ? 'Novos Orçamentos' : 'Ticket Médio (Filtro)'}</p>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                        {entity === 'Todos'
                            ? metrics.avgTicket
                            : `R$ ${metrics.avgTicket.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`}
                    </h3>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase mb-1">{entity === 'Todos' ? 'Volume Agenda' : 'Margem Est. (30%)'}</p>
                    <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {entity === 'Todos'
                            ? metrics.margin
                            : `R$ ${metrics.margin.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`}
                    </h3>
                </div>
                {/* ROI simplified as Conversion based on Entity type */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase mb-1">{entity === 'Todos' ? 'Geral 360' : 'ROI / Conversão'}</p>
                    <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {entity === 'Orçamentos' ? 'N/A' : (entity === 'Todos' ? 'Ativo' : '-%')}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">Depende de Custos Ads</p>
                </div>
            </div>

            {/* 5-LEVEL FILTER PANEL */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6">

                    {/* LEVEL 1: ENTITY */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">1. Entidade (Visão)</label>
                        <select
                            value={entity}
                            onChange={(e) => { setEntity(e.target.value as EntityType); setStatusFilter('all'); }}
                            className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="Orçamentos">Comercial (Orçamentos)</option>
                            <option value="Produção">Clínico (Produção)</option>
                            <option value="Pacientes">Clínico (Pacientes)</option>
                            <option value="Financeiro">Financeiro (Caixa)</option>
                            <option value="Leads">Marketing (Leads)</option>
                            <option value="Operacional">Operacional (Agenda)</option>
                            <option value="Todos">Visão Executiva 360º</option>
                        </select>
                    </div>

                    {/* LEVEL 2: CATEGORY / UNIT */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">
                            {entity === 'Todos' ? '2. Departamento (Visão)' : '2. Unidade de Negócio (Categoria)'}
                        </label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value as CategoryType)}
                            className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm outline-none"
                        >
                            <option value="all">Todas</option>
                            {getCategoryOptions().map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>

                    {/* LEVEL 3: PROFESSIONAL */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">3. Profissional</label>
                        <select
                            value={professional}
                            onChange={(e) => setProfessional(e.target.value)}
                            className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm outline-none"
                        >
                            <option value="all">Todos os Doutores</option>
                            {professionals.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>

                    {/* LEVEL 4: KPI / STATUS */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">
                            {entity === 'Todos' ? '4. Indicador de Saúde (KPI)' : '4. KPI / Status'}
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm outline-none"
                        >
                            <option value="all">Status Geral</option>
                            {getStatusOptions().map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>

                    {/* LEVEL 5: ORIGIN */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">5. Origem (Canal Marketing)</label>
                        <select
                            value={origin}
                            onChange={(e) => setOrigin(e.target.value as OriginType)}
                            className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm outline-none"
                        >
                            <option value="all">Todos os Canais</option>
                            <option>Instagram</option>
                            <option>Google Ads</option>
                            <option>Facebook</option>
                            <option>Indicação</option>
                            <option>WhatsApp</option>
                            <option>Orgânico</option>
                        </select>
                    </div>

                    {/* SEARCH */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Busca Específica</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Nome, Descrição..."
                                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm outline-none"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        </div>
                    </div>
                </div>
            </div>

            {/* RESULTS TABLE */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Data</th>
                                <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Descrição / Paciente</th>
                                <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Profissional</th>
                                <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Categoria</th>
                                <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Origem</th>
                                <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">KPI</th>
                                <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400 text-right">Montante</th>
                                <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400 text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {filteredData.length > 0 ? (
                                filteredData.map((item, idx) => (
                                    <tr key={item.id || idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 text-gray-500 text-xs">
                                            {item.date && !isNaN(new Date(item.date).getTime())
                                                ? new Date(item.date).toLocaleDateString('pt-BR')
                                                : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-gray-900 dark:text-white">{item.description || item.patientName}</p>
                                            {item.phone && <p className="text-xs text-gray-500">{item.phone}</p>}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                            {item.professional}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                            <span className="inline-flex px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                                                {item.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300 text-xs">
                                            {item.origin}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                                ${['Aprovado', 'Pago', 'Finalizado', 'Adimplente', 'Concluído (Pago)', 'Pendente (Pago)'].includes(item.status) ? 'bg-green-100 text-green-800' :
                                                    ['Pendente', 'Em Análise', 'Em Tratamento', 'Produção em Curso', 'Em Andamento'].includes(item.status) ? 'bg-yellow-100 text-yellow-800' :
                                                        ['Atrasado', 'Perdido', 'Inadimplente - Risco', 'Concluído (Inadimplente)', 'Pendente (Inadimplente)', 'Pendente (Débito)'].includes(item.status) ? 'bg-red-100 text-red-800' :
                                                            'bg-gray-100 text-gray-800'}
                                            `}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">
                                            R$ {item.value?.toLocaleString('pt-BR')}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {item.phone && (
                                                <a
                                                    href={`https://wa.me/55${item.phone.replace(/\D/g, '')}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-bold text-xs"
                                                >
                                                    <Smartphone size={16} /> Zap
                                                </a>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">
                                        <Filter size={32} className="mx-auto mb-2 opacity-50" />
                                        <p>Sem dados nesta seleção do Radar.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Reports;
