import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

// ⚠️ SOLUÇÃO SIMPLIFICADA: Removido fetch customizado que causava perda de headers
// Mantendo apenas Connection: close nos headers globais
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      // Adiciona Connection: close para evitar HTTP/2 multiplexing
      // O Supabase vai mesclar com headers padrão (apikey, Authorization)
      'Connection': 'close',
    },
  },
  db: {
    schema: 'public',
  },
});

// Helper function to get current clinic ID from user profile
export const getCurrentClinicId = async (): Promise<string | null> => {
  try {
    // Get user from auth session
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) return null;

    // Get profile from users table to get clinic_id
    const { data: profile, error } = await supabase
      .from("users")
      .select("clinic_id")
      .eq("id", session.user.id)
      .single();

    if (error || !profile) {
      console.error("Error getting user profile:", error);
      return null;
    }

    return profile.clinic_id || null;
  } catch (error) {
    console.error("Error getting clinic ID:", error);
    return null;
  }
};

// Helper function to get current clinic ID from JWT (deprecated - use AuthContext instead)
export const getCurrentClinicIdFromJWT = async (): Promise<string | null> => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) return null;

    // Extract clinic_id from user metadata or JWT
    // This assumes clinic_id is stored in user metadata during registration
    return session.user.user_metadata?.clinic_id || null;
  } catch (error) {
    console.error("Error getting clinic ID:", error);
    return null;
  }
};
