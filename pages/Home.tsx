import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { SearchContent } from '../components/ui/SearchContent';

export default function Home() {
    const { profile } = useAuth();
    const navigate = useNavigate();

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Bom dia';
        if (hour < 18) return 'Boa tarde';
        return 'Boa noite';
    };

    const quickActions = [
        {
            label: 'Novo Paciente',
            icon: UserPlus,
            color: 'bg-blue-500 hover:bg-blue-600',
            onClick: () => navigate('/patients'),
        },
        {
            label: 'Agenda',
            icon: Calendar,
            color: 'bg-purple-500 hover:bg-purple-600',
            onClick: () => navigate('/agenda'),
        },
        {
            label: 'Financeiro',
            icon: DollarSign,
            color: 'bg-emerald-500 hover:bg-emerald-600',
            onClick: () => navigate('/financial'),
        },
        {
            label: 'Dashboard',
            icon: TrendingUp,
            color: 'bg-violet-500 hover:bg-violet-600',
            onClick: () => navigate('/dashboard'),
        },
    ];

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            <div className="w-full max-w-2xl px-4 md:px-6 py-12 text-center space-y-8">
                {/* Logo / Clinic Name */}
                <div className="space-y-2 animate-in fade-in duration-500">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-violet-600 to-purple-600 dark:from-violet-500 dark:to-purple-500 rounded-2xl shadow-lg mb-4">
                        <span className="text-3xl font-black text-white">CP</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white">
                        {profile?.clinics?.name || 'ClinicPro'}
                    </h1>
                </div>

                {/* Greeting */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                    <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400">
                        {getGreeting()}, <span className="font-semibold text-slate-900 dark:text-white">{profile?.name?.split(' ')[0] || 'Usuário'}</span> 👋
                    </p>
                </div>

                {/* INLINE SEARCH - Google Style */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                    <div className="w-full max-w-xl mx-auto">
                        <SearchContent className="w-full shadow-xl" />
                        <p className="text-xs text-center text-slate-400 dark:text-slate-600 mt-2">
                            Dica: Pressione <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-400 font-mono text-[10px]">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-400 font-mono text-[10px]">K</kbd> em outras telas
                        </p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4">Ações Rápidas</p>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        {quickActions.map((action, index) => (
                            <Button
                                key={index}
                                onClick={action.onClick}
                                className={`${action.color} text-white h-auto py-4 flex-col gap-2 shadow-md hover:shadow-lg transition-all`}
                            >
                                <action.icon className="h-6 w-6" />
                                <span className="text-sm font-medium">{action.label}</span>
                            </Button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
