import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export interface BottomSheetProps {
    /** Controla se o sheet está aberto */
    isOpen: boolean;
    /** Callback ao fechar */
    onClose: () => void;
    /** Título do sheet */
    title?: string;
    /** Conteúdo do sheet */
    children: React.ReactNode;
    /** Altura do sheet (auto, half, full) */
    height?: 'auto' | 'half' | 'full';
    /** Permite fechar ao clicar fora */
    dismissible?: boolean;
}

/**
 * BottomSheet - Modal Nativo Mobile App-Ready
 * 
 * Componente que desliza de baixo para cima (padrão iOS/Android).
 * Preparado para conversão nativa com:
 * - Animações suaves (transform + transition)
 * - Backdrop com blur
 * - Gesture de arrastar para fechar (preparado)
 * - Safe area automática
 * - Acessibilidade completa
 * 
 * @example
 * <BottomSheet 
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Opções"
 *   height="half"
 * >
 *   <div>Conteúdo aqui</div>
 * </BottomSheet>
 */
export const BottomSheet: React.FC<BottomSheetProps> = ({
    isOpen,
    onClose,
    title,
    children,
    height = 'auto',
    dismissible = true,
}) => {
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsAnimating(true);
            // Previne scroll do body quando sheet está aberto
            document.body.style.overflow = 'hidden';
        } else {
            // Restaura scroll após animação
            const timer = setTimeout(() => {
                document.body.style.overflow = '';
                setIsAnimating(false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isOpen && !isAnimating) return null;

    // Altura do sheet baseada na prop
    const heightClasses = {
        auto: 'max-h-[90vh]',
        half: 'h-[50vh]',
        full: 'h-[90vh]',
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={`
                    fixed inset-0 z-50
                    bg-black/40 backdrop-blur-sm
                    transition-opacity duration-300
                    ${isOpen ? 'opacity-100' : 'opacity-0'}
                `}
                onClick={dismissible ? onClose : undefined}
                aria-hidden="true"
            />

            {/* Sheet Container */}
            <div
                className={`
                    fixed bottom-0 left-0 right-0 z-50
                    bg-white dark:bg-slate-900
                    rounded-t-3xl
                    shadow-2xl
                    transition-transform duration-300 ease-out
                    ${heightClasses[height]}
                    ${isOpen ? 'translate-y-0' : 'translate-y-full'}
                `}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? 'bottom-sheet-title' : undefined}
            >
                {/* Handle (Drag Indicator) */}
                <div className="flex justify-center pt-3 pb-2">
                    <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full" />
                </div>

                {/* Header */}
                {title && (
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                        <h2
                            id="bottom-sheet-title"
                            className="text-xl font-bold text-slate-900 dark:text-white"
                        >
                            {title}
                        </h2>
                        <button
                            onClick={onClose}
                            className="
                                p-2 rounded-full
                                hover:bg-slate-100 dark:hover:bg-slate-800
                                transition-colors
                                min-w-[44px] min-h-[44px]
                                flex items-center justify-center
                            "
                            aria-label="Fechar"
                        >
                            <X size={24} className="text-slate-500 dark:text-slate-400" />
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className="overflow-y-auto px-6 py-4" style={{ maxHeight: 'calc(90vh - 120px)' }}>
                    {children}
                </div>

                {/* Safe Area Bottom (iOS) */}
                <div className="h-[env(safe-area-inset-bottom)]" />
            </div>
        </>
    );
};
