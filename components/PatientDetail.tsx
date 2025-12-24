import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useData } from "../contexts/DataContext";
import { supabase } from "../lib/supabase";
import {
  ArrowLeft, Edit2, Trash2, DollarSign, TrendingUp, Star,
  Phone, Mail, Instagram, Briefcase, Heart, Calendar,
  FileText, Image, Activity, CreditCard, Stethoscope, AlertTriangle,
  Smile, Scissors, Sparkles
} from "lucide-react";
import { PatientInstallments } from "./PatientInstallments";
import { OrthoTab } from "./ortho/OrthoTab";

// Patient Score Badge (VIP Status)
const ScoreBadge = ({ score }: { score?: string }) => {
  const badges = {
    DIAMOND: { bg: 'bg-gradient-to-r from-blue-600 to-purple-600', text: 'text-white', label: '💎 DIAMOND' },
    GOLD: { bg: 'bg-gradient-to-r from-yellow-600 to-amber-600', text: 'text-white', label: '⭐ GOLD' },
    STANDARD: { bg: 'bg-slate-700', text: 'text-slate-300', label: 'STANDARD' }
  };
  const badge = badges[score as keyof typeof badges] || badges.STANDARD;
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.bg} ${badge.text} shadow-lg`}>
      {badge.label}
    </span>
  );
};

interface PatientDetailProps {
  patientId?: string;
  onClose?: () => void;
  onEdit?: (patient: any) => void;
  onDelete?: () => void;
}

export const PatientDetailContent: React.FC<PatientDetailProps> = ({ patientId, onClose, onEdit, onDelete }) => {
  const { id: paramId } = useParams<{ id: string }>();
  // Prioritize prop id, then param id
  const id = patientId || paramId;
  const navigate = useNavigate();
  const { patients } = useData();

  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Real Data States
  const [budgets, setBudgets] = useState<any[]>([]);
  const [clinicalTreatments, setClinicalTreatments] = useState<any[]>([]); // CLINICA_GERAL
  const [orthoTreatments, setOrthoTreatments] = useState<any[]>([]);       // ORTODONTIA
  const [hofTreatments, setHofTreatments] = useState<any[]>([]);           // HOF
  const [insights, setInsights] = useState<any[]>([]);
  const [orthoContracts, setOrthoContracts] = useState<any[]>([]);
  const [clinicalImages, setClinicalImages] = useState<any[]>([]);
  const [financialData, setFinancialData] = useState({
    totalApproved: 0,
    totalPaid: 0,
    balanceDue: 0
  });

  useEffect(() => {
    const loadPatientData = async () => {
      if (!id) return;
      setLoading(true);

      try {
        // 1. FETCH PATIENT (with all fields)
        const { data: patientData, error: patientError } = await supabase
          .from('patients')
          .select('*')
          .eq('id', id)
          .single();

        if (patientError) throw patientError;

        if (patientData) {
          setPatient(patientData);

          // Set financial data from patient record
          setFinancialData({
            totalApproved: patientData.total_approved || 0,
            totalPaid: patientData.total_paid || 0,
            balanceDue: patientData.balance_due || 0
          });
        }

        // 2. FETCH BUDGETS (Propostas)
        const { data: budgetsData } = await supabase
          .from('budgets')
          .select(`
                        *,
                        budget_items (*)
                    `)
          .eq('patient_id', id)
          .order('created_at', { ascending: false });

        setBudgets(budgetsData || []);

        // 3. FETCH TREATMENTS BY CATEGORY

        // 3.1 Clínica Geral
        const { data: clinicalData } = await supabase
          .from('treatment_items')
          .select('*')
          .eq('patient_id', id)
          .eq('category', 'CLINICA_GERAL')
          .order('created_at', { ascending: false });
        setClinicalTreatments(clinicalData || []);

        // 3.2 Ortodontia
        const { data: orthoTreatmentsData } = await supabase
          .from('treatment_items')
          .select('*')
          .eq('patient_id', id)
          .eq('category', 'ORTODONTIA')
          .order('created_at', { ascending: false });
        setOrthoTreatments(orthoTreatmentsData || []);

        // 3.3 HOF (Harmonização Orofacial)
        const { data: hofData } = await supabase
          .from('treatment_items')
          .select('*')
          .eq('patient_id', id)
          .eq('category', 'HOF')
          .order('created_at', { ascending: false });
        setHofTreatments(hofData || []);

        // 4. FETCH AI INSIGHTS (Sentinelas específicas do paciente)
        const { data: insightsData } = await supabase
          .from('ai_insights')
          .select('*')
          .eq('related_entity_id', id)
          .in('status', ['OPEN', 'open', 'ACTIVE', 'active'])
          .order('priority', { ascending: false });

        setInsights(insightsData || []);

        // 5. FETCH ORTHO CONTRACTS
        const { data: orthoData } = await supabase
          .from('ortho_contracts')
          .select(`
                        *,
                        ortho_treatment_plans (*)
                    `)
          .eq('patient_id', id);

        setOrthoContracts(orthoData || []);

        // 6. FETCH CLINICAL IMAGES (Galeria)
        const { data: imagesData } = await supabase
          .from('clinical_images')
          .select('*')
          .eq('patient_id', id)
          .order('created_at', { ascending: false });

        setClinicalImages(imagesData || []);

      } catch (error) {
        console.error('Error loading patient data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPatientData();
  }, [id]);

  const handleDeletePatient = async () => {
    // If external handler provided (e.g. from Sheet with PIN), use it
    if (onDelete) {
      onDelete();
      return;
    }

    // Fallback legacy behavior
    if (!confirm('Tem certeza que deseja excluir este paciente? Esta ação não pode ser desfeita.')) return;

    try {
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      navigate('/dashboard/patients');
    } catch (error) {
      console.error('Error deleting patient:', error);
      alert('Erro ao excluir paciente');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="text-center">
          <Activity className="w-12 h-12 text-blue-500 animate-pulse mx-auto mb-4" />
          <p className="text-slate-400 font-medium">Carregando dossiê...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="text-center">
          <p className="text-slate-400">Paciente não encontrado</p>
          <button onClick={() => navigate('/dashboard/patients')} className="mt-4 text-blue-400 hover:text-blue-300">
            Voltar para lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      {/* HEADER - VIP IDENTITY */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border-b border-slate-700 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => onClose ? onClose() : navigate('/dashboard/patients')}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Voltar</span>
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => onEdit ? onEdit(patient) : navigate(`/dashboard/patients/${id}/edit`)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
              >
                <Edit2 size={18} />
                Editar
              </button>
              <button
                onClick={handleDeletePatient}
                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row items-center xl:items-start justify-between gap-6 md:gap-8">
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 text-center md:text-left w-full xl:w-auto">
              {/* Avatar */}
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl md:text-3xl font-black shadow-xl shrink-0">
                {patient.name?.charAt(0).toUpperCase()}
              </div>

              {/* Identity */}
              <div className="flex-1 min-w-0 flex flex-col items-center md:items-start w-full">
                <h1 className="text-xl sm:text-2xl md:text-4xl font-black text-white mb-2 break-all md:break-words leading-tight">{patient.name}</h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-3 mb-3">
                  <ScoreBadge score={patient.patient_score} />
                  {patient.is_bad_debtor && (
                    <span className="px-3 py-1 bg-rose-900/30 border border-rose-600 text-rose-300 rounded-full text-[10px] md:text-xs font-bold">
                      ⚠️ INADIMPLENTE
                    </span>
                  )}
                  {!patient.active && (
                    <span className="px-3 py-1 bg-slate-700 text-slate-300 rounded-full text-[10px] md:text-xs font-bold">
                      INATIVO
                    </span>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-2 sm:gap-4 text-xs sm:text-sm text-slate-400">
                  <span className="flex items-center gap-1">
                    <Phone size={14} />
                    {patient.phone}
                  </span>
                  {patient.email && (
                    <span className="flex items-center gap-1">
                      <Mail size={14} />
                      <span className="truncate max-w-[200px]">{patient.email}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Financial Indicators (REAL DATA) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full xl:w-auto">
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 md:p-4 flex flex-row sm:flex-col justify-between sm:justify-center items-center sm:items-start gap-2">
                <p className="text-[10px] sm:text-xs text-slate-500 uppercase font-bold">Saldo Devedor</p>
                <p className={`text-base sm:text-lg md:text-2xl font-black ${financialData.balanceDue > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  R$ {financialData.balanceDue.toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 md:p-4 flex flex-row sm:flex-col justify-between sm:justify-center items-center sm:items-start gap-2">
                <p className="text-[10px] sm:text-xs text-slate-500 uppercase font-bold">Aprovado</p>
                <p className="text-base sm:text-lg md:text-2xl font-black text-blue-400">
                  R$ {financialData.totalApproved.toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 md:p-4 flex flex-row sm:flex-col justify-between sm:justify-center items-center sm:items-start gap-2">
                <p className="text-[10px] sm:text-xs text-slate-500 uppercase font-bold">Pago</p>
                <p className="text-base sm:text-lg md:text-2xl font-black text-emerald-400">
                  R$ {financialData.totalPaid.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto">
            {[
              { id: 'overview', label: 'Visão Geral', icon: Activity },
              { id: 'budgets', label: `Propostas (${budgets.length})`, icon: FileText },
              { id: 'clinical', label: `Clínica Geral (${clinicalTreatments.length})`, icon: Stethoscope },
              { id: 'ortho', label: `Ortodontia (${orthoTreatments.length})`, icon: Smile },
              { id: 'hof', label: `HOF (${hofTreatments.length})`, icon: Sparkles },
              { id: 'financial', label: 'Financeiro', icon: CreditCard },
              { id: 'gallery', label: `Galeria (${clinicalImages.length})`, icon: Image },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">

            {/* AI INSIGHTS (Sentinelas) */}
            {insights.length > 0 && (
              <div className="bg-rose-900/20 border border-rose-700/50 rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-rose-300 mb-4 flex items-center gap-2">
                  <AlertTriangle size={20} />
                  Alertas Inteligentes ({insights.length})
                </h3>
                <div className="space-y-3">
                  {insights.map(insight => (
                    <div key={insight.id} className="bg-rose-900/30 border border-rose-700/30 rounded-lg p-4">
                      <h4 className="font-bold text-rose-200 mb-1">{insight.title}</h4>
                      <p className="text-sm text-rose-100/70 mb-2">{insight.explanation}</p>
                      <p className="text-xs text-rose-300 font-medium">
                        💡 Ação: {insight.recommended_action || insight.action_label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Personal Data */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Briefcase size={20} className="text-blue-400" />
                  Dados Pessoais
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-slate-500 text-xs uppercase font-bold mb-1">CPF</p>
                    <p className="text-slate-200">{patient.cpf || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs uppercase font-bold mb-1">Data de Nascimento</p>
                    <p className="text-slate-200">{patient.birth_date ? new Date(patient.birth_date).toLocaleDateString('pt-BR') : 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs uppercase font-bold mb-1">Profissão</p>
                    <p className="text-slate-200">{patient.occupation || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs uppercase font-bold mb-1">Estado Civil</p>
                    <p className="text-slate-200">
                      {{
                        'SINGLE': 'Solteiro(a)',
                        'MARRIED': 'Casado(a)',
                        'DIVORCED': 'Divorciado(a)',
                        'WIDOWED': 'Viúvo(a)',
                        'SEPARATED': 'Separado(a)'
                      }[patient.marital_status as string] || patient.marital_status || 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs uppercase font-bold mb-1">Status de Sentimento</p>
                    <p className="text-slate-200">
                      {patient.sentiment_status === 'VERY_HAPPY' ? '😄 Muito Satisfeito' :
                        patient.sentiment_status === 'HAPPY' ? '😊 Satisfeito' :
                          patient.sentiment_status === 'NEUTRAL' ? '😐 Neutro' :
                            patient.sentiment_status === 'UNHAPPY' ? '😟 Insatisfeito' :
                              patient.sentiment_status === 'COMPLAINING' ? '😡 Reclamando' :
                                'Não informado'}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs uppercase font-bold mb-1">Status do Cadastro</p>
                    <p className="text-slate-200">
                      {patient.is_active !== false ? '✅ Ativo' : '❌ Inativo'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Social & Marketing */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Instagram size={20} className="text-purple-400" />
                  Social & Marketing
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-slate-500 text-xs uppercase font-bold mb-1">Instagram</p>
                    <p className="text-slate-200">{patient.instagram || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs uppercase font-bold mb-1">Aniversário de Casamento</p>
                    <p className="text-slate-200">{patient.wedding_anniversary ? new Date(patient.wedding_anniversary).toLocaleDateString('pt-BR') : 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs uppercase font-bold mb-1">Como Conheceu</p>
                    <p className="text-slate-200">{patient.how_met || 'Não informado'}</p>
                  </div>
                </div>
              </div>

              {/* VIP Notes */}
              <div className="bg-gradient-to-br from-amber-900/20 to-yellow-900/20 border border-amber-700/50 rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-amber-300 mb-4 flex items-center gap-2">
                  <Star size={20} className="text-amber-400" />
                  Notas VIP
                </h3>
                <p className="text-sm text-amber-100/80 leading-relaxed">
                  {patient.vip_notes || 'Nenhuma nota especial registrada.'}
                </p>
              </div>
            </div>

            {/* Medical Alerts */}
            {patient.medical_alerts && (
              <div className="bg-rose-900/20 border border-rose-700/50 rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-rose-300 mb-3 flex items-center gap-2">
                  ⚠️ Alertas Médicos
                </h3>
                <p className="text-sm text-rose-100/80">{patient.medical_alerts}</p>
              </div>
            )}
          </div>
        )}

        {/* BUDGETS TAB (REAL DATA) */}
        {activeTab === 'budgets' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Propostas Comerciais</h2>
              <button
                onClick={() => navigate(`/budgets/new?patient_id=${id}`)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                + Nova Proposta
              </button>
            </div>
            {budgets.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
                <FileText size={48} className="text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Nenhuma proposta cadastrada</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {budgets.map(budget => (
                  <div
                    key={budget.id}
                    onClick={() => navigate(`/patients/${id}/budgets/${budget.id}`)}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-blue-600 transition-colors cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-lg font-bold text-white mb-2">
                          Proposta #{budget.id.slice(0, 8)}
                        </h4>
                        <p className="text-sm text-slate-400">
                          {new Date(budget.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-blue-400">
                          R$ {(budget.final_value || 0).toLocaleString('pt-BR')}
                        </p>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mt-2 ${budget.status === 'APPROVED' ? 'bg-emerald-900/30 text-emerald-300' :
                          budget.status === 'REJECTED' ? 'bg-rose-900/30 text-rose-300' :
                            'bg-amber-900/30 text-amber-300'
                          }`}>
                          {budget.status === 'DRAFT' ? 'Rascunho' :
                            budget.status === 'APPROVED' ? 'Aprovado' :
                              budget.status === 'REJECTED' ? 'Rejeitado' :
                                budget.status === 'SENT' ? 'Enviado' :
                                  budget.status === 'NEGOTIATION' ? 'Em Negociação' :
                                    budget.status}
                        </span>
                      </div>
                    </div>
                    {budget.budget_items && budget.budget_items.length > 0 && (
                      <div className="border-t border-slate-800 pt-4">
                        <p className="text-xs text-slate-500 uppercase font-bold mb-2">Itens ({budget.budget_items.length})</p>
                        <div className="space-y-1">
                          {budget.budget_items.slice(0, 3).map((item: any) => (
                            <p key={item.id} className="text-sm text-slate-300">• {item.description}</p>
                          ))}
                          {budget.budget_items.length > 3 && (
                            <p className="text-xs text-slate-500">+ {budget.budget_items.length - 3} mais...</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CLINICAL TAB (TREATMENTS - REAL DATA) */}
        {activeTab === 'clinical' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Tratamentos Clínicos</h2>
            </div>
            {clinicalTreatments.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
                <Stethoscope size={48} className="text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Nenhum tratamento registrado</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {clinicalTreatments.map(treatment => {
                  const handleUpdateStatus = async (newStatus: string) => {
                    try {
                      const { error } = await supabase
                        .from('treatment_items')
                        .update({
                          status: newStatus,
                          ...(newStatus === 'COMPLETED' ? { execution_date: new Date().toISOString().split('T')[0] } : {}),
                          updated_at: new Date().toISOString()
                        })
                        .eq('id', treatment.id);

                      if (error) throw error;
                      window.location.reload();
                    } catch (error) {
                      console.error('Error updating treatment:', error);
                      alert('Erro ao atualizar tratamento');
                    }
                  };

                  return (
                    <div
                      key={treatment.id}
                      className="bg-slate-900 border border-slate-800 rounded-xl p-6"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-white mb-2">
                            {treatment.procedure_name || treatment.description}
                          </h4>
                          <div className="flex items-center gap-3 text-sm text-slate-400">
                            <span>{new Date(treatment.created_at).toLocaleDateString('pt-BR')}</span>
                            {treatment.region && (
                              <span className="px-2 py-1 bg-slate-800 rounded text-xs">{treatment.region}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${treatment.status === 'COMPLETED' ? 'bg-emerald-900/30 text-emerald-300' :
                            treatment.status === 'IN_PROGRESS' ? 'bg-blue-900/30 text-blue-300' :
                              'bg-amber-900/30 text-amber-300'
                            }`}>
                            {treatment.status === 'COMPLETED' ? '✓ Concluído' :
                              treatment.status === 'IN_PROGRESS' ? '⏳ Em Andamento' :
                                '📋 Planejado'}
                          </span>

                          {treatment.status === 'NOT_STARTED' && (
                            <button
                              onClick={() => confirm('Iniciar este tratamento?') && handleUpdateStatus('IN_PROGRESS')}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                            >
                              ▶️ Iniciar
                            </button>
                          )}

                          {treatment.status === 'IN_PROGRESS' && (
                            <button
                              onClick={() => confirm('Finalizar este tratamento?') && handleUpdateStatus('COMPLETED')}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium"
                            >
                              ✓ Finalizar
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-800">
                        <div>
                          <p className="text-xs text-slate-500 uppercase font-bold mb-1">Valor Unitário</p>
                          <p className="text-sm text-slate-300">R$ {(treatment.unit_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 uppercase font-bold mb-1">Valor Total</p>
                          <p className="text-sm text-slate-300">R$ {(treatment.total_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                      </div>

                      {treatment.execution_date && (
                        <div className="mt-3 pt-3 border-t border-slate-800">
                          <p className="text-xs text-slate-500 uppercase font-bold mb-1">Data de Conclusão</p>
                          <p className="text-sm text-emerald-400">{new Date(treatment.execution_date).toLocaleDateString('pt-BR')}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ORTHO TAB (REAL DATA) */}
        {activeTab === 'ortho' && (
          <OrthoTab
            patientId={id!}
            patientName={patient.name}
            clinicId={patient.clinic_id}
          />
        )}

        {/* HOF TAB */}
        {activeTab === 'hof' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Harmonização Orofacial (HOF)</h2>
            </div>
            {hofTreatments.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
                <Sparkles size={48} className="text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Nenhum tratamento de HOF registrado</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {hofTreatments.map(treatment => {
                  const handleUpdateStatus = async (newStatus: string) => {
                    try {
                      const { error } = await supabase
                        .from('treatment_items')
                        .update({
                          status: newStatus,
                          ...(newStatus === 'COMPLETED' ? { execution_date: new Date().toISOString().split('T')[0] } : {}),
                          updated_at: new Date().toISOString()
                        })
                        .eq('id', treatment.id);

                      if (error) throw error;
                      window.location.reload();
                    } catch (error) {
                      console.error('Error updating treatment:', error);
                      alert('Erro ao atualizar tratamento');
                    }
                  };

                  return (
                    <div
                      key={treatment.id}
                      className="bg-slate-900 border border-slate-800 rounded-xl p-6"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-white mb-2">
                            {treatment.procedure_name || treatment.description}
                          </h4>
                          <div className="flex items-center gap-3 text-sm text-slate-400">
                            <span>{new Date(treatment.created_at).toLocaleDateString('pt-BR')}</span>
                            {treatment.specialty && (
                              <span className="px-2 py-1 bg-slate-800 rounded text-xs">{treatment.specialty}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${treatment.status === 'COMPLETED' ? 'bg-emerald-900/30 text-emerald-300' :
                            treatment.status === 'IN_PROGRESS' ? 'bg-blue-900/30 text-blue-300' :
                              'bg-amber-900/30 text-amber-300'
                            }`}>
                            {treatment.status === 'COMPLETED' ? '✓ Concluído' :
                              treatment.status === 'IN_PROGRESS' ? '⏳ Em Andamento' :
                                '📋 Planejado'}
                          </span>

                          {treatment.status === 'NOT_STARTED' && (
                            <button
                              onClick={() => confirm('Iniciar este tratamento?') && handleUpdateStatus('IN_PROGRESS')}
                              className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700"
                            >
                              Iniciar
                            </button>
                          )}
                          {treatment.status === 'IN_PROGRESS' && (
                            <button
                              onClick={() => confirm('Concluir este tratamento?') && handleUpdateStatus('COMPLETED')}
                              className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs hover:bg-emerald-700"
                            >
                              Concluir
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* FINANCIAL TAB */}
        {activeTab === 'financial' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">Resumo Financeiro</h2>
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <p className="text-sm text-slate-500 uppercase font-bold mb-2">Total Aprovado</p>
                <p className="text-3xl font-black text-blue-400">R$ {financialData.totalApproved.toLocaleString('pt-BR')}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <p className="text-sm text-slate-500 uppercase font-bold mb-2">Total Pago</p>
                <p className="text-3xl font-black text-emerald-400">R$ {financialData.totalPaid.toLocaleString('pt-BR')}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <p className="text-sm text-slate-500 uppercase font-bold mb-2">Saldo Devedor</p>
                <p className={`text-3xl font-black ${financialData.balanceDue > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                  R$ {financialData.balanceDue.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>

            {/* Installments Component */}
            <PatientInstallments patientId={id!} />
          </div>
        )}

        {/* GALLERY TAB (REAL DATA) */}
        {activeTab === 'gallery' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Galeria Clínica</h2>
            </div>
            {clinicalImages.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
                <Image size={48} className="text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Nenhuma imagem cadastrada</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {clinicalImages.map(img => (
                  <div key={img.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    <img src={img.url} alt={img.description} className="w-full h-48 object-cover" />
                    <div className="p-3">
                      <p className="text-sm text-slate-300">{img.description}</p>
                      <p className="text-xs text-slate-500 mt-1">{new Date(img.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default function PatientDetailWrapper() {
  return <PatientDetailContent />;
}
