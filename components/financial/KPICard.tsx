import React, { useState } from 'react';
import { LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface KPICardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    color: 'emerald' | 'blue' | 'violet' | 'red' | 'amber';
    trend?: number;
    subtitle?: string;
    expandedContent?: React.ReactNode;
}

const colorClasses = {
    emerald: {
        bg: 'bg-emerald-100 dark:bg-emerald-900/20',
        icon: 'text-emerald-600 dark:text-emerald-400',
        hover: 'hover:bg-emerald-100 dark:hover:bg-emerald-900/40',
    },
    blue: {
        bg: 'bg-blue-100 dark:bg-blue-900/20',
        icon: 'text-blue-600 dark:text-blue-400',
        hover: 'hover:bg-blue-100 dark:hover:bg-blue-900/40',
    },
    violet: {
        bg: 'bg-violet-100 dark:bg-violet-900/20',
        icon: 'text-violet-600 dark:text-violet-400',
        hover: 'hover:bg-violet-100 dark:hover:bg-violet-900/40',
    },
    red: {
        bg: 'bg-red-100 dark:bg-red-900/20',
        icon: 'text-red-600 dark:text-red-400',
        hover: 'hover:bg-red-100 dark:hover:bg-red-900/40',
    },
    amber: {
        bg: 'bg-amber-100 dark:bg-amber-900/20',
        icon: 'text-amber-600 dark:text-amber-400',
        hover: 'hover:bg-amber-100 dark:hover:bg-amber-900/40',
    },
};

/**
 * KPICard
 * 
 * Card de KPI com micro-interações
 * - Hover: Escala 1.02
 * - Click: Expande para mostrar gráfico/detalhes
 * - Animações suaves (300ms)
 */
export const KPICard: React.FC<KPICardProps> = ({
    title,
    value,
    icon: Icon,
    color,
    trend,
    subtitle,
    expandedContent,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const colors = colorClasses[color];

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => expandedContent && setIsExpanded(!isExpanded)}
            className={`
        bg-card rounded-xl p-6 border border-gray-200 dark:border-gray-800
        ${expandedContent ? 'cursor-pointer' : ''}
        transition-all duration-300
        hover:shadow-lg
      `}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${colors.bg} ${colors.hover} transition-colors`}>
                    <Icon className={colors.icon} size={24} />
                </div>
                {trend !== undefined && (
                    <span
                        className={`text-sm font-bold ${trend > 0
                                ? 'text-green-600 dark:text-green-400'
                                : trend < 0
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-gray-500 dark:text-gray-400'
                            }`}
                    >
                        {trend > 0 ? '+' : ''}
                        {trend.toFixed(1)}%
                    </span>
                )}
            </div>

            {/* Título */}
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{title}</p>

            {/* Valor */}
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {value}
            </p>

            {/* Subtítulo */}
            {subtitle && (
                <p className="text-xs text-gray-400 dark:text-gray-500">{subtitle}</p>
            )}

            {/* Conteúdo Expandido */}
            <AnimatePresence>
                {isExpanded && expandedContent && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 overflow-hidden"
                    >
                        {expandedContent}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default KPICard;
