import React, { useState } from 'react';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from '../ui/drawer';

/**
 * FinancialActionHandler
 * 
 * Componente base para TODAS as ações financeiras do sistema.
 * Implementa o padrão SAP/Bancário de Event-Driven Finance:
 * 
 * - Desktop: Dialog centralizado com Overlay escurecido
 * - Mobile: Bottom Sheet (Apple Style) ocupando 90% da altura
 * - ZERO edição inline - Toda ação é um evento isolado
 * - Foco total na transação com confirmação obrigatória
 * 
 * Princípios:
 * 1. Consciência da Ação: Dialog/Sheet força o usuário a entender que está mexendo com dinheiro
 * 2. Segurança de Dados: Validações complexas antes de salvar
 * 3. Ergonomia Mobile: Bottom Sheet permite operação com uma mão
 */

interface FinancialActionHandlerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    children: React.ReactNode;
    /** Largura do Dialog no desktop (padrão: 2xl = 672px) */
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
}

const maxWidthClasses = {
    sm: 'sm:max-w-sm',   // 384px - Confirmações simples
    md: 'sm:max-w-md',   // 448px - Formulários básicos
    lg: 'sm:max-w-lg',   // 512px - Formulários padrão
    xl: 'sm:max-w-xl',   // 576px - Formulários complexos
    '2xl': 'sm:max-w-2xl', // 672px - Recebimentos/Pagamentos
    '3xl': 'sm:max-w-3xl', // 768px - Orçamentos
    '4xl': 'sm:max-w-4xl', // 896px - DRE/Relatórios
};

export const FinancialActionHandler: React.FC<FinancialActionHandlerProps> = ({
    open,
    onOpenChange,
    title,
    description,
    children,
    maxWidth = '2xl'
}) => {
    const isMobile = useMediaQuery('(max-width: 768px)');

    if (isMobile) {
        // MOBILE: Apple Style Bottom Sheet
        return (
            <Drawer open={open} onOpenChange={onOpenChange}>
                <DrawerContent className="h-[90vh] flex flex-col rounded-t-[20px] focus:outline-none">
                    {/* Puxador Visual (Apple Style) */}
                    <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 dark:bg-gray-600 mt-4 mb-2" />

                    {/* Header */}
                    <DrawerHeader className="text-left px-6 pb-4">
                        <DrawerTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                            {title}
                        </DrawerTitle>
                        {description && (
                            <DrawerDescription className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {description}
                            </DrawerDescription>
                        )}
                    </DrawerHeader>

                    {/* Content - Scrollable */}
                    <div className="flex-1 overflow-y-auto px-6 pb-6">
                        {children}
                    </div>

                    {/* Safe Area Bottom (iPhone) */}
                    <div className="h-[env(safe-area-inset-bottom)] bg-white dark:bg-gray-900" />
                </DrawerContent>
            </Drawer>
        );
    }

    // DESKTOP: Centered Dialog with Dark Overlay
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={`${maxWidthClasses[maxWidth]} max-h-[90vh] overflow-y-auto focus:outline-none`}
                onPointerDownOutside={(e) => {
                    // Previne fechamento acidental ao clicar fora
                    // Usuário DEVE clicar em Cancelar ou Confirmar
                    e.preventDefault();
                }}
            >
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                        {title}
                    </DialogTitle>
                    {description && (
                        <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
                            {description}
                        </DialogDescription>
                    )}
                </DialogHeader>

                {/* Content */}
                <div className="mt-6">
                    {children}
                </div>
            </DialogContent>
        </Dialog>
    );
};

/**
 * Hook auxiliar para gerenciar estado de ações financeiras
 * 
 * Uso:
 * const { openAction, closeAction, isOpen, actionType } = useFinancialAction();
 * 
 * openAction('RECEIVE_PAYMENT', installmentData);
 * openAction('REFUND', transactionData);
 * openAction('TRANSFER', transferData);
 */
export const useFinancialAction = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [actionType, setActionType] = useState<
        'RECEIVE_PAYMENT' |
        'MAKE_PAYMENT' |
        'REFUND' |
        'TRANSFER' |
        'CLOSE_CASH' |
        'OPEN_CASH' |
        'APPROVE_BUDGET' |
        null
    >(null);
    const [actionData, setActionData] = useState<any>(null);

    const openAction = (
        type: typeof actionType,
        data?: any
    ) => {
        setActionType(type);
        setActionData(data);
        setIsOpen(true);
    };

    const closeAction = () => {
        setIsOpen(false);
        // Delay para animação de fechamento
        setTimeout(() => {
            setActionType(null);
            setActionData(null);
        }, 300);
    };

    return {
        isOpen,
        actionType,
        actionData,
        openAction,
        closeAction
    };
};

export default FinancialActionHandler;
