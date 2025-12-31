import React from 'react';
import { useGeneralClinical, DentalChartItem } from '../../hooks/useGeneralClinical';
import { Stethoscope, AlertTriangle, FileText } from 'lucide-react';

interface GeneralTabProps {
    patientId: string;
}

const TOOTH_MAP = [
    // Upper Right (Quadrante 1) - 18 a 11
    [18, 17, 16, 15, 14, 13, 12, 11],
    // Upper Left (Quadrante 2) - 21 a 28
    [21, 22, 23, 24, 25, 26, 27, 28],
    // Lower Right (Quadrante 4) - 48 a 41
    [48, 47, 46, 45, 44, 43, 42, 41],
    // Lower Left (Quadrante 3) - 31 a 38
    [31, 32, 33, 34, 35, 36, 37, 38]
];

const Tooth: React.FC<{ number: number; data?: DentalChartItem }> = ({ number, data }) => {
    let statusColor = "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700";
    let statusText = "";

    if (data) {
        switch (data.status_code) {
            case 'DECAYED': statusColor = "bg-red-50 border-red-200 text-red-600"; statusText = "Cáries"; break;
            case 'FILLED': statusColor = "bg-slate-100 border-slate-300 text-slate-600"; statusText = "Rest."; break;
            case 'MISSING': statusColor = "bg-slate-50 border-dashed border-slate-200 opacity-40"; statusText = "Ausente"; break;
            case 'IMPLANT': statusColor = "bg-blue-50 border-blue-200 text-blue-600"; statusText = "Implante"; break; // Blue as requested
            case 'ENDODONTIC': statusColor = "bg-orange-50 border-orange-200 text-orange-600"; statusText = "Canal"; break;
            // Add more cases as needed
        }
    }

    return (
        <div className={`aspect-square rounded-lg border flex flex-col items-center justify-center p-1 text-xs transition-all hover:scale-105 cursor-pointer shadow-sm ${statusColor}`}>
            <span className="font-bold text-slate-900 dark:text-slate-100">{number}</span>
            {statusText && <span className="text-[9px] font-medium leading-none mt-1">{statusText}</span>}
        </div>
    );
};

export const GeneralTab: React.FC<GeneralTabProps> = ({ patientId }) => {
    const { treatments, dentalChart, medicalAlerts, loading } = useGeneralClinical(patientId);

    const getToothData = (num: number) => dentalChart.find(d => d.tooth_number === num);

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            {/* 1. Medical Alerts Section */}
            {medicalAlerts.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <h3 className="text-red-800 font-bold flex items-center gap-2 mb-2">
                        <AlertTriangle size={18} /> Alertas Médicos
                    </h3>
                    <div className="space-y-2">
                        {medicalAlerts.map(alert => (
                            <div key={alert.id} className="flex gap-2 text-sm text-red-700 bg-white/50 p-2 rounded-lg border border-red-100">
                                <span className="font-bold uppercase text-xs px-1.5 py-0.5 bg-red-100 rounded">{alert.alert_type}</span>
                                {alert.description}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 2. Visual Odontogram (Simplified) */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <Stethoscope size={18} /> Odontograma Digital
                </h3>

                <div className="flex flex-col gap-8 max-w-3xl mx-auto">
                    {/* Arch Upper */}
                    <div className="flex justify-between gap-8">
                        <div className="grid grid-cols-8 gap-2 flex-1 direction-rtl">
                            {TOOTH_MAP[0].map(num => <Tooth key={num} number={num} data={getToothData(num)} />)}
                        </div>
                        <div className="grid grid-cols-8 gap-2 flex-1">
                            {TOOTH_MAP[1].map(num => <Tooth key={num} number={num} data={getToothData(num)} />)}
                        </div>
                    </div>

                    {/* Arch Lower */}
                    <div className="flex justify-between gap-8">
                        <div className="grid grid-cols-8 gap-2 flex-1 direction-rtl">
                            {TOOTH_MAP[2].map(num => <Tooth key={num} number={num} data={getToothData(num)} />)}
                        </div>
                        <div className="grid grid-cols-8 gap-2 flex-1">
                            {TOOTH_MAP[3].map(num => <Tooth key={num} number={num} data={getToothData(num)} />)}
                        </div>
                    </div>
                </div>
                <div className="text-center mt-6">
                    <button className="text-sm text-violet-600 hover:underline font-medium">Ver Histórico Completo do Odontograma &rarr;</button>
                </div>
            </div>

            {/* 3. Treatment History List */}
            <div>
                <h3 className="font-bold text-slate-500 uppercase tracking-wider text-sm mb-4">Histórico Clínico</h3>
                <div className="space-y-3">
                    {treatments.map((t) => (
                        <div key={t.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between hover:border-violet-200 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-600 flex items-center justify-center">
                                    <FileText size={18} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 dark:text-white">{t.procedure_name}</h4>
                                    <span className="text-xs font-mono text-slate-400">{new Date(t.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                            {t.tooth_number && (
                                <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold px-2 py-1 rounded text-xs">
                                    Dente {t.tooth_number}
                                </span>
                            )}
                        </div>
                    ))}
                    {treatments.length === 0 && <p className="text-slate-500 text-center py-4">Nenhum tratamento registrado.</p>}
                </div>
            </div>
        </div>
    );
};
