
import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, Legend, ComposedChart
} from 'recharts';
import { 
  TrendingUp, TrendingDown, AlertTriangle, Lightbulb, 
  DollarSign, Users, Activity, Filter, Download, Calendar, 
  ArrowRight, Target, Clock, AlertCircle, Briefcase, Stethoscope, Layers, FileText, Table
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// --- MOCK HISTORICAL DATA (Simulating database history for trends) ---
const FINANCIAL_HISTORY = [
  { month: 'Mai', receita: 42000, despesa: 30000, lucro: 12000, inadimplencia: 2000 },
  { month: 'Jun', receita: 45000, despesa: 32000, lucro: 13000, inadimplencia: 2500 },
  { month: 'Jul', receita: 41000, despesa: 29000, lucro: 12000, inadimplencia: 1800 },
  { month: 'Ago', receita: 48000, despesa: 35000, lucro: 13000, inadimplencia: 3000 },
  { month: 'Set', receita: 52000, despesa: 34000, lucro: 18000, inadimplencia: 2200 },
  { month: 'Out', receita: 58000, despesa: 36000, lucro: 22000, inadimplencia: 2500 },
];

const OCCUPANCY_DATA = [
  { name: 'Ocupado', value: 68, fill: '#3b82f6' },
  { name: 'Ocioso', value: 25, fill: '#e2e8f0' },
  { name: 'Faltas', value: 7, fill: '#ef4444' },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

type DashboardType = 'executivo' | 'financeiro' | 'comercial' | 'operacional' | 'clinico' | 'funil' | 'insights';

const Reports: React.FC = () => {
  const { patients, globalFinancials, leads, treatments, appointments, expenses } = useData();
  const [activeTab, setActiveTab] = useState<DashboardType>('executivo');
  const [period, setPeriod] = useState('Este Mês');
  const [showExportMenu, setShowExportMenu] = useState(false);

  // --- KPI ENGINE: REAL-TIME CALCULATIONS ---
  const kpis = useMemo(() => {
    // Financial
    const totalRevenue = globalFinancials.filter(r => r.type === 'income').reduce((acc, r) => acc + r.amount, 0);
    const totalExpense = globalFinancials.filter(r => r.type === 'expense').reduce((acc, r) => acc + r.amount, 0);
    const netResult = totalRevenue - totalExpense;
    const payingPatients = patients.filter(p => (p.totalPaid || 0) > 0).length || 1;
    const ticketAvg = totalRevenue / payingPatients;
    const totalReceivables = patients.reduce((acc, p) => acc + (p.balanceDue || 0), 0);
    
    // Commercial
    const totalLeads = leads.length || 1;
    const wonLeads = leads.filter(l => l.status === 'Aprovado').length;
    const conversionRate = (wonLeads / totalLeads) * 100;
    
    // Operational
    const totalAppts = appointments.length || 1;
    const completedAppts = appointments.filter(a => a.status === 'Concluído').length;
    const canceledAppts = appointments.filter(a => a.status === 'Cancelado').length;
    const noShowRate = (canceledAppts / totalAppts) * 100;
    
    // Clinical
    const totalTreatments = treatments.length;
    const completedTreatments = treatments.filter(t => t.status === 'Concluído').length;

    return { 
        totalRevenue, totalExpense, netResult, ticketAvg, totalReceivables,
        conversionRate, totalLeads, wonLeads,
        noShowRate, totalAppts, completedAppts,
        totalTreatments, completedTreatments
    };
  }, [globalFinancials, patients, leads, appointments, treatments]);

  // --- AUTOMATED INSIGHTS GENERATOR ---
  const generatedInsights = useMemo(() => {
      const list = [];
      
      // Commercial Insight
      if (kpis.conversionRate < 20) {
          list.push({ type: 'alert', title: 'Baixa Conversão', desc: `Sua taxa de conversão está em ${kpis.conversionRate.toFixed(1)}%. A média de mercado é 30%. Verifique o tempo de resposta às oportunidades.` });
      } else {
          list.push({ type: 'success', title: 'Conversão Saudável', desc: `Parabéns! Sua taxa de conversão de ${kpis.conversionRate.toFixed(1)}% está acima da média de mercado.` });
      }

      // Financial Insight
      if (kpis.netResult > 0) {
          const margin = (kpis.netResult / kpis.totalRevenue) * 100;
          list.push({ type: 'info', title: 'Margem de Lucro', desc: `Sua margem operacional atual é de ${margin.toFixed(1)}%. Mantenha os custos fixos controlados para preservar este resultado.` });
      }

      // Operational Insight
      if (kpis.noShowRate > 10) {
           list.push({ type: 'warning', title: 'Índice de Faltas', desc: `Sua taxa de no-show é de ${kpis.noShowRate.toFixed(1)}%. Considere implementar confirmação via WhatsApp 24h antes.` });
      }

      return list;
  }, [kpis]);

  // --- PROFESSIONAL EXPORT FUNCTIONS ---

  const generatePDF = () => {
    // ... (Existing export logic remains same, it uses explicit colors so it's theme independent for output)
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const dateStr = new Date().toLocaleDateString('pt-BR');
    const timeStr = new Date().toLocaleTimeString('pt-BR');
    const auditHash = Math.random().toString(36).substring(2, 15).toUpperCase();
    
    // --- 1. HEADER (Branding & Context) ---
    doc.setFillColor(30, 58, 138); // Blue 900
    doc.rect(0, 0, pageWidth, 28, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text('ClinicPro Manager', 14, 18);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Relatório: ${activeTab.toUpperCase()}`, pageWidth - 14, 12, { align: 'right' });
    doc.text(`Gerado por: Dr. Marcelo Vilas Boas (Admin)`, pageWidth - 14, 17, { align: 'right' });
    doc.text(`${dateStr} às ${timeStr}`, pageWidth - 14, 22, { align: 'right' });

    let y = 38;

    // --- 2. EXECUTIVE KPI CARDS (Visual Rendering) ---
    doc.setFontSize(14);
    doc.setTextColor(31, 41, 55);
    doc.setFont("helvetica", "bold");
    doc.text('Indicadores Estratégicos', 14, y);
    y += 8;

    const cardWidth = 45;
    const cardHeight = 25;
    const gap = 5;
    let x = 14;

    // Define KPIs based on active tab context
    const reportKPIs = [
        { label: 'Faturamento Liq.', value: `R$ ${kpis.netResult.toLocaleString('pt-BR')}`, color: [220, 252, 231] }, // Green-100
        { label: 'Ticket Médio', value: `R$ ${kpis.ticketAvg.toLocaleString('pt-BR', {maximumFractionDigits: 0})}`, color: [224, 242, 254] }, // Blue-100
        { label: 'Conversão', value: `${kpis.conversionRate.toFixed(1)}%`, color: [243, 232, 255] }, // Purple-100
        { label: 'Novos Pacientes', value: `${kpis.totalLeads}`, color: [255, 237, 213] } // Orange-100
    ];

    reportKPIs.forEach(kpi => {
        doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
        doc.setDrawColor(200, 200, 200);
        doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'FD');
        
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(8);
        doc.text(kpi.label, x + 3, y + 8);
        
        doc.setTextColor(30, 30, 30);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(kpi.value, x + 3, y + 18);
        
        x += cardWidth + gap;
    });

    y += cardHeight + 15;

    // --- 3. INSIGHTS SECTION ---
    if (generatedInsights.length > 0) {
        doc.setFontSize(12);
        doc.setTextColor(31, 41, 55);
        doc.text('Análise Inteligente & Insights', 14, y);
        y += 6;

        generatedInsights.forEach(insight => {
            doc.setFontSize(10);
            if (insight.type === 'alert') {
                doc.setTextColor(185, 28, 28); // Red
                doc.text(`[ALERTA] ${insight.title}`, 14, y);
            } else if (insight.type === 'success') {
                doc.setTextColor(21, 128, 61); // Green
                doc.text(`[SUCESSO] ${insight.title}`, 14, y);
            } else {
                doc.setTextColor(30, 64, 175); // Blue
                doc.text(`[INFO] ${insight.title}`, 14, y);
            }
            
            y += 5;
            doc.setTextColor(75, 85, 99);
            doc.setFont("helvetica", "normal");
            const desc = doc.splitTextToSize(insight.desc, pageWidth - 28);
            doc.text(desc, 14, y);
            y += (desc.length * 4) + 4;
        });
        y += 5;
    }

    // --- 4. DETAILED DATA TABLE (With Visual Data Bars) ---
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text('Detalhamento de Dados', 14, y);
    y += 5;

    let tableHead = [];
    let tableBody = [];

    // Select Data Source based on Tab
    if (activeTab === 'financeiro' || activeTab === 'executivo') {
        tableHead = [['Data', 'Descrição', 'Categ', 'Valor', 'Status']];
        tableBody = globalFinancials.slice(0, 30).map(f => [
            f.date, 
            f.description, 
            f.category, 
            { content: `R$ ${f.amount.toLocaleString('pt-BR')}`, styles: { textColor: f.type === 'income' ? [22, 163, 74] : [220, 38, 38], fontStyle: 'bold' } },
            f.status
        ]);
    } else if (activeTab === 'comercial' || activeTab === 'funil') {
        tableHead = [['Nome', 'Origem', 'Status', 'Valor Potencial']];
        tableBody = leads.map(l => [
            l.name, 
            l.source, 
            l.status, 
            l.value ? `R$ ${l.value.toLocaleString('pt-BR')}` : '-'
        ]);
    } else if (activeTab === 'clinico') {
        tableHead = [['Procedimento', 'Profissional', 'Status', 'Valor']];
        // We mock values for treatments here for visual purpose as context might not have specific value per treatment item readily available in flat list without join
        tableBody = treatments.map(t => [
            t.procedure,
            t.doctorName || '-',
            t.status,
            'R$ -' // Placeholder as raw treatment doesn't always carry value in this mock
        ]);
    } else {
        tableHead = [['Data', 'Hora', 'Paciente', 'Tipo', 'Status']];
        tableBody = appointments.map(a => [a.date, a.time || '-', a.patientName, a.type, a.status]);
    }

    autoTable(doc, {
        startY: y,
        head: tableHead,
        body: tableBody,
        theme: 'striped',
        headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 },
        alternateRowStyles: { fillColor: [243, 244, 246] },
        // Custom Hook to Draw "Visuals" if needed (e.g. data bars)
        didDrawCell: (data) => {
            // Example: Add a colored dot for Status column
            if (data.section === 'body' && (data.column.index === 2 || data.column.index === 4)) {
                // simple visual indicator could go here
            }
        }
    });

    // --- 5. FOOTER (Audit & Page Info) ---
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFillColor(243, 244, 246);
        doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
        
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text(`Audit Hash: ${auditHash} | ClinicPro Manager System`, 14, pageHeight - 6);
        doc.text(`Página ${i} de ${pageCount}`, pageWidth - 14, pageHeight - 6, { align: 'right' });
    }

    doc.save(`ClinicPro_${activeTab}_${dateStr.replace(/\//g,'-')}.pdf`);
    setShowExportMenu(false);
  };

  const generateExcel = () => {
    const wb = XLSX.utils.book_new();
    const dateStr = new Date().toLocaleDateString('pt-BR');

    // --- SHEET 1: RESUMO EXECUTIVO (KPIs) ---
    const summaryData = [
        ["Relatório Gerencial", `Gerado em ${dateStr}`],
        ["Usuário", "Dr. Marcelo Vilas Boas (Admin)"],
        [],
        ["INDICADORES DE PERFORMANCE", ""],
        ["Faturamento Líquido", kpis.netResult],
        ["Receita Total", kpis.totalRevenue],
        ["Despesas Totais", kpis.totalExpense],
        ["Ticket Médio", kpis.ticketAvg],
        ["Taxa de Conversão (%)", kpis.conversionRate],
        ["Inadimplência Total", kpis.totalReceivables]
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Resumo Executivo");

    // --- SHEET 2: DADOS DETALHADOS ---
    let detailedData: any[] = [];
    let sheetName = "Dados";

    if (activeTab === 'financeiro' || activeTab === 'executivo') {
        detailedData = globalFinancials.map(f => ({
            Data: f.date,
            Descricao: f.description,
            Tipo: f.type === 'income' ? 'Entrada' : 'Saída',
            Categoria: f.category,
            Valor: f.amount,
            Status: f.status,
            Metodo: f.paymentMethod || '-'
        }));
        sheetName = "Financeiro";
    } else if (activeTab === 'comercial' || activeTab === 'funil') {
        detailedData = leads.map(l => ({
            Nome: l.name,
            Origem: l.source,
            Status: l.status,
            Ultima_Interacao: l.lastInteraction,
            Valor_Potencial: l.value || 0
        }));
        sheetName = "Comercial";
    } else {
        detailedData = appointments.map(a => ({
            Data: a.date,
            Hora: a.time || '-',
            Paciente: a.patientName,
            Medico: a.doctorName,
            Tipo: a.type,
            Status: a.status
        }));
        sheetName = "Operacional";
    }

    const wsDetail = XLSX.utils.json_to_sheet(detailedData);
    XLSX.utils.book_append_sheet(wb, wsDetail, sheetName);

    // --- SHEET 3: INSIGHTS ---
    const insightsData = generatedInsights.map(i => ({
        Tipo: i.type.toUpperCase(),
        Titulo: i.title,
        Descricao: i.desc
    }));
    const wsInsights = XLSX.utils.json_to_sheet(insightsData);
    XLSX.utils.book_append_sheet(wb, wsInsights, "Insights IA");

    XLSX.writeFile(wb, `ClinicPro_Relatorio_${activeTab}_${dateStr.replace(/\//g,'-')}.xlsx`);
    setShowExportMenu(false);
  };

  // --- COMPONENT: METRIC CARD ---
  const MetricCard = ({ title, value, subtext, trend, type = 'neutral', icon: Icon }: any) => (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className="flex justify-between items-start mb-2 relative z-10">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          {Icon && <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"><Icon size={18}/></div>}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white relative z-10">{value}</h3>
      <div className="flex items-center gap-2 mt-2 relative z-10">
        {trend && (
            <span className={`flex items-center text-xs font-bold px-1.5 py-0.5 rounded 
                ${type === 'positive' ? 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400' : 
                  type === 'negative' ? 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400' : 'text-gray-600 bg-gray-50 dark:text-gray-300 dark:bg-gray-700'}`}>
                {type === 'positive' ? <TrendingUp size={12} className="mr-1"/> : <TrendingDown size={12} className="mr-1"/>}
                {trend}
            </span>
        )}
        <p className="text-xs text-gray-400 dark:text-gray-500">{subtext}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-20 md:pb-0" onClick={() => showExportMenu && setShowExportMenu(false)}>
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Activity className="text-blue-600 dark:text-blue-400" />
                Intelligence Center
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Gestão estratégica orientada a dados</p>
        </div>
        
        {/* FILTERS TOOLBAR */}
        <div className="flex flex-wrap gap-2 bg-white dark:bg-gray-800 p-1.5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
             <div className="relative">
                 <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14}/>
                 <select 
                    value={period} 
                    onChange={e => setPeriod(e.target.value)}
                    className="pl-9 pr-8 py-1.5 bg-transparent text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
                 >
                     <option>Este Mês</option>
                     <option>Últimos 3 Meses</option>
                     <option>Este Ano</option>
                 </select>
             </div>
             <div className="w-px bg-gray-200 dark:bg-gray-700 my-1"></div>
             <button className="flex items-center gap-2 px-3 py-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors">
                 <Filter size={14}/> <span className="hidden sm:inline">Filtros</span>
             </button>
             
             {/* EXPORT BUTTON & DROPDOWN */}
             <div className="relative">
                 <button 
                    onClick={(e) => { e.stopPropagation(); setShowExportMenu(!showExportMenu); }}
                    className="flex items-center gap-2 px-3 py-1.5 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg text-sm font-medium transition-colors"
                 >
                     <Download size={14}/> <span className="hidden sm:inline">Exportar</span>
                 </button>
                 
                 {showExportMenu && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 z-50 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                        <button 
                            onClick={generatePDF}
                            className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 border-b border-gray-50 dark:border-gray-700"
                        >
                            <FileText size={16} className="text-red-500" /> Relatório PDF
                        </button>
                        <button 
                            onClick={generateExcel}
                            className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                            <Table size={16} className="text-green-600" /> Dados Excel (XLS)
                        </button>
                    </div>
                 )}
             </div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto scrollbar-hide">
          <div className="flex gap-1 min-w-max pb-1">
              {[
                  { id: 'executivo', label: 'Executivo', icon: Briefcase },
                  { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
                  { id: 'comercial', label: 'Comercial', icon: Target },
                  { id: 'operacional', label: 'Operacional', icon: Clock },
                  { id: 'clinico', label: 'Clínico', icon: Stethoscope },
                  { id: 'funil', label: 'Funil Completo', icon: Layers },
                  { id: 'insights', label: 'Insights & Alertas', icon: Lightbulb }
              ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all
                        ${activeTab === tab.id 
                            ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-900/20' 
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  >
                      <tab.icon size={16} />
                      {tab.label}
                  </button>
              ))}
          </div>
      </div>

      {/* --- 1. DASHBOARD EXECUTIVO --- */}
      {activeTab === 'executivo' && (
          <div className="space-y-6 animate-in fade-in">
              <div className="bg-blue-600 dark:bg-blue-700 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                      <div>
                          <p className="text-blue-100 font-medium mb-1">Resultado Líquido (Mês Atual)</p>
                          <h2 className="text-4xl font-bold">R$ {kpis.netResult.toLocaleString('pt-BR')}</h2>
                          <div className="flex items-center gap-2 mt-2">
                              <span className="bg-white/20 px-2 py-0.5 rounded text-sm font-medium">+12% vs mês anterior</span>
                              <span className="text-blue-100 text-sm">Meta: R$ 25.000</span>
                          </div>
                      </div>
                      <div className="flex gap-8 text-center md:text-right">
                          <div>
                              <p className="text-blue-200 text-sm mb-1">Margem</p>
                              <p className="text-2xl font-bold">{kpis.totalRevenue > 0 ? ((kpis.netResult/kpis.totalRevenue)*100).toFixed(1) : 0}%</p>
                          </div>
                          <div>
                              <p className="text-blue-200 text-sm mb-1">Ticket Médio</p>
                              <p className="text-2xl font-bold">R$ {kpis.ticketAvg.toFixed(0)}</p>
                          </div>
                      </div>
                  </div>
                  {/* Decorator */}
                  <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <MetricCard title="Faturamento Bruto" value={`R$ ${kpis.totalRevenue.toLocaleString('pt-BR')}`} trend="+8%" type="positive" icon={DollarSign} />
                  <MetricCard title="Custos Operacionais" value={`R$ ${kpis.totalExpense.toLocaleString('pt-BR')}`} trend="+2%" type="negative" icon={Activity} />
                  <MetricCard title="Novos Tratamentos" value={kpis.totalTreatments} trend="+5" type="positive" icon={Stethoscope} />
                  <MetricCard title="Inadimplência" value={`R$ ${kpis.totalReceivables.toLocaleString('pt-BR')}`} trend="+1.2%" type="negative" icon={AlertCircle} />
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                  <h3 className="font-bold text-gray-800 dark:text-white mb-6">Crescimento vs Lucratividade</h3>
                  <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={FINANCIAL_HISTORY}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10}/>
                              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                              <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}/>
                              <Legend />
                              <Bar dataKey="receita" name="Receita Bruta" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                              <Line type="monotone" dataKey="lucro" name="Lucro Operacional" stroke="#10b981" strokeWidth={3} dot={{r: 4}} />
                          </ComposedChart>
                      </ResponsiveContainer>
                  </div>
              </div>
          </div>
      )}

      {/* --- 2. DASHBOARD FINANCEIRO --- */}
      {activeTab === 'financeiro' && (
          <div className="space-y-6 animate-in fade-in">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border-l-4 border-green-500 shadow-sm">
                       <p className="text-gray-500 dark:text-gray-400 text-sm">Entradas (Hoje)</p>
                       <h3 className="text-2xl font-bold text-green-700 dark:text-green-400">R$ {globalFinancials.filter(f => f.type === 'income' && f.date === new Date().toLocaleDateString('pt-BR')).reduce((acc, v) => acc + v.amount, 0).toLocaleString('pt-BR')}</h3>
                   </div>
                   <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border-l-4 border-red-500 shadow-sm">
                       <p className="text-gray-500 dark:text-gray-400 text-sm">Saídas (Hoje)</p>
                       <h3 className="text-2xl font-bold text-red-700 dark:text-red-400">R$ {globalFinancials.filter(f => f.type === 'expense' && f.date === new Date().toLocaleDateString('pt-BR')).reduce((acc, v) => acc + v.amount, 0).toLocaleString('pt-BR')}</h3>
                   </div>
                   <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border-l-4 border-blue-500 shadow-sm">
                       <p className="text-gray-500 dark:text-gray-400 text-sm">Previsão (30 Dias)</p>
                       <h3 className="text-2xl font-bold text-blue-700 dark:text-blue-400">R$ {(kpis.totalReceivables * 0.8).toLocaleString('pt-BR')}</h3>
                   </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                       <h3 className="font-bold text-gray-800 dark:text-white mb-6">Fluxo de Caixa Diário</h3>
                       <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={FINANCIAL_HISTORY}> {/* Using history as mock for daily */}
                                    <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="lucro" fill="#3b82f6" name="Saldo" radius={[4,4,0,0]} />
                                </BarChart>
                            </ResponsiveContainer>
                       </div>
                   </div>
                   <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                       <h3 className="font-bold text-gray-800 dark:text-white mb-4">Contas a Pagar (Próximos 7 dias)</h3>
                       <div className="space-y-3">
                           {expenses.filter(e => e.status === 'Pendente').slice(0, 5).map(expense => (
                               <div key={expense.id} className="flex justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg border border-transparent hover:border-gray-100 transition-colors">
                                   <div>
                                       <p className="font-medium text-gray-800 dark:text-white">{expense.description}</p>
                                       <p className="text-xs text-gray-500 dark:text-gray-400">{expense.dueDate} • {expense.category}</p>
                                   </div>
                                   <span className="font-bold text-red-600 dark:text-red-400">- R$ {expense.amount.toLocaleString('pt-BR')}</span>
                               </div>
                           ))}
                           {expenses.filter(e => e.status === 'Pendente').length === 0 && <p className="text-gray-400 text-sm italic">Nenhuma conta pendente próxima.</p>}
                       </div>
                   </div>
               </div>
          </div>
      )}

      {/* --- 3. DASHBOARD COMERCIAL --- */}
      {activeTab === 'comercial' && (
          <div className="space-y-6 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <MetricCard title="Oportunidades Totais" value={kpis.totalLeads} subtext="Novas oportunidades" icon={Users} />
                  <MetricCard title="Agendamentos" value={kpis.totalAppts} trend="+12%" type="positive" icon={Calendar} />
                  <MetricCard title="Taxa Conversão" value={`${kpis.conversionRate.toFixed(1)}%`} subtext="Meta: 30%" type={kpis.conversionRate > 25 ? 'positive' : 'negative'} icon={Target} />
                  <MetricCard title="CAC" value="R$ 45,00" subtext="Custo por aquisição" icon={DollarSign} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                      <h3 className="font-bold text-gray-800 dark:text-white mb-6">Funil de Vendas</h3>
                      <div className="h-72">
                          <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={[
                                  { name: 'Oportunidades', value: kpis.totalLeads },
                                  { name: 'Agendados', value: kpis.totalAppts },
                                  { name: 'Compareceram', value: kpis.completedAppts },
                                  { name: 'Aprovados', value: kpis.wonLeads },
                              ]} layout="vertical" barCategoryGap="20%">
                                  <CartesianGrid strokeDasharray="3 3" horizontal={false}/>
                                  <XAxis type="number" hide/>
                                  <YAxis dataKey="name" type="category" width={100} tick={{fill: '#9CA3AF'}}/>
                                  <Tooltip cursor={{fill: 'transparent'}}/>
                                  <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} label={{ position: 'right', fill: '#6b7280' }}>
                                    {/* Gradient or colored bars could go here */}
                                  </Bar>
                              </BarChart>
                          </ResponsiveContainer>
                      </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                      <h3 className="font-bold text-gray-800 dark:text-white mb-6">Origem das Oportunidades</h3>
                      <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                  <Pie
                                    data={[
                                        { name: 'Instagram', value: 45 },
                                        { name: 'Google', value: 30 },
                                        { name: 'Indicação', value: 25 },
                                    ]}
                                    innerRadius={60} outerRadius={80}
                                    dataKey="value"
                                  >
                                    <Cell fill="#E1306C" />
                                    <Cell fill="#4285F4" />
                                    <Cell fill="#34A853" />
                                  </Pie>
                                  <Tooltip />
                                  <Legend verticalAlign="bottom"/>
                              </PieChart>
                          </ResponsiveContainer>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- 4. DASHBOARD OPERACIONAL --- */}
      {activeTab === 'operacional' && (
          <div className="space-y-6 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <MetricCard title="Ocupação de Agenda" value="68%" subtext="Meta: 80%" trend="-2%" type="negative" icon={Calendar} />
                  <MetricCard title="Taxa de No-Show" value={`${kpis.noShowRate.toFixed(1)}%`} subtext="Faltas não avisadas" type="negative" icon={AlertCircle} />
                  <MetricCard title="Ociosidade" value="32%" subtext="Horários vagos" icon={Clock} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                      <h3 className="font-bold text-gray-800 dark:text-white mb-6">Status da Agenda</h3>
                      <div className="h-64 flex items-center justify-center">
                           <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={OCCUPANCY_DATA} innerRadius={60} outerRadius={80} dataKey="value" paddingAngle={5}>
                                        {OCCUPANCY_DATA.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend layout="vertical" verticalAlign="middle" align="right"/>
                                </PieChart>
                           </ResponsiveContainer>
                      </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                      <h3 className="font-bold text-gray-800 dark:text-white mb-4">Gargalos Operacionais</h3>
                      <ul className="space-y-4">
                          <li className="flex items-center justify-between">
                              <span className="text-gray-600 dark:text-gray-300">Reagendamentos Frequentes</span>
                              <span className="font-bold text-red-500 dark:text-red-400">12%</span>
                          </li>
                          <li className="flex items-center justify-between">
                              <span className="text-gray-600 dark:text-gray-300">Tempo Médio em Sala de Espera</span>
                              <span className="font-bold text-gray-900 dark:text-white">18 min</span>
                          </li>
                          <li className="flex items-center justify-between">
                              <span className="text-gray-600 dark:text-gray-300">Horário de Pico (Recepção)</span>
                              <span className="font-bold text-gray-900 dark:text-white">14:00 - 15:00</span>
                          </li>
                          <li className="flex items-center justify-between">
                              <span className="text-gray-600 dark:text-gray-300">Confirmações Pendentes</span>
                              <span className="font-bold text-orange-500 dark:text-orange-400">8 agendamentos</span>
                          </li>
                      </ul>
                  </div>
              </div>
          </div>
      )}

      {/* --- 5. DASHBOARD CLÍNICO --- */}
      {activeTab === 'clinico' && (
          <div className="space-y-6 animate-in fade-in">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-gray-800 dark:text-white">Produção por Profissional</h3>
                      <button className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline">Ver detalhes</button>
                  </div>
                  <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                          <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
                              <tr>
                                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Profissional</th>
                                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Procedimentos</th>
                                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Faturamento</th>
                                  <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Ticket Médio</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                  <td className="px-6 py-4 font-bold text-gray-700 dark:text-white">Dr. Marcelo V. Boas</td>
                                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">12</td>
                                  <td className="px-6 py-4 text-green-600 dark:text-green-400 font-medium">R$ 15.400</td>
                                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">R$ 1.283</td>
                              </tr>
                              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                  <td className="px-6 py-4 font-bold text-gray-700 dark:text-white">Dra. Sofia</td>
                                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">8</td>
                                  <td className="px-6 py-4 text-green-600 dark:text-green-400 font-medium">R$ 9.800</td>
                                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">R$ 1.225</td>
                              </tr>
                          </tbody>
                      </table>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                      <h3 className="font-bold text-gray-800 dark:text-white mb-6">Top Procedimentos (Receita)</h3>
                      <div className="h-60">
                           <ResponsiveContainer width="100%" height="100%">
                                <BarChart layout="vertical" data={[
                                    { name: 'Invisalign', value: 25000 },
                                    { name: 'Implantes', value: 18000 },
                                    { name: 'Lentes', value: 12000 },
                                ]}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false}/>
                                    <XAxis type="number" hide/>
                                    <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 12, fill: '#9CA3AF'}}/>
                                    <Bar dataKey="value" fill="#34d399" radius={[0, 4, 4, 0]} barSize={20} label={{ position: 'right', fill: '#9CA3AF', fontSize: 12, formatter: (val: number) => `R$ ${val/1000}k` }}/>
                                </BarChart>
                           </ResponsiveContainer>
                      </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                      <h3 className="font-bold text-gray-800 dark:text-white mb-4">Eficiência Clínica</h3>
                      <div className="space-y-4">
                           <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                               <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Tempo Médio de Cadeira</p>
                               <p className="text-xl font-bold text-gray-900 dark:text-white">45 min</p>
                               <p className="text-xs text-gray-400">vs 50 min (Meta)</p>
                           </div>
                           <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                               <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Taxa de Retrabalho</p>
                               <p className="text-xl font-bold text-green-600 dark:text-green-400">1.2%</p>
                               <p className="text-xs text-gray-400">Excelente (Abaixo de 3%)</p>
                           </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- 6. DASHBOARD FUNIL COMPLETO --- */}
      {activeTab === 'funil' && (
          <div className="space-y-6 animate-in fade-in">
              <div className="bg-white dark:bg-gray-800 p-8 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                  <h3 className="font-bold text-gray-800 dark:text-white mb-8 text-center">Jornada do Paciente (End-to-End)</h3>
                  
                  <div className="relative flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0">
                      {/* Step 1 */}
                      <div className="flex flex-col items-center z-10 w-full md:w-auto">
                          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-2 border-2 border-gray-200 dark:border-gray-600">
                              <Users className="text-gray-500 dark:text-gray-400" />
                          </div>
                          <p className="font-bold text-gray-800 dark:text-white">Oportunidades</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{kpis.totalLeads}</p>
                      </div>

                      {/* Connector */}
                      <div className="hidden md:block flex-1 h-1 bg-gray-100 dark:bg-gray-700 relative">
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 px-2 text-xs font-bold text-gray-400">
                              {((kpis.totalAppts / kpis.totalLeads)*100).toFixed(0)}%
                          </div>
                      </div>

                      {/* Step 2 */}
                      <div className="flex flex-col items-center z-10 w-full md:w-auto">
                          <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-2 border-2 border-blue-100 dark:border-blue-800">
                              <Calendar className="text-blue-500 dark:text-blue-400" />
                          </div>
                          <p className="font-bold text-gray-800 dark:text-white">Agendados</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{kpis.totalAppts}</p>
                      </div>

                      {/* Connector */}
                      <div className="hidden md:block flex-1 h-1 bg-gray-100 dark:bg-gray-700 relative">
                         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 px-2 text-xs font-bold text-gray-400">
                              {((kpis.completedAppts / kpis.totalAppts)*100).toFixed(0)}%
                          </div>
                      </div>

                      {/* Step 3 */}
                      <div className="flex flex-col items-center z-10 w-full md:w-auto">
                          <div className="w-16 h-16 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center mb-2 border-2 border-purple-100 dark:border-purple-800">
                              <Target className="text-purple-500 dark:text-purple-400" />
                          </div>
                          <p className="font-bold text-gray-800 dark:text-white">Compareceram</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{kpis.completedAppts}</p>
                      </div>

                      {/* Connector */}
                      <div className="hidden md:block flex-1 h-1 bg-gray-100 dark:bg-gray-700 relative">
                         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 px-2 text-xs font-bold text-gray-400">
                              50%
                          </div>
                      </div>

                      {/* Step 4 */}
                      <div className="flex flex-col items-center z-10 w-full md:w-auto">
                          <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center mb-2 border-2 border-green-100 dark:border-green-800">
                              <DollarSign className="text-green-500 dark:text-green-400" />
                          </div>
                          <p className="font-bold text-gray-800 dark:text-white">Fechamento</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{kpis.wonLeads}</p>
                      </div>
                  </div>

                  <div className="mt-8 p-4 bg-orange-50 dark:bg-orange-900/30 border border-orange-100 dark:border-orange-800 rounded-lg flex items-start gap-3">
                      <AlertTriangle className="text-orange-500 dark:text-orange-400 shrink-0 mt-0.5" />
                      <div>
                          <p className="font-bold text-orange-800 dark:text-orange-300 text-sm">Gargalo Identificado</p>
                          <p className="text-orange-700 dark:text-orange-400 text-sm">A maior perda ocorre entre o <strong>Agendamento</strong> e o <strong>Comparecimento</strong> (No-show de {kpis.noShowRate.toFixed(1)}%). Foque em ações de confirmação nesta etapa.</p>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- 7. DASHBOARD INSIGHTS --- */}
      {activeTab === 'insights' && (
          <div className="space-y-6 animate-in fade-in">
              <h3 className="font-bold text-gray-800 dark:text-white mb-2">Recomendações da IA</h3>
              <div className="grid grid-cols-1 gap-4">
                  {generatedInsights.map((insight, idx) => (
                      <div key={idx} className={`p-6 rounded-xl border flex items-start gap-4 shadow-sm
                          ${insight.type === 'alert' ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' : 
                            insight.type === 'warning' ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800' : 
                            insight.type === 'success' ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 
                            'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'}`}>
                          <div className={`p-2 rounded-full bg-white/50 dark:bg-black/20 shrink-0
                             ${insight.type === 'alert' ? 'text-red-600 dark:text-red-400' : 
                               insight.type === 'warning' ? 'text-orange-600 dark:text-orange-400' : 
                               insight.type === 'success' ? 'text-green-600 dark:text-green-400' : 
                               'text-blue-600 dark:text-blue-400'}`}>
                              {insight.type === 'success' ? <TrendingUp size={24}/> : <Lightbulb size={24}/>}
                          </div>
                          <div>
                              <h4 className={`font-bold text-lg mb-1
                                 ${insight.type === 'alert' ? 'text-red-900 dark:text-red-300' : 
                                   insight.type === 'warning' ? 'text-orange-900 dark:text-orange-300' : 
                                   insight.type === 'success' ? 'text-green-900 dark:text-green-300' : 
                                   'text-blue-900 dark:text-blue-300'}`}>
                                  {insight.title}
                              </h4>
                              <p className={`text-sm leading-relaxed
                                 ${insight.type === 'alert' ? 'text-red-700 dark:text-red-400' : 
                                   insight.type === 'warning' ? 'text-orange-700 dark:text-orange-400' : 
                                   insight.type === 'success' ? 'text-green-700 dark:text-green-400' : 
                                   'text-blue-700 dark:text-blue-400'}`}>
                                  {insight.desc}
                              </p>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}
    </div>
  );
};

export default Reports;
