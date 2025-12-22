import React from "react";
import { HashRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import "./index.css"; // Import CSS globally

// ============================================
// PROVIDERS (Global State Management)
// ============================================
import { ThemeProvider } from "./contexts/ThemeContext";
import { DataProvider } from "./contexts/DataContext";
import { AuthProvider } from "./contexts/AuthContext";
import { FinancialProvider } from "./contexts/FinancialContext";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

// ============================================
// LAYOUT & PROTECTION
// ============================================
import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import { DynamicRedirect } from "./components/DynamicRedirect";


// ============================================
// PAGES (Main Application Routes)
// ============================================
import Login from "./components/Login";
import IntelligenceGateway from "./pages/IntelligenceGateway";
import Dashboard from "./pages/Dashboard";
import Agenda from "./pages/Agenda";
import PatientsList from "./pages/PatientsList";
import PatientDetail from "./pages/PatientDetail";
import PipelinePage from "./pages/Pipeline";
import Financial from "./pages/Financial";
import BudgetDetail from "./pages/BudgetDetail"; // New Budget Negotiator
import ChatBOS from "./pages/ChatBOS";
import Reports from "./pages/Reports";
import Lab from "./pages/Lab";
import Inventory from "./pages/Inventory";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";

// ============================================
// FORMS
// ============================================
import PatientForm from "./components/PatientForm";
import BudgetForm from "./components/BudgetForm";
import AgendaForm from "./components/AgendaForm";
import LeadForm from "./components/LeadForm";
import LeadDetail from "./components/LeadDetail";
import ExpenseForm from "./components/ExpenseForm";

// ============================================
// FASE 1 - ROTAS CRÍTICAS
// ============================================
import PayExpense from "./pages/financial/PayExpense";
import ReceivePayment from "./pages/financial/ReceivePayment";
import Goals from "./pages/intelligence/Goals";
import BOSIntelligence from "./pages/intelligence/BOSIntelligence";
import ClinicHealth from "./pages/intelligence/ClinicHealth";

// Wrapper to adapt AppLayout for Router Outlet
const LayoutWrapper = () => (
  <AppLayout>
    <Outlet />
  </AppLayout>
);

// ============================================
// MAIN APP COMPONENT
// ============================================
const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <FinancialProvider>
            <DataProvider>
              <HashRouter>
                <Routes>
                  {/* PUBLIC ROUTES */}
                  <Route path="/login" element={<Login />} />

                  {/* Root redirect */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />

                  {/* PROTECTED ROUTES (Wrapped in AppLayout) */}
                  <Route element={
                    <ProtectedRoute>
                      <LayoutWrapper />
                    </ProtectedRoute>
                  }>

                    {/* --- CORE MODULES --- */}
                    <Route path="/intelligence" element={<IntelligenceGateway />} />
                    <Route path="/dashboard" element={<Dashboard />} />

                    {/* --- AGENDA MODULE --- */}
                    <Route path="/agenda" element={<Agenda />} />
                    <Route path="/agenda/new" element={<AgendaForm />} />
                    <Route path="/agenda/:id" element={<AgendaForm />} />

                    {/* --- PATIENTS MODULE --- */}
                    <Route path="/patients" element={<PatientsList />} />
                    <Route path="/patients/new" element={<PatientForm />} />
                    <Route path="/patients/:id" element={<PatientDetail />} />
                    <Route path="/patients/:id/edit" element={<PatientForm />} />

                    {/* --- PIPELINE (CRM) MODULE --- */}
                    <Route path="/pipeline" element={<PipelinePage />} />
                    <Route path="/pipeline/leads/new" element={<LeadForm />} />
                    <Route path="/pipeline/leads/:id" element={<LeadDetail />} />
                    <Route path="/pipeline/leads/:id/edit" element={<LeadForm />} />

                    {/* --- BUDGETS MODULE --- */}
                    <Route path="/budgets/new" element={<BudgetForm />} />
                    <Route path="/budgets/:id" element={<BudgetForm />} />
                    <Route path="/patients/:id/new-budget" element={<BudgetForm />} />
                    <Route path="/patients/:patientId/budgets/:id" element={<BudgetDetail />} />

                    {/* --- FINANCIAL MODULE --- */}
                    <Route path="/financial" element={<Financial />} />
                    <Route path="/financial/expenses/new" element={<ExpenseForm />} />
                    <Route path="/financial/expenses/:id" element={<ExpenseForm />} />
                    <Route path="/financial/pay/:id" element={<PayExpense />} />
                    <Route path="/financial/receive/:id" element={<ReceivePayment />} />

                    {/* --- INTELLIGENCE MODULE --- */}
                    <Route path="/intelligence/goals" element={<Goals />} />
                    <Route path="/intelligence/bos" element={<BOSIntelligence />} />
                    <Route path="/intelligence/clinic-health" element={<ClinicHealth />} />

                    {/* --- USER PROFILE --- */}
                    <Route path="/profile" element={<Profile />} />

                    {/* --- SECONDARY MODULES --- */}
                    <Route path="/lab" element={<Lab />} />
                    <Route path="/inventory" element={<Inventory />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/chat-bos" element={<ChatBOS />} />
                    <Route path="/settings" element={<Settings />} />

                  </Route>

                  {/* LEGACY ROUTE REDIRECTS (Backwards Compatibility) */}

                  {/* Intelligence Gateway Redirects */}
                  <Route path="/dashboard/goals" element={<Navigate to="/intelligence/goals" replace />} />
                  <Route path="/dashboard/bos-intelligence" element={<Navigate to="/intelligence/bos" replace />} />
                  <Route path="/dashboard/clinic-health" element={<Navigate to="/intelligence/clinic-health" replace />} />
                  <Route path="/dashboard/chatbos" element={<Navigate to="/chat-bos" replace />} />

                  {/* Agenda Redirects */}
                  <Route path="/dashboard/agenda" element={<Navigate to="/agenda" replace />} />
                  <Route path="/dashboard/agenda/:id" element={<DynamicRedirect to="/agenda/:id" />} />
                  <Route path="/dashboard/schedule" element={<Navigate to="/agenda" replace />} />
                  <Route path="/dashboard/schedule/new" element={<Navigate to="/agenda/new" replace />} />
                  <Route path="/dashboard/schedule/:id" element={<DynamicRedirect to="/agenda/:id" />} />

                  {/* Patients Redirects */}
                  <Route path="/dashboard/pacientes" element={<Navigate to="/patients" replace />} />
                  <Route path="/dashboard/pacientes/:id" element={<DynamicRedirect to="/patients/:id" />} />
                  <Route path="/dashboard/patients/:id/edit" element={<DynamicRedirect to="/patients/:id/edit" />} />

                  {/* CRM/Pipeline Redirects */}
                  <Route path="/dashboard/orcamentos" element={<Navigate to="/budgets/new" replace />} />
                  <Route path="/dashboard/financeiro" element={<Navigate to="/financial" replace />} />
                  <Route path="/dashboard/crm" element={<Navigate to="/pipeline" replace />} />
                  <Route path="/crm/:id" element={<DynamicRedirect to="/pipeline/leads/:id" />} />

                  {/* Settings Redirects */}
                  <Route path="/dashboard/configuracoes" element={<Navigate to="/settings" replace />} />
                  <Route path="/dashboard/reports" element={<Navigate to="/reports" replace />} />

                  {/* FALLBACK (404) */}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </HashRouter>
            </DataProvider>
          </FinancialProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
