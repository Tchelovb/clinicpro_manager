import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import BottomNav from './BottomNav';
import { BOSFloatingButton } from './BOSFloatingButton';

export default function AppLayout() {
  const { user, clinicId, loading, signOut } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  // 1. Loading Inicial
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <span className="ml-3 text-gray-500 font-medium">Iniciando sistema...</span>
      </div>
    );
  }

  // 2. Não Autenticado
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Logado mas sem Clínica (Proteção contra Visitante/Broken State)
  if (user && !clinicId) {
    console.error("⛔ [AppLayout] Usuário logado sem Clinic ID. Forçando Logout para correção.");
    signOut(); // Força logout para tentar pegar metadados frescos no próximo login
    return <Navigate to="/login" replace />;
  }

  // 4. Modo Visitante (Removido/Unreachable devido ao check acima)
  const isVisitor = false;

  // 4. Sucesso
  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      <div className={`hidden md:flex flex-col h-full bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 shadow-sm z-30 flex-shrink-0 ${isSidebarCollapsed ? "w-20" : "w-64"}`}>
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>

      <BottomNav />
      <BOSFloatingButton />
    </div>
  );
}
