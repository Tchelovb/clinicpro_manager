import React from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import BottomNav from "./components/BottomNav";
import Dashboard from "./components/Dashboard";
import CRM from "./components/CRM";
import { CRMForm, CRMDetail } from "./components/CRMPages";
import Agenda from "./components/Agenda";
import { AgendaForm, AgendaDetail } from "./components/AgendaPages";
import Patients from "./components/Patients";
import PatientForm from "./components/PatientForm";
import PatientDetail from "./components/PatientDetail";
import {
  PatientNoteForm,
  PatientDocumentForm,
  TreatmentConclusionForm,
} from "./components/PatientPages";
import BudgetForm from "./components/BudgetForm";
import Financial from "./components/Financial";
import {
  FinancialExpenseForm,
  PaymentReceivePage,
  ExpensePayPage,
} from "./components/FinancialPages";
import Reports from "./components/Reports";
import Settings from "./components/Settings";
import Support from "./components/Support";
import Notifications from "./components/Notifications";
import Documents from "./components/Documents";
import BlankSheets from "./components/BlankSheets";
import {
  DocumentTemplateForm,
  DocumentViewer,
} from "./components/DocumentPages";
import UserProfile from "./components/UserProfile";
import Login from "./components/Login";
import UserManagement from "./components/UserManagement";
import ProfessionalsPage from "./components/ProfessionalsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import MasterDashboard from "./components/master/MasterDashboard";
import NewClinicForm from "./components/master/NewClinicForm";
import AppLayout from "./components/AppLayout";
import { DataProvider } from "./contexts/DataContext";
import { AuthProvider } from "./contexts/AuthContext";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { supabase } from "./lib/supabase";

// Monitorar todas as queries para pacientes
const originalFrom = supabase.from;
supabase.from = function (table: string) {
  if (table === "patients") {
    console.log("Query para pacientes detectada!");

    const query = originalFrom.call(this, table);

    const originalSelect = query.select;
    query.select = function (columns: any) {
      console.log("Colunas selecionadas:", columns);
      console.trace("Stack trace da query");

      // Corrige automaticamente queries malformadas
      if (
        typeof columns === "string" &&
        columns.includes("created_atascreatedAt")
      ) {
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

const App: React.FC = () => {
  return (
    <HashRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <DataProvider>
            <Routes>
              {/* Rotas Públicas - Sem Layout */}
              <Route path="/" element={<Login />} />

              {/* Rotas Master - Sem Layout Padrão */}
              <Route
                path="/master/*"
                element={
                  <ProtectedRoute requiredRole="MASTER">
                    <Routes>
                      <Route path="/" element={<MasterDashboard />} />
                      <Route path="/clinics/new" element={<NewClinicForm />} />
                    </Routes>
                  </ProtectedRoute>
                }
              />

              {/* Rotas Protegidas - Com Layout */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Routes>
                        <Route
                          path="/"
                          element={<Navigate to="/dashboard" replace />}
                        />
                        <Route path="/dashboard" element={<Dashboard />} />

                        {/* CRM Routes */}
                        <Route path="/crm" element={<CRM />} />
                        <Route path="/crm/new" element={<CRMForm />} />
                        <Route path="/crm/:id" element={<CRMDetail />} />

                        {/* Agenda Routes */}
                        <Route path="/agenda" element={<Agenda />} />
                        <Route path="/agenda/new" element={<AgendaForm />} />
                        <Route path="/agenda/:id" element={<AgendaDetail />} />

                        {/* Patient Routes */}
                        <Route path="/patients" element={<Patients />} />
                        <Route path="/patients/new" element={<PatientForm />} />
                        <Route
                          path="/patients/:id"
                          element={<PatientDetail />}
                        />
                        <Route
                          path="/patients/:id/notes/new"
                          element={<PatientNoteForm />}
                        />
                        <Route
                          path="/patients/:id/documents/new"
                          element={<PatientDocumentForm />}
                        />
                        <Route
                          path="/patients/:id/treatments/:treatmentId/conclude"
                          element={<TreatmentConclusionForm />}
                        />

                        {/* Budget Routes */}
                        <Route
                          path="/patients/:id/new-budget"
                          element={<BudgetForm />}
                        />
                        <Route
                          path="/patients/:id/budgets/:budgetId"
                          element={<BudgetForm />}
                        />

                        {/* Document Routes */}
                        <Route path="/documents" element={<Documents />} />
                        <Route
                          path="/documents/blank-sheets"
                          element={<BlankSheets />}
                        />
                        <Route
                          path="/documents/new"
                          element={<PatientDocumentForm />}
                        />
                        <Route
                          path="/documents/:id"
                          element={<DocumentViewer />}
                        />
                        <Route
                          path="/documents/templates/new"
                          element={<DocumentTemplateForm />}
                        />
                        <Route
                          path="/documents/templates/:id"
                          element={<DocumentTemplateForm />}
                        />

                        {/* Financial Routes */}
                        <Route path="/financial" element={<Financial />} />
                        <Route
                          path="/financial/expenses/new"
                          element={<FinancialExpenseForm />}
                        />
                        <Route
                          path="/financial/receive/:installmentId"
                          element={<PaymentReceivePage />}
                        />
                        <Route
                          path="/financial/pay/:expenseId"
                          element={<ExpensePayPage />}
                        />

                        <Route path="/reports" element={<Reports />} />
                        <Route
                          path="/settings/users"
                          element={<UserManagement />}
                        />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/support" element={<Support />} />
                        <Route
                          path="/notifications"
                          element={<Notifications />}
                        />
                        <Route path="/profile" element={<UserProfile />} />
                      </Routes>
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </DataProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HashRouter>
  );
};

export default App;
