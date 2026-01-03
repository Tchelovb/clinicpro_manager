import React, { useState, useEffect } from 'react';
import { supabase } from '../src/lib/supabase';
import { Gamepad2, Trophy, Flame, Play, Zap, Target } from 'lucide-react';

export function TycoonGameHub() {
    const [simClinics, setSimClinics] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSimulations();
    }, []);

    const fetchSimulations = async () => {
        try {
            const { data, error } = await supabase
                .from('clinics')
                .select('*')
                .eq('environment', 'SIMULATION')
                .eq('active', true);

            if (error) {
                console.error('Erro ao buscar simulações:', error);
            }

            if (data) {
                console.log('Simulações encontradas:', data);
                setSimClinics(data);
            }
        } catch (error) {
            console.error('Erro:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePlay = (clinicId: string) => {
        localStorage.setItem('current_clinic_id', clinicId);
        window.location.href = '/dashboard';
    };

    const handleStartChallenge = (levelId: string, levelName: string) => {
        alert(`🎮 Iniciando: ${levelName}\n\nEm breve você será transportado para o cenário!\n\n(Função de clonagem de seed será implementada aqui)`);
        // TODO: Implementar script de seed que cria a clínica de simulação
    };

    const scenarios = [
        {
            id: 'level1',
            name: 'Nível 1: A Clínica Familiar',
            diff: 'FÁCIL',
            color: 'green',
            icon: '🟢',
            desc: 'Organize a agenda e fidelize os primeiros 50 pacientes.',
            challenges: ['Organizar agenda', 'Padronizar atendimento', 'Criar fluxo de caixa'],
            xp: 100
        },
        {
            id: 'level2',
            name: 'Nível 2: Expansão Acelerada',
            diff: 'MÉDIO',
            color: 'yellow',
            icon: '🟡',
            desc: 'Gerencie múltiplos dentistas e invista em tráfego pago.',
            challenges: ['Converter 20 leads', 'Aumentar ticket 30%', 'Manter NPS > 8.5'],
            xp: 250
        },
        {
            id: 'level3',
            name: 'Nível 3: O Caos da Falência',
            diff: 'DIFÍCIL',
            color: 'red',
            icon: '🔴',
            desc: 'Dívida de R$ 500k. Salve a clínica em 30 dias.',
            challenges: ['Zerar dívidas urgentes', 'Gerar R$ 50k em 30 dias', 'Recuperar moral'],
            xp: 500
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-10 text-center">
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <Gamepad2 className="w-16 h-16 text-purple-400" />
                        <h1 className="text-5xl font-black bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
                            Clinic Tycoon Simulator
                        </h1>
                    </div>
                    <p className="text-slate-300 text-xl">Escolha seu desafio, CEO. Suas decisões custam milhões.</p>
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-3 gap-6 mb-12">
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30">
                        <div className="flex items-center gap-3 mb-2">
                            <Trophy className="w-6 h-6 text-yellow-400" />
                            <span className="text-slate-400 text-sm">Nível Atual</span>
                        </div>
                        <p className="text-4xl font-black text-white">5</p>
                    </div>

                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30">
                        <div className="flex items-center gap-3 mb-2">
                            <Zap className="w-6 h-6 text-blue-400" />
                            <span className="text-slate-400 text-sm">XP Total</span>
                        </div>
                        <p className="text-4xl font-black text-white">1,250</p>
                    </div>

                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-green-500/30">
                        <div className="flex items-center gap-3 mb-2">
                            <Target className="w-6 h-6 text-green-400" />
                            <span className="text-slate-400 text-sm">Cenários Completos</span>
                        </div>
                        <p className="text-4xl font-black text-white">0/3</p>
                    </div>
                </div>

                {/* Scenarios Grid */}
                <div className="space-y-6 mb-12">
                    <h2 className="text-2xl font-bold text-white mb-6">Escolha seu Desafio</h2>

                    {scenarios.map((level, index) => {
                        const existingSim = simClinics.find(c => c.name.includes(level.name.split(':')[1]?.trim() || level.name));
                        const colorClasses = {
                            green: 'from-green-900/40 to-emerald-900/40 border-green-400/30',
                            yellow: 'from-yellow-900/40 to-orange-900/40 border-yellow-400/30',
                            red: 'from-red-900/40 to-pink-900/40 border-red-400/30'
                        };

                        return (
                            <div
                                key={index}
                                className={`bg-gradient-to-r ${colorClasses[level.color as keyof typeof colorClasses]} border-2 rounded-2xl p-8 hover:scale-[1.02] transition-all group relative overflow-hidden shadow-2xl`}
                            >
                                <div className="grid grid-cols-12 gap-6">
                                    {/* Left: Info */}
                                    <div className="col-span-8">
                                        <div className="flex items-center gap-4 mb-4">
                                            <span className="text-6xl">{level.icon}</span>
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${level.color === 'green' ? 'bg-green-500 text-white' :
                                                            level.color === 'yellow' ? 'bg-yellow-500 text-black' :
                                                                'bg-red-500 text-white'
                                                        }`}>
                                                        {level.diff}
                                                    </span>
                                                    <span className="text-white/60 text-sm">+{level.xp} XP</span>
                                                </div>
                                                <h3 className="text-3xl font-black text-white mb-2">{level.name}</h3>
                                            </div>
                                        </div>

                                        <p className="text-white/80 text-lg mb-6">{level.desc}</p>

                                        {/* Challenges */}
                                        <div className="mb-6">
                                            <p className="text-sm font-bold text-white/60 mb-3">DESAFIOS:</p>
                                            <div className="space-y-2">
                                                {level.challenges.map((challenge, i) => (
                                                    <div key={i} className="flex items-center gap-2">
                                                        <div className="w-2 h-2 bg-white/40 rounded-full" />
                                                        <p className="text-white/90">{challenge}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Action */}
                                    <div className="col-span-4 flex items-center justify-center">
                                        {existingSim ? (
                                            <button
                                                onClick={() => handlePlay(existingSim.id)}
                                                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-black py-6 px-8 rounded-xl transition-all flex flex-col items-center justify-center gap-3 shadow-2xl hover:scale-105"
                                            >
                                                <Play className="w-12 h-12" />
                                                <span className="text-2xl">CONTINUAR</span>
                                                <span className="text-sm opacity-80">JOGO SALVO</span>
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleStartChallenge(level.id, level.name)}
                                                className={`w-full bg-gradient-to-r ${level.color === 'green' ? 'from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700' :
                                                        level.color === 'yellow' ? 'from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700' :
                                                            'from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700'
                                                    } text-white font-black py-6 px-8 rounded-xl transition-all flex flex-col items-center justify-center gap-3 shadow-2xl hover:scale-105`}
                                            >
                                                <Flame className="w-12 h-12" />
                                                <span className="text-2xl">INICIAR</span>
                                                <span className="text-sm opacity-80">DESAFIO</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Achievements */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700">
                    <h3 className="text-2xl font-bold text-white flex items-center gap-3 mb-6">
                        <Trophy className="w-8 h-8 text-yellow-400" /> Suas Conquistas
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-slate-900/50 p-6 rounded-xl text-center border border-slate-700 opacity-50">
                            <div className="text-4xl mb-2">🔒</div>
                            <p className="text-slate-400 text-sm">Primeiro Milhão</p>
                        </div>
                        <div className="bg-slate-900/50 p-6 rounded-xl text-center border border-slate-700 opacity-50">
                            <div className="text-4xl mb-2">🔒</div>
                            <p className="text-slate-400 text-sm">Salvador da Pátria</p>
                        </div>
                        <div className="bg-slate-900/50 p-6 rounded-xl text-center border border-slate-700 opacity-50">
                            <div className="text-4xl mb-2">🔒</div>
                            <p className="text-slate-400 text-sm">Império Nacional</p>
                        </div>
                        <div className="bg-slate-900/50 p-6 rounded-xl text-center border border-slate-700 opacity-50">
                            <div className="text-4xl mb-2">🔒</div>
                            <p className="text-slate-400 text-sm">Mestre da IA</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
