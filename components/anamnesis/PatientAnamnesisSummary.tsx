
import React, { useMemo } from 'react';
import { AnamnesisResponse } from '../../src/services/anamnesis/AnamnesisRepository';
import { AnamnesisIntelligence, MedicalAlert, SalesOpportunity } from '../../src/services/anamnesis/AnamnesisIntelligence';
import { AlertTriangle, Info, HeartPulse, DollarSign, Sparkles } from 'lucide-react';
import { cn } from '../../src/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface Props {
    responses: Record<string, any>; // Flattened responses from all templates
    patientName: string;
}

export const PatientAnamnesisSummary: React.FC<Props> = ({ responses, patientName }) => {

    // Analisa em tempo real
    const { alerts, opportunities } = useMemo(() => AnamnesisIntelligence.analyze(responses), [responses]);

    return (
        <div className="space-y-6 animate-in fade-in duration-700">

            {/* 1. Radar de Riscos (Alertas) */}
            {alerts.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <HeartPulse className="w-4 h-4 text-rose-500" />
                        Radar Clínico & Segurança
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {alerts.map((alert, idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    "p-4 rounded-xl border-l-4 shadow-sm flex items-start gap-3",
                                    alert.type === 'CRITICAL' ? "bg-rose-50 border-rose-500 text-rose-900" :
                                        alert.type === 'HIGH' ? "bg-orange-50 border-orange-500 text-orange-900" :
                                            alert.type === 'MODERATE' ? "bg-yellow-50 border-yellow-500 text-yellow-900" :
                                                "bg-blue-50 border-blue-500 text-blue-900"
                                )}
                            >
                                <AlertTriangle className={cn("w-5 h-5 flex-shrink-0 mt-0.5",
                                    alert.type === 'CRITICAL' ? "text-rose-600 animate-pulse" : "text-current"
                                )} />
                                <div>
                                    <strong className="block font-bold text-sm mb-1">{alert.title}</strong>
                                    <p className="text-xs opacity-90 leading-relaxed">{alert.message}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 2. Oportunidades de Venda (High Ticket) */}
            {opportunities.length > 0 && (
                <div className="space-y-3 mt-8">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        Inteligência Comercial
                    </h3>
                    <div className="p-1 bg-gradient-to-r from-amber-200 to-yellow-400 rounded-xl shadow-lg">
                        <div className="bg-white rounded-lg p-5">
                            <div className="flex items-center gap-2 text-amber-600 font-bold mb-4">
                                <DollarSign className="w-5 h-5" />
                                Oportunidades Detectadas
                            </div>
                            <div className="space-y-3">
                                {opportunities.map((opp, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg border border-slate-100 transition-colors cursor-pointer group">
                                        <div>
                                            <p className="font-bold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors">{opp.procedure}</p>
                                            <p className="text-xs text-slate-500">{opp.reason}</p>
                                        </div>
                                        <button className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                            Apresentar Protocolo
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Se não houver nada */}
            {alerts.length === 0 && opportunities.length === 0 && (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400">
                    <p>Nenhum alerta crítico ou oportunidade detectada.</p>
                </div>
            )}

        </div>
    );
};
