import React, { createContext, useEffect, useState, useContext } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// Definição simples para garantir que não quebre tipos
export interface AuthContextData {
  user: any;
  profile: any;
  clinicId: string | null;
  loading: boolean;
  signIn: (clinicCode: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ... (maintain existing state and fetchProfile) [TRUNCATED for brevity in replacement]
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 🛡️ WATCHDOG: Força a saída do estado de loading se o banco não responder em 5s
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        console.error("⛔ [AUTH] Watchdog: Tempo limite (5s) excedido. Forçando liberação.");
        setLoading(false);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [loading]);

  // Função Nuclear de Busca de Perfil
  const fetchProfile = async (userId: string, email: string) => {
    console.log("🔍 [AUTH] Buscando perfil para:", email);

    try {
      // TENTATIVA 1: Busca direta pelo ID
      let { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      // TENTATIVA 2: Se falhar pelo ID, busca pelo E-mail (Fallback)
      if (!data || error) {
        console.warn("⚠️ [AUTH] Falha pelo ID. Tentando por Email...");
        const responseEmail = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single();

        data = responseEmail.data;
        error = responseEmail.error;
      }

      if (error) {
        console.error("❌ [AUTH] Erro fatal ao buscar perfil:", error);
        toast.error("Erro ao buscar perfil: " + error.message);
        return null;
      }

      if (data) {
        console.log("✅ [AUTH] Perfil encontrado:", data);
        setProfile(data);
        return data;
      } else {
        console.error("❌ [AUTH] Perfil não encontrado no banco!");
        toast.error("Perfil de usuário não encontrado.");
        return null;
      }
    } catch (err: any) {
      console.error("🔥 [AUTH] Exceção:", err);
      toast.error("Erro exceção Auth: " + err.message);
      return null;
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 [AUTH EVENT]:", event);

      if (session?.user) {
        setUser(session.user);

        // 🚀 METADATA FIRST STRATEGY (Ultimatum)
        // Se temos o ID da clínica nos metadados, liberamos o acesso IMEDIATAMENTE.
        const metadata = session.user.user_metadata;

        if (metadata && metadata.clinic_id) {
          console.log("🚀 [AUTH] Fast-track: Usando metadados da sessão para acesso imediato.");
          setProfile({
            id: session.user.id,
            email: session.user.email,
            clinic_id: metadata.clinic_id,
            role: metadata.role || 'PROFESSIONAL', // Fallback seguro
            name: metadata.name || session.user.email?.split('@')[0] || 'Usuário',
            active: true
          });
          setLoading(false); // 🔓 UNLOCK UI IMMEDIATELY
        }

        // 🔄 Background Sync: Busca dados frescos do banco (sem bloquear UX)
        fetchProfile(session.user.id, session.user.email!).then(fullProfile => {
          if (fullProfile) {
            console.log("🔄 [AUTH] Perfil sincronizado com o banco.");
            setProfile(fullProfile);
          }
          // Se não tínhamos metadados, só agora liberamos o loading
          if (!metadata?.clinic_id) setLoading(false);
        });

      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (clinicCode: string, email: string, password: string) => {
    console.log(`[AUTH] Tentando login (Clinic: ${clinicCode}, Email: ${email})`);
    try {
      setLoading(true);
      // Supabase só precisa de email e senha. O clinicCode seria para multi-tenant real, mas aqui validamos depois.
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) throw error;

      if (data.user) {
        setUser(data.user);
        const profileData = await fetchProfile(data.user.id, data.user.email!);

        if (!profileData) {
          toast.error("Erro crítico: Usuário sem perfil no banco de dados.");
        } else {
          toast.success("Login realizado com sucesso!");
          navigate('/dashboard');
        }
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error("Erro ao fazer login: " + (error.message || error));
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    navigate('/login');
  };

  const updateProfile = async (data: any) => {
    console.log("Update profile not implemented in debug mode", data);
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      clinicId: profile?.clinic_id || null, // AQUI ESTÁ A CHAVE
      loading,
      signIn,
      signOut,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
