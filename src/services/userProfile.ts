import { supabase } from "../../lib/supabase";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  color?: string;
  active: boolean;
  clinic_id: string;
}

/**
 * Busca o perfil do usuário usando o authId (UID do Supabase Auth)
 */
export const getProfileByAuthId = async (
  authId: string
): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", authId)
      .single();

    if (error) {
      console.error("Erro ao buscar perfil:", error);
      return null;
    }

    return data as UserProfile;
  } catch (error) {
    console.error("Erro ao buscar perfil:", error);
    return null;
  }
};

/**
 * Atualiza o perfil do usuário
 */
export const updateProfile = async (
  authId: string,
  data: Partial<Pick<UserProfile, "name" | "role" | "phone" | "color">>
): Promise<UserProfile | null> => {
  try {
    const { data: updatedData, error } = await supabase
      .from("users")
      .update(data)
      .eq("id", authId)
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar perfil:", error);
      throw error;
    }

    return updatedData as UserProfile;
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    throw error;
  }
};

/**
 * Atualiza a senha do usuário autenticado
 */
export const updatePassword = async (newPassword: string): Promise<void> => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error("Erro ao atualizar senha:", error);
      throw error;
    }
  } catch (error) {
    console.error("Erro ao atualizar senha:", error);
    throw error;
  }
};
