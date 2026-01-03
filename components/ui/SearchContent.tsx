import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, UserPlus, Calendar, DollarSign, FileText, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { supabase } from "../../src/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { useSheetStore } from "../../stores/useSheetStore";
import { useAuth } from "../../contexts/AuthContext";
import { cn } from "../../src/lib/utils";
import { getTodaysPrinciple } from "../../src/data/strategicWisdom";
import { StrategicWisdomModal } from "./StrategicWisdomModal";

export default function SearchContent() {
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);
    const [isWisdomModalOpen, setIsWisdomModalOpen] = useState(false);

    const navigate = useNavigate();
    const { openSheet } = useSheetStore();
    const { profile } = useAuth();

    const todaysPrinciple = useMemo(() => getTodaysPrinciple(), []);
    const greeting = new Date().getHours() < 12 ? "Bom dia" : new Date().getHours() < 18 ? "Boa tarde" : "Boa noite";

    // --- MOTOR DE BUSCA EM MEMÓRIA (ZERO LATENCY) ---
    // Carrega lista LEVE de pacientes para busca instantânea

    const { data: allPatients } = useQuery({
        queryKey: ["patients-lite", profile?.clinic_id],
        queryFn: async () => {
            if (!profile?.clinic_id) return [];
            const { data } = await supabase
                .from("patients")
                .select("id, name, phone, cpf")
                .eq("clinic_id", profile.clinic_id)
                .eq("is_active", true) // Apenas ativos no cache rápido
                .limit(2000); // Segurança para não explodir memória em clínicas gigantes
            return data || [];
        },
        enabled: !!profile?.clinic_id,
        staleTime: 1000 * 60 * 15, // 15 minutos de cache (Atualiza pouco)
    });

    const searchData = useCallback((searchQuery: string) => {
        const term = searchQuery.toLowerCase().trim();
        if (!term || term.length < 2) {
            setResults([]);
            return;
        }

        // 1. Lógica de Comandos (Mantida)
        const commands = [];
        if (term.includes('inadimpl') || term.includes('devedor')) {
            commands.push({
                id: 'cmd-overdue', type: 'command', name: 'Relatório de Inadimplentes',
                phone: 'Financeiro > Recebíveis', path: '/financial?tab=receivables&status=OVERDUE',
                icon: <DollarSign className="h-6 w-6 text-red-500" />
            });
        }
        if (term.includes('pagar') || term.includes('despesa')) {
            commands.push({
                id: 'cmd-payables', type: 'command', name: 'Contas a Pagar',
                phone: 'Financeiro > Despesas', path: '/financial?tab=payables',
                icon: <DollarSign className="h-6 w-6 text-orange-500" />
            });
        }
        if (term.includes('agenda') || term.includes('hoje')) {
            commands.push({
                id: 'cmd-agenda', type: 'command', name: 'Agenda de Hoje',
                phone: 'Atendimentos do Dia', path: '/agenda?view=day&date=today',
                icon: <Calendar className="h-6 w-6 text-purple-500" />
            });
        }

        // 2. Busca na Memória (Instantânea)
        // Fuzzy search simples: match no nome ou telefone
        const patientResults = (allPatients || [])
            .filter(p =>
                (p.name && p.name.toLowerCase().includes(term)) ||
                (p.phone && p.phone.includes(term)) ||
                (p.cpf && p.cpf.includes(term))
            )
            .slice(0, 6) // Top 6 resultados
            .map(p => ({ ...p, type: 'patient' }));

        setResults([...commands, ...patientResults]);
    }, [allPatients]);


    useEffect(() => {
        searchData(query);
    }, [query]);

    const quickActions = [
        { label: "Agenda", icon: Calendar, path: "/agenda?view=day&date=today", color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950/30" },
        { label: "Novo Paciente", icon: UserPlus, path: "/patients/new", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
        { label: "Receber", icon: DollarSign, path: "/financial?tab=receivables", color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
        { label: "Orçamentos", icon: FileText, path: "/budgets/new", color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30" },
    ];

    return (
        <div className="w-full min-h-screen px-6 py-16 bg-[#F5F6FA] dark:bg-[#0B0B0C] transition-all flex flex-col items-center">

            {/* TÍTULO E SABEDORIA DISCRETA */}
            <div className="w-full max-w-5xl text-left mb-10 space-y-2">
                <h1 className="text-4xl font-light text-slate-700 dark:text-white tracking-tight">
                    {greeting}, <span className="font-semibold">{profile?.name?.split(' ')[0] || "Dr."}</span>
                </h1>

                {/* Princípio de Gestão (Invisível Tech) */}
                <button
                    onClick={() => setIsWisdomModalOpen(true)}
                    className="flex items-center gap-1.5 text-[10px] text-slate-400 hover:text-blue-500 transition-colors italic font-light tracking-wide group"
                >
                    <Sparkles className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    "{todaysPrinciple.verse.substring(0, 55)}..." ({todaysPrinciple.verseReference})
                </button>
            </div>

            {/* BARRA DE PESQUISA GLASS (A Estrela) */}
            <div className="w-full max-w-5xl relative mb-12 group">
                <div className="absolute inset-0 bg-white/70 dark:bg-white/5 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 dark:border-white/10 transition-all group-focus-within:shadow-xl" />

                <div className="relative flex items-center h-20 px-8">
                    <Search className="h-7 w-7 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Buscar pacientes, financeiro ou comandos..."
                        className="ml-4 flex-1 bg-transparent text-2xl outline-none focus:outline-none focus:ring-0 border-0 text-slate-700 dark:text-white placeholder:text-slate-300 font-light"
                    />
                    {loading && <Loader2 className="h-6 w-6 animate-spin text-slate-400" />}
                </div>
            </div>

            {/* AÇÕES RÁPIDAS (ESTILO IPHONE) */}
            {!query && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full max-w-5xl animate-in fade-in duration-700">
                    {quickActions.map((a) => (
                        <button
                            key={a.label}
                            onClick={() => navigate(a.path)}
                            className="p-8 rounded-[32px] bg-white/70 dark:bg-white/5 backdrop-blur-xl shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all border border-white/50 dark:border-white/10 flex flex-col items-center group"
                        >
                            <div className={cn("p-4 rounded-2xl mb-4 transition-colors", a.bg)}>
                                <a.icon className={cn("h-10 w-10", a.color)} />
                            </div>
                            <span className="text-xs font-bold text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white uppercase tracking-[2px]">
                                {a.label}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {/* RESULTADOS DE BUSCA (COMANDO OU PACIENTE) */}
            {query && results.length > 0 && (
                <div className="w-full max-w-5xl mt-2 space-y-3 animate-in slide-in-from-top-4 duration-500">
                    {results.map((res) => (
                        <button
                            key={res.id}
                            onClick={() => res.type === 'command' ? navigate(res.path) : openSheet("patient", res.id)}
                            className="w-full flex items-center justify-between px-8 py-6 bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-[28px] border border-white/60 dark:border-white/10 shadow-sm hover:shadow-md transition-all group"
                        >
                            <div className="flex items-center gap-6">
                                <div className="h-14 w-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl font-light">
                                    {res.type === 'command' ? res.icon : res.name?.charAt(0)}
                                </div>
                                <div className="text-left">
                                    <p className="text-xl font-medium text-slate-700 dark:text-white tracking-tight">{res.name}</p>
                                    <p className="text-sm text-slate-400 uppercase tracking-widest">{res.phone}</p>
                                </div>
                            </div>
                            <ArrowRight className="h-6 w-6 text-slate-200 group-hover:text-blue-500 group-hover:translate-x-2 transition-all" />
                        </button>
                    ))}
                </div>
            )}

            {/* NENHUM RESULTADO */}
            {query && results.length === 0 && !loading && (
                <div className="mt-20 text-center animate-in fade-in">
                    <p className="text-slate-400 font-light text-xl">Nenhum registro ou comando encontrado.</p>
                </div>
            )}

            {/* Modal de Sabedoria */}
            <StrategicWisdomModal
                isOpen={isWisdomModalOpen}
                onClose={() => setIsWisdomModalOpen(false)}
                principle={todaysPrinciple}
                roleSpecificAction={todaysPrinciple.practicalAction}
                userRole={profile?.role || 'PROFESSIONAL'}
            />
        </div>
    );
}
