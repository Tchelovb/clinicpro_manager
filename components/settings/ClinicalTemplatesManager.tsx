import React, { useState, useEffect } from 'react';
import { supabase, getCurrentClinicId } from '../../lib/supabase';
import { Plus, Edit, Trash2, Loader2, FileText, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

interface ClinicalTemplate {
    id?: string;
    name: string;
    type: 'ANAMNESE' | 'EVOLUCAO';
    content: string;
    is_active?: boolean;
}

const ClinicalTemplatesManager: React.FC = () => {
    const [templates, setTemplates] = useState<ClinicalTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingData, setEditingData] = useState<Partial<ClinicalTemplate>>({});
    const [showNewForm, setShowNewForm] = useState(false);
    const [newTemplate, setNewTemplate] = useState<Partial<ClinicalTemplate>>({
        name: '',
        type: 'ANAMNESE',
        content: ''
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
            await loadTemplates(currentClinicId);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            toast.error('Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    const loadTemplates = async (clinicId: string) => {
        const { data, error } = await supabase
            .from('clinical_form_templates')
            .select('*')
            .eq('clinic_id', clinicId)
            .order('type')
            .order('name');

        if (error) {
            console.error('Erro ao carregar templates:', error);
            return;
        }

        setTemplates(data || []);
    };

    const handleCreate = async () => {
        if (!newTemplate.name?.trim()) {
            toast.error('Digite um nome para o template');
            return;
        }

        if (!newTemplate.content?.trim()) {
            toast.error('Digite o conteúdo do template');
            return;
        }

        try {
            const { error } = await supabase
                .from('clinical_form_templates')
                .insert([{
                    clinic_id: clinicId,
                    name: newTemplate.name.trim(),
                    type: newTemplate.type,
                    content: newTemplate.content.trim(),
                    is_active: true
                }]);

            if (error) throw error;

            await loadTemplates(clinicId);
            setNewTemplate({ name: '', type: 'ANAMNESE', content: '' });
            setShowNewForm(false);
            toast.success('Template criado com sucesso!');
        } catch (error) {
            console.error('Erro ao criar:', error);
            toast.error('Erro ao criar template');
        }
    };

    const handleUpdate = async (id: string) => {
        if (!editingData.name?.trim()) {
            toast.error('Digite um nome válido');
            return;
        }

        try {
            const { error } = await supabase
                .from('clinical_form_templates')
                .update({
                    name: editingData.name.trim(),
                    type: editingData.type,
                    content: editingData.content?.trim()
                })
                .eq('id', id);

            if (error) throw error;

            await loadTemplates(clinicId);
            setEditingId(null);
            setEditingData({});
            toast.success('Template atualizado com sucesso!');
        } catch (error) {
            console.error('Erro ao atualizar:', error);
            toast.error('Erro ao atualizar template');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este template?')) return;

        try {
            const { error } = await supabase
                .from('clinical_form_templates')
                .delete()
                .eq('id', id);

            if (error) throw error;

            await loadTemplates(clinicId);
            toast.success('Template excluído com sucesso!');
        } catch (error) {
            console.error('Erro ao excluir:', error);
            toast.error('Erro ao excluir template');
        }
    };

    const handleDuplicate = async (template: ClinicalTemplate) => {
        try {
            const { error } = await supabase
                .from('clinical_form_templates')
                .insert([{
                    clinic_id: clinicId,
                    name: `${template.name} (Cópia)`,
                    type: template.type,
                    content: template.content,
                    is_active: true
                }]);

            if (error) throw error;

            await loadTemplates(clinicId);
            toast.success('Template duplicado com sucesso!');
        } catch (error) {
            console.error('Erro ao duplicar:', error);
            toast.error('Erro ao duplicar template');
        }
    };

    const startEdit = (template: ClinicalTemplate) => {
        setEditingId(template.id || null);
        setEditingData({ ...template });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditingData({});
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-3 text-gray-600">Carregando templates clínicos...</span>
            </div>
        );
    }

    const anamneseTemplates = templates.filter(t => t.type === 'ANAMNESE');
    const evolucaoTemplates = templates.filter(t => t.type === 'EVOLUCAO');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FileText className="text-green-600" />
                        Templates Clínicos
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Gerencie templates de Anamnese e Evolução para agilizar atendimentos
                    </p>
                </div>
                <button
                    onClick={() => setShowNewForm(!showNewForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Novo Template
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Templates de Anamnese</p>
                    <p className="text-3xl font-bold text-blue-600">{anamneseTemplates.length}</p>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Templates de Evolução</p>
                    <p className="text-3xl font-bold text-green-600">{evolucaoTemplates.length}</p>
                </div>
            </div>

            {/* Create New Form */}
            {showNewForm && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <h3 className="text-sm font-bold text-green-900 dark:text-green-200 mb-3">Novo Template Clínico</h3>
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <input
                                type="text"
                                value={newTemplate.name}
                                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                                placeholder="Nome do template *"
                                className="px-4 py-2 border border-green-300 dark:border-green-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-800"
                            />
                            <select
                                value={newTemplate.type}
                                onChange={(e) => setNewTemplate({ ...newTemplate, type: e.target.value as 'ANAMNESE' | 'EVOLUCAO' })}
                                className="px-4 py-2 border border-green-300 dark:border-green-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-800"
                            >
                                <option value="ANAMNESE">Anamnese</option>
                                <option value="EVOLUCAO">Evolução</option>
                            </select>
                        </div>
                        <textarea
                            value={newTemplate.content}
                            onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                            placeholder="Conteúdo do template (perguntas, campos, etc.) *"
                            rows={6}
                            className="w-full px-4 py-2 border border-green-300 dark:border-green-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-800"
                        />
                    </div>
                    <div className="flex gap-2 mt-3">
                        <button
                            onClick={handleCreate}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            Criar Template
                        </button>
                        <button
                            onClick={() => {
                                setShowNewForm(false);
                                setNewTemplate({ name: '', type: 'ANAMNESE', content: '' });
                            }}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {/* Templates List */}
            <div className="space-y-4">
                {/* Anamnese Section */}
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">📋 Anamnese</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {anamneseTemplates.length === 0 ? (
                            <div className="col-span-2 text-center py-8 text-gray-500">
                                Nenhum template de anamnese cadastrado
                            </div>
                        ) : (
                            anamneseTemplates.map((template) => (
                                <div
                                    key={template.id}
                                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4"
                                >
                                    {editingId === template.id ? (
                                        <div className="space-y-3">
                                            <input
                                                type="text"
                                                value={editingData.name}
                                                onChange={(e) => setEditingData({ ...editingData, name: e.target.value })}
                                                className="w-full px-3 py-2 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <textarea
                                                value={editingData.content}
                                                onChange={(e) => setEditingData({ ...editingData, content: e.target.value })}
                                                rows={4}
                                                className="w-full px-3 py-2 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleUpdate(template.id!)}
                                                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                                                >
                                                    Salvar
                                                </button>
                                                <button
                                                    onClick={cancelEdit}
                                                    className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <h4 className="font-bold text-gray-900 dark:text-white mb-2">{template.name}</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">
                                                {template.content}
                                            </p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => startEdit(template)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDuplicate(template)}
                                                    className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                                                    title="Duplicar"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(template.id!)}
                                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Evolução Section */}
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">📝 Evolução</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {evolucaoTemplates.length === 0 ? (
                            <div className="col-span-2 text-center py-8 text-gray-500">
                                Nenhum template de evolução cadastrado
                            </div>
                        ) : (
                            evolucaoTemplates.map((template) => (
                                <div
                                    key={template.id}
                                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4"
                                >
                                    {editingId === template.id ? (
                                        <div className="space-y-3">
                                            <input
                                                type="text"
                                                value={editingData.name}
                                                onChange={(e) => setEditingData({ ...editingData, name: e.target.value })}
                                                className="w-full px-3 py-2 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <textarea
                                                value={editingData.content}
                                                onChange={(e) => setEditingData({ ...editingData, content: e.target.value })}
                                                rows={4}
                                                className="w-full px-3 py-2 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleUpdate(template.id!)}
                                                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                                                >
                                                    Salvar
                                                </button>
                                                <button
                                                    onClick={cancelEdit}
                                                    className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <h4 className="font-bold text-gray-900 dark:text-white mb-2">{template.name}</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">
                                                {template.content}
                                            </p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => startEdit(template)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDuplicate(template)}
                                                    className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                                                    title="Duplicar"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(template.id!)}
                                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="text-sm font-bold text-blue-900 dark:text-blue-200 mb-2">
                    💡 Dicas de Uso
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
                    <li>Templates de Anamnese são usados na primeira consulta do paciente</li>
                    <li>Templates de Evolução são usados em consultas de retorno e acompanhamento</li>
                    <li>Use a função "Duplicar" para criar variações de templates existentes</li>
                    <li>Templates inativos não aparecem nos formulários de atendimento</li>
                </ul>
            </div>
        </div>
    );
};

export default ClinicalTemplatesManager;
