import React, { useState, useEffect } from 'react';
import { supabase, getCurrentClinicId } from '../../lib/supabase';
import { Plus, Edit, Trash2, Loader2, Calendar, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

interface AppointmentType {
    id?: string;
    name: string;
    duration_minutes: number;
    color: string;
    is_active?: boolean;
}

const AppointmentTypesManager: React.FC = () => {
    const [types, setTypes] = useState<AppointmentType[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingData, setEditingData] = useState<Partial<AppointmentType>>({});
    const [newType, setNewType] = useState<Partial<AppointmentType>>({
        name: '',
        duration_minutes: 60,
        color: '#3B82F6'
    });
    const [clinicId, setClinicId] = useState<string>('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const currentClinicId = await getCurrentClinicId();
            if (!currentClinicId) {
                toast.error('Clínica não encontrada');
                return;
            }
            setClinicId(currentClinicId);
            await loadTypes(currentClinicId);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            toast.error('Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    const loadTypes = async (clinicId: string) => {
        const { data, error } = await supabase
            .from('appointment_types')
            .select('*')
            .eq('clinic_id', clinicId)
            .order('name');

        if (error) {
            console.error('Erro ao carregar tipos:', error);
            return;
        }

        setTypes(data || []);
    };

    const handleCreate = async () => {
        if (!newType.name?.trim()) {
            toast.error('Digite um nome para o tipo de agendamento');
            return;
        }

        try {
            const { error } = await supabase
                .from('appointment_types')
                .insert([{
                    clinic_id: clinicId,
                    name: newType.name.trim(),
                    duration_minutes: newType.duration_minutes || 60,
                    color: newType.color || '#3B82F6',
                    is_active: true
                }]);

            if (error) throw error;

            await loadTypes(clinicId);
            setNewType({ name: '', duration_minutes: 60, color: '#3B82F6' });
            toast.success('Tipo de agendamento criado com sucesso!');
        } catch (error) {
            console.error('Erro ao criar:', error);
            toast.error('Erro ao criar tipo de agendamento');
        }
    };

    const handleUpdate = async (id: string) => {
        if (!editingData.name?.trim()) {
            toast.error('Digite um nome válido');
            return;
        }

        try {
            const { error } = await supabase
                .from('appointment_types')
                .update({
                    name: editingData.name.trim(),
                    duration_minutes: editingData.duration_minutes,
                    color: editingData.color
                })
                .eq('id', id);

            if (error) throw error;

            await loadTypes(clinicId);
            setEditingId(null);
            setEditingData({});
            toast.success('Tipo atualizado com sucesso!');
        } catch (error) {
            console.error('Erro ao atualizar:', error);
            toast.error('Erro ao atualizar tipo');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este tipo de agendamento?')) return;

        try {
            const { error } = await supabase
                .from('appointment_types')
                .delete()
                .eq('id', id);

            if (error) throw error;

            await loadTypes(clinicId);
            toast.success('Tipo excluído com sucesso!');
        } catch (error) {
            console.error('Erro ao excluir:', error);
            toast.error('Erro ao excluir tipo');
        }
    };

    const startEdit = (type: AppointmentType) => {
        setEditingId(type.id || null);
        setEditingData({ ...type });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditingData({});
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-3 text-gray-600">Carregando tipos de agendamento...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Tipos de Agendamento
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Configure os tipos de atendimento e suas durações padrão para a agenda
                </p>
            </div>

            {/* Create New */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="grid grid-cols-12 gap-3">
                    <input
                        type="text"
                        value={newType.name}
                        onChange={(e) => setNewType({ ...newType, name: e.target.value })}
                        onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
                        placeholder="Nome do tipo (ex: Consulta VIP, Urgência 24h...)"
                        className="col-span-12 md:col-span-5 px-4 py-2 border border-green-300 dark:border-green-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-800"
                    />
                    <div className="col-span-6 md:col-span-3 flex items-center gap-2">
                        <Clock size={16} className="text-gray-500" />
                        <input
                            type="number"
                            value={newType.duration_minutes}
                            onChange={(e) => setNewType({ ...newType, duration_minutes: parseInt(e.target.value) })}
                            placeholder="Duração"
                            min="15"
                            step="15"
                            className="w-full px-3 py-2 border border-green-300 dark:border-green-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-800"
                        />
                        <span className="text-sm text-gray-600">min</span>
                    </div>
                    <div className="col-span-6 md:col-span-2 flex items-center gap-2">
                        <input
                            type="color"
                            value={newType.color}
                            onChange={(e) => setNewType({ ...newType, color: e.target.value })}
                            className="w-12 h-10 rounded cursor-pointer"
                        />
                        <span className="text-xs text-gray-600">Cor</span>
                    </div>
                    <button
                        onClick={handleCreate}
                        className="col-span-12 md:col-span-2 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Criar
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Nome do Tipo
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Duração
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Cor na Agenda
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Ações
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                            {types.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Calendar className="w-12 h-12 text-gray-400" />
                                            <p className="text-gray-600 dark:text-gray-400">
                                                Nenhum tipo de agendamento cadastrado
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Use o formulário acima para criar o primeiro tipo
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                types.map((type) => (
                                    <tr
                                        key={type.id}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            {editingId === type.id ? (
                                                <input
                                                    type="text"
                                                    value={editingData.name}
                                                    onChange={(e) => setEditingData({ ...editingData, name: e.target.value })}
                                                    className="w-full px-3 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    autoFocus
                                                />
                                            ) : (
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {type.name}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {editingId === type.id ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        value={editingData.duration_minutes}
                                                        onChange={(e) => setEditingData({ ...editingData, duration_minutes: parseInt(e.target.value) })}
                                                        min="15"
                                                        step="15"
                                                        className="w-20 px-3 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                    <span className="text-sm text-gray-600">min</span>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                                    <Clock size={14} />
                                                    {type.duration_minutes} min
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {editingId === type.id ? (
                                                <input
                                                    type="color"
                                                    value={editingData.color}
                                                    onChange={(e) => setEditingData({ ...editingData, color: e.target.value })}
                                                    className="w-12 h-8 rounded cursor-pointer"
                                                />
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-8 h-8 rounded border border-gray-300"
                                                        style={{ backgroundColor: type.color }}
                                                    />
                                                    <span className="text-xs text-gray-500 font-mono">{type.color}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                {editingId === type.id ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleUpdate(type.id!)}
                                                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-xs"
                                                        >
                                                            Salvar
                                                        </button>
                                                        <button
                                                            onClick={cancelEdit}
                                                            className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-xs"
                                                        >
                                                            Cancelar
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => startEdit(type)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                            title="Editar"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(type.id!)}
                                                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                            title="Excluir"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                    💡 <strong>Dica:</strong> As cores definidas aqui serão refletidas automaticamente no calendário da agenda.
                </p>
            </div>
        </div>
    );
};

export default AppointmentTypesManager;
