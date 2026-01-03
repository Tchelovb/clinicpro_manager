import React, { useState, useEffect } from "react";
import { supabase, getCurrentClinicId } from "../../src/lib/supabase";
import {
  Plus,
  Edit,
  Trash2,
  Loader,
  Save,
  X,
  User as UserIcon,
  Link as LinkIcon,
  AlertCircle,
} from "lucide-react";
import { ROLE_LABELS } from "../../types";

interface ProfessionalData {
  council_number: string;
  council_type: string;
  specialty: string;
  photo_url?: string;
}

interface Professional {
  id: string;
  name: string;
  specialty?: string;
  council?: string;
  crc?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  color: string;
  active: boolean;
  is_sales_rep?: boolean;
  is_clinical_provider?: boolean;
  professional_id?: string;
  professional?: {
    id: string;
    name: string;
    crc: string;
    specialty: string;
    council: string;
    photo_url: string;
  };
  created_at: string;
}

const UsersSettings: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "PROFESSIONAL",
    color: "#3b82f6",
    active: true,
    isSales: false,
  });

  // Clinical Profile State
  const [isClinical, setIsClinical] = useState(false);
  const [professionalMode, setProfessionalMode] = useState<"CREATE" | "LINK">("CREATE");
  const [selectedProfessionalId, setSelectedProfessionalId] = useState("");
  const [availableProfessionals, setAvailableProfessionals] = useState<Professional[]>([]);

  // Professional Data Form
  const [profData, setProfData] = useState<ProfessionalData>({
    council_number: "",
    council_type: "CRO",
    specialty: "",
    photo_url: "",
  });

  useEffect(() => {
    loadUsers();
  }, []);

  // Reset form when modal opens/closes or user changes
  useEffect(() => {
    if (modalOpen) {
      if (editingUser) {
        setFormData({
          name: editingUser.name,
          email: editingUser.email,
          role: editingUser.role,
          color: editingUser.color || "#3b82f6",
          active: editingUser.active,
          isSales: editingUser.is_sales_rep || false,
        });

        // Determine clinical state
        const isProf = editingUser.role === 'PROFESSIONAL';
        const hasProfLink = !!editingUser.professional_id;

        setIsClinical(isProf || hasProfLink);

        if (hasProfLink && editingUser.professional) {
          setProfessionalMode('LINK');
          setSelectedProfessionalId(editingUser.professional_id!);
          // Also set create data just in case user switches back, populated from existing
          setProfData({
            council_number: editingUser.professional.crc || "", // assumes crc column holds council number
            council_type: editingUser.professional.council || "CRO",
            specialty: editingUser.professional.specialty || "",
            photo_url: editingUser.professional.photo_url || "",
          });
        } else {
          setProfessionalMode('CREATE');
          setProfData({
            council_number: "",
            council_type: "CRO",
            specialty: "",
            photo_url: "",
          });
        }
      } else {
        // New User Defaults
        setFormData({
          name: "",
          email: "",
          role: "PROFESSIONAL",
          color: "#3b82f6",
          active: true,
          isSales: false,
        });
        setIsClinical(true); // Default to professional/clinical
        setProfessionalMode('CREATE');
        setProfData({
          council_number: "",
          council_type: "CRO",
          specialty: "",
          photo_url: "",
        });
        setSelectedProfessionalId("");
      }
      loadProfessionalsList();
    }
  }, [modalOpen, editingUser]);

  // Effect to toggle isClinical based on Role changes in form
  useEffect(() => {
    if (formData.role === 'PROFESSIONAL') {
      setIsClinical(true);
    } else if (formData.role === 'RECEPTIONIST' || formData.role === 'CRC') {
      setIsClinical(false);
    }
    // ADMIN maintains current state (can be toggled manually)
  }, [formData.role]);

  const loadUsers = async () => {
    try {
      const clinicId = await getCurrentClinicId();
      if (!clinicId) {
        setError("Clínica não encontrada");
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select(`
          *,
          professional:professionals(*)
        `)
        .eq("clinic_id", clinicId)
        .order("name");

      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadProfessionalsList = async () => {
    // Load unlinked professionals or all professionals for linking
    try {
      const clinicId = await getCurrentClinicId();
      if (!clinicId) return;

      const { data, error } = await supabase
        .from('professionals')
        .select('id, name, specialty, council, crc') // verify column names
        .eq('clinic_id', clinicId)
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setAvailableProfessionals(data || []);
    } catch (err) {
      console.error("Error loading professionals", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const clinicId = await getCurrentClinicId();
      if (!clinicId) throw new Error("Clínica não encontrada");

      // Prepare payload
      // Logic: 
      // Always construct pro metadata with flags
      // If isClinical, include professional details

      const finalProfData = {
        ...profData,
        is_clinical_provider: isClinical,
        is_sales_rep: formData.isSales
      };

      const finalLinkId = isClinical && professionalMode === 'LINK' ? selectedProfessionalId : null;

      if (isClinical && professionalMode === 'LINK' && !finalLinkId) {
        throw new Error("Selecione um profissional para vincular");
      }

      // Transactional RPC call
      const { data, error } = await supabase.rpc('manage_user_professional', {
        p_user_id: editingUser?.id || null, // Null for new users
        p_clinic_id: clinicId,
        p_name: formData.name,
        p_email: formData.email,
        p_role: formData.role,
        p_color: formData.color,
        p_active: formData.active,
        p_professional_data: finalProfData,
        p_link_professional_id: finalLinkId || null
      });

      if (error) throw error;

      // Removed manual update of is_sales_rep since RPC handles it now

      setModalOpen(false);
      setEditingUser(null);
      loadUsers();
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      alert("Erro ao salvar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Tem certeza que deseja inativar este usuário?")) return;

    try {
      const { error } = await supabase
        .from("users")
        .update({ active: false })
        .eq("id", userId);

      if (error) throw error;
      loadUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openNewUserModal = () => {
    setEditingUser(null);
    setModalOpen(true);
  };

  const openEditUserModal = (user: User) => {
    setEditingUser(user);
    setModalOpen(true);
  };

  const rolesOptions = Object.entries(ROLE_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="animate-spin" size={24} />
        <span className="ml-2">Carregando usuários...</span>
      </div>
    );
  }

  const showProfessionalFields = formData.role === 'PROFESSIONAL' || (formData.role === 'ADMIN' && isClinical);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Usuários do Sistema</h2>
          <p className="text-sm text-gray-500">Gerencie o acesso e permissões da equipe</p>
        </div>
        <button
          onClick={openNewUserModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
        >
          <Plus size={18} />
          Novo Usuário
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
          <button onClick={() => setError(null)} className="ml-auto font-bold">×</button>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Usuário</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Função</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vínculo Profissional</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div
                        className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: user.color || '#3b82f6' }}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'PROFESSIONAL' ? 'bg-blue-100 text-blue-800' :
                          user.role === 'CRC' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'}`}>
                      {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] || user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                      {user.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {user.professional ? (
                      <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                        <UserIcon size={14} />
                        <span>{user.professional.name}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">Sem vínculo</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEditUserModal(user)} className="text-blue-600 hover:text-blue-900 dark:hover:text-blue-400 p-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-900 dark:hover:text-red-400 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingUser ? "Editar Usuário" : "Novo Usuário"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* USER INFO SECTION */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b pb-2">Informações de Acesso</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Completo *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                      disabled={!!editingUser} // Can't change email for now to avoid sync issues
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Função do Sistema *</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      {rolesOptions.map((role) => (
                        <option key={role.value} value={role.value}>{role.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cor na Agenda</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
                        className="h-10 w-20 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
                      />
                      <span className="text-xs text-gray-500">Identificação visual</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CLINICAL PROFILE SECTION */}
              {formData.role === 'ADMIN' && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${isClinical ? 'bg-blue-600' : 'bg-gray-300'}`} onClick={() => setIsClinical(!isClinical)}>
                    <div className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform ${isClinical ? 'translate-x-5' : ''}`}></div>
                  </div>
                  <div className="cursor-pointer" onClick={() => setIsClinical(!isClinical)}>
                    <span className="font-medium text-gray-900 dark:text-white text-sm">Este usuário realiza atendimentos clínicos?</span>
                    <p className="text-xs text-gray-500">Habilita agenda e vínculo profissional para administradores que também são dentistas.</p>
                  </div>
                </div>
              )}

              {showProfessionalFields && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b pb-2 flex items-center gap-2 mb-4">
                    <UserIcon size={16} />
                    Perfil Profissional
                  </h4>

                  {/* MODE SWITCHER */}
                  <div className="flex gap-4 mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="profMode"
                        checked={professionalMode === 'CREATE'}
                        onChange={() => setProfessionalMode('CREATE')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Cadastrar Novo Profissional</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="profMode"
                        checked={professionalMode === 'LINK'}
                        onChange={() => setProfessionalMode('LINK')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Vincular Profissional Existente</span>
                    </label>
                  </div>

                  {professionalMode === 'LINK' ? (
                    <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Selecione o Profissional
                      </label>
                      <select
                        value={selectedProfessionalId}
                        onChange={(e) => setSelectedProfessionalId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">-- Selecione --</option>
                        {availableProfessionals.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.specialty || 'Sem especialidade'})
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <AlertCircle size={12} />
                        Vincular um profissional existente permitirá que este usuário gerencie a agenda desse profissional.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in zoom-in-95 duration-200">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Conselho *</label>
                        <div className="flex gap-2">
                          <select
                            value={profData.council_type}
                            onChange={(e) => setProfData({ ...profData, council_type: e.target.value })}
                            className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          >
                            <option value="CRO">CRO</option>
                            <option value="CRM">CRM</option>
                            <option value="RMS">RMS</option>
                          </select>
                          <input
                            type="text"
                            placeholder="Número (Ex: 12345/SP)"
                            value={profData.council_number}
                            onChange={(e) => setProfData({ ...profData, council_number: e.target.value })}
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Especialidade Principal *</label>
                        <input
                          type="text"
                          placeholder="Ex: Ortodontia, Clínico Geral..."
                          value={profData.specialty}
                          onChange={(e) => setProfData({ ...profData, specialty: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          required
                        />
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Foto de Perfil (URL)</label>
                        <input
                          type="text"
                          placeholder="https://..."
                          value={profData.photo_url}
                          onChange={(e) => setProfData({ ...profData, photo_url: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SALES ROLE TOGGLE */}
              <div className="flex items-center gap-3 p-4 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-100 dark:border-orange-800/30">
                <div className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${formData.isSales ? 'bg-orange-500' : 'bg-gray-300'}`} onClick={() => setFormData(prev => ({ ...prev, isSales: !prev.isSales }))}>
                  <div className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform ${formData.isSales ? 'translate-x-5' : ''}`}></div>
                </div>
                <div className="cursor-pointer" onClick={() => setFormData(prev => ({ ...prev, isSales: !prev.isSales }))}>
                  <span className="font-medium text-gray-900 dark:text-white text-sm">Atua no Setor Comercial? (Vendedor)</span>
                  <p className="text-xs text-gray-500">Habilita este usuário para ser selecionado como vendedor em orçamentos.</p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData((prev) => ({ ...prev, active: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="active" className="text-sm text-gray-700 dark:text-gray-300">
                  Usuário Ativo
                </label>
              </div>

              <div className="flex gap-3 pt-6 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? <Loader className="animate-spin" size={16} /> : <Save size={16} />}
                  {saving ? "Salvando..." : "Salvar Usuário"}
                </button>
              </div>
            </form>
          </div>
        </div >
      )}
    </div >
  );
};

export default UsersSettings;
