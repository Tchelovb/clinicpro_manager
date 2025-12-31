import React from 'react';
import { useOpenCashRegisters } from '../../hooks/useCashRegister';
import { Lock } from 'lucide-react';
import toast from 'react-hot-toast';

interface SecureActionWrapperProps {
    children: React.ReactNode;
    action: string;
    onActionBlocked?: () => void;
}

/**
 * SecureActionWrapper
 * 
 * Componente de alto nível que envolve botões de ação financeira
 * Garante que o caixa esteja aberto antes de permitir a ação
 * 
 * Uso:
 * <SecureActionWrapper action="Receber Pagamento">
 *   <button>Receber</button>
 * </SecureActionWrapper>
 */
export const SecureActionWrapper: React.FC<SecureActionWrapperProps> = ({
    children,
    action,
    onActionBlocked
}) => {
    const { registers, loading } = useOpenCashRegisters();

    const isCashOpen = registers.length > 0;

    const handleClick = (e: React.MouseEvent) => {
        if (!isCashOpen) {
            e.preventDefault();
            e.stopPropagation();

            toast.error(
                `🔒 Abra o caixa para ${action}`,
                {
                    duration: 4000,
                    icon: '🔒',
                }
            );

            if (onActionBlocked) {
                onActionBlocked();
            }
        }
    };

    // Se está carregando, não desabilita
    if (loading) {
        return <>{children}</>;
    }

    // Se o caixa não está aberto, envolve com bloqueio
    if (!isCashOpen) {
        return (
            <div
                onClick={handleClick}
                className="relative cursor-not-allowed"
                title={`Abra o caixa para ${action}`}
            >
                {/* Overlay de bloqueio */}
                <div className="absolute inset-0 bg-gray-900/50 dark:bg-gray-100/10 backdrop-blur-[1px] rounded-lg z-10 flex items-center justify-center">
                    <Lock className="text-gray-400" size={16} />
                </div>

                {/* Conteúdo desabilitado */}
                <div className="opacity-50 pointer-events-none">
                    {children}
                </div>
            </div>
        );
    }

    // Caixa aberto, renderiza normalmente
    return <>{children}</>;
};

export default SecureActionWrapper;
