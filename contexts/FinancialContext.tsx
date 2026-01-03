import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "../src/lib/supabase";
import { withRetry } from "../src/lib/supabaseWithRetry";
import { useAuth } from "./AuthContext";
import { CashRegister, ClinicFinancialSettings, Expense, FinancialRecord } from "../types";

interface FinancialContextType {
  // State
  financialSettings: ClinicFinancialSettings | null;
  cashRegisters: CashRegister[];
  activeSession: CashRegister | null;
  expenses: Expense[];
  globalTransactions: FinancialRecord[];

  // Actions
  refreshFinancialData: () => Promise<void>;
  openSession: (initialBalance: number, user: string) => Promise<void>;
  closeSession: (id: string, closingBalance: number, observations?: string) => Promise<void>;
  addExpense: (expense: Omit<Expense, "id">) => Promise<void>;
  payExpense: (id: string, amount: number, method: string, date: string, notes?: string) => Promise<void>;
  addCashMovement: (type: 'sangria' | 'suprimento', amount: number, description: string) => Promise<void>;


  // Helper to record transaction from other contexts (e.g. Patient Payment)
  recordTransaction: (transaction: Omit<FinancialRecord, "id">) => void;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export const FinancialProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { profile } = useAuth();

  const [financialSettings, setFinancialSettings] = useState<ClinicFinancialSettings | null>(null);
  const [cashRegisters, setCashRegisters] = useState<CashRegister[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [globalTransactions, setGlobalTransactions] = useState<FinancialRecord[]>([]);

  // Derived active session
  const activeSession = cashRegisters.find((cr) => cr.status === "Aberto") || null;

  // Initial Fetch
  // Initial Fetch - 🛑 AUTO-FETCH DESATIVADO para evitar congestionamento
  // O carregamento será acionado via DataContext ou on-demand
  useEffect(() => {
    // if (profile?.clinic_id) {
    //   refreshFinancialData();
    // }
  }, [profile?.clinic_id]);

  const refreshFinancialData = async () => {
    if (!profile?.clinic_id) return;

    try {
      // 1. Settings
      const { data: settingsData, error: settingsError } = await withRetry(
        () => supabase
          .from("clinic_financial_settings")
          .select("*")
          .eq("clinic_id", profile.clinic_id)
          .maybeSingle(),
        {
          onRetry: (attempt) => console.log(`🔄 [FINANCIAL] Retentando busca de configurações (tentativa ${attempt})`)
        }
      );

      if (settingsError) {
        console.error("Erro ao buscar configurações financeiras:", settingsError);
      }

      if (settingsData) setFinancialSettings(settingsData);

      // ⏱️ Delay para evitar congestionamento
      await new Promise(resolve => setTimeout(resolve, 150));

      // 2. Expenses
      const { data: expensesData } = await withRetry(
        () => supabase
          .from("expenses")
          .select("*")
          .eq("clinic_id", profile.clinic_id)
          .order("due_date", { ascending: true })
      );

      if (expensesData) {
        setExpenses(expensesData.map((e: any) => ({
          id: e.id,
          description: e.description,
          category: e.category,
          provider: e.provider || '',
          amount: e.amount,
          amountPaid: e.amount_paid || 0,
          dueDate: new Date(e.due_date).toLocaleDateString("pt-BR"),
          status: e.status === 'PENDING' ? 'Pendente' :
            e.status === 'PAID' ? 'Pago' :
              e.status === 'PARTIAL' ? 'Pago Parcial' :
                e.status === 'OVERDUE' ? 'Atrasado' : e.status,
          paymentHistory: []
        })));
      }

      // ⏱️ Delay para evitar congestionamento
      await new Promise(resolve => setTimeout(resolve, 150));

      // 3. Cash Registers (History + Active)
      // Fetch History
      const { data: historyData } = await withRetry(
        () => supabase
          .from("cash_registers")
          .select("*")
          .eq("clinic_id", profile.clinic_id)
          .in("status", ["CLOSED", "AUDIT_PENDING"])
          .order("closed_at", { ascending: false })
          .limit(10)
      );

      // Fetch Active
      const { data: activeData } = await withRetry(
        () => supabase
          .from("cash_registers")
          .select("*")
          .eq("clinic_id", profile.clinic_id)
          .eq("user_id", profile.id)
          .eq("status", "OPEN")
          .is("closed_at", null)
          .maybeSingle()
      );

      let registers: CashRegister[] = [];

      // Map History
      if (historyData) {
        registers = historyData.map((h: any) => ({
          id: h.id,
          openedAt: h.opened_at,
          responsibleName: 'N/A', // TODO: Fetch name
          openingBalance: h.opening_balance,
          calculatedBalance: h.calculated_balance,
          status: (h.status === 'CLOSED' ? 'Fechado' : 'Fechado') as 'Fechado', // Temporary mapping until type supports Auditoria
          closedAt: h.closed_at,
          closingBalance: h.declared_balance,
          observations: h.observations,
          transactions: []
        }));
      }

      // Map Active
      if (activeData) {
        // Fetch transactions for active session
        const { data: txData } = await supabase
          .from("transactions")
          .select("*")
          .eq("cash_register_id", activeData.id)
          .order("created_at", { ascending: false });

        const transactions: FinancialRecord[] = (txData || []).map((tx: any) => ({
          id: tx.id,
          description: tx.description,
          amount: tx.amount,
          type: tx.type === 'INCOME' ? 'income' : 'expense',
          date: new Date(tx.created_at).toLocaleDateString("pt-BR"),
          category: tx.category,
          status: 'Pago',
          paymentMethod: tx.payment_method,
          cashRegisterId: tx.cash_register_id
        }));

        // Update global list (just for display if needed)
        setGlobalTransactions(transactions);

        const activeRegister: CashRegister = {
          id: activeData.id,
          openedAt: activeData.opened_at,
          responsibleName: profile.name || 'Você',
          openingBalance: activeData.opening_balance,
          calculatedBalance: activeData.calculated_balance,
          status: 'Aberto',
          transactions: transactions
        };

        registers = [activeRegister, ...registers];
      }

      setCashRegisters(registers);

    } catch (err) {
      console.error("FinancialContext: Error refreshing data", err);
    }
  };

  // --- ACTIONS ---

  const openSession = async (initialBalance: number, user: string) => {
    if (activeSession) return;
    try {
      const { data, error } = await supabase
        .from('cash_registers')
        .insert({
          clinic_id: profile?.clinic_id,
          user_id: profile?.id,
          opened_at: new Date().toISOString(),
          opening_balance: initialBalance,
          calculated_balance: initialBalance,
          status: 'OPEN'
        })
        .select()
        .single();

      if (error) throw error;
      await refreshFinancialData(); // Reload to get everything fresh
    } catch (error: any) {
      console.error("Error opening register:", error);
      alert("Erro ao abrir caixa: " + error.message);
    }
  };

  const closeSession = async (id: string, closingBalance: number, observations?: string) => {
    try {
      const reg = cashRegisters.find(c => c.id === id);
      const calculated = reg ? reg.calculatedBalance : closingBalance;
      const diff = closingBalance - calculated;

      const { error } = await supabase
        .from('cash_registers')
        .update({
          status: 'CLOSED',
          closed_at: new Date().toISOString(),
          declared_balance: closingBalance,
          difference_amount: diff,
          difference_reason: observations,
          observations: observations
        })
        .eq('id', id);

      if (error) throw error;
      await refreshFinancialData();
    } catch (error: any) {
      console.error("Error closing register:", error);
      alert("Erro ao fechar caixa: " + error.message);
    }
  };

  const addExpense = async (expense: Omit<Expense, "id">) => {
    try {
      let isoDate = expense.dueDate;
      if (expense.dueDate.includes('/')) {
        const [day, month, year] = expense.dueDate.split('/');
        isoDate = `${year}-${month}-${day}`;
      }

      const { error } = await supabase
        .from('expenses')
        .insert({
          clinic_id: profile?.clinic_id,
          description: expense.description,
          category: expense.category,
          provider: expense.provider,
          amount: expense.amount,
          amount_paid: 0,
          due_date: isoDate,
          status: 'PENDING'
        });

      if (error) throw error;
      await refreshFinancialData();
    } catch (error: any) {
      console.error("Error adding expense:", error);
      alert("Erro ao adicionar despesa: " + error.message);
    }
  };

  const payExpense = async (id: string, amount: number, method: string, date: string, notes?: string) => {
    try {
      const expense = expenses.find(e => e.id === id);
      if (!expense) return;

      // 1. Update Expense
      const currentPaid = expense.amountPaid || 0;
      const newPaidTotal = currentPaid + amount;
      const isFullyPaid = newPaidTotal >= expense.amount;

      const { error: expError } = await supabase
        .from('expenses')
        .update({
          amount_paid: newPaidTotal,
          status: isFullyPaid ? 'PAID' : 'PARTIAL'
          // TODO: update payment method if needed
        })
        .eq('id', id);

      if (expError) throw expError;

      // 2. Insert Transaction (Trigger handles checks)
      const { error: txError } = await supabase.from('transactions').insert({
        clinic_id: profile?.clinic_id,
        description: expense.description,
        amount: amount,
        type: 'EXPENSE',
        category: expense.category,
        payment_method: method,
        date: new Date().toISOString(),
        cash_register_id: activeSession?.id || null, // Let trigger validate/assign
        expense_id: id
      });

      if (txError) {
        if (txError.message.includes("BLOQUEIO")) {
          alert("ATENÇÃO: Pagamento registrado na despesa mas bloqueado no caixa (Caixa Fechado).");
        } else {
          throw txError;
        }
      }

      await refreshFinancialData();

    } catch (error: any) {
      console.error("Error paying expense:", error);
      alert("Erro ao pagar despesa: " + error.message);
    }
  };

  const addCashMovement = async (type: 'sangria' | 'suprimento', amount: number, description: string) => {
    try {
      if (!activeSession) {
        throw new Error("É necessário ter um caixa aberto para realizar movimentações.");
      }

      const txType = type === 'sangria' ? 'EXPENSE' : 'INCOME';
      const category = type === 'sangria' ? 'Sangria' : 'Suprimento';

      const { error } = await supabase.from('transactions').insert({
        clinic_id: profile?.clinic_id,
        description: `${category}: ${description}`,
        amount: amount,
        type: txType,
        category: category,
        payment_method: 'Dinheiro', // Movimentações de caixa são sempre em espécie
        date: new Date().toISOString(),
        cash_register_id: activeSession.id
      });

      if (error) throw error;
      await refreshFinancialData();

    } catch (error: any) {
      console.error(`Error adding ${type}:`, error);
      alert(`Erro ao registrar ${type}: ` + error.message);
    }
  };

  const recordTransaction = (transaction: Omit<FinancialRecord, "id">) => {
    // Optimistic update for UI, but real data comes from refresh
    // This is mostly used when DataContext (ReceivePayment) triggers a transaction
    // For now, simpler to just trigger a refresh
    refreshFinancialData();
  };

  return (
    <FinancialContext.Provider
      value={{
        financialSettings,
        cashRegisters,
        activeSession,
        expenses,
        globalTransactions,
        refreshFinancialData,
        openSession,
        closeSession,
        addExpense,
        payExpense,
        addCashMovement,
        recordTransaction
      }}
    >
      {children}
    </FinancialContext.Provider>
  );
};

export const useFinancial = () => {
  const context = useContext(FinancialContext);
  if (!context) throw new Error("useFinancial must be used within a FinancialProvider");
  return context;
};
