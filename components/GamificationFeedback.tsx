import React, { useState, useEffect } from 'react';
import { Zap, TrendingUp, Award } from 'lucide-react';
import { gamificationService, XPGain } from '../services/gamificationService';

interface XPNotificationProps {
    xpGain: XPGain;
    onComplete?: () => void;
}

export const XPNotification: React.FC<XPNotificationProps> = ({ xpGain, onComplete }) => {
    const [visible, setVisible] = useState(true);
    const config = gamificationService.getTierConfig(xpGain.tier);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
            onComplete?.();
        }, 3000);

        return () => clearTimeout(timer);
    }, [onComplete]);

    if (!visible) return null;

    return (
        <div className={`fixed top-20 right-8 z-50 ${config.animation}`}>
            <div className={`bg-gradient-to-r ${config.color} rounded-xl p-4 shadow-2xl border-2 border-white/30 backdrop-blur-sm`}>
                <div className="flex items-center gap-3">
                    <div className="text-4xl">{config.icon}</div>
                    <div>
                        <p className="text-white font-bold text-lg">+{xpGain.amount} XP</p>
                        <p className="text-white/80 text-sm">{config.label}</p>
                    </div>
                    <Zap size={32} className="text-yellow-300 animate-pulse" />
                </div>
            </div>
        </div>
    );
};

interface LevelUpModalProps {
    newLevel: number;
    totalXP: number;
    rewardsUnlocked: string[];
    onClose: () => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({
    newLevel,
    totalXP,
    rewardsUnlocked,
    onClose
}) => {
    const levelInfo = gamificationService.getLevelInfo(newLevel);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 rounded-2xl p-8 max-w-md w-full shadow-2xl border-4 border-yellow-400 relative overflow-hidden">
                {/* Confetti Effect */}
                <div className="absolute inset-0 pointer-events-none">
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute animate-ping"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 2}s`,
                                animationDuration: '2s'
                            }}
                        >
                            ✨
                        </div>
                    ))}
                </div>

                {/* Content */}
                <div className="relative z-10 text-center">
                    <div className="mb-6">
                        <Award size={80} className="mx-auto text-yellow-400 animate-bounce" />
                    </div>

                    <h2 className="text-4xl font-black text-white mb-2">
                        🎉 LEVEL UP! 🎉
                    </h2>

                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6">
                        <p className="text-white/70 text-sm mb-2">Você atingiu o</p>
                        <p className="text-5xl font-black text-yellow-400 mb-2">
                            NÍVEL {newLevel}
                        </p>
                        <p className="text-white text-lg font-bold">
                            {levelInfo.title}
                        </p>
                        <p className="text-white/60 text-sm mt-2">
                            {totalXP.toLocaleString('pt-BR')} XP Total
                        </p>
                    </div>

                    {rewardsUnlocked.length > 0 && (
                        <div className="bg-green-900/30 backdrop-blur-sm rounded-xl p-4 mb-6 border border-green-500/50">
                            <p className="text-green-300 font-bold mb-3 flex items-center justify-center gap-2">
                                <TrendingUp size={20} />
                                Recompensas Desbloqueadas
                            </p>
                            <ul className="space-y-2">
                                {rewardsUnlocked.map((reward, idx) => (
                                    <li key={idx} className="text-white text-sm flex items-center justify-center gap-2">
                                        <span className="text-green-400">✓</span>
                                        {reward}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <button
                        onClick={onClose}
                        className="w-full px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold rounded-lg transition-all transform hover:scale-105"
                    >
                        Continuar Evoluindo! 🚀
                    </button>
                </div>
            </div>
        </div>
    );
};

interface ProgressBarProps {
    currentXP: number;
    totalXP: number;
    currentLevel: number;
    progressPercent: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
    currentXP,
    totalXP,
    currentLevel,
    progressPercent
}) => {
    const levelInfo = gamificationService.getLevelInfo(currentLevel);
    const nextLevelInfo = gamificationService.getLevelInfo(currentLevel + 1);

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <p className="text-white font-bold text-lg">
                        Nível {currentLevel}: {levelInfo.title}
                    </p>
                    <p className="text-gray-400 text-sm">
                        {totalXP.toLocaleString('pt-BR')} XP Total
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-purple-400 font-bold text-sm">
                        {progressPercent.toFixed(1)}%
                    </p>
                    <p className="text-gray-500 text-xs">
                        Próximo: Nível {currentLevel + 1}
                    </p>
                </div>
            </div>

            <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                <div
                    className="h-4 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-full transition-all duration-500 relative"
                    style={{ width: `${Math.min(100, progressPercent)}%` }}
                >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
            </div>

            {nextLevelInfo && (
                <p className="text-gray-400 text-xs mt-2 text-center">
                    Faltam {(nextLevelInfo.xp - totalXP).toLocaleString('pt-BR')} XP para o próximo nível
                </p>
            )}
        </div>
    );
};
