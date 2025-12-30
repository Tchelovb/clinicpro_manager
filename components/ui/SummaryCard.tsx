import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SummaryCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    color: 'emerald' | 'rose' | 'blue' | 'amber' | 'violet';
    subtitle?: string;
    className?: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
    title,
    value,
    icon: Icon,
    color,
    subtitle,
    className
}) => {
    const colorConfigs = {
        emerald: {
            bg: 'bg-emerald-50 dark:bg-emerald-900/20',
            border: 'border-emerald-200 dark:border-emerald-700/50',
            iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
            textColor: 'text-emerald-700 dark:text-emerald-300'
        },
        rose: {
            bg: 'bg-rose-50 dark:bg-rose-900/20',
            border: 'border-rose-200 dark:border-rose-700/50',
            iconBg: 'bg-rose-100 dark:bg-rose-900/30',
            iconColor: 'text-rose-600 dark:text-rose-400',
            textColor: 'text-rose-700 dark:text-rose-300'
        },
        blue: {
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            border: 'border-blue-200 dark:border-blue-700/50',
            iconBg: 'bg-blue-100 dark:bg-blue-900/30',
            iconColor: 'text-blue-600 dark:text-blue-400',
            textColor: 'text-blue-700 dark:text-blue-300'
        },
        amber: {
            bg: 'bg-amber-50 dark:bg-amber-900/20',
            border: 'border-amber-200 dark:border-amber-700/50',
            iconBg: 'bg-amber-100 dark:bg-amber-900/30',
            iconColor: 'text-amber-600 dark:text-amber-400',
            textColor: 'text-amber-700 dark:text-amber-300'
        },
        violet: {
            bg: 'bg-violet-50 dark:bg-violet-900/20',
            border: 'border-violet-200 dark:border-violet-700/50',
            iconBg: 'bg-violet-100 dark:bg-violet-900/30',
            iconColor: 'text-violet-600 dark:text-violet-400',
            textColor: 'text-violet-700 dark:text-violet-300'
        }
    };

    const config = colorConfigs[color];

    return (
        <div className={`${config.bg} border ${config.border} rounded-lg p-5 shadow-sm ${className || ''}`}>
            <div className="flex items-center justify-between mb-3">
                <div className={`w-12 h-12 ${config.iconBg} rounded-lg flex items-center justify-center`}>
                    <Icon className={config.iconColor} size={24} strokeWidth={2} />
                </div>
            </div>
            <p className={`text-xs ${config.textColor} uppercase font-bold mb-1 tracking-wide`}>
                {title}
            </p>
            <p className={`text-3xl font-black ${config.textColor}`}>
                {value}
            </p>
            {subtitle && (
                <p className={`text-xs ${config.textColor} mt-2 opacity-75`}>
                    {subtitle}
                </p>
            )}
        </div>
    );
};

export default SummaryCard;
