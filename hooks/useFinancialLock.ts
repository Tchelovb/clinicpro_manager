import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface FinancialLockStatus {
    isLocked: boolean;
    overdueAmount: number;
    checkStatus: () => Promise<boolean>;
    unlock: (pin: string) => Promise<boolean>;
}

export const useFinancialLock = (patientId: string): FinancialLockStatus => {
    const [isLocked, setIsLocked] = useState(false);
    const [overdueAmount, setOverdueAmount] = useState(0);

    const checkStatus = useCallback(async (): Promise<boolean> => {
        if (!patientId) return false;

        try {
            // Check for overdue installments
            // Assuming 'financial_installments' table exists and has 'status' and 'due_date'
            const { data, error } = await supabase
                .from('financial_installments')
                .select('amount, status, due_date')
                .eq('patient_id', patientId)
                .lt('due_date', new Date().toISOString().split('T')[0]) // Due date before today
                .neq('status', 'PAID') // Not paid
                .neq('status', 'CANCELLED'); // Not cancelled

            if (error) throw error;

            const totalOverdue = data?.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0) || 0;

            if (totalOverdue > 0) {
                setIsLocked(true);
                setOverdueAmount(totalOverdue);
                return true; // Locked
            } else {
                setIsLocked(false);
                setOverdueAmount(0);
                return false; // Not locked
            }
        } catch (err) {
            console.error('Error checking financial lock:', err);
            // Fail safe: don't lock if error checks fail, but log it
            return false;
        }
    }, [patientId]);

    const unlock = async (pin: string): Promise<boolean> => {
        // TODO: Implement proper PIN validation against user hash or special admin PIN
        // For now, hardcoded master pin for "Emergency Override"
        if (pin === '9999') {
            setIsLocked(false);
            toast.success('Bloqueio financeiro liberado temporariamente.');
            return true;
        }
        toast.error('PIN inválido para liberação.');
        return false;
    };

    return {
        isLocked,
        overdueAmount,
        checkStatus,
        unlock
    };
};
