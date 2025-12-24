import { supabase } from '../lib/supabase';

// Helper interface for RPC response
interface PinVerificationResult {
    success: boolean;
    message?: string;
    isLocked?: boolean;
    lockedUntil?: Date | null; // Changed to Date object for easier handling
    attemptsRemaining?: number;
}

export const securityService = {
    /**
     * Checks if the user has a transaction PIN configured.
     */
    hasPinConfigured: async (userId: string): Promise<boolean> => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('transaction_pin_hash')
                .eq('id', userId)
                .maybeSingle();

            if (error) throw error;
            return !!data?.transaction_pin_hash;
        } catch (err) {
            console.error("Error checking PIN configuration:", err);
            return false;
        }
    },

    /**
     * S16 Protocol: Securely verifies the PIN via Server-Side RPC.
     * Replaces previous client-side hashing.
     */
    async validatePin(userId: string, pin: string): Promise<PinVerificationResult> {
        try {
            // Calling the Fort Knox RPC
            const { data, error } = await supabase
                .rpc('verify_transaction_pin', { p_pin: pin });

            if (error) throw error;

            // RPC returns standard JSON format
            return {
                success: data.success,
                message: data.message,
                isLocked: (data as any).isLocked || false,
                lockedUntil: (data as any).lockedUntil ? new Date((data as any).lockedUntil) : null,
                attemptsRemaining: (data as any).attemptsRemaining
            };

        } catch (err: any) {
            console.error('S16 Protocol Error:', err);
            return {
                success: false,
                message: 'Erro de comunicação com o cofre de segurança.',
                isLocked: false
            };
        }
    },

    /**
     * Checks if the PIN is currently locked (without attempting verification)
     */
    async isPinLocked(userId: string): Promise<{ isLocked: boolean, lockedUntil: Date | null }> {
        try {
            const { data, error } = await supabase
                .rpc('is_pin_locked', { p_user_id: userId });

            if (error) throw error;

            return {
                isLocked: data.isLocked,
                lockedUntil: data.lockedUntil ? new Date(data.lockedUntil) : null
            };
        } catch (err) {
            console.error('Error checking lock status:', err);
            return { isLocked: false, lockedUntil: null };
        }
    },

    /**
     * Log High-Security Actions (Audit Trail)
     */
    async logAction(details: {
        action_type: string,
        entity_type: string,
        entity_id?: string,
        entity_name?: string,
        changes_summary: string
    }): Promise<void> {
        // Here we would insert into 'audit_logs' table
        // For now, console log payload to simulate strict logging
        console.log('🔒 [S16 AUDIT]', details);
    },

    /**
    * @deprecated Use validatePin instead. Kept for backward compatibility if needed.
    */
    hashPin(pin: string): string {
        // No longer used for verification, but kept if legacy checks exist
        return 'HASH_HIDDEN_BY_S16';
    },

    /**
     * Sets the user's transaction PIN securely via RPC.
     */
    async setPin(userId: string, pin: string): Promise<{ success: boolean; message: string }> {
        try {
            // Note: userId param is strictly for interface compatibility (like in hasPinConfigured),
            // but the RPC uses auth.uid() for security. We verify match just in case.
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || user.id !== userId) {
                return { success: false, message: 'Usuário não autenticado ou inválido.' };
            }

            const { data, error } = await supabase.rpc('set_own_pin', { p_pin: pin });

            if (error) throw error;

            return {
                success: data.success,
                message: data.message
            };

        } catch (err: any) {
            console.error('Error setting PIN:', err);
            return {
                success: false,
                message: err.message || 'Erro ao configurar PIN.'
            };
        }
    }
};

