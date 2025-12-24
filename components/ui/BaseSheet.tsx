import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface BaseSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '5xl' | '6xl' | 'full';
    hideHeader?: boolean;
}

export function BaseSheet({
    open,
    onOpenChange,
    title,
    description,
    children,
    footer,
    size = 'md',
    hideHeader = false
}: BaseSheetProps) {

    // Fechar com ESC
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onOpenChange(false);
        };
        if (open) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [open, onOpenChange]);

    if (!open) return null;

    const sizeClasses = {
        sm: 'sm:max-w-md',
        md: 'sm:max-w-lg',
        lg: 'sm:max-w-xl',
        xl: 'sm:max-w-2xl',
        '2xl': 'sm:max-w-3xl',
        '4xl': 'sm:max-w-4xl',
        '5xl': 'sm:max-w-5xl',
        '6xl': 'sm:max-w-6xl',
        'full': 'sm:max-w-[95vw]',
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop with Blur */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out"
                onClick={() => onOpenChange(false)}
            />

            {/* Sheet Panel */}
            <div
                className={`
                    relative w-full ${sizeClasses[size]} 
                    bg-white dark:bg-slate-900 
                    shadow-2xl border-l border-slate-200 dark:border-slate-800
                    flex flex-col h-full
                    animate-in slide-in-from-right duration-300 ease-out
                `}
            >
                {/* Fixed Header */}
                {!hideHeader && (
                    <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 z-10 shrink-0">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
                                {title}
                            </h2>
                            {description && (
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    {description}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={() => onOpenChange(false)}
                            className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                )}

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-0 py-0 custom-scrollbar">
                    {/* Padding handled by children when header is hidden, implies full control */}
                    <div className={hideHeader ? "" : "px-6 py-6 space-y-6"}>
                        {children}
                    </div>
                </div>

                {/* Fixed Footer */}
                {footer && (
                    <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur shrink-0 md:flex md:justify-end md:gap-3 space-y-3 md:space-y-0">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
