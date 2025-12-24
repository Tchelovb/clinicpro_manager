import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { User } from "@supabase/supabase-js";

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

  useEffect(() => {
    setLoading(true);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth event:", event);

      setUser(session?.user ?? null);

      if (session?.user) {
        if (session.user.id) {
          // Faz o fetchProfile em background, sem bloquear o loading
          fetchProfile(session.user.id).catch((err) => {
            console.error(
              "Falha ao carregar profile (continuando sem ele):",
              err
            );
            setProfile(null);
          });
        }
      } else {
        setProfile(null);
      }

      // SEMPRE termina o loading, independentemente do profile
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select(
          "id, clinic_id, email, name, role, active, clinics!clinic_id(id, name, code, status)"
        )
        .eq("id", userId)
        .single();

      const { data: authUser } = await supabase.auth.getUser();
      const isBosEnabled = authUser?.user?.user_metadata?.is_bos_fab_enabled !== false; // Default true

      if (userError || !userData) {
        console.error("Erro Supabase:", userError);
        throw new Error("Usuário não encontrado");
      }

      const clinicData = (userData as any).clinics;

      // Verificar se clínica está suspensa (exceto para MASTER)
      if (
        userData.role !== 'MASTER' &&
        clinicData &&
        clinicData.status === 'SUSPENDED'
      ) {
        await supabase.auth.signOut();
        throw new Error('Acesso suspenso. Entre em contato com o suporte financeiro.');
      }

      // Validação do código da clínica (se houver pending)
      const pendingClinicCode = sessionStorage.getItem("pending_clinic_code");

      // MASTER pode usar código 'MASTER' para fazer login
      if (userData.role === 'MASTER') {
        // MASTER não precisa validar código de clínica específica
        if (pendingClinicCode && pendingClinicCode !== 'MASTER') {
          console.warn('MASTER tentou logar com código diferente de MASTER');
        }
      } else {
        // Usuários normais precisam validar código da clínica
        if (
          pendingClinicCode &&
          clinicData &&
          clinicData.code?.toUpperCase() !== pendingClinicCode?.toUpperCase()
        ) {
          console.error("AuthContext: Código da clínica inválido", {
            esperado: clinicData.code,
            recebido: pendingClinicCode,
          });
          await supabase.auth.signOut();
          throw new Error("Código da clínica inválido");
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
      setProfile(null);
      // Opcional: deslogar em caso de erro grave
      // await supabase.auth.signOut();
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
    <AuthContext.Provider value={{ user, profile, loading, activeClinicId, setActiveClinic, signIn, signUp, signOut, updateProfileSettings }}>
      {children}
    </AuthContext.Provider>
  );
};
