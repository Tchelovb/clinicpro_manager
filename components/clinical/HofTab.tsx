import React, { useMemo } from 'react';
import { useHof } from '../../hooks/useHof';
import { Sparkles, Image as ImageIcon, Plus } from 'lucide-react';

interface HofTabProps {
    patientId: string;
}

export const HofTab: React.FC<HofTabProps> = ({ patientId }) => {
    const { treatments, images, activeContract, loading } = useHof(patientId);

    // Group treatments by region
    const treatmentsByRegion = useMemo(() => {
        const grouped: Record<string, typeof treatments> = {};
        treatments.forEach(t => {
            const region = t.region || 'OUTROS';
            if (!grouped[region]) grouped[region] = [];
            grouped[region].push(t);
        });
        return grouped;
    }, [treatments]);

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            {/* 0. Active Contract Badge (Botox Club) */}
            {activeContract && (
                <div className="bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-yellow-900/40 dark:to-amber-900/40 rounded-2xl p-4 border border-yellow-200 dark:border-yellow-700/50 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-yellow-400 dark:bg-yellow-600 flex items-center justify-center text-white shadow-md">
                            <Sparkles size={24} fill="currentColor" />
                        </div>
                        <div>
                            <h3 className="font-bold text-yellow-900 dark:text-yellow-100 text-lg">{activeContract.contract_name || 'Botox Club'}</h3>
                            <p className="text-sm text-yellow-800 dark:text-yellow-200/80">Status: {activeContract.status === 'ACTIVE' ? 'Ativo' : 'Suspenso'}</p>
                        </div>
                    </div>
                    {activeContract.status === 'ACTIVE' && (
                        <span className="bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                            Vip Member
                        </span>
                    )}
                </div>
            )}

            {/* 1. Header & Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/10 dark:to-rose-900/10 rounded-2xl p-6 border border-pink-100 dark:border-pink-800/30 shadow-sm relative overflow-hidden">
                    <div className="absolute right-0 top-0 opacity-10">
                        <Sparkles size={120} className="text-pink-600" />
                    </div>
                    <h3 className="font-bold text-pink-700 dark:text-pink-300 mb-2 flex items-center gap-2 relative z-10">
                        <Sparkles size={18} /> Procedimentos HOF Ativos
                    </h3>
                    <div className="text-3xl font-black text-pink-800 dark:text-pink-200 relative z-10">{treatments.length}</div>
                    <p className="text-xs text-pink-600/80 mt-1 relative z-10">Regiões tratadas nos últimos 12 meses</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button className="rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center p-4 text-slate-500 hover:text-pink-600 hover:border-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/10 transition-all group">
                        <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <ImageIcon size={20} />
                        </div>
                        <span className="font-bold text-sm">Galeria</span>
                    </button>
                    <button className="rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center p-4 text-slate-500 hover:text-pink-600 hover:border-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/10 transition-all group">
                        <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <Plus size={20} />
                        </div>
                        <span className="font-bold text-sm">Novo HOF</span>
                    </button>
                </div>
            </div>

            {/* 2. Recent Photos Carousel */}
            {images.length > 0 && (
                <div className="space-y-3">
                    <h3 className="font-bold text-sm text-slate-500 uppercase tracking-wider px-1">Últimas Fotos</h3>
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                        {images.map((img) => (
                            <div key={img.id} className="flex-shrink-0 w-32 h-32 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 relative group cursor-pointer">
                                <img src={img.thumbnail_url || img.file_url} alt="Clinical" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 3. Treatments Grouped by Region (Face Map List) */}
            <div className="space-y-6">
                {Object.entries(treatmentsByRegion).map(([region, items]) => (
                    <div key={region} className="space-y-3">
                        <h4 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                            {region}
                        </h4>
                        <div className="grid grid-cols-1 gap-3">
                            {items.map((t) => (
                                <div key={t.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-start gap-4 hover:border-pink-200 transition-colors">
                                    <div className="w-12 h-12 rounded-xl bg-pink-50 dark:bg-pink-900/20 text-pink-600 flex items-center justify-center font-bold text-[10px] text-center px-1 leading-tight border border-pink-100 dark:border-pink-800/30 uppercase">
                                        {region.substring(0, 3)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-slate-800 dark:text-white">{t.procedure_name}</h4>
                                            <span className="text-xs font-mono text-slate-400">{new Date(t.created_at).toLocaleDateString()}</span>
                                        </div>
                                        {t.observations && <p className="text-sm text-slate-500 mt-1">{t.observations}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {treatments.length === 0 && (
                    <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                        <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">Nenhum procedimento HOF realizado.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
