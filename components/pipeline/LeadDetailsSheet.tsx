
import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "../ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import {
    User, Phone, Mail, Calendar, MessageSquare, CheckCircle,
    XCircle, Clock, Save, Trash2, Send, MoreVertical,
    Briefcase, DollarSign, Tag, FileText
} from 'lucide-react';
import { HighTicketLead, highTicketService, Pipeline } from '../../services/highTicketService';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

interface LeadDetailsSheetProps {
    isOpen: boolean;
    onClose: () => void;
    lead: HighTicketLead | null;
    onSave: () => void;
    pipeline?: Pipeline | null; // NEW: Pipeline context
}

export function LeadDetailsSheet({ isOpen, onClose, lead, onSave, pipeline }: LeadDetailsSheetProps) {
    const { profile } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<HighTicketLead>>({});
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (lead) {
            setFormData(lead);
        } else {
            // NEW LEAD: Set default values with pipeline context
            setFormData({
                clinic_id: profile?.clinic_id,
                pipeline_id: pipeline?.id,
                stage_id: pipeline?.stages?.[0]?.id, // First stage
                priority: 'MEDIUM',
                lead_score: 0,
                source: 'MANUAL',
                value: 0,
                name: '',
                phone: ''
            });
        }
    }, [lead, profile, isOpen, pipeline]);

    const handleChange = (field: keyof HighTicketLead, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        // Validation
        if (!formData.name || !formData.phone) {
            alert('Por favor, preencha Nome e Telefone');
            return;
        }

        setLoading(true);
        try {
            if (lead?.id) {
                // UPDATE existing lead
                await highTicketService.updateLead(lead.id, formData);
            } else {
                // CREATE new lead
                if (!pipeline?.id || !pipeline?.stages?.[0]?.id) {
                    throw new Error('Pipeline não configurado');
                }

                await highTicketService.createLead(
                    formData,
                    pipeline.id,
                    pipeline.stages[0].id
                );
            }
            onSave();
            onClose();
        } catch (error) {
            console.error('Erro ao salvar lead:', error);
            alert('Erro ao salvar lead: ' + (error as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!lead?.id || !confirm('Tem certeza que deseja excluir este lead?')) return;
        setLoading(true);
        try {
            await highTicketService.deleteLead(lead.id);
            onSave();
            onClose();
        } catch (error) {
            console.error('Erro ao excluir:', error);
            alert('Erro ao excluir lead');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'NEW': return 'bg-blue-100 text-blue-800';
            case 'WON': return 'bg-green-100 text-green-800';
            case 'LOST': return 'bg-slate-100 text-slate-800';
            default: return 'bg-violet-100 text-violet-800';
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-[100vw] sm:w-[800px] sm:max-w-[800px] flex flex-col p-0 gap-0">

                {/* HEADER KOMMO STYLE */}
                <div className="border-b border-gray-200 p-6 flex justify-between items-start bg-slate-50/50">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-white p-2 rounded-full border border-gray-200 shadow-sm">
                                <User className="text-gray-500" size={24} />
                            </div>
                            <div className="flex-1">
                                <Input
                                    value={formData.name || ''}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    className="text-xl font-bold border-transparent bg-transparent hover:bg-white hover:border-gray-200 px-2 py-1 h-auto focus:ring-0 focus:border-blue-500 transition-all rounded"
                                    placeholder="Nome do Lead"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-2">
                            <Badge className={cn("cursor-pointer hover:opacity-80", getStatusColor(formData.status))}>
                                {formData.status || 'NEW'}
                            </Badge>
                            <Badge variant="outline" className="text-gray-500 border-gray-300">
                                <Tag size={10} className="mr-1" />
                                {formData.priority}
                            </Badge>
                            {lead?.value && (
                                <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                                    R$ {lead.value.toLocaleString('pt-BR')}
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="hidden sm:flex">
                            <Phone size={16} className="mr-2" /> Ligar
                        </Button>
                        <Button variant="outline" size="sm" className="hidden sm:flex border-green-200 text-green-700 hover:bg-green-50">
                            <MessageSquare size={16} className="mr-2" /> WhatsApp
                        </Button>
                        <Button variant="ghost" size="icon">
                            <MoreVertical size={18} />
                        </Button>
                    </div>
                </div>

                {/* CONTENT AREA - 2 COLUMNS */}
                <div className="flex-1 flex overflow-hidden">

                    {/* LEFT COLUMN: FIELDS */}
                    <div className="w-1/3 border-r border-gray-200 overflow-y-auto p-6 bg-white shrink-0">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Detalhes do Lead</h3>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-500">Telefone</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={formData.phone || ''}
                                        onChange={(e) => handleChange('phone', e.target.value)}
                                        placeholder="(00) 00000-0000"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs text-gray-500">E-mail</Label>
                                <Input
                                    value={formData.email || ''}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    placeholder="email@exemplo.com"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs text-gray-500">Tratamento de Interesse</Label>
                                <div className="relative">
                                    {/* Could use a Select here */}
                                    <Input
                                        value={formData.desired_treatment || ''}
                                        onChange={(e) => handleChange('desired_treatment', e.target.value)}
                                        placeholder="Ex: Lipoescultura"
                                    />
                                    <Briefcase className="absolute right-3 top-2.5 text-gray-400" size={16} />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs text-gray-500">Valor Estimado</Label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        value={formData.value ?? ''}
                                        onInput={(e: React.FormEvent<HTMLInputElement>) => {
                                            const target = e.currentTarget;
                                            const numValue = target.valueAsNumber;
                                            handleChange('value', isNaN(numValue) ? 0 : numValue);
                                        }}
                                        placeholder="0"
                                        className="pl-8"
                                        step="0.01"
                                        min="0"
                                    />
                                    <DollarSign className="absolute left-2.5 top-2.5 text-gray-400" size={16} />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs text-gray-500">Origem</Label>
                                <Input
                                    value={formData.source || ''}
                                    onChange={(e) => handleChange('source', e.target.value)}
                                    placeholder="Instagram, Indicação..."
                                />
                            </div>
                        </div>

                        <div className="mt-8 border-t border-gray-100 pt-4">
                            <Button
                                variant="destructive"
                                size="sm"
                                className="w-full"
                                onClick={handleDelete}
                                disabled={!lead?.id}
                            >
                                <Trash2 size={16} className="mr-2" /> Excluir Lead
                            </Button>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: TIMELINE & TABS */}
                    <div className="flex-1 flex flex-col bg-slate-50">
                        <Tabs defaultValue="timeline" className="flex-1 flex flex-col">
                            <div className="border-b border-gray-200 bg-white px-6">
                                <TabsList className="bg-transparent h-12 p-0 space-x-6">
                                    <TabsTrigger value="timeline" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-violet-600 data-[state=active]:shadow-none px-0">
                                        Timeline
                                    </TabsTrigger>
                                    <TabsTrigger value="notes" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-violet-600 data-[state=active]:shadow-none px-0">
                                        Notas
                                    </TabsTrigger>
                                    <TabsTrigger value="tasks" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-violet-600 data-[state=active]:shadow-none px-0">
                                        Tarefas
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4">

                                <TabsContent value="timeline" className="space-y-4 data-[state=active]:block h-full">
                                    {/* Timeline Items */}
                                    {(!lead?.agent_logs || lead.agent_logs.length === 0) && (
                                        <div className="text-center py-10 text-gray-400">
                                            <MessageSquare size={32} className="mx-auto mb-2 opacity-20" />
                                            <p className="text-sm">Nenhuma interação registrada</p>
                                        </div>
                                    )}

                                    {lead?.agent_logs?.map((log, index) => (
                                        <div key={index} className="flex gap-3">
                                            <div className="mt-1">
                                                <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                                                    <span className="text-xs font-bold text-violet-600">IA</span>
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <div className="bg-white p-3 rounded-lg rounded-tl-none border border-gray-200 shadow-sm relative group">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-xs font-bold text-gray-700">Assistente Virtual</span>
                                                        <span className="text-[10px] text-gray-400">{new Date(log.created_at).toLocaleString()}</span>
                                                    </div>
                                                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{log.message_sent}</p>
                                                    <div className="mt-2 text-xs text-gray-400 flex items-center gap-2">
                                                        <Badge variant="secondary" className="text-[10px] h-5">{log.status}</Badge>
                                                    </div>

                                                    {/* Copy Action */}
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100"
                                                        onClick={() => navigator.clipboard.writeText(log.message_sent)}
                                                    >
                                                        <FileText size={12} />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </TabsContent>

                                <TabsContent value="notes" className="h-full">
                                    <div className="bg-yellow-50 p-4 border border-yellow-100 rounded-lg text-yellow-800 text-sm">
                                        Área de notas em desenvolvimento...
                                    </div>
                                </TabsContent>

                                <TabsContent value="tasks" className="h-full">
                                    <div className="bg-blue-50 p-4 border border-blue-100 rounded-lg text-blue-800 text-sm">
                                        Área de tarefas em desenvolvimento...
                                    </div>
                                </TabsContent>
                            </div>

                            {/* Input Area (Chat-style) */}
                            <div className="p-4 bg-white border-t border-gray-200">
                                <div className="flex gap-2">
                                    <Textarea
                                        placeholder="Escreva uma nota ou observação..."
                                        className="min-h-[40px] max-h-[120px] resize-none"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    />
                                    <Button size="icon" className="h-auto w-12 shrink-0 bg-violet-600 hover:bg-violet-700">
                                        <Send size={18} />
                                    </Button>
                                </div>
                            </div>
                        </Tabs>
                    </div>
                </div>

                <SheetFooter className="border-t border-gray-200 p-4 bg-white sm:justify-between">
                    <span className="text-xs text-gray-400 flex items-center">
                        <Clock size={12} className="mr-1" />
                        Criado em {lead?.created_at ? new Date(lead.created_at).toLocaleDateString() : 'Hoje'}
                    </span>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white">
                            {loading ? 'Salvando...' : 'Salvar Alterações'}
                        </Button>
                    </div>
                </SheetFooter>

            </SheetContent>
        </Sheet>
    );
}
