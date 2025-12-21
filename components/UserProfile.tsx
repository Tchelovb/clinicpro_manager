import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  Lock,
  Save,
  Camera,
  LogOut,
  Loader,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
  getProfileByAuthId,
  updateProfile,
  updatePassword,
  UserProfile as UserProfileType,
} from "../src/services/userProfile";
import { ROLE_LABELS, UserRole } from "../types";

const UserProfile: React.FC = () => {
  const { user: authUser, profile, refreshProfile, signOut } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfileType | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    color: "#3b82f6",
  });

  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (authUser?.id) {
      loadProfile();
    }
  }, [authUser]);

  const loadProfile = async () => {
    if (!authUser?.id) return;

    try {
      setLoading(true);
      const profileData = await getProfileByAuthId(authUser.id);
      if (profileData) {
        setUserProfile(profileData);
        setFormData({
          name: profileData.name || "",
          phone: profileData.phone || "",
          color: profileData.color || "#3b82f6",
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!authUser?.id || !userProfile) return;

    setSaving(true);
    try {
      const updatedProfile = await updateProfile(authUser.id, {
        name: formData.name,
        phone: formData.phone,
        color: formData.color,
      });

      if (updatedProfile) {
        setUserProfile(updatedProfile);
        setIsEditing(false);
        setError(null);
        alert("Perfil atualizado com sucesso!");
        // Revalidar perfil no AuthContext
        await refreshProfile();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("As senhas não coincidem");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert("A nova senha deve ter pelo menos 6 caracteres");
      return;
    }

    try {
      await updatePassword(passwordData.newPassword);
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      alert("Senha alterada com sucesso!");
    } catch (err: any) {
      alert("Erro ao alterar senha: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="animate-spin" size={24} />
        <span className="ml-2">Carregando perfil...</span>
      </div>
    );
  }

  if (!userProfile || !authUser) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">
            Erro ao carregar perfil. Faça login novamente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
      <h1 className="text-2xl font-bold text-gray-800">Meu Perfil</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header/Cover */}
        <div className="h-32 bg-gradient-to-r from-blue-600 to-blue-800"></div>

        <div className="px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-12 mb-6">
            <div className="relative">
              <div
                className="w-24 h-24 rounded-xl border-4 border-white shadow-md flex items-center justify-center text-white font-bold text-xl"
                style={{ backgroundColor: userProfile.color || "#3b82f6" }}
              >
                {userProfile.name.charAt(0).toUpperCase()}
              </div>
              <button className="absolute bottom-0 right-0 p-1.5 bg-gray-900 text-white rounded-lg text-xs hover:bg-black transition-colors">
                <Camera size={14} />
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={signOut}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <LogOut size={16} /> Sair
              </button>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
                >
                  Editar Perfil
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      name: userProfile.name || "",
                      phone: userProfile.phone || "",
                      color: userProfile.color || "#3b82f6",
                    });
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 flex items-center gap-2"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2">
                Informações Pessoais
              </h3>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Nome Completo
                </label>
                {isEditing ? (
                  <input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                    required
                  />
                ) : (
                  <p className="text-gray-900 font-medium flex items-center gap-2">
                    <User size={16} className="text-gray-400" />{" "}
                    {userProfile.name}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Função / Cargo
                </label>
                <p className="text-gray-700 text-sm bg-gray-50 p-2 rounded border border-gray-100 inline-block">
                  {ROLE_LABELS[userProfile.role as UserRole] || userProfile.role}
                </p>
              </div>
              {isEditing && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Cor de Identificação
                  </label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        color: e.target.value,
                      }))
                    }
                    className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                  />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2">
                Contato
              </h3>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  E-mail
                </label>
                <p className="text-gray-900 font-medium flex items-center gap-2">
                  <Mail size={16} className="text-gray-400" /> {authUser.email}
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Telefone
                </label>
                {isEditing ? (
                  <input
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                    placeholder="(00) 00000-0000"
                  />
                ) : (
                  <p className="text-gray-900 font-medium flex items-center gap-2">
                    <Phone size={16} className="text-gray-400" />{" "}
                    {userProfile.phone || "Não informado"}
                  </p>
                )}
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold shadow-sm hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <Loader size={16} className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                {saving ? "Salvando..." : "Salvar Alterações"}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Lock size={20} className="text-gray-400" /> Segurança
        </h3>
        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
          <div>
            <p className="font-bold text-gray-900">Senha de Acesso</p>
            <p className="text-xs text-gray-500">
              Clique para alterar sua senha
            </p>
          </div>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="text-blue-600 text-sm font-bold hover:underline"
          >
            Alterar Senha
          </button>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Alterar Senha
              </h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <LogOut size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nova Senha *
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Nova Senha *
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Digite novamente a senha"
                  minLength={6}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handlePasswordChange}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Alterar Senha
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
