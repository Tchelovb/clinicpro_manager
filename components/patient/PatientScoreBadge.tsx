// =====================================================
// COMPONENTE: PatientScoreBadge (Dossiê High-Ticket)
// =====================================================

import React from 'react';
import { Gem, Crown, Shield, ShieldAlert, Ban } from 'lucide-react';

interface Props {
    score: string; // 'DIAMOND' | 'GOLD' | 'STANDARD' | 'RISK' | 'BLACKLIST'
    size?: 'sm' | 'md' | 'lg';
}

export const PatientScoreBadge: React.FC<Props> = ({ score, size = 'md' }) => {
    const normalizedScore = score?.toUpperCase() || 'STANDARD';

    const config = {
        DIAMOND: {
            color: 'bg-gradient-to-r from-purple-500 to-indigo-600',
            text: 'text-white',
            icon: Gem,
            label: 'DIAMOND',
            shadow: 'shadow-purple-200'
        },
        GOLD: {
            color: 'bg-gradient-to-r from-yellow-400 to-yellow-600',
            text: 'text-white',
            icon: Crown,
            label: 'GOLD',
            shadow: 'shadow-yellow-200'
        },
        STANDARD: {
            color: 'bg-gray-100',
            text: 'text-gray-700',
            icon: Shield,
            label: 'STANDARD',
            shadow: ''
        },
        RISK: {
            color: 'bg-orange-100',
            text: 'text-orange-700',
            icon: ShieldAlert,
            label: 'RISK',
            shadow: ''
        },
        BLACKLIST: {
            color: 'bg-red-600',
            text: 'text-white',
            icon: Ban,
            label: 'BLACKLIST',
            shadow: 'shadow-red-200'
        }
    };

    const style = config[normalizedScore as keyof typeof config] || config.STANDARD;
    const Icon = style.icon;

    const sizeClass = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1 text-sm',
        lg: 'px-4 py-2 text-base'
    }[size];

    return (
        <div className={`inline-flex items-center gap-1.5 rounded-full font-bold shadow-sm ${style.color} ${style.text} ${sizeClass} ${style.shadow}`}>
            <Icon size={size === 'sm' ? 12 : size === 'md' ? 16 : 20} />
            <span>{style.label}</span>
        </div>
    );
};
