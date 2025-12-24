import { supabase } from '../lib/supabase';
import SHA256 from 'crypto-js/sha256';

export const securityService = {
    /**
     * Hashes the PIN using SHA-256 (same as backend expectation)
     */
    hashPin(pin: string): string {
        return SHA256(pin).toString();
    },

    /**
     * Verified if the provided PIN is correct using secure RPC
     */
    async verifyPin(pin: string): Promise<boolean> {
        const pinHash = this.hashPin(pin);

        const { data, error } = await supabase
            .rpc('verify_transaction_pin', { p_pin_hash: pinHash });

        if (error) {
            console.error('Error verifying PIN:', error);
            // Determine if it was a lock error or other
            if (error.message.includes('locked')) {
                throw new Error('PIN bloqueado temporariamente. Tente novamente em alguns minutos.');
            }
            if (error.message.includes('PIN not set')) {
                throw new Error('PIN de segurança não configurado. Contate o administrador.');
            }
            /* If standard error, it might just be false/wrong pin, but RPC returns boolean for success/fail logic
               Actually the RPC returns FALSE on mismatch, so data would be false.
               The Error object is thrown only on Exceptions (Lock, Auth, Not Set).
            */
            throw error;
        }

        return data === true;
    },

    /**
     * Checks if the user is currently locked out locally (optional optimization)
     */
    async isLocked(): Promise<boolean> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const { data, error } = await supabase
            .rpc('is_pin_locked', { p_user_id: user.id });

        if (error) return false;
        return !!data;
    },

    /**
     * Setup initial PIN (Dev/Admin Helper)
     */
    async setPin(pin: string): Promise<void> {
        const pinHash = this.hashPin(pin);
        const { error } = await supabase
            .rpc('set_own_pin', { p_pin_hash: pinHash });

        if (error) throw error;
    }
};
