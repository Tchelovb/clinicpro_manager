import React, { useState, useEffect } from 'react';
import { supabase, getCurrentClinicId } from '../../lib/supabase';
import { Edit, Loader2, GitBranch, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface CRMStage {
    id?: string;
    name: string;
    order_index: number;
    color: string;
    pipeline_id?: string;
}

const CRMPipelineManager: React.FC = () => {
    const [stages, setStages] = useState<CRMStage[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingData, setEditingData] = useState<Partial<CRMStage>>({});
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
            await loadStages(currentClinicId);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            toast.error('Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    const loadStages = async (clinicId: string) => {
        // Buscar pipeline padrão da clínica
        const { data: pipelines } = await supabase
            .from('crm_pipelines')
            .select('id')
            .eq('clinic_id', clinicId)
            .limit(1);

        if (!pipelines || pipelines.length === 0) {
            console.error('Nenhum pipeline encontrado');
            return;
        }

        const pipelineId = pipelines[0].id;

        // Buscar estágios do pipeline
        const { data, error } = await supabase
            .from('crm_stages')
            .select('*')
            .eq('pipeline_id', pipelineId)
            .order('order_index');

        if (error) {
            console.error('Erro ao carregar estágios:', error);
            return;
        }

        setStages(data || []);
    };

    const handleUpdate = async (id: string) => {
        if (!editingData.name?.trim()) {
            toast.error('Digite um nome válido');
            return;
        }

        try {
            const { error } = await supabase
                .from('crm_stages')
                .update({
                    name: editingData.name.trim(),
                    color: editingData.color
                })
                .eq('id', id);

            if (error) throw error;

            await loadStages(clinicId);
            setEditingId(null);
            setEditingData({});
            toast.success('Estágio atualizado com sucesso!');
        } catch (error) {
            console.error('Erro ao atualizar:', error);
            toast.error('Erro ao atualizar estágio');
        }
    };

    const startEdit = (stage: CRMStage) => {
        setEditingId(stage.id || null);
        setEditingData({ ...stage });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditingData({});
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-3 text-gray-600">Carregando pipeline de CRM...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <GitBranch className="text-purple-600" />
                    Pipeline de CRM - Estágios
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Customize os nomes e cores dos estágios do seu funil de vendas
                </p>
            </div>

            {/* Info Alert */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <p className="text-sm text-amber-800 dark:text-amber-300">
                    ⚠️ <strong>Atenção:</strong> Alterar os nomes dos estágios afeta todos os leads existentes. As cores são refletidas imediatamente no quadro Kanban.
                </p>
            </div>

            {/* Stages Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stages.map((stage, index) => (
                    <div
                        key={stage.id}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border-2 transition-all hover:shadow-md"
                        style={{ borderColor: stage.color }}
                    >
                        <div
                            className="h-2 rounded-t-lg"
                            style={{ backgroundColor: stage.color }}
                        />
                        <div className="p-4">
                            {editingId === stage.id ? (
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        value={editingData.name}
                                        onChange={(e) => setEditingData({ ...editingData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        autoFocus
                                    />
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={editingData.color}
                                            onChange={(e) => setEditingData({ ...editingData, color: e.target.value })}
                                            className="w-12 h-8 rounded cursor-pointer"
                                        />
                                        <span className="text-xs text-gray-500 font-mono">{editingData.color}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleUpdate(stage.id!)}
                                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                                        >
                                            <Save size={12} />
                                            Salvar
                                        </button>
                                        <button
                                            onClick={cancelEdit}
                                            className="flex items-center justify-center px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <div className="text-xs text-gray-500 mb-1">Estágio {index + 1}</div>
                                            <h3 className="font-bold text-gray-900 dark:text-white">{stage.name}</h3>
                                        </div>
                                        <button
                                            onClick={() => startEdit(stage)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                            title="Editar"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-6 h-6 rounded border border-gray-300"
                                            style={{ backgroundColor: stage.color }}
                                        />
                                        <span className="text-xs text-gray-500 font-mono">{stage.color}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Pipeline Flow Visualization */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
                <h3 className="text-sm font-bold text-purple-900 dark:text-purple-200 mb-4">
                    📊 Visualização do Funil
                </h3>
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {stages.map((stage, index) => (
                        <React.Fragment key={stage.id}>
                            <div
                                className="flex-shrink-0 px-4 py-2 rounded-lg text-white font-medium text-sm shadow-sm"
                                style={{ backgroundColor: stage.color }}
                            >
                                {stage.name}
                            </div>
                            {index < stages.length - 1 && (
                                <div className="text-gray-400 flex-shrink-0">→</div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="text-sm font-bold text-blue-900 dark:text-blue-200 mb-2">
                    💡 Dicas de Customização
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
                    <li>Use cores distintas para facilitar a identificação visual no Kanban</li>
                    <li>Nomes claros ajudam a equipe a entender o status de cada lead</li>
                    <li>A ordem dos estágios não pode ser alterada (segue o fluxo padrão)</li>
                    <li>Estágios não podem ser excluídos para manter a integridade dos dados</li>
                </ul>
            </div>
        </div>
    );
};

export default CRMPipelineManager;
