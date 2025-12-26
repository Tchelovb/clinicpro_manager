import { useEffect, useState } from 'react';

/**
 * Hook para detecção de media queries
 * Permite renderização condicional baseada em breakpoints
 * 
 * @param query - Media query CSS (ex: '(max-width: 768px)')
 * @returns Boolean indicando se a query corresponde
 */
export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState<boolean>(false);

    useEffect(() => {
        // Criar media query list
        const mediaQuery = window.matchMedia(query);

        // Setar valor inicial
        setMatches(mediaQuery.matches);

        // Listener para mudanças
        const handler = (event: MediaQueryListEvent) => {
            setMatches(event.matches);
        };

        // Adicionar listener (compatível com navegadores antigos)
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handler);
        } else {
            // Fallback para navegadores antigos
            mediaQuery.addListener(handler);
        }

        // Cleanup
        return () => {
            if (mediaQuery.removeEventListener) {
                mediaQuery.removeEventListener('change', handler);
            } else {
                mediaQuery.removeListener(handler);
            }
        };
    }, [query]);

    return matches;
}
