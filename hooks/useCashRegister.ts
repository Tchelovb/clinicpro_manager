import { useState, useEffect } from "react";
import { supabase } from "../src/lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export interface CashRegister {
  id: string;
  clinic_id: string;
  user_id: string;
  opened_at: string;
  closed_at?: string;
  opening_balance: number;
  closing_balance?: number;
  calculated_balance: number;
  status: "OPEN" | "CLOSED";
  responsible_name: string;
  observations?: string;
  transactions: any[];
}

export const useOpenCashRegisters = () => {
  const [registers, setRegisters] = useState<CashRegister[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useAuth();

  const fetchRegisters = async () => {
    if (!profile?.clinic_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("cash_registers")
        .select(
          `
          *,
          transactions (*)
        `
        )
        .eq("clinic_id", profile.clinic_id)
        .eq("status", "OPEN")
        .order("opened_at", { ascending: false });

      if (error) throw error;
      setRegisters(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegisters();
  }, [profile?.clinic_id]);

  return { registers, loading, error, refetch: fetchRegisters };
};

export const useCashRegisterActions = () => {
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();

  const openRegister = async (openingBalance: number) => {
    if (!profile) throw new Error("Usuário não autenticado");

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("cash_registers")
        .insert({
          clinic_id: profile.clinic_id,
          user_id: profile.id,
          opening_balance: openingBalance,
          calculated_balance: openingBalance,
          status: "OPEN",
          responsible_name: profile.name,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } finally {
      setLoading(false);
    }
  };

  const closeRegister = async (
    registerId: string,
    closingBalance: number,
    observations?: string
  ) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("cash_registers")
        .update({
          status: "CLOSED",
          closed_at: new Date().toISOString(),
          closing_balance: closingBalance,
          observations,
        })
        .eq("id", registerId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } finally {
      setLoading(false);
    }
  };

  return { openRegister, closeRegister, loading };
};

export const useRegisterPayment = () => {
  const [loading, setLoading] = useState(false);

  const registerPayment = async ({
    installmentId,
    amount,
    paymentMethod,
    cashRegisterId,
    notes,
  }: {
    installmentId: string;
    amount: number;
    paymentMethod: string;
    cashRegisterId: string;
    notes?: string;
  }) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "register-payment-cash",
        {
          body: {
            installment_id: installmentId,
            amount,
            payment_method: paymentMethod,
            cash_register_id: cashRegisterId,
            notes,
          },
        }
      );

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      return data;
    } finally {
      setLoading(false);
    }
  };

  return { registerPayment, loading };
};
