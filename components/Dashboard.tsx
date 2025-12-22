import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  MessageCircle,
  Phone,
  User,
  ArrowRight,
  ListTodo,
  CheckSquare,
  Bell,
  X,
  AlertTriangle,
  DollarSign,
  Target,
  Brain,
  Activity,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useDashboardData } from "../hooks/useDashboardData";
import { LeadStatus } from "../types";
import AIInsightsFeed from "./dashboard/AIInsightsFeed";
import ComplianceWidget from "./dashboard/ComplianceWidget";
import { WarRoomCard } from "./WarRoomCard";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);

  // Usar o hook personalizado para dados do dashboard
  const {
    appointments: todaysAppointments,
    leads,
    kpis,
    reminders,
    isLoading,
    hasError,
    appointmentsError,
    leadsError,
    patientsError,
    refetch,
  } = useDashboardData();

  // Filtrar leads prioritários
  const priorityLeads = useMemo(
    () =>
      leads.filter(
        (l) => l.status === LeadStatus.NEW || l.status === LeadStatus.CONTACT
      ),
    [leads]
  );

  // Componente de estado vazio
  const EmptyState: React.FC<{
    icon: React.ComponentType<any>;
    title: string;
    description: string;
  }> = ({ icon: Icon, title, description }) => (
    <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 p-6">
      <Icon size={32} className="mb-2 opacity-50" />
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-center mt-1">{description}</p>
    </div>
  );

  // Componente de erro
  const ErrorState: React.FC<{
    title: string;
    error: any;
    onRetry: () => void;
  }> = ({ title, error, onRetry }) => (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
        <span className="text-red-800 dark:text-red-200 font-medium">
          {title}
        </span>
      </div>
      <p className="text-sm text-red-700 dark:text-red-300 mb-3">
        {error?.message || "Erro desconhecido"}
      </p>
      <button
        onClick={onRetry}
        className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
      >
        Tentar Novamente
      </button>
    </div>
  );

  // Estado de loading
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border border-blue-600 border-t-transparent mb-4" />
        <p className="text-gray-600 dark:text-gray-400">
          Carregando dashboard...
        </p>
      </div>
    );
  }

  // Estado de erro geral
  if (hasError) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="text-red-800 dark:text-red-200">
              Erro ao carregar dashboard
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {appointmentsError && (
              <p className="text-sm text-red-700 dark:text-red-300">
                • Agendamentos: {appointmentsError.message}
              </p>
            )}
            {leadsError && (
              <p className="text-sm text-red-700 dark:text-red-300">
                • Leads: {leadsError.message}
              </p>
            )}
            {patientsError && (
              <p className="text-sm text-red-700 dark:text-red-300">
                • Pacientes: {patientsError.message}
              </p>
            )}
          </div>
          <button
            onClick={refetch}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  // Funções auxiliares
  const handleConfirmAppointment = (id: string) => {
    // TODO: Implementar confirmação de agendamento
    console.log("Confirmar agendamento:", id);
  };

  const handleQuickLeadAction = (id: string) => {
    // TODO: Implementar ação rápida de lead
    navigate("/crm");
  };

  const handleCompleteTask = (id: string) => {
    setCompletedTasks((prev) => [...prev, id]);
  };

  const getPatientPhone = (appointment: any) => {
    // TODO: Implementar busca de telefone do paciente
    return "";
  };

  // Componente ReminderCard
  const ReminderCard: React.FC<{ item: any }> = ({ item }) => {
    const colors: any = {
      orange:
        "border-l-orange-500 bg-white dark:bg-gray-800 dark:border-gray-700",
      purple:
        "border-l-purple-500 bg-white dark:bg-gray-800 dark:border-gray-700",
      blue: "border-l-blue-500 bg-white dark:bg-gray-800 dark:border-gray-700",
      red: "border-l-red-500 bg-white dark:bg-gray-800 dark:border-gray-700",
    };

    const badgeColors: any = {
      urgent:
        "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
      medium:
        "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
      normal:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    };

    return (
      <div
        className={`p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 border-l-4 relative group transition-all duration-300 hover:shadow-md ${colors[item.color]
          }`}
      >
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-lg ${badgeColors[item.type]
                .replace("text-", "bg-")
                .replace("100", "50")}`}
            >
              <div
                className={`w-2 h-2 rounded-full ${badgeColors[item.type].split(" ")[0] === "bg-orange"
                  ? "bg-orange-500"
                  : badgeColors[item.type].split(" ")[0] === "bg-purple"
                    ? "bg-purple-500"
                    : "bg-blue-500"
                  }`}
              />
            </div>
            <span
              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${badgeColors[item.type]
                }`}
            >
              {item.type === "urgent"
                ? "Prioridade"
                : item.type === "medium"
                  ? "Atenção"
                  : "Lembrete"}
            </span>
          </div>
          <button
            onClick={() => handleCompleteTask(item.id)}
            className="text-gray-300 hover:text-green-500 transition-colors"
            title="Concluir Lembrete"
          >
            <CheckCircle size={20} />
          </button>
        </div>
        <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm">
          {item.title}
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
          {item.desc}
        </p>

        <button
          onClick={() => navigate(item.actionPath)}
          className="mt-3 w-full py-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-lg border border-gray-200 dark:border-gray-600 transition-colors flex items-center justify-center gap-2"
        >
          {item.actionLabel} <ArrowRight size={12} />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0 animate-in fade-in flex flex-col">
      {/* HEADER & GLOBAL STATUS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Painel Operacional
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
            <Calendar size={14} />{" "}
            {new Date().toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
          {profile && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Clínica: {profile.clinics?.name || "Não identificada"}
            </p>
          )}
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          {/* KPI Cards */}
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm min-w-[120px]">
              <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold">
                Atendimentos
              </p>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {kpis.confirmed}/{kpis.appointments}
                </span>
                <div className="h-1.5 w-10 bg-gray-100 dark:bg-gray-700 rounded-full">
                  <div
                    className="h-1.5 bg-blue-500 rounded-full"
                    style={{
                      width: `${kpis.appointments > 0
                        ? (kpis.confirmed / kpis.appointments) * 100
                        : 0
                        }%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm min-w-[120px]">
              <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold">
                Novas Oportunidades
              </p>
              <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {kpis.pendingLeads}
              </span>
            </div>

            <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm min-w-[130px]">
              <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold flex items-center gap-1">
                <Target size={10} /> Meta do Dia
              </p>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                  75%
                </span>
                <div
                  className="h-1.5 w-10 bg-gray-100 dark:bg-gray-700 rounded-full"
                  title="Progresso do dia"
                >
                  <div
                    className="h-1.5 bg-green-500 rounded-full"
                    style={{ width: "75%" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-3 rounded-xl border transition-colors relative ${showNotifications
                ? "bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-300"
                : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
            >
              <Bell size={20} />
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                  <h3 className="font-bold text-gray-700 dark:text-gray-300 text-xs uppercase">
                    Notificações
                  </h3>
                  <button onClick={() => setShowNotifications(false)}>
                    <X size={14} className="text-gray-400 dark:text-gray-500" />
                  </button>
                </div>
                <div className="p-8 text-center text-gray-400 dark:text-gray-500">
                  <Bell size={32} className="mb-2 opacity-50 mx-auto" />
                  <p className="text-sm">Nenhuma notificação pendente</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- INTELLIGENCE MODULES (NEW) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full mb-8">

        {/* 1. CENTRAL DE METAS (WAR ROOM) */}
        <WarRoomCard />

        {/* 2. BOS INTELLIGENCE CARD */}
        <div
          onClick={() => navigate('/dashboard/bos-intelligence')}
          className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 shadow-xl border border-gray-700 overflow-hidden cursor-pointer group hover:scale-[1.02] transition-all"
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32">
              <Brain size={128} className="text-white" />
            </div>
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-500/20 rounded-xl backdrop-blur-sm">
                <Brain size={24} className="text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">BOS Intelligence</h2>
                <p className="text-red-200 text-xs">SCR-01-B</p>
              </div>
              <ArrowRight className="ml-auto text-gray-500 group-hover:text-white transition-colors" size={20} />
            </div>

            <p className="text-gray-400 text-sm mb-6 h-10">
              Alertas críticos e insights proativos para maximizar resultados.
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-400" />
                  <span className="text-gray-300 text-sm font-medium">Alertas Críticos</span>
                </div>
                <span className="text-white font-bold">3</span>
              </div>
              <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-yellow-400" />
                  <span className="text-gray-300 text-sm font-medium">Insights Ativos</span>
                </div>
                <span className="text-white font-bold">7</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-700">
              <span className="text-xs text-gray-500 group-hover:text-gray-300 transition-colors">Clique para ver todos os alertas</span>
            </div>
          </div>
        </div>

        {/* 3. SAÚDE DA CLÍNICA (SCORE) */}
        <div
          onClick={() => navigate('/dashboard/clinic-health')}
          className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 shadow-xl border border-gray-700 overflow-hidden cursor-pointer group hover:scale-[1.02] transition-all"
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32">
              <Activity size={128} className="text-white" />
            </div>
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-500/20 rounded-xl backdrop-blur-sm">
                <Activity size={24} className="text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Saúde da Clínica</h2>
                <p className="text-blue-200 text-xs">Health Score</p>
              </div>
              <ArrowRight className="ml-auto text-gray-500 group-hover:text-white transition-colors" size={20} />
            </div>

            <p className="text-gray-400 text-sm mb-6 h-10">
              Score geral de saúde baseado nos 5 pilares operacionais.
            </p>

            <div className="flex items-center justify-center py-2">
              <div className="relative w-24 h-24 flex items-center justify-center rounded-full border-4 border-gray-700">
                <span className="text-3xl font-black text-white">0</span>
                <span className="absolute -bottom-6 text-xs text-gray-500 font-bold uppercase">Score</span>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-700 text-center">
              <span className="text-xs text-gray-500 group-hover:text-gray-300 transition-colors">Clique para análise detalhada</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI INSIGHTS WIDGET (BOS LAYER) - Keeping as secondary feed or removing if redundant */}
      {/* <AIInsightsFeed /> */}

      {/* --- GRID LAYOUT --- */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 w-full items-start">
        {/* BLOCK 1: AGENDA DO DIA */}
        <div className="flex flex-col gap-4 w-full">
          <div className="flex items-center justify-between shrink-0">
            <h3 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <Clock className="text-blue-600 dark:text-blue-400" size={18} />{" "}
              Agenda de Hoje
            </h3>
            <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-xs font-bold px-2 py-0.5 rounded-full">
              {todaysAppointments.length}
            </span>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
            {todaysAppointments.length > 0 ? (
              <div className="p-2 space-y-2">
                {todaysAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50/30 dark:hover:bg-blue-900/20 transition-all group relative"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <div className="text-center min-w-[45px]">
                          <span className="block text-sm font-bold text-gray-900 dark:text-white">
                            {apt.time}
                          </span>
                          <span className="block text-[10px] text-gray-400 uppercase">
                            {apt.type}
                          </span>
                        </div>
                        <div className="w-px h-8 bg-gray-200 dark:bg-gray-600"></div>
                        <div>
                          <p className="font-bold text-gray-800 dark:text-gray-200 text-sm">
                            {apt.patientName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {apt.doctorName}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${apt.status === "Confirmado"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                          : apt.status === "Pendente"
                            ? "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300"
                            : apt.status === "Concluído"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                              : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300"
                          }`}
                      >
                        {apt.status}
                      </div>
                    </div>

                    {/* Actions for Pending */}
                    {apt.status === "Pendente" && (
                      <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 flex gap-2">
                        <button
                          onClick={() => handleConfirmAppointment(apt.id)}
                          className="flex-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/50 py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                        >
                          <CheckCircle size={12} /> Confirmar
                        </button>
                        <a
                          href={`https://wa.me/55${getPatientPhone(apt)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                        >
                          <MessageCircle size={12} /> WhatsApp
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Calendar}
                title="Nenhum agendamento hoje"
                description="Não há agendamentos marcados para hoje. Que tal verificar a agenda completa?"
              />
            )}
            <div className="p-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-center shrink-0">
              <button
                onClick={() => navigate("/agenda")}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Ver Agenda Completa
              </button>
            </div>
          </div>
        </div>

        {/* BLOCK 2: LEMBRETES */}
        <div className="flex flex-col gap-6 w-full">
          <ComplianceWidget />
          <div className="flex items-center justify-between shrink-0">
            <h3 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <ListTodo className="text-orange-500" size={18} /> Lembretes &
              Tarefas
            </h3>
          </div>

          <div className="space-y-4">
            {reminders.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reminders.map((item) => (
                  <ReminderCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 bg-gray-100 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-gray-400">
                <CheckCircle size={32} className="mb-2" />
                <p className="text-sm">Tudo em dia!</p>
              </div>
            )}

            {/* Manual Task Input */}
            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">
                Novo Lembrete Rápido
              </p>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Digite e pressione Enter..."
                  className="w-full pl-3 pr-10 py-2 text-xs border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:border-blue-500"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-600 dark:text-blue-400 hover:text-blue-800">
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* BLOCK 3: CRM QUEUE */}
        <div className="flex flex-col gap-4 w-full">
          <div className="flex items-center justify-between shrink-0">
            <h3 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <User
                className="text-purple-600 dark:text-purple-400"
                size={18}
              />{" "}
              Fila de Oportunidades
            </h3>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
            {priorityLeads.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {priorityLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="p-4 hover:bg-purple-50/20 dark:hover:bg-purple-900/10 transition-colors group"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${lead.status === "Nova Oportunidade"
                              ? "bg-blue-500"
                              : "bg-yellow-500"
                              }`}
                          ></span>
                          <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                            {lead.name}
                          </h4>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-4">
                          Origem: {lead.source} •{" "}
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {lead.status}
                          </span>
                        </p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="p-1.5 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-300 rounded hover:bg-green-100 dark:hover:bg-green-900/50"
                          title="WhatsApp"
                        >
                          <MessageCircle size={14} />
                        </button>
                        <button
                          className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50"
                          title="Ligar"
                        >
                          <Phone size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-3 ml-4 flex gap-2">
                      <button
                        onClick={() => handleQuickLeadAction(lead.id)}
                        className="text-[10px] font-bold uppercase tracking-wide text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-700 px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      >
                        Registrar Contato
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={CheckCircle}
                title="Nenhuma oportunidade pendente"
                description="Todas as oportunidades foram processadas. Excelente trabalho!"
              />
            )}
            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 border-t border-purple-100 dark:border-purple-800 shrink-0">
              <div className="flex justify-between items-center text-xs">
                <span className="text-purple-800 dark:text-purple-300 font-bold">
                  Meta de Conversão
                </span>
                <span className="bg-white dark:bg-purple-800/50 px-2 py-0.5 rounded text-purple-700 dark:text-purple-200 font-bold shadow-sm">
                  0/5 Hoje
                </span>
              </div>
              <div className="w-full bg-purple-200 dark:bg-purple-800 h-1.5 rounded-full mt-2">
                <div
                  className="bg-purple-600 h-1.5 rounded-full"
                  style={{ width: "0%" }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div >
  );
};

export default Dashboard;
