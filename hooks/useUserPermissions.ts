import { useState, useEffect } from 'react';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Permissions {
    can_approve_budget: boolean;
    can_view_margins: boolean;
    can_access_checkout: boolean;
    can_edit_prices: boolean;
    can_process_payments: boolean;
}

export const useUserPermissions = () => {
    const { user } = useAuth();
    const [permissions, setPermissions] = useState<Permissions>({
        can_approve_budget: false, // Default seguro (Travado)
        can_view_margins: false,
        can_access_checkout: false,
        can_edit_prices: false,
        can_process_payments: false
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        const fetchPermissions = async () => {
            try {
                // FIX: Use maybeSingle() instead of single() to avoid 406 error
                // when user_permissions row doesn't exist yet
                const { data, error } = await supabase
                    .from('user_permissions')
                    .select('*')
                    .eq('user_id', user.id)
                    .maybeSingle(); // Returns null if no row found, instead of throwing error

                if (error) {
                    console.error('Erro ao buscar permissões:', error);
                }

                if (data) {
                    setPermissions({
                        can_approve_budget: data.can_approve_budget || false,
                        can_view_margins: data.can_view_financial_margins || false,
                        can_access_checkout: data.can_access_pos || false,
                        can_edit_prices: data.can_edit_prices || false,
                        can_process_payments: data.can_process_payments || false
                    });
                } else {
                    // Fallback: ADMIN e OWNER têm todas as permissões
                    if (user.role === 'ADMIN' || user.role === 'OWNER') {
                        setPermissions({
                            can_approve_budget: true,
                            can_view_margins: true,
                            can_access_checkout: true,
                            can_edit_prices: true,
                            can_process_payments: true
                        });
                    }
                }
            } catch (err) {
                console.error('Erro ao carregar permissões:', err);

                // Fallback para ADMIN/OWNER em caso de erro
                if (user.role === 'ADMIN' || user.role === 'OWNER') {
                    setPermissions({
                        can_approve_budget: true,
                        can_view_margins: true,
                        can_access_checkout: true,
                        can_edit_prices: true,
                        can_process_payments: true
                    });
                }
            } finally {
                setLoading(false);
            }
        };

        fetchPermissions();
    }, [user?.id, user?.role]);

    return { permissions, loading };
};
