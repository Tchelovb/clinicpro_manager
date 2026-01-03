import { useState } from 'react';
import { supabase } from '../src/lib/supabase';
import toast from 'react-hot-toast';
import { QuickAddResult } from '../types/quickAdd';

interface UseQuickAddOptions {
    tableName: string;
    clinicId: string;
    successMessage?: string;
    onSuccess?: (item: QuickAddResult) => void;
}

export function useQuickAdd({
    tableName,
    clinicId,
    successMessage = 'Item criado com sucesso!',
    onSuccess
}: UseQuickAddOptions) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const createItem = async (data: Record<string, any>): Promise<QuickAddResult | null> => {
        setIsLoading(true);

        try {
            // Preparar dados com clinic_id e is_active
            const itemData = {
                ...data,
                clinic_id: clinicId,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            // Converter string 'true'/'false' para boolean se necessário
            Object.keys(itemData).forEach(key => {
                if (itemData[key] === 'true') itemData[key] = true;
                if (itemData[key] === 'false') itemData[key] = false;
            });

            // Inserir no Supabase
            const { data: newItem, error } = await supabase
                .from(tableName)
                .insert(itemData)
                .select()
                .single();

            if (error) {
                console.error(`Erro ao criar item em ${tableName}:`, error);
                throw error;
            }

            // Sucesso
            toast.success(successMessage);
            setIsOpen(false);

            // Callback de sucesso
            if (onSuccess && newItem) {
                onSuccess(newItem as QuickAddResult);
            }

            return newItem as QuickAddResult;
        } catch (error: any) {
            console.error('Erro no useQuickAdd:', error);

            // Mensagens de erro específicas
            if (error.code === '23505') {
                toast.error('Este item já existe. Escolha um nome diferente.');
            } else if (error.code === '23503') {
                toast.error('Erro de referência. Verifique os dados e tente novamente.');
            } else {
                toast.error(`Erro ao criar item: ${error.message || 'Erro desconhecido'}`);
            }

            return null;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        isOpen,
        setIsOpen,
        createItem,
        isLoading
    };
}
