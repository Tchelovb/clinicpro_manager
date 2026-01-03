import { supabase } from '../src/lib/supabase';

/**
 * Creates a new user in the system (Admin only)
 * This function calls the Edge Function that uses admin privileges
 * 
 * @param email - User email
 * @param password - User password
 * @param fullName - User full name
 * @param role - User role (admin, dentist, secretary)
 * @param clinicId - Clinic ID to associate the user with
 * @returns Promise with user data or error
 */
export const createUser = async ({
    email,
    password,
    fullName,
    role = 'secretary',
    clinicId
}: {
    email: string;
    password: string;
    fullName: string;
    role?: 'admin' | 'dentist' | 'secretary';
    clinicId: string;
}) => {
    try {
        const { data, error } = await supabase.functions.invoke('create-user', {
            body: {
                email,
                password,
                full_name: fullName,
                role,
                clinic_id: clinicId
            },
        });

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error creating user:', error);
        return { data: null, error: error.message || 'Erro ao criar usuário' };
    }
};

/**
 * Updates an existing user's data and permissions
 * 
 * @param userId - User ID to update
 * @param data - User data to update (email, fullName, role, permissions)
 * @returns Promise with success message or error
 */
export const updateUser = async ({
    userId,
    email,
    fullName,
    role,
    permissions
}: {
    userId: string;
    email?: string;
    fullName?: string;
    role?: 'admin' | 'dentist' | 'secretary';
    permissions?: {
        can_view_financial: boolean;
        can_edit_calendar: boolean;
        can_manage_settings: boolean;
        can_delete_patient: boolean;
        can_give_discount: boolean;
        max_discount_percent: number;
        role: string;
    };
}) => {
    try {
        const { data, error } = await supabase.functions.invoke('update-user', {
            body: {
                user_id: userId,
                email,
                full_name: fullName,
                role,
                permissions
            },
        });

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error updating user:', error);
        return { data: null, error: error.message || 'Erro ao atualizar usuário' };
    }
};

/**
 * Deletes a user from the system
 * 
 * @param userId - User ID to delete
 * @returns Promise with success message or error
 */
export const deleteUser = async (userId: string) => {
    try {
        const { data, error } = await supabase.functions.invoke('delete-user', {
            body: { user_id: userId },
        });

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error deleting user:', error);
        return { data: null, error: error.message || 'Erro ao deletar usuário' };
    }
};

/**
 * Example usage in a React component:
 * 
 * const handleCreateProfessional = async () => {
 *   try {
 *     const { data: { user } } = await supabase.auth.getUser();
 *     const clinicId = user?.user_metadata?.clinic_id;
 * 
 *     if (!clinicId) {
 *       throw new Error('Clinic ID not found');
 *     }
 * 
 *     const { data, error } = await createUser({
 *       email: 'novo.dentista@email.com',
 *       password: 'SenhaProvisoria123',
 *       fullName: 'Dr. Roberto',
 *       role: 'dentist',
 *       clinicId
 *     });
 * 
 *     if (error) throw new Error(error);
 * 
 *     toast.success('Profissional cadastrado com sucesso!');
 *   } catch (error) {
 *     console.error('Erro ao criar:', error);
 *     toast.error('Erro: ' + error.message);
 *   }
 * };
 */
