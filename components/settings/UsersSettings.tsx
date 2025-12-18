import React, { useState, useEffect } from "react";
import { supabase, getCurrentClinicId } from "../../lib/supabase";
import { Plus, Edit, Trash2, Loader, Save, X, User as UserIcon, Link as LinkIcon, AlertCircle } from "lucide-react";

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

  useEffect(() => {
    loadUsers();
  }, []);

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

  const handleSave = async (userData: any, professionalData: ProfessionalData | null, linkProfessionalId: string | null) => {
    setSaving(true);
    try {
      const clinicId = await getCurrentClinicId();
      if (!clinicId) throw new Error("Clínica não encontrada");

      // Transactional RPC call
      const { data, error } = await supabase.rpc('manage_user_professional', {
        p_user_id: editingUser?.id || null, // Null for new users
        p_clinic_id: clinicId,
        p_name: userData.name,
        p_email: userData.email,
        p_role: userData.role,
        p_color: userData.color,
        p_active: userData.active,
        p_professional_data: professionalData, // JSONB or null
        p_link_professional_id: linkProfessionalId // UUID or null
      });

      if (error) throw error;

      setModalOpen(false);
      setEditingUser(null);
      loadUsers();
    } catch (err: any) {
      setError(err.message);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="animate-spin" size={24} />
        <span className="ml-2">Carregando usuários...</span>
      </div>
    );
  }

  const roles = [
    { value: "ADMIN", label: "Administrador" },
    { value: "DENTIST", label: "Dentista / Especialista" },
    { value: "RECEPTIONIST", label: "Recepcionista" },
    { value: "ASSISTANT", label: "Assistente / ASB" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          Usuários e Funções
        </h2>
        <button
          onClick={() => {
            setEditingUser(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={16} />
          Novo Usuário
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          Erro: {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Profissional
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Contato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Função / Registro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {user.professional?.photo_url ? (
                        <img
                          src={user.professional.photo_url}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover border-2"
                          style={{ borderColor: user.color }}
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: user.color }}
                        >
                          {user.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.name}
                        </div>
                        {user.professional && (
                          <span className="text-xs text-blue-600 dark:text-blue-400">
                            {user.professional.specialty}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col">
                      <span>{user.email}</span>
                      {/* Phone could be added here if available */}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span className="px-2 py-1 text-xs font-medium rounded-full w-fit bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                        {roles.find((r) => r.value === user.role)?.label || user.role}
                      </span>
                      {user.professional && (
                        <span className="text-xs text-gray-500">
                          {user.professional.council}: {user.professional.crc}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${user.active
                          ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                          : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
                        }`}
                    >
                      {user.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingUser(user);
                          setModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    Nenhum usuário cadastrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <Modal
          user={editingUser}
          onSave={handleSave}
          onClose={() => {
            setModalOpen(false);
            setEditingUser(null);
          }}
          saving={saving}
          roles={roles}
        />
      )}
    </div>
  );
};

interface ModalProps {
  user: User | null;
  onSave: (userData: any, professionalData: ProfessionalData | null, linkProfessionalId: string | null) => void;
  onClose: () => void;
  saving: boolean;
  roles: { value: string; label: string }[];
}

const Modal: React.FC<ModalProps> = ({
  user,
  onSave,
  onClose,
  saving,
  roles,
}) => {
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    role: user?.role === "PROFESSIONAL" ? "DENTIST" : (user?.role || "DENTIST"),
    color: user?.color || "#3b82f6",
    active: user?.active ?? true,
  });

  // New State for Linking Mode
  const [professionalMode, setProfessionalMode] = useState<'CREATE' | 'LINK'>('CREATE');
  const [availableProfessionals, setAvailableProfessionals] = useState<Professional[]>([]);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>("");

  // Professional Data State (Existing)
  const [isClinical, setIsClinical] = useState(!!user?.professional_id);
  const [profData, setProfData] = useState<ProfessionalData>({
    council_number: user?.professional?.crc || "",
    council_type: user?.professional?.council || "CRO",
    specialty: user?.professional?.specialty || "Clínico Geral",
    photo_url: user?.professional?.photo_url || ""
  });

  // Load Professionals for Linking
  useEffect(() => {
    const fetchPros = async () => {
      const clinicId = await getCurrentClinicId();
      if (!clinicId) return;

      const { data } = await supabase
        .from('professionals')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('is_active', true)
        .order('name');

      if (data) setAvailableProfessionals(data);
    };
    fetchPros();
  }, []);

  // Initialize linking mode if user already has a professional linked
  useEffect(() => {
    if (user?.professional_id) {
      setProfessionalMode('LINK');
      setSelectedProfessionalId(user.professional_id);
    }
  }, [user]);

  // Effect to toggle isClinical based on Role
  useEffect(() => {
    if (formData.role === 'DENTIST') {
      setIsClinical(true);
    } else if (formData.role === 'RECEPTIONIST' || formData.role === 'ASSISTANT') {
      setIsClinical(false);
    }
  }, [formData.role]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Logic for Professional Data
    let proPayload: ProfessionalData | null = null;
    let linkId: string | null = null;

    if (formData.role === 'DENTIST' || (formData.role === 'ADMIN' && isClinical)) {

      if (professionalMode === 'CREATE') {
        if (!profData.council_number) {
          alert("Número do conselho é obrigatório para novos profissionais.");
          return;
        }
        if (!profData.specialty) {
          alert("Especialidade é obrigatória para novos profissionais.");
          return;
        }
        proPayload = profData;
      } else {
        if (!selectedProfessionalId) {
          alert("Selecione um profissional para vincular.");
          return;
        }
        linkId = selectedProfessionalId;
      }
    }

    onSave(formData, proPayload, linkId);
  };

  const showProfessionalFields = formData.role === 'DENTIST' || (formData.role === 'ADMIN' && isClinical);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {user ? "Editar Usuário" : "Novo Usuário"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* USER INFO SECTION */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b pb-2">Informações de Acesso</h4>

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
                  {roles.map((role) => (
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
                  <span className="text-xs text-gray-500">Usada para identificar atendimentos</span>
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
              <div>
                <span className="font-medium text-gray-900 dark:text-white text-sm">Este usuário realiza atendimentos clínicos?</span>
                <p className="text-xs text-gray-500">Habilita agenda e vínculo profissional para administradores que também são dentistas.</p>
              </div>
            </div>
          )}

          {showProfessionalFields && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b pb-2 flex items-center gap-2 mb-4">
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
              onClick={onClose}
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
    </div>
  );
};

export default UsersSettings;
