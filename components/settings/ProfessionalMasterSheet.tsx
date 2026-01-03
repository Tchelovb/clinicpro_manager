import React, { useState, useEffect } from 'react';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { X, User, DollarSign, TrendingUp, Save, Trash2, History } from 'lucide-react';
import toast from 'react-hot-toast';
import { ProfessionalFeesConfig } from './ProfessionalFeesConfig';
import { ProfessionalClosingPanel } from '../financial/ProfessionalClosingPanel';
import { ProfessionalPaymentHistory } from '../financial/ProfessionalPaymentHistory';

interface ProfessionalMasterSheetProps {
    professionalId: string;
    isOpen: boolean;
    onClose: () => void;
    onSave?: () => void;
}

interface ProfessionalData {
    id: string;
    name: string;
    crc: string;
    specialty: string;
    council: string;
    is_active: boolean;
    photo_url: string;
    color: string;
    payment_release_rule: 'FULL_ON_COMPLETION' | 'PROPORTIONAL_TO_PAYMENT';
}

type TabType = 'profile' | 'fees' | 'production' | 'history';

export const ProfessionalMasterSheet: React.FC<ProfessionalMasterSheetProps> = ({
    professionalId,
    isOpen,
    onClose,
    onSave
}) => {
    const { profile } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('profile');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [professional, setProfessional] = useState<ProfessionalData | null>(null);

    // Load professional data or initialize for new
    useEffect(() => {
        if (isOpen) {
            if (professionalId) {
                loadProfessional();
            } else {
                // Initialize empty professional for creation
                setProfessional({
                    id: '',
                    name: '',
                    crc: '',
                    specialty: '',
                    council: 'CRO',
                    is_active: true,
                    photo_url: '',
                    color: '#3B82F6',
                    payment_release_rule: 'FULL_ON_COMPLETION'
                });
            }
        }
    }, [isOpen, professionalId]);

    const loadProfessional = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('professionals')
                .select('*')
                .eq('id', professionalId)
                .single();

            if (error) throw error;
            setProfessional(data);
        } catch (error) {
            console.error('Error loading professional:', error);
            toast.error('Erro ao carregar dados do profissional');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!professional || !profile?.clinic_id) return;

        // Validation
        if (!professional.name.trim() || !professional.crc.trim()) {
            toast.error('Nome e CRC são obrigatórios');
            return;
        }

        setSaving(true);
        try {
            const professionalData = {
                name: professional.name,
                crc: professional.crc,
                specialty: professional.specialty,
                council: professional.council,
                is_active: professional.is_active,
                color: professional.color,
                clinic_id: profile.clinic_id,
                updated_at: new Date().toISOString()
            };

            if (professionalId) {
                // Update existing
                const { error } = await supabase
                    .from('professionals')
                    .update(professionalData)
                    .eq('id', professionalId);

                if (error) throw error;
                toast.success('Profissional atualizado com sucesso!');
            } else {
                // Create new
                const { error } = await supabase
                    .from('professionals')
                    .insert({
                        ...professionalData,
                        created_at: new Date().toISOString()
                    });

                if (error) throw error;
                toast.success('Profissional criado com sucesso!');
            }

            if (onSave) onSave();
            onClose();
        } catch (error) {
            console.error('Error saving professional:', error);
            toast.error('Erro ao salvar profissional');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!professionalId || !professional) return;

        if (!confirm(`Tem certeza que deseja excluir ${professional.name}?`)) {
            return;
        }

        try {
            const { error } = await supabase
                .from('professionals')
                .delete()
                .eq('id', professionalId);

            if (error) throw error;

            toast.success('Profissional excluído com sucesso!');
            if (onSave) onSave();
            onClose();
        } catch (error) {
            console.error('Error deleting professional:', error);
            toast.error('Erro ao excluir profissional');
        }
    };

    if (!isOpen) return null;

    const tabs = [
        { id: 'profile' as TabType, label: 'Perfil', icon: User },
        { id: 'fees' as TabType, label: 'Honorários', icon: DollarSign },
        { id: 'production' as TabType, label: 'Produção', icon: TrendingUp },
        { id: 'history' as TabType, label: 'Histórico', icon: History }
    ];

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="fixed inset-y-0 right-0 w-full sm:max-w-4xl bg-white dark:bg-gray-900 shadow-2xl flex flex-col animate-in slide-in-from-right">

                {/* Fixed Header */}
                <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                    {/* Professional Info */}
                    <div className="p-6 pb-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div
                                    className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                                    style={{ backgroundColor: professional?.color || '#3B82F6' }}
                                >
                                    {professional?.name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {professional?.name || (professionalId ? 'Carregando...' : 'Novo Profissional')}
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {professional?.specialty || (professionalId ? 'Profissional' : 'Preencha os dados abaixo')}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <X size={24} className="text-gray-500 dark:text-gray-400" />
                            </button>
                        </div>
                    </div>

                    {/* Tab Navigation - Hide fees, production and history for new professionals */}
                    <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
                        {tabs.filter(tab => professionalId || tab.id === 'profile').map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${activeTab === tab.id
                                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <>
                            {/* Tab 1: Profile */}
                            {activeTab === 'profile' && professional && (
                                <div className="p-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Name */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Nome Completo
                                            </label>
                                            <input
                                                type="text"
                                                value={professional.name}
                                                onChange={(e) => setProfessional({ ...professional, name: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>

                                        {/* CRO/CRC */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                CRO/CRC
                                            </label>
                                            <input
                                                type="text"
                                                value={professional.crc || ''}
                                                onChange={(e) => setProfessional({ ...professional, crc: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>

                                        {/* Specialty */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Especialidade
                                            </label>
                                            <input
                                                type="text"
                                                value={professional.specialty || ''}
                                                onChange={(e) => setProfessional({ ...professional, specialty: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>

                                        {/* Council */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Conselho
                                            </label>
                                            <select
                                                value={professional.council || 'CRO'}
                                                onChange={(e) => setProfessional({ ...professional, council: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                            >
                                                <option value="CRO">CRO - Odontologia</option>
                                                <option value="CRC">CRC - Cirurgia</option>
                                                <option value="CRM">CRM - Medicina</option>
                                                <option value="CREFITO">CREFITO - Fisioterapia</option>
                                            </select>
                                        </div>

                                        {/* Color */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Cor de Identificação
                                            </label>
                                            <input
                                                type="color"
                                                value={professional.color || '#3B82F6'}
                                                onChange={(e) => setProfessional({ ...professional, color: e.target.value })}
                                                className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
                                            />
                                        </div>

                                        {/* Payment Release Rule */}
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Regra de Liberação de Pagamento
                                            </label>
                                            <select
                                                value={professional.payment_release_rule}
                                                onChange={(e) => setProfessional({
                                                    ...professional,
                                                    payment_release_rule: e.target.value as 'FULL_ON_COMPLETION' | 'PROPORTIONAL_TO_PAYMENT'
                                                })}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                            >
                                                <option value="FULL_ON_COMPLETION">
                                                    Integral na Conclusão (100% ao concluir procedimento)
                                                </option>
                                                <option value="PROPORTIONAL_TO_PAYMENT">
                                                    Proporcional ao Recebimento (% conforme parcelas pagas)
                                                </option>
                                            </select>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                {professional.payment_release_rule === 'PROPORTIONAL_TO_PAYMENT'
                                                    ? '💡 O honorário será liberado proporcionalmente às parcelas pagas pelo paciente'
                                                    : '💡 O honorário integral será liberado quando o procedimento for concluído'}
                                            </p>
                                        </div>

                                        {/* Status */}
                                        <div className="flex items-center gap-3">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Status
                                            </label>
                                            <button
                                                onClick={() => setProfessional({ ...professional, is_active: !professional.is_active })}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${professional.is_active ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                                                    }`}
                                            >
                                                <span
                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${professional.is_active ? 'translate-x-6' : 'translate-x-1'
                                                        }`}
                                                />
                                            </button>
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                {professional.is_active ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tab 2: Fees */}
                            {activeTab === 'fees' && (
                                <div className="p-6">
                                    <ProfessionalFeesConfig
                                        professionalId={professionalId}
                                        embedded={true}
                                    />
                                </div>
                            )}

                            {/* Tab 3: Production */}
                            {activeTab === 'production' && (
                                <div className="p-6">
                                    <ProfessionalClosingPanel
                                        professionalId={professionalId}
                                        autoFilter={true}
                                        embedded={true}
                                    />
                                </div>
                            )}

                            {/* Tab 4: History */}
                            {activeTab === 'history' && (
                                <div className="p-6">
                                    <ProfessionalPaymentHistory
                                        professionalId={professionalId}
                                        embedded={true}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Fixed Footer */}
                {activeTab === 'profile' && (
                    <div className="sticky bottom-0 z-10 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4">
                        <div className="flex justify-between gap-3">
                            {/* Delete button - only for existing professionals */}
                            {professionalId && (
                                <button
                                    onClick={handleDelete}
                                    className="px-6 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-lg font-medium transition-colors flex items-center gap-2"
                                >
                                    <Trash2 size={18} />
                                    Excluir Profissional
                                </button>
                            )}

                            <div className="flex gap-3 ml-auto">
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                                >
                                    {saving ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Salvando...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            {professionalId ? 'Salvar Alterações' : 'Criar Profissional'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
