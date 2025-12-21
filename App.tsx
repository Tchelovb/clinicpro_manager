import React from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";

// Providers
import { DataProvider } from "./contexts/DataContext";
import { AuthProvider } from "./contexts/AuthContext";
import { FinancialProvider } from "./contexts/FinancialContext";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

// Layout
import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import Login from "./components/Login";
import IntelligenceGateway from "./pages/IntelligenceGateway";
import Dashboard from "./pages/Dashboard";
import Agenda from "./pages/Agenda";
import PatientsList from "./pages/PatientsList";
import PatientDetail from "./pages/PatientDetail";
import PipelinePage from "./pages/Pipeline";
import Financial from "./pages/Financial";
import ChatBOS from "./pages/ChatBOS";

// Additional Forms/Details (Secondary Routes)
import { AgendaForm, AgendaDetail } from "./components/AgendaPages";
import PatientForm from "./components/PatientForm";
import BudgetForm from "./components/BudgetForm";
import { FinancialExpenseForm, PaymentReceivePage, ExpensePayPage } from "./components/FinancialPages";

// --- Debug / Patch for Supabase (Preserved) ---
import { supabase } from "./lib/supabase";
const originalFrom = supabase.from;
supabase.from = function (table: string) {
  if (table === "patients") {
    const query = originalFrom.call(this, table);
    const originalSelect = query.select;
    query.select = function (columns: any) {
      if (typeof columns === "string" && columns.includes("created_atascreatedAt")) {
        console.warn("Query malformada detectada! Corrigindo...");
        columns = columns
          .replace("created_atascreatedAt", "created_at as createdAt")
          .replace("updated_atasupdatedAt", "updated_at as updatedAt")
          .replace("balanceDue", "balance_due as balanceDue");
      }
      return originalSelect.call(this, columns);
    };
    return query;
  }
  return originalFrom.call(this, table);
};
// ----------------------------------------------

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DataProvider>
          <FinancialProvider>
            <HashRouter>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/login" element={<Login />} />

                {/* Protected Routes (Wrapped in AppLayout) */}
                <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>

                  {/* Portal de Inteligência */}
                  <Route path="/intelligence" element={<IntelligenceGateway />} />

                  {/* Dashboard */}
                  <Route path="/dashboard" element={<Dashboard />} />

                  {/* Agenda */}
                  <Route path="/agenda" element={<Agenda />} />
                  <Route path="/dashboard/schedule" element={<Navigate to="/agenda" replace />} /> {/* Legacy Redirect */}
                  <Route path="/agenda/new" element={<AgendaForm />} />
                  <Route path="/agenda/:id" element={<AgendaDetail />} />

                  {/* Pacientes */}
                  <Route path="/patients" element={<PatientsList />} />
                  <Route path="/dashboard/patients" element={<Navigate to="/patients" replace />} /> {/* Legacy Redirect */}
                  <Route path="/patients/new" element={<PatientForm />} />
                  <Route path="/patients/:id" element={<PatientDetail />} />
                  <Route path="/patients/:id/edit" element={<PatientForm />} />

                  {/* Pipeline CRM */}
                  <Route path="/pipeline" element={<PipelinePage />} />

                  {/* Financeiro */}
                  <Route path="/financial" element={<Financial />} />
                  <Route path="/financial/expenses/new" element={<FinancialExpenseForm />} />
                  <Route path="/financial/receive/:installmentId" element={<PaymentReceivePage />} />
                  <Route path="/financial/pay/:expenseId" element={<ExpensePayPage />} />

                  {/* Chat BOS */}
                  <Route path="/chat-bos" element={<ChatBOS />} />

                  {/* Orçamentos (Global Access) */}
                  <Route path="/patients/:id/new-budget" element={<BudgetForm />} />
                  <Route path="/patients/:id/budgets/:budgetId" element={<BudgetForm />} />

                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </HashRouter>
          </FinancialProvider>
        </DataProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
