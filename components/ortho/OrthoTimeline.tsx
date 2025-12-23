import React from 'react';
import { OrthoAppointment } from '../../services/orthoService';
import { Calendar, Camera } from 'lucide-react';

interface OrthoTimelineProps {
    appointments: OrthoAppointment[];
}

export const OrthoTimeline: React.FC<OrthoTimelineProps> = ({ appointments }) => {
    if (appointments.length === 0) {
        return (
            <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
                    <Calendar className="text-muted-foreground" size={24} />
                </div>
                <p className="text-muted-foreground font-medium">Nenhuma evolução registrada</p>
                <p className="text-sm text-muted-foreground/80 mt-1">Clique em "Nova Evolução" para começar</p>
            </div>
        );
    }

    return (
        <div className="relative pl-6 border-l border-border space-y-8">
            {appointments.map((appt) => (
                <div key={appt.id} className="relative group">
                    {/* Dot Indicator */}
                    <div className="absolute -left-[29px] top-1 w-4 h-4 rounded-full bg-primary border-4 border-background shadow-sm group-hover:bg-primary/80 transition-colors" />

                    {/* Card Content */}
                    <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors shadow-sm">

                        {/* Header */}
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-foreground">
                                    {new Date(appt.created_at).toLocaleDateString('pt-BR', {
                                        day: '2-digit', month: 'long', year: 'numeric',
                                        hour: '2-digit', minute: '2-digit'
                                    })}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${appt.appointment_type === 'MAINTENANCE' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                                        appt.appointment_type === 'EMERGENCY' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                                            'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                    }`}>
                                    {appt.appointment_type === 'MAINTENANCE' ? 'Manutenção' :
                                        appt.appointment_type === 'EMERGENCY' ? 'Emergência' :
                                            appt.appointment_type === 'INSTALLATION' ? 'Instalação' : appt.appointment_type}
                                </span>
                            </div>
                        </div>

                        {/* Clinical Data Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {/* Arcada Superior */}
                            <div className="bg-muted/30 rounded-lg p-3">
                                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">Arcada Superior</p>
                                <div className="space-y-1">
                                    {appt.archwire_upper && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Fio:</span>
                                            <span className="text-foreground font-medium">{appt.archwire_upper}</span>
                                        </div>
                                    )}
                                    {appt.chain_upper && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Corrente:</span>
                                            <span className="text-foreground font-medium">{appt.chain_upper}</span>
                                        </div>
                                    )}
                                    {appt.aligners_delivered_from !== undefined && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Placas Entregues:</span>
                                            <span className="text-purple-600 dark:text-purple-400 font-bold">#{appt.aligners_delivered_from} - #{appt.aligners_delivered_to}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Arcada Inferior */}
                            <div className="bg-muted/30 rounded-lg p-3">
                                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">Arcada Inferior</p>
                                <div className="space-y-1">
                                    {appt.archwire_lower && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Fio:</span>
                                            <span className="text-foreground font-medium">{appt.archwire_lower}</span>
                                        </div>
                                    )}
                                    {appt.chain_lower && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Corrente:</span>
                                            <span className="text-foreground font-medium">{appt.chain_lower}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        {appt.notes && (
                            <div className="mb-4 text-sm text-foreground bg-secondary/50 p-3 rounded-lg border border-border">
                                <p className="leading-relaxed whitespace-pre-wrap">{appt.notes}</p>
                            </div>
                        )}

                        {/* Footer (Scores & Photos) */}
                        <div className="flex items-center justify-between pt-3 border-t border-border">
                            <div className="flex gap-4">
                                <div className="text-center">
                                    <span className="block text-[10px] text-muted-foreground font-bold uppercase">Higiene</span>
                                    <span className={`font-bold ${(appt.hygiene_score || 0) >= 4 ? 'text-emerald-500' :
                                            (appt.hygiene_score || 0) >= 3 ? 'text-amber-500' : 'text-destructive'
                                        }`}>
                                        {appt.hygiene_score || '-'}/5
                                    </span>
                                </div>
                                <div className="text-center">
                                    <span className="block text-[10px] text-muted-foreground font-bold uppercase">Colaboração</span>
                                    <span className={`font-bold ${(appt.compliance_score || 0) >= 4 ? 'text-emerald-500' :
                                            (appt.compliance_score || 0) >= 3 ? 'text-amber-500' : 'text-destructive'
                                        }`}>
                                        {appt.compliance_score || '-'}/5
                                    </span>
                                </div>
                            </div>

                            {appt.photos_urls && appt.photos_urls.length > 0 && (
                                <button className="flex items-center gap-2 text-xs font-medium text-blue-500 hover:text-blue-400 transition-colors bg-blue-100 dark:bg-blue-900/20 px-3 py-1.5 rounded-full">
                                    <Camera size={14} />
                                    {appt.photos_urls.length} fotos
                                </button>
                            )}
                        </div>

                    </div>
                </div>
            ))}
        </div>
    );
};
