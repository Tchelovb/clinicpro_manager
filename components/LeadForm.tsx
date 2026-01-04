import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { User, Phone, Mail, Target, Sparkles, X, Save, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../src/lib/supabase';
import toast from 'react-hot-toast';
import { GlassCard } from './ui/GlassCard';
import { PrimaryButton } from './ui/PrimaryButton';
import { FormInput } from './ui/FormInput';

const LeadForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { profile } = useAuth();

    const isEditing = !!id;
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        source: 'Instagram' as string,
        desired_treatment: '',
        priority: 'MEDIUM' as 'HIGH' | 'MEDIUM' | 'LOW',
        notes: '',
        lead_score: 50
    });

    useEffect(() => {
        if (isEditing) {
            loadLead();
        }
    }, [id]);

    const loadLead = async () => {
        try {
            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            setFormData({
                name: data.name,
                phone: data.phone,
                email: data.email || '',
                source: data.source,
                desired_treatment: data.desired_treatment || '',
                priority: data.priority || 'MEDIUM',
                notes: data.notes || '',
                lead_score: data.lead_score || 50
            });
        } catch (error) {
            console.error('Erro ao carregar lead:', error);
            toast.error('Erro ao carregar lead');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const leadData = {
                clinic_id: profile?.clinic_id,
                name: formData.name,
                phone: formData.phone,
                email: formData.email || null,
                source: formData.source,
                desired_treatment: formData.desired_treatment || null,
                priority: formData.priority,
                notes: formData.notes || null,
                lead_score: formData.lead_score,
                status: 'NEW',
                last_interaction: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            if (isEditing) {
                const { error } = await supabase
                    .from('leads')
                    .update(leadData)
                    .eq('id', id);

                if (error) throw error;
                toast.success('Lead atualizado com sucesso!');
            } else {
                const { error } = await supabase
                    .from('leads')
                    .insert([{
                        ...leadData,
                        created_at: new Date().toISOString()
                    }]);

                if (error) throw error;
                toast.success('Lead criado com sucesso!');
            }

            navigate('/pipeline');
        } catch (error: any) {
            console.error('Erro ao salvar lead:', error);
            toast.error(error.message || 'Erro ao salvar lead');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                        <Sparkles className="text-amber-600" size={32} />
                        {isEditing ? 'Editar Lead' : 'Novo Lead'}
                    </h1>
                    <p className="text-slate-500 mt-2">Cadastre uma nova oportunidade no pipeline</p>
                </div>
                <button
                    onClick={() => navigate('/pipeline')}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                    <X size={24} className="text-slate-400" />
                </button>
            </div>

            {/* Form */}
            <GlassCard className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Name */}
                    <FormInput
                        label="Nome Completo"
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        leftIcon={<User size={18} />}
                        placeholder="Nome do lead"
                    />

                    {/* Contact Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormInput
                            label="Telefone"
                            type="tel"
                            required
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            leftIcon={<Phone size={18} />}
                            placeholder="(00) 00000-0000"
                        />
                        <FormInput
                            label="E-mail"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            leftIcon={<Mail size={18} />}
                            placeholder="email@exemplo.com"
                        />
                    </div>

                    {/* Source */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            Origem do Lead *
                        </label>
                        <select
                            required
                            value={formData.source}
                            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                        >
                            <option value="Instagram">📸 Instagram</option>
                            <option value="Google">🔍 Google</option>
                            <option value="Indicação">👥 Indicação</option>
                            <option value="Facebook">📘 Facebook</option>
                            <option value="Tráfego Pago">💰 Tráfego Pago</option>
                            <option value="WhatsApp">💬 WhatsApp</option>
                            <option value="Orgânico">🌱 Orgânico</option>
                        </select>
                    </div>

                    {/* Desired Treatment */}
                    <FormInput
                        label="Procedimento de Interesse"
                        type="text"
                        value={formData.desired_treatment}
                        onChange={(e) => setFormData({ ...formData, desired_treatment: e.target.value })}
                        leftIcon={<Target size={18} />}
                        placeholder="Ex: Implante, Harmonização Facial, Botox..."
                    />

                    {/* Priority */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            Prioridade
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {(['HIGH', 'MEDIUM', 'LOW'] as const).map(priority => (
                                <button
                                    key={priority}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, priority })}
                                    className={`px-4 py-2 rounded-lg border-2 transition-all ${formData.priority === priority
                                        ? priority === 'HIGH'
                                            ? 'border-rose-500 bg-rose-50 text-rose-700 font-bold'
                                            : priority === 'MEDIUM'
                                                ? 'border-amber-500 bg-amber-50 text-amber-700 font-bold'
                                                : 'border-slate-500 bg-slate-50 text-slate-700 font-bold'
                                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                        }`}
                                >
                                    {priority === 'HIGH' ? '🔥 Alta' : priority === 'MEDIUM' ? '⚡ Média' : '📌 Baixa'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            Observações
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 min-h-[100px]"
                            placeholder="Informações adicionais sobre o lead..."
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-slate-100">
                        <PrimaryButton
                            type="button"
                            variant="ghost"
                            onClick={() => navigate('/pipeline')}
                            disabled={loading}
                            fullWidth
                        >
                            Cancelar
                        </PrimaryButton>
                        <PrimaryButton
                            type="submit"
                            variant="solid"
                            loading={loading}
                            leftIcon={<Save size={18} />}
                            fullWidth
                        >
                            {isEditing ? 'Salvar Alterações' : 'Criar Lead'}
                        </PrimaryButton>
                    </div>
                </form>
            </GlassCard>
        </div>
    );
};

export default LeadForm;
