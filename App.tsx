import React from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import BottomNav from "./components/BottomNav";
import Dashboard from "./pages/Dashboard";
import CommercialCentral from "./components/CommercialCentral";
import { CRMForm, CRMDetail } from "./components/CRMPages";
import Agenda from "./components/Agenda";
import { AgendaForm, AgendaDetail } from "./components/AgendaPages";
import Patients from "./components/Patients";
import PatientForm from "./components/PatientForm";
import PatientDetail from "./pages/PatientDetail";
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
import DocumentsCenter from "./components/DocumentsCenter";
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
import AppLayout from "./components/layout/AppLayout";
import { DataProvider } from "./contexts/DataContext";
import { AuthProvider } from "./contexts/AuthContext";
import { FinancialProvider } from "./contexts/FinancialContext";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { supabase } from "./lib/supabase";
import { IntelligenceDashboard } from "./components/IntelligenceDashboard";
import { WarRoom } from "./components/WarRoom";
import ChatBOSPage from "./components/ChatBOSPage";
import BOSIntelligencePage from "./components/BOSIntelligencePage";
import IntelligenceCenter from "./components/IntelligenceCenter";
import IntelligenceGateway from "./components/IntelligenceGateway";
import ClinicHealthCenter from "./components/ClinicHealthCenter";
import GamificationTestPage from "./components/GamificationTestPage";
import TeamCommandCenter from "./components/TeamCommandCenter";
import { HighTicketPipeline } from "./components/HighTicketPipeline";
import { OpportunityRadar } from "./components/OpportunityRadar";
import { MasterGateway } from "./components/MasterGateway";
import { NetworkHub } from "./components/NetworkHub";
import { TycoonGameHub } from "./components/TycoonGameHub";
import { ConfirmationDashboard } from "./components/confirmations";
import { LabOrderList } from "./components/lab";
import { ReferralDashboard } from "./components/referrals";
import { RecallDashboard } from "./components/recalls";

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
          <FinancialProvider>
            <DataProvider>
              <Routes>
                {/* Rotas Públicas - Sem Layout */}
                <Route path="/" element={<Login />} />

                {/* Rotas Master - Redirect para Intelligence Gateway */}
                <Route
                  path="/master/*"
                  element={
                    <ProtectedRoute requiredRole="MASTER">
                      <Navigate to="/dashboard/intelligence-gateway" replace />
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
                          <Route path="/crm" element={<CommercialCentral />} />
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
                          <Route path="/documents" element={<DocumentsCenter />} />
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

                          {/* Intelligence Gateway - Portal Central */}
                          <Route path="/dashboard/intelligence-gateway" element={<IntelligenceGateway />} />

                          {/* Master Routes - Rede e Jogo */}
                          <Route path="/dashboard/network" element={<NetworkHub />} />
                          <Route path="/dashboard/game" element={<TycoonGameHub />} />

                          {/* ClinicHealth Intelligence Center */}
                          <Route path="/dashboard/clinic-health" element={<ClinicHealthCenter />} />

                          {/* BOS Intelligence Center */}
                          <Route path="/dashboard/bos-intelligence" element={<BOSIntelligencePage />} />

                          {/* ChatBOS - Embedded */}
                          <Route path="/dashboard/chatbos" element={<ChatBOSPage />} />

                          {/* Gamification Test Page (BOS 8.0) */}
                          <Route path="/dashboard/gamification-test" element={<GamificationTestPage />} />

                          {/* Team Command Center (BOS 12.5) - ADMIN Only */}
                          <Route path="/dashboard/team-command" element={<TeamCommandCenter />} />

                          {/* High-Ticket Pipeline (BOS 12.7) - CRC Focus */}
                          <Route path="/dashboard/high-ticket" element={<HighTicketPipeline />} />

                          {/* Opportunity Radar (BOS 18.7) - CRC Multidisciplinar */}
                          <Route path="/dashboard/opportunity-radar" element={<OpportunityRadar />} />

                          {/* REFINAMENTO EASYDENT - P0 */}
                          <Route path="/dashboard/confirmacoes" element={<ConfirmationDashboard />} />
                          <Route path="/dashboard/laboratorio" element={<LabOrderList />} />
                          <Route path="/dashboard/indicacoes" element={<ReferralDashboard />} />
                          <Route path="/dashboard/recalls" element={<RecallDashboard />} />

                          {/* Legacy Routes (manter compatibilidade) */}
                          <Route path="/intelligence" element={<IntelligenceCenter />} />
                          <Route path="/bos-intelligence" element={<BOSIntelligencePage />} />
                          <Route path="/chatbos" element={<ChatBOSPage />} />

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
          </FinancialProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HashRouter>
  );
};

export default App;
