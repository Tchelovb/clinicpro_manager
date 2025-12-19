import React, { useState, useEffect } from 'react';
import { FileText, Plus, Edit2, Trash2, Copy, Eye, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

interface FormTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
    fields: any[];
    is_default: boolean;
    is_active: boolean;
}

interface DocumentTemplate {
    id: string;
    name: string;
    document_type: string;
    content: string;
    is_default: boolean;
    is_active: boolean;
}

const ClinicalSettings: React.FC = () => {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [activeTab, setActiveTab] = useState<'forms' | 'documents'>('forms');

    const [formTemplates, setFormTemplates] = useState<FormTemplate[]>([]);
    const [documentTemplates, setDocumentTemplates] = useState<DocumentTemplate[]>([]);

    const [selectedForm, setSelectedForm] = useState<FormTemplate | null>(null);
    const [selectedDocument, setSelectedDocument] = useState<DocumentTemplate | null>(null);
    const [showEditor, setShowEditor] = useState(false);

    useEffect(() => {
        loadData();
    }, [profile]);

    const loadData = async () => {
        if (!profile?.clinic_id) return;

        try {
            setLoading(true);

            // Carregar templates de formulários
            const { data: forms, error: formsError } = await supabase
                .from('clinical_form_templates')
                .select('*')
                .eq('clinic_id', profile.clinic_id)
                .order('name');

            if (formsError) throw formsError;
            setFormTemplates(forms || []);

            // Carregar templates de documentos
            const { data: docs, error: docsError } = await supabase
                .from('document_templates')
                .select('*')
                .eq('clinic_id', profile.clinic_id)
                .order('name');

            if (docsError) throw docsError;
            setDocumentTemplates(docs || []);

        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            showMessage('error', 'Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleFormActive = async (formId: string, active: boolean) => {
        try {
            const { error } = await supabase
                .from('clinical_form_templates')
                .update({ is_active: active })
                .eq('id', formId);

            if (error) throw error;

            setFormTemplates(forms => forms.map(f =>
                f.id === formId ? { ...f, is_active: active } : f
            ));

            showMessage('success', active ? 'Formulário ativado' : 'Formulário desativado');
        } catch (error) {
            console.error('Erro ao atualizar:', error);
            showMessage('error', 'Erro ao atualizar');
        }
    };

    const handleToggleDocumentActive = async (docId: string, active: boolean) => {
        try {
            const { error } = await supabase
                .from('document_templates')
                .update({ is_active: active })
                .eq('id', docId);

            if (error) throw error;

            setDocumentTemplates(docs => docs.map(d =>
                d.id === docId ? { ...d, is_active: active } : d
            ));

            showMessage('success', active ? 'Template ativado' : 'Template desativado');
        } catch (error) {
            console.error('Erro ao atualizar:', error);
            showMessage('error', 'Erro ao atualizar');
        }
    };

    const handleDeleteForm = async (formId: string) => {
        if (!confirm('Tem certeza que deseja excluir este formulário?')) return;

        try {
            const { error } = await supabase
                .from('clinical_form_templates')
                .delete()
                .eq('id', formId);

            if (error) throw error;

            setFormTemplates(forms => forms.filter(f => f.id !== formId));
            showMessage('success', 'Formulário excluído');
        } catch (error) {
            console.error('Erro ao excluir:', error);
            showMessage('error', 'Erro ao excluir');
        }
    };

    const handleDeleteDocument = async (docId: string) => {
        if (!confirm('Tem certeza que deseja excluir este template?')) return;

        try {
            const { error } = await supabase
                .from('document_templates')
                .delete()
                .eq('id', docId);

            if (error) throw error;

            setDocumentTemplates(docs => docs.filter(d => d.id !== docId));
            showMessage('success', 'Template excluído');
        } catch (error) {
            console.error('Erro ao excluir:', error);
            showMessage('error', 'Erro ao excluir');
        }
    };

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 5000);
    };

    const getCategoryLabel = (category: string) => {
        const labels: Record<string, string> = {
            'ANAMNESIS': 'Anamnese',
            'CONSENT': 'Consentimento',
            'EVALUATION': 'Avaliação',
            'FOLLOW_UP': 'Acompanhamento',
            'OTHER': 'Outro'
        };
        return labels[category] || category;
    };

    const getDocumentTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            'PRESCRIPTION': 'Receita',
            'CERTIFICATE': 'Atestado',
            'DECLARATION': 'Declaração',
            'TREATMENT_PLAN': 'Plano de Tratamento',
            'BUDGET': 'Orçamento',
            'OTHER': 'Outro'
        };
        return labels[type] || type;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <FileText className="text-blue-600" size={28} />
                    Formulários e Documentos Clínicos
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Gerencie formulários de anamnese e templates de documentos
                </p>
            </div>

            {/* Message Alert */}
            {message && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                    {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    <span>{message.text}</span>
                </div>
            )}

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('forms')}
                        className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${activeTab === 'forms'
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                            }`}
                    >
                        <FileText size={18} />
                        Formulários de Anamnese
                    </button>
                    <button
                        onClick={() => setActiveTab('documents')}
                        className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${activeTab === 'documents'
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                            }`}
                    >
                        <FileText size={18} />
                        Templates de Documentos
                    </button>
                </div>
            </div>

            {/* Forms Tab */}
            {activeTab === 'forms' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formTemplates.length} formulário(s) cadastrado(s)
                        </p>
                        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors">
                            <Plus size={18} />
                            Novo Formulário
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {formTemplates.map((form) => (
                            <div key={form.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {form.name}
                                            </h3>
                                            {form.is_default && (
                                                <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 text-xs font-medium rounded">
                                                    Padrão
                                                </span>
                                            )}
                                            <span className={`px-2 py-1 text-xs font-medium rounded ${form.is_active
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                                                }`}>
                                                {form.is_active ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            {form.description}
                                        </p>
                                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <FileText size={14} />
                                                {getCategoryLabel(form.category)}
                                            </span>
                                            <span>
                                                {form.fields?.length || 0} campo(s)
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleToggleFormActive(form.id, !form.is_active)}
                                            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                                            title={form.is_active ? 'Desativar' : 'Ativar'}
                                        >
                                            <Eye size={18} />
                                        </button>
                                        <button
                                            className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                                            title="Editar"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                                            title="Duplicar"
                                        >
                                            <Copy size={18} />
                                        </button>
                                        {!form.is_default && (
                                            <button
                                                onClick={() => handleDeleteForm(form.id)}
                                                className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                                title="Excluir"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {formTemplates.length === 0 && (
                            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
                                <FileText className="mx-auto text-gray-400" size={48} />
                                <p className="text-gray-600 dark:text-gray-400 mt-4">
                                    Nenhum formulário cadastrado
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Clique em "Novo Formulário" para começar
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {documentTemplates.length} template(s) cadastrado(s)
                        </p>
                        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors">
                            <Plus size={18} />
                            Novo Template
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {documentTemplates.map((doc) => (
                            <div key={doc.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {doc.name}
                                            </h3>
                                            {doc.is_default && (
                                                <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 text-xs font-medium rounded">
                                                    Padrão
                                                </span>
                                            )}
                                            <span className={`px-2 py-1 text-xs font-medium rounded ${doc.is_active
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                                                }`}>
                                                {doc.is_active ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <FileText size={14} />
                                                {getDocumentTypeLabel(doc.document_type)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2 font-mono bg-gray-50 dark:bg-gray-900/50 p-2 rounded">
                                            {doc.content.substring(0, 150)}...
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleToggleDocumentActive(doc.id, !doc.is_active)}
                                            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                                            title={doc.is_active ? 'Desativar' : 'Ativar'}
                                        >
                                            <Eye size={18} />
                                        </button>
                                        <button
                                            className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                                            title="Editar"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                                            title="Duplicar"
                                        >
                                            <Copy size={18} />
                                        </button>
                                        {!doc.is_default && (
                                            <button
                                                onClick={() => handleDeleteDocument(doc.id)}
                                                className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                                title="Excluir"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {documentTemplates.length === 0 && (
                            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
                                <FileText className="mx-auto text-gray-400" size={48} />
                                <p className="text-gray-600 dark:text-gray-400 mt-4">
                                    Nenhum template cadastrado
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Clique em "Novo Template" para começar
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Variables Help */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                            💡 Variáveis Disponíveis
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-blue-800 dark:text-blue-400">
                            <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded">{'{{PATIENT_NAME}}'}</code>
                            <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded">{'{{PATIENT_CPF}}'}</code>
                            <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded">{'{{CLINIC_NAME}}'}</code>
                            <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded">{'{{PROFESSIONAL_NAME}}'}</code>
                            <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded">{'{{PROFESSIONAL_CRO}}'}</code>
                            <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded">{'{{TODAY}}'}</code>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClinicalSettings;
