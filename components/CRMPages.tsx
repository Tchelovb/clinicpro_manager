import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLeads, useLead } from '../hooks/useLeads';
import { LeadStatus, InteractionType } from '../types';
import { ArrowLeft, Save, User, Phone, Mail, Globe, Clock, MessageCircle, AlertCircle, Send, Calendar, ChevronDown, CheckCircle, XCircle, HelpCircle, DollarSign, TrendingUp, Loader } from 'lucide-react';

const inputClass = "w-full bg-white text-gray-900 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all shadow-input";
const labelClass = "block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase";

export const CRMForm: React.FC = () => {
    const navigate = useNavigate();
    const { createLead, isCreating } = useLeads();
    const [formData, setFormData] = useState<any>({ source: 'Indicação' }); // Any para facilitar o form handling incial

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.name && formData.phone) {
            createLead({
                name: formData.name,
                phone: formData.phone,
                email: formData.email,
                source: formData.source,
                status: LeadStatus.NEW,
                interest: 'Médio',
                // history, tasks e dates são gerados no backend/hook
            }, {
                onSuccess: () => navigate('/crm')
            });
        }
    };

    return (
        <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate('/crm')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500 dark:text-gray-400 transition-colors"><ArrowLeft size={20} /></button>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Novo Contato</h1>
            </div>
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-card border border-gray-200 dark:border-slate-700 space-y-6">
                <div>
                    <label className={labelClass}><span className="flex items-center gap-2"><User size={16} /> Nome Completo</span></label>
                    <input className={inputClass} required value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Maria Silva" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}><span className="flex items-center gap-2"><Phone size={16} /> Telefone / WhatsApp</span></label>
                        <input className={inputClass} required value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="(00) 00000-0000" />
                    </div>
                    <div>
                        <label className={labelClass}><span className="flex items-center gap-2"><Globe size={16} /> Origem</span></label>
                        <select className={inputClass} value={formData.source} onChange={e => setFormData({ ...formData, source: e.target.value })}>
                            <option value="Instagram">Instagram</option>
                            <option value="Google">Google</option>
                            <option value="Facebook">Facebook</option>
                            <option value="Indicação">Indicação</option>
                            <option value="Tráfego Pago">Tráfego Pago</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className={labelClass}><span className="flex items-center gap-2"><Mail size={16} /> Email (Opcional)</span></label>
                    <input type="email" className={inputClass} value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="email@exemplo.com" />
                </div>
                <div className="pt-6 flex justify-end gap-3 border-t border-gray-100 dark:border-slate-700">
                    <button type="button" onClick={() => navigate('/crm')} className="px-6 py-2.5 border border-gray-300 bg-white rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">Cancelar</button>
                    <button type="submit" disabled={isCreating} className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 font-medium shadow-sm transition-transform active:scale-95 disabled:opacity-50">
                        {isCreating ? <Loader className="animate-spin" size={18} /> : <Save size={18} />}
                        Salvar Contato
                    </button>
                </div>
            </form>
        </div>
    );
};

export const CRMDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: lead, isLoading } = useLead(id || '');
    const { updateLead, addInteraction, isUpdating } = useLeads();
    const [noteInput, setNoteInput] = useState('');
    const [interactionType, setInteractionType] = useState<InteractionType>('Note');
    const [localValue, setLocalValue] = useState<string>('');

    useEffect(() => {
        if (lead) {
            setLocalValue(lead.value ? lead.value.toString() : '');
        }
    }, [lead]);

    if (isLoading) return <div className="p-8 flex justify-center"><Loader className="animate-spin text-blue-600" size={32} /></div>;
    if (!lead) return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Oportunidade não encontrada.</div>;

    const logHistory = (message: string) => {
        addInteraction({ leadId: lead.id, type: 'System', content: message });
    };

    const handleStatusChange = (newStatus: LeadStatus) => {
        if (newStatus === lead.status) return;
        updateLead(
            { id: lead.id, data: { status: newStatus } },
            { onSuccess: () => logHistory(`Etapa alterada de "${lead.status}" para "${newStatus}"`) }
        );
    };

    const handleInterestChange = (newInterest: 'Alto' | 'Médio' | 'Baixo') => {
        if (newInterest === lead.interest) return;
        updateLead(
            { id: lead.id, data: { interest: newInterest } },
            { onSuccess: () => logHistory(`Interesse atualizado para: ${newInterest}`) }
        );
    };

    const handleValueBlur = () => {
        const numValue = parseFloat(localValue);
        if (isNaN(numValue) || numValue < 0) {
            setLocalValue(lead.value ? lead.value.toString() : '');
            return;
        }
        if (numValue !== lead.value) {
            updateLead(
                { id: lead.id, data: { value: numValue } },
                { onSuccess: () => logHistory(`Valor potencial atualizado para R$ ${numValue.toLocaleString('pt-BR')}`) }
            );
        }
    };

    const handleAddInteraction = () => {
        if (!noteInput.trim()) return;
        addInteraction({
            leadId: lead.id,
            type: interactionType,
            content: noteInput
        }, {
            onSuccess: () => setNoteInput('')
        });
    };

    const getStatusColor = (status: LeadStatus) => {
        if (status === LeadStatus.WON) return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
        if (status === LeadStatus.LOST) return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
        return 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
    };

    return (
        <div className="max-w-4xl mx-auto h-[calc(100vh-6rem)] flex flex-col animate-in fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/crm')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500 dark:text-gray-400 transition-colors"><ArrowLeft size={20} /></button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{lead.name}</h1>
                            {isUpdating && <Loader size={16} className="animate-spin text-gray-400" />}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{lead.source} • Criado em {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : 'N/A'}</p>
                    </div>
                </div>
                <div className="flex gap-2 self-end md:self-auto">
                    <a href={`https://wa.me/55${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="p-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50" title="WhatsApp"><MessageCircle size={20} /></a>
                    <a href={`tel:${lead.phone}`} className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50" title="Ligar"><Phone size={20} /></a>
                    <button onClick={() => navigate('/agenda')} className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50" title="Agendar"><Calendar size={20} /></button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-4 md:p-6 mb-4 rounded-xl shadow-card shrink-0 transition-colors">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className={labelClass}><span className="flex items-center gap-2">Etapa do Funil <HelpCircle size={14} className="text-gray-400" /></span></label>
                        <div className="relative">
                            <select
                                value={lead.status}
                                onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
                                className={`w-full appearance-none pl-4 pr-10 py-3 rounded-xl border font-bold text-sm outline-none focus:ring-2 focus:ring-primary-500 transition-all cursor-pointer ${getStatusColor(lead.status)}`}
                            >
                                {Object.values(LeadStatus).map(status => (
                                    <option key={status} value={status} className="bg-white text-gray-900">
                                        {status}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-current opacity-70">
                                <ChevronDown size={18} />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}><span className="flex items-center gap-2">Interesse <TrendingUp size={14} className="text-blue-500" /></span></label>
                        <div className="relative">
                            <select
                                value={lead.interest || ''}
                                onChange={(e) => handleInterestChange(e.target.value as 'Alto' | 'Médio' | 'Baixo')}
                                className={`${inputClass} appearance-none py-3 font-medium cursor-pointer`}
                            >
                                <option value="" disabled>Selecione...</option>
                                <option value="Baixo">Baixo</option>
                                <option value="Médio">Médio</option>
                                <option value="Alto">Alto</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                <ChevronDown size={18} />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}><span className="flex items-center gap-2">Valor Potencial (R$) <DollarSign size={14} className="text-green-500" /></span></label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">R$</span>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0,00"
                                className={`${inputClass} pl-10 py-3 font-bold`}
                                value={localValue}
                                onChange={(e) => setLocalValue(e.target.value)}
                                onBlur={handleValueBlur}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl shadow-card border border-gray-200 dark:border-slate-700 overflow-hidden flex flex-col transition-colors">
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {lead.history && lead.history.length > 0 ? (
                        lead.history.map((interaction, idx) => (
                            <div key={interaction.id || idx} className="flex gap-4 relative animate-in fade-in slide-in-from-bottom-2">
                                {idx !== lead.history.length - 1 && <div className="absolute left-4 top-10 bottom-[-24px] w-0.5 bg-gray-100 dark:bg-slate-700"></div>}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 border-2 border-white dark:border-slate-800 shadow-sm ${interaction.type === 'System' ? 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-gray-400' : interaction.type === 'WhatsApp' ? 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400' : 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'}`}>
                                    {interaction.type === 'System' ? <AlertCircle size={14} /> : interaction.type === 'WhatsApp' ? <MessageCircle size={14} /> : <User size={14} />}
                                </div>
                                <div className="flex-1 bg-gray-50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-100 dark:border-slate-700">
                                    <p className="text-gray-800 dark:text-gray-200 text-sm whitespace-pre-wrap">{interaction.content}</p>
                                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-slate-700 flex justify-between text-xs text-gray-400 dark:text-gray-500">
                                        <span>{interaction.user}</span>
                                        <span>{interaction.date ? new Date(interaction.date).toLocaleString() : 'Data N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <MessageCircle size={32} className="mb-2 opacity-50" />
                            <p>Nenhuma interação registrada.</p>
                        </div>
                    )}
                </div>
                <div className="p-4 bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 shrink-0">
                    <div className="flex gap-2 mb-3">
                        {['Note', 'Call', 'WhatsApp'].map(type => (
                            <button key={type} onClick={() => setInteractionType(type as any)} className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${interactionType === type ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-slate-600'}`}>{type === 'Note' ? 'Nota' : type}</button>
                        ))}
                    </div>
                    <div className="relative">
                        <textarea className={`${inputClass} pr-12 h-24 resize-none`} placeholder="Registrar interação..." value={noteInput} onChange={e => setNoteInput(e.target.value)} />
                        <button onClick={handleAddInteraction} disabled={!noteInput.trim()} className="absolute right-2 bottom-2 p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"><Send size={18} /></button>
                    </div>
                </div>
            </div>
        </div>
    );
};
