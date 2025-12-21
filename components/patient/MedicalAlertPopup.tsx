// =====================================================
// COMPONENTE: MedicalAlertPopup (Safety Shield)
// =====================================================

import React, { useState } from 'react';
import { AlertTriangle, XCircle, Activity } from 'lucide-react';

interface Alert {
    id: string;
    description: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    type: string;
}

interface Props {
    alerts: Alert[];
    patientName: string;
    onClose: () => void;
}

export const MedicalAlertPopup: React.FC<Props> = ({ alerts, patientName, onClose }) => {
    const [acknowledged, setAcknowledged] = useState(false);
    const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL' || a.severity === 'HIGH');

    if (criticalAlerts.length === 0) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border-2 border-red-500 animate-in zoom-in-95 duration-200">

                {/* Header Vermelho Piscante */}
                <div className="bg-red-600 text-white p-6 flex justify-between items-start animate-pulse-slow">
                    <div className="flex gap-4">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <AlertTriangle className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-wider">Atenção Crítica</h2>
                            <p className="text-red-100 text-sm mt-1">Alertas médicos para {patientName}</p>
                        </div>
                    </div>
                </div>

                {/* Lista de Alertas */}
                <div className="p-6 space-y-4">
                    {criticalAlerts.map(alert => (
                        <div key={alert.id} className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                            <Activity className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                            <div>
                                <span className="text-xs font-bold text-red-500 uppercase tracking-widest block mb-1">
                                    {alert.type} • {alert.severity}
                                </span>
                                <p className="text-gray-900 font-bold text-lg leading-tight">
                                    {alert.description}
                                </p>
                            </div>
                        </div>
                    ))}

                    <div className="mt-6 pt-4 border-t border-gray-200">
                        <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition-colors">
                            <input
                                type="checkbox"
                                className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                                checked={acknowledged}
                                onChange={(e) => setAcknowledged(e.target.checked)}
                            />
                            <span className="text-sm font-medium text-gray-700">
                                Li e estou ciente dos riscos acima.
                            </span>
                        </label>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={onClose}
                        disabled={!acknowledged}
                        className={`
              px-6 py-3 rounded-xl font-bold text-sm shadow-lg transition-all
              ${acknowledged
                                ? 'bg-red-600 text-white hover:bg-red-700 hover:scale-[1.02] active:scale-95'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
            `}
                    >
                        {acknowledged ? 'Confirmar Ciência e Acessar' : 'Confirme para Continuar'}
                    </button>
                </div>
            </div>
        </div>
    );
};
