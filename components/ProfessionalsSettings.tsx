import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, Loader2, X } from 'lucide-react';
import { SettingsService, User } from '../services/settingsService';
import { UserRole, ROLE_LABELS } from '../types';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const ProfessionalsSettings: React.FC = () => {
  const { profile } = useAuth();
  const [professionals, setProfessionals] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'PROFESSIONAL' as UserRole,
    color: '#3B82F6',
    active: true,
    phone: '',
  });

  useEffect(() => {
    if (profile?.clinic_id) {
      loadProfessionals();
    }
  }, [profile?.clinic_id]);

  const loadProfessionals = async () => {
    try {
      setLoading(true);
      const data = await SettingsService.getProfessionals(profile!.clinic_id);
      setProfessionals(data);
    } catch (error) {
      console.error('Erro ao carregar profissionais:', error);
      toast.error('Erro ao carregar profissionais');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setSaving(true);

      if (editingProfessional) {
        await SettingsService.updateProfessional(editingProfessional.id, formData);
        toast.success('Profissional atualizado!');
      } else {
        await SettingsService.createProfessional({
          ...formData,
          clinic_id: profile!.clinic_id,
        });
        toast.success('Profissional criado!');
      }

      await loadProfessionals();
      closeModal();
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast.error(error.message || 'Erro ao salvar profissional');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (professional: User) => {
    setEditingProfessional(professional);
    setFormData({
      name: professional.name,
      email: professional.email,
      role: professional.role as UserRole,
      color: professional.color || '#3B82F6',
      active: professional.active,
      phone: professional.phone || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este profissional?')) return;

    try {
      await SettingsService.deleteProfessional(id);
      toast.success('Profissional excluído!');
      await loadProfessionals();
    } catch (error: any) {
      console.error('Erro ao excluir:', error);
      toast.error(error.message || 'Erro ao excluir profissional');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProfessional(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'PROFESSIONAL',
      color: '#3B82F6',
      active: true,
      phone: '',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Profissionais</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gerencie os profissionais da clínica</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Novo Profissional
        </button>
      </div>

      <div className="grid gap-4">
        {professionals.map((professional) => (
          <div
            key={professional.id}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: professional.color || '#3B82F6' }}
              >
                {professional.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {professional.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {ROLE_LABELS[professional.role as UserRole] || professional.role}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {professional.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${professional.active
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}
              >
                {professional.active ? 'Ativo' : 'Inativo'}
              </span>
              <button
                onClick={() => handleEdit(professional)}
                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(professional.id)}
                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingProfessional ? 'Editar' : 'Novo'} Profissional
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nome *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Nome completo"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="email@exemplo.com"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Função *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Telefone
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', formatPhone(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="(99) 99999-9999"
                  maxLength={15}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Cor de Identificação
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => handleInputChange('color', e.target.value)}
                    className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => handleInputChange('color', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="#3B82F6"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => handleInputChange('active', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded"
                />
                <label htmlFor="active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ativo
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Salvar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessionalsSettings;
