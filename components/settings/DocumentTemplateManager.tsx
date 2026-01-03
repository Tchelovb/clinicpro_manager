import React, { useState, useEffect } from 'react';
import { FileText, Plus, Save, Search, Link2, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import toast from 'react-hot-toast';
import { EliteEditor } from '../shared/EliteEditor';
import { cn } from '../../src/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';

// Tipos baseados no Schema
interface EliteTemplate {
    id: string;
    name: string;
    category: 'CONTRACT' | 'TCLE' | 'PRE_OP' | 'POST_OP' | 'PRESCRIPTION' | 'QUOTATION' | 'PROMISSORY' | 'RECEIPT';
    content: string;
    procedure_tag?: string;
    is_glamour_enabled: boolean;
}

export const DocumentTemplateManager: React.FC = () => {
    const { profile } = useAuth();
    const [templates, setTemplates] = useState<EliteTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState<EliteTemplate | null>(null);
    const [viewMode, setViewMode] = useState<'LIST' | 'EDIT'>('LIST');

    // Estado do Editor
    const [editorContent, setEditorContent] = useState('');
    const [editorMetadata, setEditorMetadata] = useState<Partial<EliteTemplate>>({
        name: '',
        category: 'CONTRACT',
        procedure_tag: '',
        is_glamour_enabled: true
    });

    // Buscar Templates
    const fetchTemplates = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('elite_document_templates')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            setTemplates(data || []);
        } catch (error) {
            console.error('Erro ao buscar templates:', error);
            // Fallback silencioso ou toast
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (profile?.clinic_id) fetchTemplates();
    }, [profile]);

    // Salvar Template
    const handleSave = async () => {
        if (!editorMetadata.name) {
            toast.error('Nome do documento é obrigatório');
            return;
        }

        try {
            const payload = {
                clinic_id: profile?.clinic_id,
                name: editorMetadata.name,
                category: editorMetadata.category,
                content: editorContent,
                procedure_tag: editorMetadata.procedure_tag,
                is_glamour_enabled: editorMetadata.is_glamour_enabled,
                updated_at: new Date()
            };

            let error;
            if (selectedTemplate?.id) {
                const { error: updateError } = await supabase
                    .from('elite_document_templates')
                    .update(payload)
                    .eq('id', selectedTemplate.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('elite_document_templates')
                    .insert([payload]);
                error = insertError;
            }

            if (error) throw error;

            toast.success('Template salvo com sucesso!');
            setViewMode('LIST');
            setSelectedTemplate(null);
            fetchTemplates();
        } catch (error) {
            console.error('Erro ao salvar:', error);
            toast.error('Erro ao salvar template.');
        }
    };

    const handleEdit = (template: EliteTemplate) => {
        setSelectedTemplate(template);
        setEditorMetadata({
            name: template.name,
            category: template.category,
            procedure_tag: template.procedure_tag,
            is_glamour_enabled: template.is_glamour_enabled
        });
        setEditorContent(template.content);
        setViewMode('EDIT');
    };

    const handleNew = () => {
        setSelectedTemplate(null);
        setEditorMetadata({
            name: '',
            category: 'CONTRACT',
            procedure_tag: '',
            is_glamour_enabled: true
        });
        setEditorContent('');
        setViewMode('EDIT');
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <FileText className="text-purple-600" size={24} />
                        Gestão de Documentos Elite
                    </h2>
                    <p className="text-sm text-slate-500">Configure os modelos jurídicos e protocolos da clínica.</p>
                </div>

                {viewMode === 'LIST' && (
                    <Button onClick={handleNew} className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
                        <Plus size={16} /> Novo Modelo
                    </Button>
                )}
            </div>

            {viewMode === 'LIST' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Lista de Cards */}
                    {templates.map((tpl) => (
                        <div key={tpl.id} className="bg-white p-5 rounded-xl border border-slate-200 hover:shadow-md transition-shadow cursor-pointer group" onClick={() => handleEdit(tpl)}>
                            <div className="flex justify-between items-start mb-4">
                                <div className={cn(
                                    "p-2 rounded-lg",
                                    tpl.category === 'CONTRACT' ? "bg-blue-50 text-blue-600" :
                                        tpl.category === 'TCLE' ? "bg-amber-50 text-amber-600" :
                                            "bg-slate-50 text-slate-600"
                                )}>
                                    <FileText size={20} />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-2 py-1 rounded">
                                    {tpl.category}
                                </span>
                            </div>
                            <h3 className="font-bold text-slate-800 mb-2 group-hover:text-purple-600 transition-colors">{tpl.name}</h3>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                                <Link2 size={12} />
                                <span>Tag: {tpl.procedure_tag || 'Geral'}</span>
                            </div>
                            <div className="text-xs text-slate-400 border-t pt-3 flex justify-between items-center">
                                <span>Última edição: {new Date().toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}

                    {templates.length === 0 && !isLoading && (
                        <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <AlertCircle className="mx-auto mb-3" size={32} />
                            <p>Nenhum modelo encontrado. Aguardando sincronização SQL ou crie o primeiro.</p>
                        </div>
                    )}
                </div>
            ) : (
                /* Modo de Edição */
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-200px)]">

                    {/* Toolbar Editor */}
                    <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-slate-50">
                        <Button variant="ghost" size="sm" onClick={() => setViewMode('LIST')}>
                            Voltar
                        </Button>
                        <div className="h-6 w-px bg-slate-200"></div>
                        <Input
                            value={editorMetadata.name}
                            onChange={(e) => setEditorMetadata({ ...editorMetadata, name: e.target.value })}
                            placeholder="Nome do Modelo (Ex: Contrato Lipo)"
                            className="bg-white max-w-sm"
                        />
                        <select
                            value={editorMetadata.category}
                            onChange={(e) => setEditorMetadata({ ...editorMetadata, category: e.target.value as any })}
                            className="p-2 rounded-md border text-sm font-medium bg-white"
                        >
                            <option value="CONTRACT">Contrato</option>
                            <option value="TCLE">TCLE</option>
                            <option value="PRE_OP">Pré-Operatório</option>
                            <option value="POST_OP">Pós-Operatório</option>
                            <option value="PRESCRIPTION">Receituário</option>
                        </select>
                        <Input
                            value={editorMetadata.procedure_tag}
                            onChange={(e) => setEditorMetadata({ ...editorMetadata, procedure_tag: e.target.value })}
                            placeholder="Tag (ex: lipo_papada)"
                            className="bg-white max-w-[150px]"
                        />
                        <div className="flex-1"></div>
                        <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white gap-2">
                            <Save size={16} /> Salvar Modelo
                        </Button>
                    </div>

                    {/* Área de Edição */}
                    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 flex justify-center">
                        <div className="w-[210mm] min-h-[297mm] bg-white shadow-lg p-[2.5cm]">
                            <EliteEditor
                                content={editorContent}
                                onChange={setEditorContent}
                                editable={true}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
