import React, { createContext, useContext, useEffect, useState, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: any;
  session: any;
  loading: boolean;
  isAdmin: boolean;
  isMaster: boolean;
  signIn: (clinicCode: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  profile: any;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMaster, setIsMaster] = useState(false);

  // Trava Anti-Loop e Controle de Busca
  const lastTokenRef = useRef<string | null>(null);
  const fetchingRef = useRef(false);

  // 1. Função para carregar dados do usuário (Hoisted for refreshProfile access)
  const initializeUser = async (currentSession: any) => {
    if (!currentSession?.user) return;

    const metadata = currentSession.user.user_metadata || {};
    let clinicId = metadata.clinic_id;
    let role = metadata.role;

    // 🔧 HARDCODED DEV IDENTITY (Zero Guest Protocol)
    if (!clinicId && (currentSession.user.email?.includes('marcelo') || currentSession.user.email?.includes('admin'))) {
      clinicId = '550e8400-e29b-41d4-a716-446655440000';
      role = 'MASTER';

      // Persiste a injeção
      currentSession.user.user_metadata = { ...metadata, clinic_id: clinicId, role };
      supabase.auth.updateUser({ data: { clinic_id: clinicId, role } });
    }

    // 🔍 BUSCA DE IDENTIDADE (Database Authority)
    // Sempre busca dados atualizados do banco (Nome, Role, Avatar) para garantir consistência
    const { data: dbProfile } = await supabase
      .from('users')
      .select('clinic_id, role, name, photo_url') // 🛠️ FIX: photo_url instead of avatar_url
      .eq('id', currentSession.user.id)
      .maybeSingle();

    if (dbProfile) {
      clinicId = dbProfile.clinic_id || clinicId;
      role = dbProfile.role || role;
    }

    // Conclusão da Identidade
    if (clinicId) {
      setSession(currentSession);
      // Funde os dados da sessão com a identidade descoberta
      setUser({
        ...currentSession.user,
        clinic_id: clinicId,
        role: role,
        email: currentSession.user.email,
        name: dbProfile?.name || currentSession.user.user_metadata?.full_name || 'Usuário',
        avatar_url: dbProfile?.photo_url || currentSession.user.user_metadata?.avatar_url // Map correctly
      });

      setIsAdmin(role === 'ADMIN' || role === 'MASTER');
      setIsMaster(role === 'MASTER');
      setLoading(false);
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 2. Verificação Inicial de Sessão
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (s) {
        lastTokenRef.current = s.access_token;
        initializeUser(s);
      } else {
        setLoading(false);
      }
    });

    // 3. Ouvinte de Mudanças (Com Trava de Segurança)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      // 🚨 REMOVIDO CONSOLE.LOG QUE CAUSAVA RE-RENDER

      const token = currentSession?.access_token ?? null;

      // Impede reprocessar a mesma sessão (Causa do Loop)
      if (token && lastTokenRef.current === token && event !== 'SIGNED_OUT') {
        // 🚨 REMOVIDO CONSOLE.LOG QUE CAUSAVA RE-RENDER
        return;
      }

      lastTokenRef.current = token;

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        initializeUser(currentSession);
      } else if (event === 'INITIAL_SESSION') {
        // 🛡️ GHOST SESSION GUARD
        const isDev = currentSession?.user?.email?.includes('marcelo') || currentSession?.user?.email?.includes('admin');

        if (currentSession?.user && !currentSession.user.user_metadata?.clinic_id && !isDev) {
          console.warn("👻 [AUTH] Sessão Fantasma detectada. Forçando purificação...");
          signOut();
        } else {
          initializeUser(currentSession);
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setIsAdmin(false);
        setIsMaster(false);
        lastTokenRef.current = null;
        setLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (clinicCode: string, email: string, password: string) => {
    // 1. Validação do código da clínica (opcional, mas boa prática UX)
    if (clinicCode.toUpperCase() !== 'CLINICPRO' && clinicCode.toUpperCase() !== 'TCHELO') {
      // Por enquanto aceitamos CLINICPRO/TCHELO como default hardcoded para dev
      // No futuro isso validaria contra tabela 'clinics'
      // throw new Error("Código da clínica inválido");
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Erro ao fazer signout no Supabase:", err);
    } finally {
      localStorage.clear(); // Limpa TUDO para evitar lixo de sessão
      sessionStorage.clear();
      window.location.href = '/login'; // Força recarregamento físico da página
    }
  };

  // 4. Função Pública para Recarregar Perfil (Ex: após edição)
  const refreshProfile = async () => {
    if (session) {
      await initializeUser(session);
    }
  };

  // Memoização do contexto para prevenir re-renders desnecessários
  const contextValue = useMemo(
    () => ({
      user,
      session,
      loading,
      isAdmin,
      isMaster,
      signIn,
      signOut,
      profile: user,
      refreshProfile
    }),
    [user, session, loading, isAdmin, isMaster]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
