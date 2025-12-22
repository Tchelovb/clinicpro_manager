import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, Clock, User, FileText, X, Save, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Professional {
    id: string;
    name: string;
    active: boolean;
}

const AgendaForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { profile } = useAuth();

    const isEditing = !!id;
    const [loading, setLoading] = useState(false);
    const [professionals, setProfessionals] = useState<Professional[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        patient_id: '',
        patient_name: '',
        professional_id: '',
        date: '',
        time: '',
        type: 'EVALUATION' as 'EVALUATION' | 'PROCEDURE' | 'FOLLOW_UP' | 'EMERGENCY',
        notes: '',
        status: 'PENDING' as 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
    });

    useEffect(() => {
        loadProfessionals();
        if (isEditing) {
            loadAppointment();
        }
    }, [id]);

    const loadProfessionals = async () => {
        try {
            const { data, error } = await supabase
                .from('professionals')
                .select('id, name, is_active')
                .eq('clinic_id', profile?.clinic_id)
                .eq('is_active', true)
                .order('name');

            if (error) throw error;
            setProfessionals(data.map(p => ({ id: p.id, name: p.name, active: p.is_active })));
        } catch (error) {
            console.error('Erro ao carregar profissionais:', error);
            toast.error('Erro ao carregar profissionais');
        }
    };

    const loadAppointment = async () => {
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            setFormData({
                patient_id: data.patient_id,
                patient_name: '', // TODO: Load patient name
                professional_id: data.professional_id,
                date: data.date,
                time: data.time,
                type: data.type,
                notes: data.notes || '',
                status: data.status
            });
        } catch (error) {
            console.error('Erro ao carregar agendamento:', error);
            toast.error('Erro ao carregar agendamento');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const appointmentData = {
                clinic_id: profile?.clinic_id,
                patient_id: formData.patient_id || null, // TODO: Link to actual patient
                professional_id: formData.professional_id,
                date: formData.date,
                time: formData.time,
                type: formData.type,
                status: formData.status,
                notes: formData.notes || null,
                created_by: profile?.id,
                updated_at: new Date().toISOString()
            };

            if (isEditing) {
                const { error } = await supabase
                    .from('appointments')
                    .update(appointmentData)
                    .eq('id', id);

                if (error) throw error;
                toast.success('Agendamento atualizado com sucesso!');
            } else {
                const { error } = await supabase
                    .from('appointments')
                    .insert([{
                        ...appointmentData,
                        created_at: new Date().toISOString()
                    }]);

                if (error) throw error;
                toast.success('Agendamento criado com sucesso!');
            }

            navigate('/agenda');
        } catch (error: any) {
            console.error('Erro ao salvar agendamento:', error);
            toast.error(error.message || 'Erro ao salvar agendamento');
        } finally {
            setLoading(false);
        }
    };

    const typeLabels = {
        EVALUATION: 'Avaliação',
        PROCEDURE: 'Procedimento',
        FOLLOW_UP: 'Retorno',
        EMERGENCY: 'Urgência'
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                        <Calendar className="text-violet-600" size={32} />
                        {isEditing ? 'Editar Agendamento' : 'Novo Agendamento'}
                    </h1>
                    <p className="text-slate-500 mt-2">Preencha os dados do agendamento</p>
                </div>
                <button
                    onClick={() => navigate('/agenda')}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                    <X size={24} className="text-slate-400" />
                </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">

                {/* Patient Name (Temporary - TODO: Replace with patient selector) */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        <User size={16} className="inline mr-2" />
                        Nome do Paciente *
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.patient_name}
                        onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                        placeholder="Digite o nome do paciente"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                        💡 Em breve: seletor de pacientes cadastrados
                    </p>
                </div>

                {/* Professional */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        Profissional *
                    </label>
                    <select
                        required
                        value={formData.professional_id}
                        onChange={(e) => setFormData({ ...formData, professional_id: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                        <option value="">Selecione um profissional</option>
                        {professionals.map(prof => (
                            <option key={prof.id} value={prof.id}>{prof.name}</option>
                        ))}
                    </select>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            <Calendar size={16} className="inline mr-2" />
                            Data *
                        </label>
                        <input
                            type="date"
                            required
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            <Clock size={16} className="inline mr-2" />
                            Horário *
                        </label>
                        <input
                            type="time"
                            required
                            value={formData.time}
                            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                    </div>
                </div>

                {/* Type */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        Tipo de Atendimento *
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {(Object.keys(typeLabels) as Array<keyof typeof typeLabels>).map(type => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setFormData({ ...formData, type })}
                                className={`px-4 py-2 rounded-lg border-2 transition-all ${formData.type === type
                                        ? 'border-violet-500 bg-violet-50 text-violet-700 font-bold'
                                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                    }`}
                            >
                                {typeLabels[type]}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Notes */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        <FileText size={16} className="inline mr-2" />
                        Observações
                    </label>
                    <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 min-h-[100px]"
                        placeholder="Observações adicionais (opcional)"
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={() => navigate('/agenda')}
                        disabled={loading}
                        className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors font-medium disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                {isEditing ? 'Salvar Alterações' : 'Criar Agendamento'}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AgendaForm;
