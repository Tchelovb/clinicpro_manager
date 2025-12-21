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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
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
