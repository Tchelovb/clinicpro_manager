import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

import { UserRole } from "../types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles
}) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center animate-pulse">
        <img src="/logo-full.png" alt="ClinicPro" className="h-12 w-auto mb-8 opacity-50 grayscale" />
        <div className="w-64 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 animate-progress origin-left w-full" style={{ animationDuration: '2000ms' }}></div>
        </div>
        <p className="mt-4 text-xs font-medium text-slate-400 uppercase tracking-widest">
          Sincronizando ClinicPro...
        </p>
      </div>
    </div>
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 🛡️ BLOCK GHOST USERS (Sem Clinic ID)
  // Check user.clinic_id instead of profile.clinic_id since profile is not provided by context
  // Also explicitly allow the Admin ID as requested (Shell Flush Protocol)
  const userClinicId = user?.clinic_id;

  if (userClinicId === '550e8400-e29b-41d4-a716-446655440000') {
    // Explicitly allowed - Skip checks
  } else if (user && !userClinicId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 p-4">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-100 dark:border-slate-700">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">🚫</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Erro de Autenticação</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Sua sessão não possui uma identidade clínica válida. Isso pode ocorrer após atualizações de segurança.
          </p>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = '/login';
            }}
            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-colors"
          >
            Reiniciar Sessão
          </button>
        </div>
      </div>
    );
  }

  // Verificar permissão baseada no array de roles permitidos
  if (allowedRoles && profile?.role && !allowedRoles.includes(profile.role as UserRole)) {
    // Se for ADMIN, geralmente tem acesso a tudo, mas vamos respeitar o array se passado explicitamente.
    // Porém, por conveniência, ADMIN geralmente passa (exceto se explicitamente proibido, mas aqui é whitelist)
    if (profile.role === 'ADMIN') {
      return <>{children}</>;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
