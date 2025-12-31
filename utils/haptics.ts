/**
 * triggerHapticFeedback
 * 
 * Dispara feedback háptico no dispositivo móvel
 * Padrão Apple: Toques curtos para sucesso, médios para alerta, longos para erro
 */

export type HapticType = 'success' | 'warning' | 'error' | 'light' | 'medium' | 'heavy';

export const triggerHapticFeedback = (type: HapticType = 'light') => {
    // Verifica se o navegador suporta vibração
    if (!('vibrate' in navigator)) {
        return;
    }

    // Padrões de vibração (em milissegundos)
    const patterns = {
        light: [10],                          // Toque leve (navegação)
        medium: [30],                         // Toque médio (seleção)
        heavy: [50],                          // Toque pesado (confirmação)
        success: [50, 30, 50],               // Dois toques curtos (sucesso)
        warning: [100, 50, 100],             // Dois toques médios (alerta)
        error: [200, 100, 200, 100, 200],   // Três toques longos (erro)
    };

    try {
        navigator.vibrate(patterns[type]);
    } catch (error) {
        console.warn('Haptic feedback não suportado:', error);
    }
};

/**
 * Hook para feedback háptico
 * 
 * Uso:
 * const haptic = useHaptic();
 * haptic.success(); // Dispara feedback de sucesso
 */
export const useHaptic = () => {
    return {
        light: () => triggerHapticFeedback('light'),
        medium: () => triggerHapticFeedback('medium'),
        heavy: () => triggerHapticFeedback('heavy'),
        success: () => triggerHapticFeedback('success'),
        warning: () => triggerHapticFeedback('warning'),
        error: () => triggerHapticFeedback('error'),
    };
};
