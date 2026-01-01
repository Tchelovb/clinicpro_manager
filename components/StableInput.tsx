import React, { memo } from 'react';

interface StableInputProps {
    name: string;
    value: string;
    type?: string;
    placeholder?: string;
    required?: boolean;
    className?: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

// 🚨 COMPONENTE ISOLADO - PREVINE RE-RENDER E PERDA DE FOCO
export const StableInput = memo(({
    name,
    value,
    type = 'text',
    placeholder,
    required,
    className,
    onChange
}: StableInputProps) => {
    return (
        <input
            name={name}
            value={value}
            type={type}
            placeholder={placeholder}
            required={required}
            className={className}
            onChange={onChange}
            autoFocus={false}
            autoComplete="off"
            style={{ fontSize: '16px' }}
        />
    );
}, (prevProps, nextProps) => {
    // Só re-renderiza se o VALUE mudar
    return prevProps.value === nextProps.value && prevProps.name === nextProps.name;
});

StableInput.displayName = 'StableInput';
