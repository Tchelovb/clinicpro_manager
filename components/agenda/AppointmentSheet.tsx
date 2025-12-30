
import React, { useState, useEffect } from 'react';
import { Drawer } from 'vaul';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { PatientSearch } from './PatientSearch';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { X, Clock, Calendar, AlertTriangle, Save, Trash2, FileText, CheckCircle, ArrowLeft, UserPlus, Phone } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AppointmentSheetProps {
    isOpen: boolean;
    onClose: () => void;
    selectedSlot?: { date: Date; time: string };
    appointmentId?: string;
    onSuccess: () => void;
}

export const AppointmentSheet: React.FC<AppointmentSheetProps> = ({
    isOpen,
    onClose,
    selectedSlot,
    appointmentId,
    onSuccess
}) => {
    const isMobile = useMediaQuery('(max-width: 768px)');
    const { profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [conflict, setConflict] = useState<string | null>(null);

    // Quick Registration State
    const [viewMode, setViewMode] = useState<'appointment' | 'quick-register'>('appointment');
    const [quickName, setQuickName] = useState('');
    const [quickPhone, setQuickPhone] = useState('');

    const [formData, setFormData] = useState({
        patient_id: '',
        patient_name: '',
        patient_phone: '',
        doctor_id: '',
        date: '',
        time: '',
        duration: 60,
        type: 'EVALUATION',
        status: 'PENDING',
        notes: ''
    });

    const [professionals, setProfessionals] = useState<any[]>([]);

    // Initialize form or load appointment data
    useEffect(() => {
        if (isOpen) {
            loadProfessionals();
            setConflict(null);
            setViewMode('appointment'); // Reset view mode
            setQuickName('');
            setQuickPhone('');

            if (appointmentId) {
                loadAppointment(appointmentId);
            } else if (selectedSlot) {
                // Auto-select current user as doctor if they are a professional
                const defaultDoctorId = profile?.id || '';

                // Smart Type Selection: Master/Admin -> Treatment, Others -> Evaluation
                const userIsAdmin = profile?.role === 'ADMIN' || profile?.role === 'MASTER';
                const defaultType = userIsAdmin ? 'TREATMENT' : 'EVALUATION';

                setFormData(prev => ({
                    ...prev,
                    patient_id: '',
                    patient_name: '',
                    patient_phone: '',
                    date: format(selectedSlot.date, 'yyyy-MM-dd'),
                    time: selectedSlot.time,
                    doctor_id: defaultDoctorId,
                    type: defaultType,
                    status: 'PENDING',
                    notes: ''
                }));
            }
        }
    }, [isOpen, selectedSlot, appointmentId, profile?.id, profile?.role]);

    const loadProfessionals = async () => {
        if (!profile?.clinic_id) return;
        const { data } = await supabase
            .from('users')
            .select('id, name')
            .eq('clinic_id', profile.clinic_id)
            .eq('is_active', true)
            .not('professional_id', 'is', null);
        setProfessionals(data || []);
    };

    const loadAppointment = async (id: string) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select(`
                *,
                patients (id, name, phone)
            `)
                .eq('id', id)
                .single();

            if (error) throw error;
            if (data) {
                const dateObj = parseISO(data.date);
                setFormData({
                    patient_id: data.patient_id,
                    patient_name: data.patients?.name || '',
                    patient_phone: data.patients?.phone || '',
                    doctor_id: data.doctor_id,
                    date: format(dateObj, 'yyyy-MM-dd'),
                    time: format(dateObj, 'HH:mm'),
                    duration: data.duration,
                    type: data.type,
                    status: data.status,
                    notes: data.notes || ''
                });
            }
        } catch (err) {
            console.error(err);
            toast.error('Erro ao carregar agendamento');
        } finally {
            setLoading(false);
        }
    };

    const checkConflict = async () => {
        if (!formData.doctor_id || !formData.date || !formData.time) return false;

        try {
            const startOfDay = `${formData.date}T00:00:00`;
            const endOfDay = `${formData.date}T23:59:59`;

            const { data: existingAppts, error } = await supabase
                .from('appointments')
                .select('id, date, duration')
                .eq('doctor_id', formData.doctor_id)
                .neq('status', 'CANCELLED') // Ignore cancelled
                .gte('date', startOfDay)
                .lte('date', endOfDay);

            if (error) throw error;
            if (!existingAppts) return false;

            const [newHour, newMinute] = formData.time.split(':').map(Number);
            const newStartMinutes = newHour * 60 + newMinute;
            const newEndMinutes = newStartMinutes + formData.duration;

            for (const appt of existingAppts) {
                if (appointmentId && appt.id === appointmentId) continue;

                const apptDate = parseISO(appt.date);
                const apptStartMinutes = apptDate.getHours() * 60 + apptDate.getMinutes();
                const apptEndMinutes = apptStartMinutes + appt.duration;

                if (newStartMinutes < apptEndMinutes && newEndMinutes > apptStartMinutes) {
                    return true;
                }
            }

            return false;
        } catch (err) {
            console.error('Error checking conflict:', err);
            return false;
        }
    };

    const handleSave = async () => {
        if (!formData.patient_id || !formData.doctor_id || !formData.date || !formData.time) {
            toast.error('Preencha os campos obrigatórios');
            return;
        }

        if (!profile?.clinic_id) {
            toast.error('Erro de perfil: Clínica não identificada');
            return;
        }

        setConflict(null);
        const hasConflict = await checkConflict();
        if (hasConflict) {
            setConflict("Choque de horário! Este profissional já tem um atendimento neste período.");
            toast.error("Conflito de horário detectado!");
            return;
        }

        setLoading(true);
        try {
            const appointmentDateTime = `${formData.date}T${formData.time}:00`;

            // Ensure types match Database Enums EXACTLY
            const validTypes = ['EVALUATION', 'TREATMENT', 'RETURN', 'URGENCY'];
            const typeToSend = validTypes.includes(formData.type) ? formData.type : 'EVALUATION';

            const validStatus = ['PENDING', 'CONFIRMED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
            const statusToSend = validStatus.includes(formData.status) ? formData.status : 'PENDING';

            const payload = {
                clinic_id: profile.clinic_id, // Explicitly use verified clinic_id
                patient_id: formData.patient_id,
                doctor_id: formData.doctor_id,
                date: appointmentDateTime,
                duration: formData.duration,
                type: typeToSend,
                status: statusToSend,
                notes: formData.notes
            };

            let error;
            if (appointmentId) {
                const { error: err } = await supabase
                    .from('appointments')
                    .update(payload)
                    .eq('id', appointmentId);
                error = err;
            } else {
                const { error: err } = await supabase
                    .from('appointments')
                    .insert([payload]);
                error = err;
            }

            if (error) throw error;
            toast.success(appointmentId ? 'Agendamento atualizado!' : 'Agendado com sucesso!');
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Save Error:', err);
            toast.error(`Erro ao salvar: ${err.message || 'Dados inválidos'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Tem certeza que deseja cancelar este agendamento?')) return;
        setLoading(true);
        try {
            const { error } = await supabase
                .from('appointments')
                .update({ status: 'CANCELLED' })
                .eq('id', appointmentId);

            if (error) throw error;
            toast.success('Agendamento cancelado');
            onSuccess();
            onClose();
        } catch (err) {
            toast.error('Erro ao cancelar');
        } finally {
            setLoading(false);
        }
    };

    // Quick Registration Handler
    const handleQuickSave = async () => {
        if (!quickName || !quickPhone) {
            toast.error('Preencha nome e telefone');
            return;
        }
        if (!profile?.clinic_id) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('patients')
                .insert({
                    name: quickName,
                    phone: quickPhone,
                    clinic_id: profile.clinic_id,
                    patient_score: 'STANDARD',
                    clinical_status: 'Em Tratamento'
                })
                .select()
                .single();

            if (error) throw error;

            toast.success('Paciente cadastrado!');
            // Auto select new patient
            setFormData(prev => ({ ...prev, patient_id: data.id, patient_name: data.name, patient_phone: data.phone }));
            // Return to appointment form
            setViewMode('appointment');
        } catch (err) {
            console.error(err);
            toast.error('Erro ao salvar paciente');
        } finally {
            setLoading(false);
        }
    };

    const renderContent = () => {
        if (viewMode === 'quick-register') {
            return (
                <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-y-auto w-full">
                    {/* Header - Quick Register */}
                    <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                        <div className="flex items-center gap-2">
                            <button onClick={() => setViewMode('appointment')} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                                <ArrowLeft size={20} />
                            </button>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <UserPlus size={18} className="text-violet-600" />
                                Cadastro Rápido
                            </h2>
                        </div>
                    </div>

                    <div className="flex-1 p-6 space-y-6">
                        <div className="bg-violet-50 dark:bg-violet-900/20 p-4 rounded-xl border border-violet-100 dark:border-violet-800/50">
                            <p className="text-sm text-violet-800 dark:text-violet-300">
                                Cadastre apenas o essencial para agendar agora. Você pode completar a ficha depois.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Nome do Paciente</label>
                                <input
                                    autoFocus
                                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm font-medium focus:ring-2 ring-violet-500"
                                    placeholder="Ex: Maria da Silva"
                                    value={quickName}
                                    onChange={e => setQuickName(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Celular / WhatsApp</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                    <input
                                        className="w-full pl-9 pr-3 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm font-medium focus:ring-2 ring-violet-500"
                                        placeholder="(00) 00000-0000"
                                        value={quickPhone}
                                        onChange={e => setQuickPhone(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="sticky bottom-0 p-4 border-t border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm space-y-3 pb-8 md:pb-4 safe-area-bottom">
                        <button
                            onClick={handleQuickSave}
                            disabled={loading || !quickName || !quickPhone}
                            className="w-full py-3.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
                        >
                            {loading ? <span className="animate-spin">⏳</span> : <UserPlus size={18} />}
                            Cadastrar e Selecionar
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-y-auto w-full">
                {/* Header - Sticky */}
                <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        {appointmentId ? 'Editar Agendamento' : 'Novo Agendamento'}
                    </h2>
                    <div className="flex items-center gap-2">
                        {/* Mobile Close Button (Drawer handle does this but explicit button is nice) */}
                        {!isMobile && <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><X size={20} /></button>}
                    </div>
                </div>

                <div className="flex-1 p-4 space-y-6">
                    {/* Patient Search */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Paciente</label>
                        <PatientSearch
                            onSelect={(p) => setFormData(prev => ({ ...prev, patient_id: p.id, patient_name: p.name, patient_phone: p.phone }))}
                            onAddNew={(name) => {
                                setQuickName(name);
                                setViewMode('quick-register');
                            }}
                            selectedId={formData.patient_id}
                        />
                        {appointmentId && formData.patient_id && (
                            <div className="text-sm bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <div>
                                    <div className="font-bold text-slate-900 dark:text-white">{formData.patient_name}</div>
                                    {formData.patient_phone && (
                                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                                            <Phone className="w-3 h-3" /> {formData.patient_phone}
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => setFormData(prev => ({ ...prev, patient_id: '', patient_name: '', patient_phone: '' }))} className="text-xs text-blue-600 font-bold hover:underline">Alterar</button>
                            </div>
                        )}
                    </div>


                    {/* DateTime Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Data</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                <input
                                    type="date"
                                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm font-medium focus:ring-2 ring-blue-500"
                                    value={formData.date}
                                    onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Horário</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                <input
                                    type="time"
                                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm font-medium focus:ring-2 ring-blue-500"
                                    value={formData.time}
                                    onChange={e => setFormData(prev => ({ ...prev, time: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Professional & Duration */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Profissional</label>
                            <select
                                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm"
                                value={formData.doctor_id}
                                onChange={e => setFormData(prev => ({ ...prev, doctor_id: e.target.value }))}
                            >
                                <option value="">Selecione...</option>
                                {professionals.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Duração (min)</label>
                            <select
                                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm"
                                value={formData.duration}
                                onChange={e => setFormData(prev => ({ ...prev, duration: Number(e.target.value) }))}
                            >
                                {[15, 30, 45, 60, 90, 120].map(m => (
                                    <option key={m} value={m}>{m} min</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Tipo</label>
                        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                            {['EVALUATION', 'TREATMENT', 'RETURN', 'URGENCY'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setFormData(prev => ({ ...prev, type }))}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${formData.type === type
                                        ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    {type === 'EVALUATION' ? 'Avaliação' : type === 'TREATMENT' ? 'Procedimento' : type === 'RETURN' ? 'Retorno' : 'Urgência'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Description/Notes */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Observações</label>
                        <textarea
                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm resize-none h-24 focus:ring-2 ring-blue-500"
                            placeholder="Adicione detalhes..."
                            value={formData.notes}
                            onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        />
                    </div>

                    {
                        conflict && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 text-sm rounded-lg flex items-center gap-2">
                                <AlertTriangle size={16} />
                                {conflict}
                            </div>
                        )
                    }
                </div >

                {/* Footer Actions */}
                < div className="sticky bottom-0 p-4 border-t border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm space-y-3 pb-8 md:pb-4 safe-area-bottom" >
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
                    >
                        {loading ? <span className="animate-spin">⏳</span> : <Save size={18} />}
                        {appointmentId ? 'Salvar Alterações' : 'Confirmar Agendamento'}
                    </button>

                    {
                        appointmentId && (
                            <button
                                onClick={handleDelete}
                                disabled={loading}
                                className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
                            >
                                <Trash2 size={18} />
                                Cancelar Agendamento
                            </button>
                        )
                    }
                </div >
            </div >
        );
    };

    if (isMobile) {
        return (
            <Drawer.Root open={isOpen} onOpenChange={(o) => !o && onClose()}>
                <Drawer.Portal>
                    <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50 transition-opacity" />
                    <Drawer.Content className="!bg-white dark:!bg-slate-900 fixed bottom-0 left-0 right-0 h-[92vh] z-50 rounded-t-[10px] flex flex-col outline-none after:hidden">
                        {/* Handle visual indicator */}
                        <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-300 dark:bg-slate-700 my-4" />
                        {renderContent()}
                    </Drawer.Content>
                </Drawer.Portal>
            </Drawer.Root>
        );
    }

    return (
        <Sheet open={isOpen} onOpenChange={(o) => !o && onClose()}>
            <SheetContent side="right" className="w-[400px] sm:w-[540px] p-0 border-l border-slate-200 dark:border-slate-800">
                {renderContent()}
            </SheetContent>
        </Sheet>
    );
};
