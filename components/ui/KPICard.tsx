import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
    icon: LucideIcon;
    iconBg: string;
    iconColor: string;
    title: string;
    value: string | number;
    trend?: string;
    trendUp?: boolean;
    onClick?: () => void;
}

export const KPICard: React.FC<KPICardProps> = ({
    icon: Icon,
    iconBg,
    iconColor,
    title,
    value,
    trend,
    trendUp,
    onClick
}) => {
    return (
        <div
            onClick={onClick}
            className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm hover:shadow-md transition-all ${onClick ? 'cursor-pointer' : ''}`}
        >
            <div className="flex items-start justify-between mb-3">
                <div className={`w-12 h-12 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <Icon className={iconColor} size={24} strokeWidth={2} />
                </div>
                {trend && (
                    <span className={`text-xs font-bold ${trendUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {trendUp ? '↗' : '↘'} {trend}
                    </span>
                )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold mb-1 tracking-wide">
                {title}
            </p>
            <p className="text-3xl font-black text-slate-900 dark:text-white">
                {value}
            </p>
        </div>
    );
};

export default KPICard;
