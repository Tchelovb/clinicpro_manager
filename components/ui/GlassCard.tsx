import React from 'react';
import { cn } from '../../src/lib/utils';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'blue' | 'green' | 'purple' | 'amber' | 'rose';
    hover?: boolean;
    onClick?: () => void;
}

const variantStyles = {
    default: 'bg-white/80 dark:bg-slate-800/80 border-slate-200/50 dark:border-slate-700/50',
    blue: 'bg-blue-50/80 dark:bg-blue-900/20 border-blue-200/50 dark:border-blue-700/50',
    green: 'bg-green-50/80 dark:bg-green-900/20 border-green-200/50 dark:border-green-700/50',
    purple: 'bg-purple-50/80 dark:bg-purple-900/20 border-purple-200/50 dark:border-purple-700/50',
    amber: 'bg-amber-50/80 dark:bg-amber-900/20 border-amber-200/50 dark:border-amber-700/50',
    rose: 'bg-rose-50/80 dark:bg-rose-900/20 border-rose-200/50 dark:border-rose-700/50',
};

export const GlassCard: React.FC<GlassCardProps> = ({
    children,
    className,
    variant = 'default',
    hover = false,
    onClick
}) => {
    return (
        <div
            className={cn(
                'backdrop-blur-md border rounded-2xl shadow-sm transition-all duration-300',
                variantStyles[variant],
                hover && 'hover:shadow-lg hover:scale-[1.02] cursor-pointer',
                onClick && 'cursor-pointer',
                className
            )}
            onClick={onClick}
        >
            {children}
        </div>
    );
};
