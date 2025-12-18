import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";
import { toast } from "react-hot-toast";

interface ActiveSession {
  session_id: string;
  user_id: string;
  clinic_id: string;
  opened_at: string;
  opening_balance: number;
  status: string;
  user_name: string;
  user_email: string;
  current_balance: number;
  transaction_count: number;
  hours_open: number;
}

interface FinancialSettings {
  clinic_id: string;
  force_cash_opening: boolean;
  force_daily_closing: boolean;
  allow_negative_balance: boolean;
  blind_closing: boolean;
  default_change_fund: number;
  max_difference_without_approval: number;
}

interface FinancialContextType {
  // Sessão ativa
  activeSession: ActiveSession | null;
  isLoadingSession: boolean;
  refreshSession: () => Promise<void>;

  // Configurações
  settings: FinancialSettings | null;
  isLoadingSettings: boolean;

  // Operações
  openCashSession: (openingBalance: number) => Promise<boolean>;
  closeCashSession: (
    declaredBalance: number,
    differenceReason?: string
  ) => Promise<boolean>;
  performWithdrawal: (amount: number, reason: string) => Promise<boolean>;
  performDeposit: (amount: number, reason: string) => Promise<boolean>;

  // Estado do modal
  showOpeningModal: boolean;
  setShowOpeningModal: (show: boolean) => void;
}

const FinancialContext = createContext<FinancialContextType | undefined>(
  undefined
);

export function FinancialProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(
    null
  );
  const [settings, setSettings] = useState<FinancialSettings | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [showOpeningModal, setShowOpeningModal] = useState(false);

  // Buscar configurações da clínica
  const loadSettings = async () => {
    if (!user?.clinic_id) return;

    setIsLoadingSettings(true);
    try {
      const { data, error } = await supabase
        .from("clinic_financial_settings")
        .select("*")
        .eq("clinic_id", user.clinic_id)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = not found
        console.error("Erro ao carregar configurações:", error);
        return;
      }

      setSettings(data);
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  // Buscar sessão ativa
  const loadActiveSession = async () => {
    if (!user?.id || !user?.clinic_id) return;

    setIsLoadingSession(true);
    try {
      const { data, error } = await supabase
        .from("user_active_session")
        .select("*")
        .eq("user_id", user.id)
        .eq("clinic_id", user.clinic_id)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = not found
        console.error("Erro ao carregar sessão ativa:", error);
        return;
      }

      setActiveSession(data);

      // Se não há sessão ativa e as configurações exigem abertura, mostrar modal
      if (!data && settings?.force_cash_opening) {
        setShowOpeningModal(true);
      }
    } catch (error) {
      console.error("Erro ao carregar sessão ativa:", error);
    } finally {
      setIsLoadingSession(false);
    }
  };

  // Refresh session
  const refreshSession = async () => {
    await loadActiveSession();
  };

  // Abrir caixa
  const openCashSession = async (openingBalance: number): Promise<boolean> => {
    if (!user?.clinic_id || !user?.id) {
      // // toast.error("Usuário não identificado");
      return false;
    }

    try {
      const { data, error } = await supabase
        .from("cash_registers")
        .insert({
          clinic_id: user.clinic_id,
          user_id: user.id,
          opening_balance: openingBalance,
          calculated_balance: openingBalance,
          status: "OPEN",
        })
        .select()
        .single();

      if (error) {
        console.error("Erro ao abrir caixa:", error);
        // // toast.error("Erro ao abrir caixa: " + error.message);
        return false;
      }

      setActiveSession(data);
      setShowOpeningModal(false);
      // toast.success("Caixa aberto com sucesso!");
      return true;
    } catch (error) {
      console.error("Erro ao abrir caixa:", error);
      // toast.error("Erro inesperado ao abrir caixa");
      return false;
    }
  };

  // Fechar caixa
  const closeCashSession = async (
    declaredBalance: number,
    differenceReason?: string
  ): Promise<boolean> => {
    if (!activeSession) {
      // toast.error("Nenhuma sessão ativa encontrada");
      return false;
    }

    try {
      const difference = declaredBalance - activeSession.current_balance;
      const isCriticalDifference =
        Math.abs(difference) >
        (settings?.max_difference_without_approval || 50);
      const status = isCriticalDifference ? "AUDIT_PENDING" : "CLOSED";

      const { error } = await supabase
        .from("cash_registers")
        .update({
          closed_at: new Date().toISOString(),
          declared_balance: declaredBalance,
          difference_amount: difference,
          difference_reason: differenceReason || null,
          status: status,
        })
        .eq("id", activeSession.session_id);

      if (error) {
        console.error("Erro ao fechar caixa:", error);
        // toast.error("Erro ao fechar caixa: " + error.message);
        return false;
      }

      setActiveSession(null);
      // toast.success(
        `Caixa fechado com sucesso! ${
          status === "AUDIT_PENDING" ? "(Pendente de auditoria)" : ""
        }`
      );
      return true;
    } catch (error) {
      console.error("Erro ao fechar caixa:", error);
      // toast.error("Erro inesperado ao fechar caixa");
      return false;
    }
  };

  // Sangria (retirada)
  const performWithdrawal = async (
    amount: number,
    reason: string
  ): Promise<boolean> => {
    if (!activeSession) {
      // toast.error("Caixa não está aberto");
      return false;
    }

    if (amount <= 0) {
      // toast.error("Valor deve ser positivo");
      return false;
    }

    try {
      const { error } = await supabase.from("transactions").insert({
        clinic_id: user?.clinic_id,
        cash_register_id: activeSession.session_id,
        description: `Sangria: ${reason}`,
        amount: amount,
        type: "EXPENSE",
        category: "Sangria",
        date: new Date().toISOString().split("T")[0],
        payment_method: "Dinheiro",
      });

      if (error) {
        console.error("Erro na sangria:", error);
        // toast.error("Erro na sangria: " + error.message);
        return false;
      }

      await refreshSession(); // Atualizar saldo
      // toast.success(`Sangria de R$ ${amount.toFixed(2)} realizada`);
      return true;
    } catch (error) {
      console.error("Erro na sangria:", error);
      // toast.error("Erro inesperado na sangria");
      return false;
    }
  };

  // Suprimento (depósito)
  const performDeposit = async (
    amount: number,
    reason: string
  ): Promise<boolean> => {
    if (!activeSession) {
      // toast.error("Caixa não está aberto");
      return false;
    }

    if (amount <= 0) {
      // toast.error("Valor deve ser positivo");
      return false;
    }

    try {
      const { error } = await supabase.from("transactions").insert({
        clinic_id: user?.clinic_id,
        cash_register_id: activeSession.session_id,
        description: `Suprimento: ${reason}`,
        amount: amount,
        type: "INCOME",
        category: "Suprimento",
        date: new Date().toISOString().split("T")[0],
        payment_method: "Dinheiro",
      });

      if (error) {
        console.error("Erro no suprimento:", error);
        // toast.error("Erro no suprimento: " + error.message);
        return false;
      }

      await refreshSession(); // Atualizar saldo
      // toast.success(`Suprimento de R$ ${amount.toFixed(2)} realizado`);
      return true;
    } catch (error) {
      console.error("Erro no suprimento:", error);
      // toast.error("Erro inesperado no suprimento");
      return false;
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    if (user?.clinic_id) {
      loadSettings();
    }
  }, [user?.clinic_id]);

  useEffect(() => {
    if (user?.id && user?.clinic_id && settings) {
      loadActiveSession();
    }
  }, [user?.id, user?.clinic_id, settings]);

  // Verificar abertura obrigatória
  useEffect(() => {
    if (settings?.force_cash_opening && !activeSession && !isLoadingSession) {
      setShowOpeningModal(true);
    }
  }, [settings, activeSession, isLoadingSession]);

  const value: FinancialContextType = {
    activeSession,
    isLoadingSession,
    refreshSession,
    settings,
    isLoadingSettings,
    openCashSession,
    closeCashSession,
    performWithdrawal,
    performDeposit,
    showOpeningModal,
    setShowOpeningModal,
  };

  return (
    <FinancialContext.Provider value={value}>
      {children}
    </FinancialContext.Provider>
  );
}

export function useFinancial() {
  const context = useContext(FinancialContext);
  if (context === undefined) {
    throw new Error("useFinancial must be used within a FinancialProvider");
  }
  return context;
}

// Hooks específicos
export function useActiveSession() {
  const { activeSession, isLoadingSession, refreshSession } = useFinancial();
  return { activeSession, isLoadingSession, refreshSession };
}

export function useCashOperations() {
  const {
    openCashSession,
    closeCashSession,
    performWithdrawal,
    performDeposit,
  } = useFinancial();

  return {
    openCashSession,
    closeCashSession,
    performWithdrawal,
    performDeposit,
  };
}
