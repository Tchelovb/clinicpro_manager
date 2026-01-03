import React from 'react';
import { cn } from '../../src/lib/utils';

interface PageContainerProps {
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
    children: React.ReactNode;
    isFluid?: boolean;
    className?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({
    title,
    subtitle,
    action,
    children,
    isFluid = false,
    className
}) => {
    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] lg:h-screen bg-slate-50/50 animate-in fade-in duration-300">

            {/* HEADER FIXO */}
            <header className="px-6 py-5 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex justify-between items-center sticky top-0 z-20">
                <div>
                    <h1 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
                    )}
                </div>

                {action && (
                    <div className="flex gap-2">
                        {action}
                    </div>
                )}
            </header>

            {/* CONTEÚDO SCROLLÁVEL */}
            <main className={cn(
                "flex-1 overflow-y-auto overflow-x-hidden scroll-smooth",
                isFluid ? "" : "p-4 lg:p-8",
                className
            )}>
                <div className={cn(
                    "mx-auto transition-all duration-300",
                    isFluid ? "w-full" : "max-w-7xl"
                )}>
                    {children}
                </div>
            </main>
        </div>
    );
};
