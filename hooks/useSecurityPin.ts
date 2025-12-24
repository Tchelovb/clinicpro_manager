import { useState } from 'react';

/**
 * Hook para gerenciar o Security PIN Modal
 * Facilita a integração com componentes que precisam de autenticação
 */

interface UseSecurityPinOptions {
    onSuccess?: () => void;
    onCancel?: () => void;
    title?: string;
    description?: string;
    actionType?: 'REFUND' | 'DISCOUNT' | 'DELETE' | 'BUDGET_OVERRIDE' | 'CUSTOM';
    entityType?: string;
    entityId?: string;
    entityName?: string;
}

export const useSecurityPin = (options: UseSecurityPinOptions = {}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [config, setConfig] = useState<UseSecurityPinOptions>(options);

    const requestPin = (customConfig?: Partial<UseSecurityPinOptions>) => {
        if (customConfig) {
            setConfig({ ...options, ...customConfig });
        }
        setIsOpen(true);
    };

    const handleSuccess = () => {
        setIsOpen(false);
        if (config.onSuccess) {
            config.onSuccess();
        }
    };

    const handleCancel = () => {
        setIsOpen(false);
        if (config.onCancel) {
            config.onCancel();
        }
    };

    return {
        isOpen,
        config,
        requestPin,
        handleSuccess,
        handleCancel,
        setIsOpen
    };
};

export default useSecurityPin;
