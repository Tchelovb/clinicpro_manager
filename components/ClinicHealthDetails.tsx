import React, { useState, useMemo } from 'react';
import { sentinels } from '../config/sentinels';
import { Search, Activity, DollarSign, Users, Award, Shield, Smartphone, Eye, CheckCircle, AlertTriangle } from 'lucide-react';
import ClinicHealth10x50 from './ClinicHealthCenter'; // Import Radar Component

import { useNavigate } from 'react-router-dom';

const ClinicHealthDetails: React.FC = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPillar, setSelectedPillar] = useState<number | 'ALL'>('ALL');

    // Filter Logic
    const filteredSentinels = useMemo(() => {
        return sentinels.filter(s => {
            const matchesSearch =
                s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.correctionAction.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesPillar = selectedPillar === 'ALL' || s.pillarId === selectedPillar;
            return matchesSearch && matchesPillar;
        });
    }, [searchTerm, selectedPillar]);

    // Mock Status Logic (In a real scenario, this would compare actual metrics vs targets)
    // For now, we randomize status based on ID to simulate a live dashboard
    const getStatus = (id: string) => {
        const hash = id.charCodeAt(0) + id.charCodeAt(1);
        if (hash % 5 === 0) return 'CRITICAL';
        if (hash % 3 === 0) return 'WARNING';
        return 'OK';
    };

    const pillarIcons: Record<number, any> = {
        1: Activity, 2: DollarSign, 3: Award, 4: Shield, 5: Users,
        6: Activity, 7: Shield, 8: Users, 9: Smartphone, 10: Eye
    };

    return (
        <div className="bg-[#09090b] min-h-screen text-slate-200 p-8 font-sans overflow-x-hidden">
            {/* Header */}
            <div className="mb-8 flex items-end justify-between border-b border-slate-800 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Activity className="text-blue-500" />
                        ClinicHealth - Gestão Estratégica BOS
                    </h1>
                    <p className="text-slate-500 mt-2">
                        Painel de Controle 10x50 (Radar + 50 Sentinelas).
                    </p>
                </div>
                <div className="flex gap-4 items-center">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
                    >
                        Voltar para Dashboard
                    </button>
                    <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-xs font-mono text-green-500">SYSTEM ONLINE</span>
                    </div>
                </div>
            </div>

            {/* RADAR 10x50 INTEGRATION (Topo) */}
            <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
                <ClinicHealth10x50 />
            </div>

            {/* SEPARATOR */}
            <div className="h-px bg-slate-800 my-8"></div>

            {/* TABLE HEADER */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
                    <Shield size={20} className="text-emerald-500" />
                    Auditoria de Sentinelas (War Room)
                </h2>
            </div>

            {/* Controls */}
            <div className="flex gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-2.5 text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por sentinela (S1...), meta ou ação..."
                        className="w-full bg-slate-900 border border-slate-800 text-slate-200 pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <select
                    className="bg-slate-900 border border-slate-800 text-slate-200 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    value={selectedPillar}
                    onChange={(e) => setSelectedPillar(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                >
                    <option value="ALL">Todos os Pilares</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                        <option key={n} value={n}>Pilar {n}</option>
                    ))}
                </select>
            </div>

            {/* Data Table */}
            <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-900/50 border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                                <th className="p-4 w-16 text-center">ID</th>
                                <th className="p-4">Pilar</th>
                                <th className="p-4">Sentinela</th>
                                <th className="p-4">Meta Ideal</th>
                                <th className="p-4 w-32 text-center">Status</th>
                                <th className="p-4">Ação de Correção (BOS)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {filteredSentinels.map((s) => {
                                const status = getStatus(s.id);
                                const PillarIcon = pillarIcons[s.pillarId] || Activity;

                                return (
                                    <tr key={s.id} className="hover:bg-slate-900/30 transition-colors group">
                                        <td className="p-4 text-center font-mono text-xs text-slate-500 bg-slate-900/20 border-r border-slate-800/50">
                                            {s.id}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 rounded bg-slate-800 text-slate-400 group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors">
                                                    <PillarIcon size={14} />
                                                </div>
                                                <span className="text-xs font-semibold text-slate-400 uppercase">{s.pillarName}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium text-slate-200">{s.name}</div>
                                            <div className="text-xs text-slate-500 mt-0.5">{s.description}</div>
                                        </td>
                                        <td className="p-4 font-mono text-sm text-blue-300">
                                            {s.target}
                                        </td>
                                        <td className="p-4 text-center">
                                            {status === 'OK' && (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium">
                                                    <CheckCircle size={12} /> OK
                                                </span>
                                            )}
                                            {status === 'WARNING' && (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-xs font-medium">
                                                    <AlertTriangle size={12} /> Atenção
                                                </span>
                                            )}
                                            {status === 'CRITICAL' && (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-medium">
                                                    <AlertTriangle size={12} /> Crítico
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                                                {s.correctionAction}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-8 text-center text-xs text-slate-600">
                ClinicHealth OS v2.0 • Powered by 10x50 Method • HarmonyFace
            </div>
        </div>
    );
};

export default ClinicHealthDetails;
