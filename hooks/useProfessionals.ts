import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

interface Professional {
  id: string;
  name: string;
  crc: string;
  specialty?: string;
  council?: string;
  color?: string;
  is_active: boolean;
}

export const useProfessionals = () => {
  const { profile } = useAuth();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfessionals = async () => {
    if (!profile?.clinic_id) {
      setProfessionals([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("professionals")
        .select("*, users!inner(active)")
        .eq("clinic_id", profile.clinic_id)
        .eq("users.active", true)
        .order("name");

      if (error) throw error;

      setProfessionals(data || []);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar profissionais");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfessionals();
  }, [profile?.clinic_id]);

  const refetch = () => {
    fetchProfessionals();
  };

  return {
    professionals,
    loading,
    error,
    refetch,
  };
};
