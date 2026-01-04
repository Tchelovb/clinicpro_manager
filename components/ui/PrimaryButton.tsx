import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    /** Variante visual do botão */
    variant?: 'solid' | 'outline' | 'ghost';
    /** Tamanho do botão (touch-friendly) */
    size?: 'sm' | 'md' | 'lg';
    /** Estado de carregamento */
    loading?: boolean;
    /** Ícone à esquerda */
    leftIcon?: React.ReactNode;
    /** Ícone à direita */
    rightIcon?: React.ReactNode;
    /** Largura total */
    fullWidth?: boolean;
}

/**
 * PrimaryButton - Componente de Botão Semântico App-Ready
 * 
 * Preparado para conversão nativa (iOS/Android) com:
 * - Touch targets mínimos de 44x44px (Apple HIG)
 * - Feedback tátil visual (active states)
 * - Unidades responsivas (rem/tailwind)
 * - Acessibilidade completa
 * 
 * @example
 * <PrimaryButton size="lg" variant="solid" leftIcon={<Save />}>
 *   Salvar Alterações
 * </PrimaryButton>
 */
export const PrimaryButton = forwardRef<HTMLButtonElement, PrimaryButtonProps>(
    (
        {
            variant = 'solid',
            size = 'md',
            loading = false,
            leftIcon,
            rightIcon,
            fullWidth = false,
            disabled,
            children,
            className = '',
            ...props
        },
        ref
    ) => {
        // Tamanhos com touch targets seguros (mínimo 44px altura)
        const sizeClasses = {
            sm: 'px-4 py-2 text-sm min-h-[44px]', // 44px mínimo
            md: 'px-6 py-3 text-base min-h-[48px]', // 48px confortável
            lg: 'px-8 py-4 text-lg min-h-[56px]', // 56px premium
        };

        // Variantes com feedback visual para toque
        const variantClasses = {
            solid:
                'bg-violet-600 text-white shadow-sm ' +
                'hover:bg-violet-700 ' +
                'active:bg-violet-800 active:scale-[0.98] ' + // Feedback tátil
                'disabled:bg-violet-300 disabled:cursor-not-allowed ' +
                'dark:bg-violet-500 dark:hover:bg-violet-600',
            outline:
                'border-2 border-violet-600 text-violet-600 bg-transparent ' +
                'hover:bg-violet-50 ' +
                'active:bg-violet-100 active:scale-[0.98] ' +
                'disabled:border-violet-300 disabled:text-violet-300 disabled:cursor-not-allowed ' +
                'dark:border-violet-400 dark:text-violet-400 dark:hover:bg-violet-900/20',
            ghost:
                'text-violet-600 bg-transparent ' +
                'hover:bg-violet-50 ' +
                'active:bg-violet-100 active:scale-[0.98] ' +
                'disabled:text-violet-300 disabled:cursor-not-allowed ' +
                'dark:text-violet-400 dark:hover:bg-violet-900/20',
        };

        const baseClasses =
            'inline-flex items-center justify-center gap-2 ' +
            'rounded-xl font-medium ' +
            'transition-all duration-150 ' + // Transição suave para feedback
            'focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 ' +
            'disabled:opacity-50 disabled:pointer-events-none';

        const widthClass = fullWidth ? 'w-full' : '';

        return (
            <button
                ref={ref}
                disabled={disabled || loading}
                className={`
                    ${baseClasses}
                    ${sizeClasses[size]}
                    ${variantClasses[variant]}
                    ${widthClass}
                    ${className}
                `}
                {...props}
            >
                {loading && <Loader2 size={18} className="animate-spin" />}
                {!loading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
                <span>{children}</span>
                {!loading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
            </button>
        );
    }
);

PrimaryButton.displayName = 'PrimaryButton';
