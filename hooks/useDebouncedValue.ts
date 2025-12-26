import { useEffect, useState } from 'react';

/**
 * Hook para debounce de valores
 * Útil para otimizar buscas e evitar múltiplas renderizações
 * 
 * @param value - Valor a ser debounced
 * @param delay - Delay em milissegundos (padrão: 300ms)
 * @returns Valor debounced
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        // Criar timer para atualizar o valor após o delay
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Limpar timer se o valor mudar antes do delay
        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
}
