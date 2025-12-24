import { supabase } from '../lib/supabase';

// Helper interface for RPC response
interface PinVerificationResult {
    success: boolean;
    message?: string;
    isLocked?: boolean;
    lockedUntil?: string; // ISO Date string
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
                isLocked: data.isLocked || false,
                lockedUntil: data.lockedUntil ? new Date(data.lockedUntil) : null,
                attemptsRemaining: data.attemptsRemaining
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
    }
};

