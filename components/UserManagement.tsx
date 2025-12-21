import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { User, Plus, Edit, Trash2, UserCheck, UserX } from "lucide-react";
import { ROLE_LABELS, UserRole } from "../types";

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
  created_at: string;
}

const UserManagement: React.FC = () => {
  const { clinicId, user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "PROFESSIONAL",
  });

  useEffect(() => {
    if (clinicId) {
      loadUsers();
    }
  }, [clinicId]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("users")
        .select("id, email, name, role, active, created_at")
        .eq("clinic_id", clinicId)
        .order("name");

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingUser) {
        // Update user
        const { error } = await supabase
          .from("users")
          .update({
            name: formData.name,
            role: formData.role,
          })
          .eq("id", editingUser.id);

        if (error) throw error;
      } else {
        // Create new user
        // Since we can't use admin.createUser from client, we'll create a placeholder
        // In production, this should be done via admin API or RPC function
        alert(
          "Criação de usuários deve ser feita por um administrador do sistema. Entre em contato com o suporte."
        );
        return;
      }

      // Reset form and reload
      setFormData({ name: "", email: "", password: "", role: "PROFESSIONAL" });
      setShowForm(false);
      setEditingUser(null);
      loadUsers();
    } catch (error: any) {
      console.error("Error saving user:", error);
      alert(error.message || "Erro ao salvar usuário");
    }
  };

  const toggleUserStatus = async (user: UserData) => {
    // Prevent deactivating self
    if (user.id === currentUser?.id) {
      alert("Você não pode desativar sua própria conta");
      return;
    }

    try {
      const { error } = await supabase
        .from("users")
        .update({ active: !user.active })
        .eq("id", user.id);

      if (error) throw error;
      loadUsers();
    } catch (error) {
      console.error("Error updating user status:", error);
    }
  };

  const startEdit = (user: UserData) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
    });
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Gerenciamento de Usuários
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={18} />
          Novo Usuário
        </button>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
        <p className="text-yellow-800 dark:text-yellow-200 text-sm">
          <strong>Nota:</strong> A criação de novos usuários deve ser feita por
          um administrador do sistema via painel administrativo. Entre em
          contato com o suporte para adicionar novos usuários à sua clínica.
        </p>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingUser ? "Editar Usuário" : "Novo Usuário"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Função</label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                {editingUser ? "Atualizar" : "Criar"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingUser(null);
                  setFormData({
                    name: "",
                    email: "",
                    password: "",
                    role: "PROFESSIONAL",
                  });
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Função
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Criado em
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                          <User size={20} className="text-white" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {ROLE_LABELS[user.role as UserRole] || user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                        }`}
                    >
                      {user.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => startEdit(user)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => toggleUserStatus(user)}
                        className={
                          user.active
                            ? "text-red-600 hover:text-red-900"
                            : "text-green-600 hover:text-green-900"
                        }
                        disabled={user.id === currentUser?.id}
                      >
                        {user.active ? (
                          <UserX size={16} />
                        ) : (
                          <UserCheck size={16} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
