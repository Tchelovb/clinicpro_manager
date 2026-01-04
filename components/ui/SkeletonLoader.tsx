import React from 'react';

export interface SkeletonLoaderProps {
    /** Tipo de skeleton */
    variant?: 'text' | 'circular' | 'rectangular' | 'card';
    /** Largura (tailwind class ou auto) */
    width?: string;
    /** Altura (tailwind class) */
    height?: string;
    /** Número de linhas (para variant="text") */
    lines?: number;
    /** Animação de pulso */
    animate?: boolean;
}

/**
 * SkeletonLoader - Loading States App-Ready
 * 
 * Componente de esqueleto animado para estados de carregamento.
 * Padrão em apps nativos para mostrar estrutura enquanto dados carregam.
 * 
 * Preparado para conversão nativa com:
 * - Animação suave de shimmer
 * - Variantes para diferentes tipos de conteúdo
 * - Responsivo e adaptável
 * - Dark mode integrado
 * 
 * @example
 * // Card skeleton
 * <SkeletonLoader variant="card" />
 * 
 * // Text skeleton (3 linhas)
 * <SkeletonLoader variant="text" lines={3} />
 * 
 * // Avatar circular
 * <SkeletonLoader variant="circular" width="w-12" height="h-12" />
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
    variant = 'rectangular',
    width = 'w-full',
    height = 'h-4',
    lines = 1,
    animate = true,
}) => {
    const baseClasses = `
        bg-slate-200 dark:bg-slate-700
        ${animate ? 'animate-pulse' : ''}
    `;

    // Skeleton de texto (múltiplas linhas)
    if (variant === 'text') {
        return (
            <div className="space-y-3">
                {Array.from({ length: lines }).map((_, index) => (
                    <div
                        key={index}
                        className={`
                            ${baseClasses}
                            rounded-lg
                            ${index === lines - 1 ? 'w-3/4' : 'w-full'}
                            ${height}
                        `}
                    />
                ))}
            </div>
        );
    }

    // Skeleton circular (avatar)
    if (variant === 'circular') {
        return (
            <div
                className={`
                    ${baseClasses}
                    rounded-full
                    ${width}
                    ${height}
                `}
            />
        );
    }

    // Skeleton de card completo
    if (variant === 'card') {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
                {/* Header com avatar e texto */}
                <div className="flex items-center gap-3">
                    <div className={`${baseClasses} rounded-full w-12 h-12`} />
                    <div className="flex-1 space-y-2">
                        <div className={`${baseClasses} rounded-lg h-4 w-3/4`} />
                        <div className={`${baseClasses} rounded-lg h-3 w-1/2`} />
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-2">
                    <div className={`${baseClasses} rounded-lg h-4 w-full`} />
                    <div className={`${baseClasses} rounded-lg h-4 w-full`} />
                    <div className={`${baseClasses} rounded-lg h-4 w-2/3`} />
                </div>

                {/* Footer */}
                <div className="flex gap-2">
                    <div className={`${baseClasses} rounded-lg h-8 w-20`} />
                    <div className={`${baseClasses} rounded-lg h-8 w-20`} />
                </div>
            </div>
        );
    }

    // Skeleton retangular padrão
    return (
        <div
            className={`
                ${baseClasses}
                rounded-lg
                ${width}
                ${height}
            `}
        />
    );
};

/**
 * SkeletonList - Lista de Skeletons
 * 
 * Componente auxiliar para renderizar múltiplos skeletons
 * 
 * @example
 * <SkeletonList count={5} variant="card" />
 */
export const SkeletonList: React.FC<{
    count: number;
    variant?: SkeletonLoaderProps['variant'];
    gap?: string;
}> = ({ count, variant = 'card', gap = 'gap-4' }) => {
    return (
        <div className={`flex flex-col ${gap}`}>
            {Array.from({ length: count }).map((_, index) => (
                <SkeletonLoader key={index} variant={variant} />
            ))}
        </div>
    );
};
