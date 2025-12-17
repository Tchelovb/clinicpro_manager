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
  clinics: {
    id: string;
    name: string;
    code: string;
  } | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (
    clinicCode: string,
    email: string,
    password: string
  ) => Promise<void>;
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

  useEffect(() => {
    setLoading(true);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth event:", event);

      setUser(session?.user ?? null);

      if (session?.user) {
        // Faz o fetchProfile em background, sem bloquear o loading
        fetchProfile(session.user.id).catch((err) => {
          console.error(
            "Falha ao carregar profile (continuando sem ele):",
            err
          );
          setProfile(null);
        });
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
          "id, clinic_id, email, name, role, active, clinics!clinic_id(id, name, code)"
        )
        .eq("id", userId)
        .single();
      // Correção final: Query users com nested clinics!clinic_id para resolver 500

      if (userError || !userData) {
        console.error("Erro Supabase:", userError);
        throw new Error("Usuário não encontrado");
      }

      const clinicData = (userData as any).clinics;

      // Validação do código da clínica (se houver pending)
      const pendingClinicCode = sessionStorage.getItem("pending_clinic_code");
      if (
        pendingClinicCode &&
        clinicData &&
        clinicData.code !== pendingClinicCode
      ) {
        await supabase.auth.signOut();
        throw new Error("Código da clínica inválido");
      }

      sessionStorage.removeItem("pending_clinic_code");

      const profileData: Profile = {
        id: userData.id,
        clinic_id: userData.clinic_id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        active: userData.active,
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

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
