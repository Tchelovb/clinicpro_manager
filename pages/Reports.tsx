import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../src/lib/supabase';
import {
    Search, Filter, Download, Printer, ChevronDown, ChevronRight,
    FileText, DollarSign, Users, TrendingUp, Calendar, X, Loader2,
    ArrowUpDown, Eye, AlertCircle, CheckCircle
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../components/ui/sheet';
import toast from 'react-hot-toast';

// ============================================
// CONFIGURATION SCHEMA - The "BI Brain"
// ============================================
interface FilterConfig {
    id: string;
    label: string;
    type: 'text' | 'select' | 'date' | 'daterange' | 'number';
    options?: { value: string; label: string }[];
    placeholder?: string;
}

interface DataSource {
    id: string;
    label: string;
    table: string;
    columns: { key: string; label: string; type?: 'currency' | 'date' | 'status' | 'text' }[];
    filters: FilterConfig[];
    defaultSort?: string;
}

interface Pillar {
    id: string;
    label: string;
    icon: any;
    color: string;
    sources: DataSource[];
}

const REPORT_CONFIG: Pillar[] = [
    {
        id: 'FINANCIAL',
        label: 'Financeiro',
        icon: DollarSign,
        color: 'blue',
        sources: [
            {
                id: 'receivables',
                label: 'Contas a Receber (Parcelas)',
                table: 'financial_installments',
                columns: [
                    { key: 'due_date', label: 'Vencimento', type: 'date' },
                    { key: 'patient_name', label: 'Paciente' },
                    { key: 'description', label: 'Descrição' },
                    { key: 'amount', label: 'Valor', type: 'currency' },
                    { key: 'amount_paid', label: 'Pago', type: 'currency' },
                    { key: 'status', label: 'Status', type: 'status' },
                    { key: 'payment_method', label: 'Forma' }
                ],
                filters: [
                    {
                        id: 'status', label: 'Status', type: 'select', options: [
                            { value: 'PENDING', label: 'Pendente' },
                            { value: 'PAID', label: 'Pago' },
                            { value: 'OVERDUE', label: 'Atrasado' },
                            { value: 'PARTIAL', label: 'Parcial' }
                        ]
                    },
                    { id: 'due_date_start', label: 'Vencimento (De)', type: 'date' },
                    { id: 'due_date_end', label: 'Vencimento (Até)', type: 'date' },
                    { id: 'patient_name', label: 'Paciente', type: 'text', placeholder: 'Nome do paciente...' },
                    { id: 'min_amount', label: 'Valor Mínimo', type: 'number' }
                ],
                defaultSort: 'due_date'
            },
            {
                id: 'payables',
                label: 'Contas a Pagar (Despesas)',
                table: 'expenses',
                columns: [
                    { key: 'due_date', label: 'Vencimento', type: 'date' },
                    { key: 'provider', label: 'Fornecedor' },
                    { key: 'description', label: 'Descrição' },
                    { key: 'category', label: 'Categoria' },
                    { key: 'amount', label: 'Valor', type: 'currency' },
                    { key: 'status', label: 'Status', type: 'status' }
                ],
                filters: [
                    {
                        id: 'status', label: 'Status', type: 'select', options: [
                            { value: 'PENDING', label: 'Pendente' },
                            { value: 'PAID', label: 'Pago' }
                        ]
                    },
                    { id: 'due_date_start', label: 'Vencimento (De)', type: 'date' },
                    { id: 'due_date_end', label: 'Vencimento (Até)', type: 'date' },
                    { id: 'provider', label: 'Fornecedor', type: 'text', placeholder: 'Nome do fornecedor...' },
                    { id: 'category', label: 'Categoria', type: 'text' }
                ],
                defaultSort: 'due_date'
            },
            {
                id: 'transactions',
                label: 'Fluxo de Caixa (Realizado)',
                table: 'transactions',
                columns: [
                    { key: 'date', label: 'Data', type: 'date' },
                    { key: 'description', label: 'Descrição' },
                    { key: 'type', label: 'Tipo' },
                    { key: 'category', label: 'Categoria' },
                    { key: 'amount', label: 'Valor', type: 'currency' },
                    { key: 'payment_method', label: 'Forma' }
                ],
                filters: [
                    {
                        id: 'type', label: 'Tipo', type: 'select', options: [
                            { value: 'INCOME', label: 'Entrada' },
                            { value: 'EXPENSE', label: 'Saída' }
                        ]
                    },
                    { id: 'date_start', label: 'Data (De)', type: 'date' },
                    { id: 'date_end', label: 'Data (Até)', type: 'date' },
                    { id: 'category', label: 'Categoria', type: 'text' },
                    { id: 'payment_method', label: 'Forma de Pagamento', type: 'text' }
                ],
                defaultSort: 'date'
            }
        ]
    },
    {
        id: 'COMMERCIAL',
        label: 'Comercial',
        icon: TrendingUp,
        color: 'violet',
        sources: [
            {
                id: 'leads',
                label: 'Leads (Pipeline)',
                table: 'leads',
                columns: [
                    { key: 'name', label: 'Nome' },
                    { key: 'phone', label: 'Telefone' },
                    { key: 'source', label: 'Origem' },
                    { key: 'status', label: 'Status', type: 'status' },
                    { key: 'value', label: 'Valor', type: 'currency' },
                    { key: 'created_at', label: 'Criado em', type: 'date' }
                ],
                filters: [
                    {
                        id: 'status', label: 'Status', type: 'select', options: [
                            { value: 'NEW', label: 'Novo' },
                            { value: 'CONTACTED', label: 'Contatado' },
                            { value: 'QUALIFIED', label: 'Qualificado' },
                            { value: 'WON', label: 'Ganho' },
                            { value: 'LOST', label: 'Perdido' }
                        ]
                    },
                    { id: 'source', label: 'Origem', type: 'text', placeholder: 'Instagram, Google...' },
                    { id: 'created_start', label: 'Criado (De)', type: 'date' },
                    { id: 'created_end', label: 'Criado (Até)', type: 'date' },
                    { id: 'min_value', label: 'Valor Mínimo', type: 'number' }
                ],
                defaultSort: 'created_at'
            },
            {
                id: 'budgets',
                label: 'Orçamentos',
                table: 'budgets',
                columns: [
                    { key: 'patient_name', label: 'Paciente' },
                    { key: 'status', label: 'Status', type: 'status' },
                    { key: 'total_value', label: 'Valor Total', type: 'currency' },
                    { key: 'final_value', label: 'Valor Final', type: 'currency' },
                    { key: 'discount', label: 'Desconto', type: 'currency' },
                    { key: 'created_at', label: 'Criado em', type: 'date' }
                ],
                filters: [
                    {
                        id: 'status', label: 'Status', type: 'select', options: [
                            { value: 'DRAFT', label: 'Rascunho' },
                            { value: 'SENT', label: 'Enviado' },
                            { value: 'APPROVED', label: 'Aprovado' },
                            { value: 'REJECTED', label: 'Rejeitado' }
                        ]
                    },
                    { id: 'created_start', label: 'Criado (De)', type: 'date' },
                    { id: 'created_end', label: 'Criado (Até)', type: 'date' },
                    { id: 'min_value', label: 'Valor Mínimo', type: 'number' }
                ],
                defaultSort: 'created_at'
            }
        ]
    },
    {
        id: 'PATIENTS',
        label: 'Pacientes',
        icon: Users,
        color: 'green',
        sources: [
            {
                id: 'patients',
                label: 'Base de Pacientes',
                table: 'patients',
                columns: [
                    { key: 'name', label: 'Nome' },
                    { key: 'phone', label: 'Telefone' },
                    { key: 'email', label: 'Email' },
                    { key: 'birth_date', label: 'Nascimento', type: 'date' },
                    { key: 'clinical_status', label: 'Status Clínico' },
                    { key: 'created_at', label: 'Cadastro', type: 'date' }
                ],
                filters: [
                    { id: 'name', label: 'Nome', type: 'text', placeholder: 'Nome do paciente...' },
                    { id: 'phone', label: 'Telefone', type: 'text' },
                    { id: 'clinical_status', label: 'Status Clínico', type: 'text' },
                    {
                        id: 'birth_month', label: 'Mês de Aniversário', type: 'select', options: [
                            { value: '01', label: 'Janeiro' },
                            { value: '02', label: 'Fevereiro' },
                            { value: '03', label: 'Março' },
                            { value: '04', label: 'Abril' },
                            { value: '05', label: 'Maio' },
                            { value: '06', label: 'Junho' },
                            { value: '07', label: 'Julho' },
                            { value: '08', label: 'Agosto' },
                            { value: '09', label: 'Setembro' },
                            { value: '10', label: 'Outubro' },
                            { value: '11', label: 'Novembro' },
                            { value: '12', label: 'Dezembro' }
                        ]
                    }
                ],
                defaultSort: 'name'
            },
            {
                id: 'appointments',
                label: 'Agendamentos',
                table: 'appointments',
                columns: [
                    { key: 'date', label: 'Data/Hora', type: 'date' },
                    { key: 'patient_name', label: 'Paciente' },
                    { key: 'doctor_name', label: 'Profissional' },
                    { key: 'type', label: 'Tipo' },
                    { key: 'status', label: 'Status', type: 'status' }
                ],
                filters: [
                    {
                        id: 'status', label: 'Status', type: 'select', options: [
                            { value: 'PENDING', label: 'Pendente' },
                            { value: 'CONFIRMED', label: 'Confirmado' },
                            { value: 'COMPLETED', label: 'Realizado' },
                            { value: 'CANCELLED', label: 'Cancelado' },
                            { value: 'NO_SHOW', label: 'Faltou' }
                        ]
                    },
                    { id: 'date_start', label: 'Data (De)', type: 'date' },
                    { id: 'date_end', label: 'Data (Até)', type: 'date' },
                    { id: 'type', label: 'Tipo', type: 'text' }
                ],
                defaultSort: 'date'
            }
        ]
    }
];

// ============================================
// MAIN COMPONENT
// ============================================
const Reports: React.FC = () => {
    const { profile } = useAuth();
    const printRef = useRef<HTMLDivElement>(null);

    // State Management
    const [selectedPillar, setSelectedPillar] = useState<Pillar | null>(null);
    const [selectedSource, setSelectedSource] = useState<DataSource | null>(null);
    const [filters, setFilters] = useState<Record<string, any>>({});
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(50);
    const [sortBy, setSortBy] = useState<string>('');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Sheet State
    const [selectedRecord, setSelectedRecord] = useState<any>(null);
    const [sheetOpen, setSheetOpen] = useState(false);

    // Initialize with first pillar
    useEffect(() => {
        if (REPORT_CONFIG.length > 0) {
            setSelectedPillar(REPORT_CONFIG[0]);
            setSelectedSource(REPORT_CONFIG[0].sources[0]);
            setSortBy(REPORT_CONFIG[0].sources[0].defaultSort || '');
        }
    }, []);

    // Query Builder
    const buildQuery = () => {
        if (!selectedSource || !profile?.clinic_id) return null;

        let query = supabase
            .from(selectedSource.table)
            .select('*', { count: 'exact' })
            .eq('clinic_id', profile.clinic_id);

        // Apply Filters
        Object.entries(filters).forEach(([key, value]) => {
            if (!value) return;

            if (key.endsWith('_start')) {
                const field = key.replace('_start', '');
                query = query.gte(field, value);
            } else if (key.endsWith('_end')) {
                const field = key.replace('_end', '');
                query = query.lte(field, value);
            } else if (key.startsWith('min_')) {
                const field = key.replace('min_', '');
                query = query.gte(field, parseFloat(value));
            } else if (key === 'birth_month') {
                // Special case for birthday month
                query = query.ilike('birth_date', `%-${value}-%`);
            } else {
                // Text search or exact match
                if (typeof value === 'string' && !['PENDING', 'PAID', 'APPROVED'].includes(value)) {
                    query = query.ilike(key, `%${value}%`);
                } else {
                    query = query.eq(key, value);
                }
            }
        });

        // Sorting
        if (sortBy) {
            query = query.order(sortBy, { ascending: sortOrder === 'asc' });
        }

        // Pagination
        const from = (currentPage - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);

        return query;
    };

    // Execute Query
    const runQuery = async () => {
        const query = buildQuery();
        if (!query) return;

        setLoading(true);
        try {
            const { data, error, count } = await query;

            if (error) throw error;

            // Enrich data with related info (patient names, etc)
            const enrichedData = await enrichResults(data || []);

            setResults(enrichedData);
            setTotalCount(count || 0);
        } catch (error) {
            console.error('Query error:', error);
            toast.error('Erro ao executar consulta');
        } finally {
            setLoading(false);
        }
    };

    // Enrich results with related data
    const enrichResults = async (data: any[]) => {
        if (!selectedSource) return data;

        // Add patient names for financial tables
        if (['financial_installments', 'budgets', 'appointments'].includes(selectedSource.table)) {
            const patientIds = data.map(r => r.patient_id).filter(Boolean);
            if (patientIds.length > 0) {
                const { data: patients } = await supabase
                    .from('patients')
                    .select('id, name')
                    .in('id', patientIds);

                const patientMap = new Map(patients?.map(p => [p.id, p.name]) || []);
                data = data.map(r => ({ ...r, patient_name: patientMap.get(r.patient_id) || 'N/A' }));
            }
        }

        // Add doctor names for appointments
        if (selectedSource.table === 'appointments') {
            const doctorIds = data.map(r => r.doctor_id).filter(Boolean);
            if (doctorIds.length > 0) {
                const { data: doctors } = await supabase
                    .from('users')
                    .select('id, name')
                    .in('id', doctorIds);

                const doctorMap = new Map(doctors?.map(d => [d.id, d.name]) || []);
                data = data.map(r => ({ ...r, doctor_name: doctorMap.get(r.doctor_id) || 'N/A' }));
            }
        }

        return data;
    };

    // Handlers
    const handlePillarChange = (pillar: Pillar) => {
        setSelectedPillar(pillar);
        setSelectedSource(pillar.sources[0]);
        setFilters({});
        setResults([]);
        setSortBy(pillar.sources[0].defaultSort || '');
    };

    const handleSourceChange = (source: DataSource) => {
        setSelectedSource(source);
        setFilters({});
        setResults([]);
        setSortBy(source.defaultSort || '');
    };

    const handleFilterChange = (filterId: string, value: any) => {
        setFilters(prev => ({ ...prev, [filterId]: value }));
    };

    const handleSort = (column: string) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('desc');
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExportCSV = () => {
        if (results.length === 0) {
            toast.error('Nenhum resultado para exportar');
            return;
        }

        const headers = selectedSource?.columns.map(c => c.label).join(',') || '';
        const rows = results.map(r =>
            selectedSource?.columns.map(c => {
                const value = r[c.key];
                if (c.type === 'currency') return `R$ ${parseFloat(value || 0).toFixed(2)}`;
                if (c.type === 'date') return new Date(value).toLocaleDateString('pt-BR');
                return value || '';
            }).join(',')
        ).join('\n');

        const csv = `${headers}\n${rows}`;
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `relatorio_${selectedSource?.id}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        toast.success('Relatório exportado com sucesso!');
    };

    // Render Helpers
    const renderCellValue = (value: any, type?: string) => {
        if (value === null || value === undefined) return '-';

        switch (type) {
            case 'currency':
                return `R$ ${parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
            case 'date':
                return new Date(value).toLocaleDateString('pt-BR');
            case 'status':
                return (
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${['PAID', 'APPROVED', 'COMPLETED', 'CONFIRMED'].includes(value)
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        : ['PENDING', 'DRAFT'].includes(value)
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                        }`}>
                        {value}
                    </span>
                );
            default:
                return value;
        }
    };

    if (!selectedPillar || !selectedSource) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
            {/* ============================================ */}
            {/* HEADER - JIRA STYLE (FIXED) */}
            {/* ============================================ */}
            <div className="flex-none bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 print:hidden z-10">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <FileText className="text-blue-600" size={28} />
                            Relatórios Operacionais
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Sistema de BI Dinâmico • {totalCount} registros encontrados
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleExportCSV}
                            disabled={results.length === 0}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                        >
                            <Download size={16} />
                            CSV
                        </button>
                        <button
                            onClick={handlePrint}
                            disabled={results.length === 0}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                        >
                            <Printer size={16} />
                            Imprimir A4
                        </button>
                    </div>
                </div>

                {/* PILLAR SELECTOR */}
                <div className="flex gap-2 mb-4 overflow-x-auto pb-1 hide-scrollbar">
                    {REPORT_CONFIG.map(pillar => {
                        const Icon = pillar.icon;
                        return (
                            <button
                                key={pillar.id}
                                onClick={() => handlePillarChange(pillar)}
                                className={`flex flex-none items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${selectedPillar.id === pillar.id
                                    ? `bg-${pillar.color}-600 text-white shadow-md`
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                            >
                                <Icon size={16} />
                                {pillar.label}
                            </button>
                        );
                    })}
                </div>

                {/* SOURCE SELECTOR */}
                <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                    {selectedPillar.sources.map(source => (
                        <button
                            key={source.id}
                            onClick={() => handleSourceChange(source)}
                            className={`flex-none px-3 py-1.5 rounded-md text-xs font-bold transition-all ${selectedSource.id === source.id
                                ? 'bg-slate-900 dark:bg-slate-200 text-white dark:text-slate-900'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                }`}
                        >
                            {source.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ============================================ */}
            {/* FILTER BAR - DYNAMIC CASCADE (FIXED) */}
            {/* ============================================ */}
            <div className="flex-none bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 print:hidden z-10">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {selectedSource.filters.map(filter => (
                        <div key={filter.id}>
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block uppercase">
                                {filter.label}
                            </label>
                            {filter.type === 'select' ? (
                                <select
                                    value={filters[filter.id] || ''}
                                    onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="">Todos</option>
                                    {filter.options?.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            ) : filter.type === 'date' ? (
                                <input
                                    type="date"
                                    value={filters[filter.id] || ''}
                                    onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            ) : filter.type === 'number' ? (
                                <input
                                    type="number"
                                    value={filters[filter.id] || ''}
                                    onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                                    placeholder={filter.placeholder}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            ) : (
                                <input
                                    type="text"
                                    value={filters[filter.id] || ''}
                                    onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                                    placeholder={filter.placeholder}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            )}
                        </div>
                    ))}
                </div>
                <div className="flex gap-2 mt-4">
                    <button
                        onClick={runQuery}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-bold text-sm shadow-md"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                        {loading ? 'Buscando...' : 'Buscar'}
                    </button>
                    <button
                        onClick={() => { setFilters({}); setResults([]); }}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 font-medium text-sm"
                    >
                        <X size={16} />
                        Limpar
                    </button>
                </div>
            </div>

            {/* ============================================ */}
            {/* RESULTS TABLE - JIRA DENSE STYLE (SCROLLABLE) */}
            {/* ============================================ */}
            <div className="flex-1 overflow-y-auto p-4" ref={printRef}>
                {results.length === 0 && !loading ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <AlertCircle size={48} className="mb-4 opacity-50" />
                        <p className="text-lg font-medium">Nenhum resultado encontrado</p>
                        <p className="text-sm">Ajuste os filtros e clique em "Buscar"</p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[500px]">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    {selectedSource.columns.map(col => (
                                        <th
                                            key={col.key}
                                            onClick={() => handleSort(col.key)}
                                            className="px-4 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                        >
                                            <div className="flex items-center gap-2">
                                                {col.label}
                                                {sortBy === col.key && (
                                                    <ArrowUpDown size={12} className={sortOrder === 'asc' ? 'rotate-180' : ''} />
                                                )}
                                            </div>
                                        </th>
                                    ))}
                                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-600 dark:text-slate-300 uppercase print:hidden">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {results.map((row, idx) => (
                                    <tr
                                        key={idx}
                                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                                        onClick={() => { setSelectedRecord(row); setSheetOpen(true); }}
                                    >
                                        {selectedSource.columns.map(col => (
                                            <td key={col.key} className="px-4 py-3 text-slate-700 dark:text-slate-300">
                                                {renderCellValue(row[col.key], col.type)}
                                            </td>
                                        ))}
                                        <td className="px-4 py-3 text-right print:hidden">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedRecord(row);
                                                    setSheetOpen(true);
                                                }}
                                                className="text-blue-600 dark:text-blue-400 hover:underline text-xs font-medium"
                                            >
                                                <Eye size={14} className="inline" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        {totalCount > pageSize && (
                            <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between print:hidden">
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, totalCount)} de {totalCount}
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded disabled:opacity-50 text-sm"
                                    >
                                        Anterior
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(p => p + 1)}
                                        disabled={currentPage * pageSize >= totalCount}
                                        className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded disabled:opacity-50 text-sm"
                                    >
                                        Próxima
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ============================================ */}
            {/* DETAIL SHEET - SHADCN */}
            {/* ============================================ */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent className="w-full sm:max-w-lg overflow-auto">
                    <SheetHeader>
                        <SheetTitle>Detalhes do Registro</SheetTitle>
                    </SheetHeader>
                    {selectedRecord && (
                        <div className="mt-6 space-y-4">
                            {Object.entries(selectedRecord).map(([key, value]) => (
                                <div key={key} className="border-b border-slate-100 dark:border-slate-800 pb-3">
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                                        {key.replace(/_/g, ' ')}
                                    </p>
                                    <p className="text-sm text-slate-900 dark:text-white font-medium">
                                        {value?.toString() || '-'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            {/* Print Styles */}
            <style>{`
                @media print {
                    body { background: white !important; }
                    .print\\:hidden { display: none !important; }
                    table { page-break-inside: auto; }
                    tr { page-break-inside: avoid; page-break-after: auto; }
                    thead { display: table-header-group; }
                }
            `}</style>
        </div>
    );
};

export default Reports;
