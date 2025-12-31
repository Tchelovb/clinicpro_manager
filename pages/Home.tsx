import React from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { AppCard } from '../components/ui/AppCard';
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
                <AppCard className="relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <DollarSign size={64} />
                    </div>
                    <h3 className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Faturamento do Dia</h3>
                    <p className="text-3xl font-bold text-slate-800 mt-2">R$ 15.400</p>
                    <span className="text-xs text-success font-medium flex items-center mt-2">
                        <TrendingUp size={12} className="mr-1" /> +12% vs ontem
                    </span>
                </AppCard>

                {/* Card 2: Meta (Glassmorphism) */}
                <AppCard variant="glass" className="bg-gradient-to-br from-primary/10 to-white border-primary/20">
                    <h3 className="text-primary text-xs font-bold uppercase tracking-wider">Meta Mensal</h3>
                    <div className="flex items-end gap-2 mt-2">
                        <p className="text-3xl font-bold text-primary">82%</p>
                        <p className="text-sm text-primary/60 mb-1">atingida</p>
                    </div>
                    {/* Barra de progresso */}
                    <div className="w-full h-1.5 bg-primary/20 rounded-full mt-3">
                        <div className="h-1.5 bg-primary rounded-full w-[82%] transition-all duration-500"></div>
                    </div>
                </AppCard>

                {/* Card 3: Novos Pacientes */}
                <AppCard>
                    <h3 className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Novos Pacientes</h3>
                    <p className="text-3xl font-bold text-slate-800 mt-2">08</p>
                    <div className="flex -space-x-2 mt-3">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white"></div>
                        ))}
                        <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-500">+4</div>
                    </div>
                </AppCard>

                {/* Card 4: Atividade */}
                <AppCard className="relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Activity size={64} />
                    </div>
                    <h3 className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Atendimentos Hoje</h3>
                    <p className="text-3xl font-bold text-slate-800 mt-2">12</p>
                    <span className="text-xs text-warning font-medium flex items-center mt-2">
                        3 aguardando
                    </span>
                </AppCard>

            </div>

            {/* Seção Principal */}
            <h2 className="text-lg font-bold text-slate-800 mb-4">Agenda Hoje</h2>
            <AppCard padding="none">
                <div className="p-12 text-center text-slate-400">
                    <Activity size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="text-sm">Área de conteúdo da agenda...</p>
                    <p className="text-xs mt-2 text-slate-300">Integração com módulo de Agenda em breve</p>
                </div>
            </AppCard>

        </PageContainer>
    );
}
