import React from 'react';
import { Plus } from 'lucide-react';
import { cn } from '../../src/lib/utils';

interface FloatingActionButtonProps {
    onClick: () => void;
    className?: string;
}

export function FloatingActionButton({ onClick, className }: FloatingActionButtonProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "fixed bottom-24 right-6 z-30",
                "h-14 w-14 rounded-full",
                "bg-blue-500 hover:bg-blue-600",
                "shadow-lg hover:shadow-xl",
                "transition-all duration-300",
                "hover:scale-110 active:scale-95",
                "flex items-center justify-center",
                "md:hidden", // Only show on mobile
                "animate-in zoom-in duration-500",
                className
            )}
            aria-label="Novo Agendamento"
        >
            <Plus className="h-6 w-6 text-white" strokeWidth={2.5} />
        </button>
    );
}
