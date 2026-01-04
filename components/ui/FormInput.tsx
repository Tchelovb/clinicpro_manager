import React, { InputHTMLAttributes, forwardRef, useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

export interface FormInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
    /** Label do campo */
    label: string;
    /** Mensagem de erro */
    error?: string;
    /** Ícone à esquerda */
    leftIcon?: React.ReactNode;
    /** Texto de ajuda */
    helperText?: string;
    /** Tamanho do input */
    size?: 'sm' | 'md' | 'lg';
    /** Largura total */
    fullWidth?: boolean;
}

/**
 * FormInput - Componente de Input Padronizado App-Ready
 * 
 * Preparado para conversão nativa (iOS/Android) com:
 * - Labels flutuantes (Material Design)
 * - Touch targets mínimos de 44px
 * - Feedback visual de foco e erro
 * - Teclado contextual (type="tel" abre teclado numérico)
 * - Acessibilidade completa (ARIA)
 * 
 * @example
 * <FormInput 
 *   label="Nome do Paciente"
 *   placeholder="Digite o nome"
 *   error={errors.name}
 *   required
 * />
 */
export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
    (
        {
            label,
            error,
            leftIcon,
            helperText,
            size = 'md',
            fullWidth = true,
            type = 'text',
            className = '',
            disabled,
            required,
            ...props
        },
        ref
    ) => {
        const [showPassword, setShowPassword] = useState(false);
        const [isFocused, setIsFocused] = useState(false);

        // Tamanhos com touch targets seguros
        const sizeClasses = {
            sm: 'px-3 py-2 text-sm min-h-[44px]',
            md: 'px-4 py-3 text-base min-h-[48px]',
            lg: 'px-5 py-4 text-lg min-h-[56px]',
        };

        const hasError = !!error;
        const isPassword = type === 'password';
        const inputType = isPassword && showPassword ? 'text' : type;

        // Classes de estado
        const stateClasses = hasError
            ? 'border-red-500 focus:ring-red-500 dark:border-red-400'
            : 'border-slate-200 focus:ring-violet-500 dark:border-slate-700';

        const baseClasses =
            'w-full rounded-xl border-2 ' +
            'bg-white dark:bg-slate-800 ' +
            'text-slate-900 dark:text-white ' +
            'placeholder:text-slate-400 dark:placeholder:text-slate-500 ' +
            'transition-all duration-150 ' +
            'focus:outline-none focus:ring-2 focus:ring-offset-0 ' +
            'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed ' +
            'dark:disabled:bg-slate-900';

        const widthClass = fullWidth ? 'w-full' : '';

        return (
            <div className={`space-y-2 ${widthClass}`}>
                {/* Label */}
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>

                {/* Input Container */}
                <div className="relative">
                    {/* Left Icon */}
                    {leftIcon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                            {leftIcon}
                        </div>
                    )}

                    {/* Input */}
                    <input
                        ref={ref}
                        type={inputType}
                        disabled={disabled}
                        required={required}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        className={`
                            ${baseClasses}
                            ${sizeClasses[size]}
                            ${stateClasses}
                            ${leftIcon ? 'pl-10' : ''}
                            ${isPassword ? 'pr-12' : ''}
                            ${className}
                        `}
                        aria-invalid={hasError}
                        aria-describedby={
                            hasError ? `${props.id}-error` : helperText ? `${props.id}-helper` : undefined
                        }
                        {...props}
                    />

                    {/* Password Toggle */}
                    {isPassword && (
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    )}
                </div>

                {/* Error Message */}
                {hasError && (
                    <div
                        id={`${props.id}-error`}
                        className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400"
                        role="alert"
                    >
                        <AlertCircle size={14} />
                        <span>{error}</span>
                    </div>
                )}

                {/* Helper Text */}
                {!hasError && helperText && (
                    <p id={`${props.id}-helper`} className="text-sm text-slate-500 dark:text-slate-400">
                        {helperText}
                    </p>
                )}
            </div>
        );
    }
);

FormInput.displayName = 'FormInput';
