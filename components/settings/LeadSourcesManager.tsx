import React, { useState, useEffect } from 'react';
import { supabase, getCurrentClinicId } from '../../lib/supabase';
import { Plus, Edit, Trash2, Loader2, Target } from 'lucide-react';
import toast from 'react-hot-toast';

interface LeadSource {
    id?: string;
    name: string;
    is_active?: boolean;
}

const LeadSourcesManager: React.FC = () => {
    const [sources, setSources] = useState<LeadSource[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const [newSourceName, setNewSourceName] = useState('');
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
            await loadSources(currentClinicId);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            toast.error('Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    const loadSources = async (clinicId: string) => {
        const { data, error } = await supabase
            .from('lead_sources')
            .select('*')
            .eq('clinic_id', clinicId)
            .order('name');

        if (error) {
            console.error('Erro ao carregar origens:', error);
            return;
        }

        setSources(data || []);
    };

    const handleCreate = async () => {
        if (!newSourceName.trim()) {
            toast.error('Digite um nome para a origem');
            return;
        }

        try {
            const { error } = await supabase
                .from('lead_sources')
                .insert([{
                    clinic_id: clinicId,
                    name: newSourceName.trim(),
                    is_active: true
                }]);

            if (error) throw error;

            await loadSources(clinicId);
            setNewSourceName('');
            toast.success('Origem criada com sucesso!');
        } catch (error) {
            console.error('Erro ao criar:', error);
            toast.error('Erro ao criar origem');
        }
    };

    const handleUpdate = async (id: string) => {
        if (!editingName.trim()) {
            toast.error('Digite um nome válido');
            return;
        }

        try {
            const { error } = await supabase
                .from('lead_sources')
                .update({ name: editingName.trim() })
                .eq('id', id);

            if (error) throw error;

            await loadSources(clinicId);
            setEditingId(null);
            setEditingName('');
            toast.success('Origem atualizada com sucesso!');
        } catch (error) {
            console.error('Erro ao atualizar:', error);
            toast.error('Erro ao atualizar origem');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta origem de lead?')) return;

        try {
            const { error } = await supabase
                .from('lead_sources')
                .delete()
                .eq('id', id);

            if (error) throw error;

            await loadSources(clinicId);
            toast.success('Origem excluída com sucesso!');
        } catch (error) {
            console.error('Erro ao excluir:', error);
            toast.error('Erro ao excluir origem');
        }
    };

    const startEdit = (source: LeadSource) => {
        setEditingId(source.id || null);
        setEditingName(source.name);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditingName('');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-3 text-gray-600">Carregando origens de lead...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Origens de Lead
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Gerencie as fontes de captação de leads (Instagram, Google Ads, Indicação, etc.)
                </p>
            </div>

            {/* Create New */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={newSourceName}
                        onChange={(e) => setNewSourceName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
                        placeholder="Nome da nova origem (ex: TikTok, Rádio Local...)"
                        className="flex-1 px-4 py-2 border border-blue-300 dark:border-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
                    />
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                                    Nome da Origem
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Ações
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                            {sources.length === 0 ? (
                                <tr>
                                    <td colSpan={2} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Target className="w-12 h-12 text-gray-400" />
                                            <p className="text-gray-600 dark:text-gray-400">
                                                Nenhuma origem de lead cadastrada
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Use o campo acima para criar a primeira origem
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                sources.map((source) => (
                                    <tr
                                        key={source.id}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            {editingId === source.id ? (
                                                <input
                                                    type="text"
                                                    value={editingName}
                                                    onChange={(e) => setEditingName(e.target.value)}
                                                    onKeyPress={(e) => e.key === 'Enter' && handleUpdate(source.id!)}
                                                    className="w-full px-3 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    autoFocus
                                                />
                                            ) : (
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {source.name}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                {editingId === source.id ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleUpdate(source.id!)}
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
                                                            onClick={() => startEdit(source)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                            title="Editar"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(source.id!)}
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
        </div>
    );
};

export default LeadSourcesManager;
