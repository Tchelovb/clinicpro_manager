import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { User } from "@supabase/supabase-js";
import toast from "react-hot-toast";

interface Profile {
  id: string;
  clinic_id: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
  is_bos_fab_enabled: boolean;
  clinics: {
    id: string;
    name: string;
    code: string;
    status?: string;
  } | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  activeClinicId: string | null;
  clinicId?: string; // Atalho direto para profile.clinic_id
  setActiveClinic: (clinicId: string | null) => void;
  updateProfileSettings: (settings: Partial<Profile>) => Promise<void>;
  signIn: (
    clinicCode: string,
    email: string,
    password: string
  ) => Promise<void>;
  signUp: (email: string, password: string, clinicName: string) => Promise<{ error: string | null, data?: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeClinicId, setActiveClinicId] = useState<string | null>(null);

  // 1. WATCHDOG TIMER (Cão de Guarda)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        console.error("Auth timeout: Watchdog forcing stop loading.");
        setLoading(false);
        if (!user) toast.error("Tempo limite de conexão excedido. Tente recarregar.");
      }
    }, 5000); // 5 segundos máximo

    return () => clearTimeout(timer);
  }, [loading, user]);

  // 2. AUTH LISTENER & INITIALIZATION
  useEffect(() => {
    // Check inicial rápido
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth event:", event);
      setUser(session?.user ?? null);

      if (session?.user?.id) {
        // Tenta carregar profile - O finally garante o fim do loading
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      // setLoading(true); // Opcional, já deve estar true no login, mas mal não faz

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select(
          "id, clinic_id, email, name, role, active, clinics!clinic_id(id, name, code, status)"
        )
        .eq("id", userId)
        .single();

      const { data: authUser } = await supabase.auth.getUser();
      const isBosEnabled = authUser?.user?.user_metadata?.is_bos_fab_enabled !== false;

      if (userError || !userData) {
        console.error("Erro Supabase:", userError);
        throw new Error("Usuário não encontrado na base de dados.");
      }

      const clinicData = (userData as any).clinics;

      // Verificar suspensão
      if (
        userData.role !== 'MASTER' &&
        clinicData &&
        clinicData.status === 'SUSPENDED'
      ) {
        await supabase.auth.signOut();
        throw new Error('Acesso suspenso. Entre em contato com o suporte financeiro.');
      }

      // Validação de Código da Clínica
      const pendingClinicCode = sessionStorage.getItem("pending_clinic_code");
      if (userData.role === 'MASTER') {
        if (pendingClinicCode && pendingClinicCode !== 'MASTER') {
          console.warn('MASTER logou com código diferente de MASTER');
        }
      } else {
        if (
          pendingClinicCode &&
          clinicData &&
          clinicData.code?.toUpperCase() !== pendingClinicCode?.toUpperCase()
        ) {
          console.error("Auth: Código inválido", { esperado: clinicData.code, recebido: pendingClinicCode });
          await supabase.auth.signOut();
          throw new Error("Código da clínica inválido.");
        }
      }

      sessionStorage.removeItem("pending_clinic_code");

      const profileData: Profile = {
        id: userData.id,
        clinic_id: userData.clinic_id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        active: userData.active,
        is_bos_fab_enabled: isBosEnabled,
        clinics: clinicData || null,
      };

      setProfile(profileData);

    } catch (err: any) {
      console.error("Auth error:", err);
      toast.error("Erro ao carregar perfil: " + (err.message || "Erro desconhecido"));
      setProfile(null);
      // Opcional: signOut se falhar criticamente para evitar "limbo"
      // await supabase.auth.signOut();
    } finally {
      // 🔓 CHAVE MESTRA: Libera a tela SEMPRE
      setLoading(false);
    }
  };

  const signIn = async (
    clinicCode: string,
    email: string,
    password: string
  ) => {
    setLoading(true);
    sessionStorage.setItem("pending_clinic_code", clinicCode);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      sessionStorage.removeItem("pending_clinic_code");
      setLoading(false);
      throw error;
    }
    // Não precisa fazer mais nada! O onAuthStateChange vai detectar e atualizar tudo
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const signUp = async (email: string, password: string, clinicName: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          clinic_name: clinicName
        }
      }
    });

    if (error) {
      setLoading(false);
      return { error: error.message };
    }

    setLoading(false);
    return { error: null, data };
  };

  const setActiveClinic = (clinicId: string | null) => {
    setActiveClinicId(clinicId);
  };

  const updateProfileSettings = async (settings: Partial<Profile>) => {
    if (!profile) return;

    // Optimistic Update
    setProfile(prev => prev ? { ...prev, ...settings } : null);

    if (settings.is_bos_fab_enabled !== undefined) {
      const { error } = await supabase.auth.updateUser({
        data: { is_bos_fab_enabled: settings.is_bos_fab_enabled }
      });
      console.log('Updated BOS FAB Status:', settings.is_bos_fab_enabled, error || 'Success');
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      activeClinicId,
      // Helper direto para garantir acesso fácil ao ID blindado
      clinicId: profile?.clinic_id,
      setActiveClinic,
      signIn,
      signUp,
      signOut,
      updateProfileSettings
    }}>
      {children}
    </AuthContext.Provider>
  );
};
