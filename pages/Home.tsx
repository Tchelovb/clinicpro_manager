import React from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { GlassCard } from '../components/ui/GlassCard';
import { TrendingUp, Users, DollarSign, Activity } from 'lucide-react';

export default function Home() {
    return (
        <PageContainer
            title="Visão Geral"
            subtitle="Bem-vindo de volta, Dr. Marcelo"
            action={
                <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors">
                    + Acesso Rápido
                </button>
            }
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

                {/* Card 1: Faturamento (Primary) */}
                <GlassCard className="relative overflow-hidden p-6">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <DollarSign size={64} />
                    </div>
                    <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Faturamento do Dia</h3>
                    <p className="text-3xl font-bold text-slate-800 dark:text-white mt-2">R$ 15.400</p>
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center mt-2">
                        <TrendingUp size={12} className="mr-1" /> +12% vs ontem
                    </span>
                </GlassCard>

                {/* Card 2: Meta (Glassmorphism) */}
                <GlassCard variant="blue" className="p-6">
                    <h3 className="text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">Meta Mensal</h3>
                    <div className="flex items-end gap-2 mt-2">
                        <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">82%</p>
                        <p className="text-sm text-blue-600/60 dark:text-blue-400/60 mb-1">atingida</p>
                    </div>
                    <div className="w-full h-1.5 bg-blue-200/50 dark:bg-blue-800/50 rounded-full mt-3">
                        <div className="h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full w-[82%] transition-all duration-500"></div>
                    </div>
                </GlassCard>

                {/* Card 3: Novos Pacientes */}
                <GlassCard className="p-6">
                    <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Novos Pacientes</h3>
                    <p className="text-3xl font-bold text-slate-800 dark:text-white mt-2">08</p>
                    <div className="flex -space-x-2 mt-3">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-800"></div>
                        ))}
                        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-600 border-2 border-white dark:border-slate-800 flex items-center justify-center text-[8px] font-bold text-slate-500 dark:text-slate-300">+4</div>
                    </div>
                </GlassCard>

                {/* Card 4: Atividade */}
                <GlassCard className="relative overflow-hidden p-6">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Activity size={64} />
                    </div>
                    <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Atendimentos Hoje</h3>
                    <p className="text-3xl font-bold text-slate-800 dark:text-white mt-2">12</p>
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center mt-2">
                        3 aguardando
                    </span>
                </GlassCard>

            </div>

            {/* Seção Principal */}
            <h2 className="text-lg font-bold text-slate-800 mb-4">Agenda Hoje</h2>
            <GlassCard className="p-12">
                <div className="text-center text-slate-400">
                    <Activity size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="text-sm">Área de conteúdo da agenda...</p>
                    <p className="text-xs mt-2 text-slate-300">Integração com módulo de Agenda em breve</p>
                </div>
            </GlassCard>

        </PageContainer>
    );
}
