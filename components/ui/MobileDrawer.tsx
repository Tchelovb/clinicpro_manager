import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../src/lib/utils';

interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    className?: string;
}

export function MobileDrawer({ isOpen, onClose, title, children, className }: DrawerProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay de Vidro Jateado */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]"
                    />

                    {/* A Gaveta (Bottom Sheet) */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className={cn(
                            "fixed bottom-0 left-0 right-0 z-[101]",
                            "bg-white/90 dark:bg-slate-900/95 backdrop-blur-2xl",
                            "rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)]",
                            "max-h-[92vh] flex flex-col overflow-hidden",
                            className
                        )}
                    >
                        {/* Indicador de Deslizar (Handle Style Apple) */}
                        <div className="flex justify-center py-4">
                            <div className="h-1.5 w-12 bg-slate-200 dark:bg-slate-700 rounded-full" />
                        </div>

                        <div className="px-6 md:px-8 pb-10 overflow-y-auto">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-medium tracking-tight text-slate-900 dark:text-white">
                                    {title}
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <X className="h-5 w-5 text-slate-500" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {children}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
