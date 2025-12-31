
import React, { useState, useEffect } from 'react';
import { Drawer } from 'vaul';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../ui/sheet';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { PatientSearch } from './PatientSearch';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { X, Clock, Calendar, AlertTriangle, Save, Trash2, FileText, CheckCircle, ArrowLeft, UserPlus, Phone, User } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import SecurityPinModal from '../SecurityPinModal';

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

    // PIN Modal State
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [pendingSave, setPendingSave] = useState<(() => Promise<void>) | null>(null);

    // Delete Confirmation Dialog State
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // Initialize form or load appointment data
    useEffect(() => {
        if (isOpen) {
            loadProfessionals();
            setConflict(null);
            setViewMode('appointment'); // Reset view mode
            setQuickName('');
            setQuickPhone('');
            setIsPinModalOpen(false);
            setPendingSave(null);

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

        // WRAPPER FOR ACTUAL SAVE LOGIC
        const executeSave = async () => {
            setConflict(null);
            setLoading(true);
            try {
                // FIXED: Convert Local Browser Time to UTC ISO String to preserve correct hour
                const localDateObj = parseISO(`${formData.date}T${formData.time}:00`);
                const appointmentDateTime = localDateObj.toISOString();

                // STRICT ENUM MAPPING - DB Requirement
                const validTypes = ['EVALUATION', 'TREATMENT', 'RETURN', 'URGENCY'];
                const typeToSend = validTypes.includes(formData.type) ? formData.type : 'EVALUATION';

                const validStatus = ['PENDING', 'CONFIRMED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
                const statusToSend = validStatus.includes(formData.status) ? formData.status : 'PENDING';

                // 0. PRE-FLIGHT: FINANCIAL TRIGGER (Find Approved Budget)
                let linkedBudgetId = null;
                if (typeToSend === 'TREATMENT' && !appointmentId) {
                    const { data: budgetData } = await supabase
                        .from('budgets')
                        .select('id')
                        .eq('patient_id', formData.patient_id)
                        .eq('status', 'APPROVED')
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    if (budgetData) {
                        linkedBudgetId = budgetData.id;
                    }
                }

                const payload: any = {
                    clinic_id: profile.clinic_id,
                    patient_id: formData.patient_id,
                    doctor_id: formData.doctor_id,
                    date: appointmentDateTime,
                    duration: formData.duration,
                    type: typeToSend,
                    status: statusToSend,
                    notes: formData.notes,
                    budget_id: linkedBudgetId
                };

                let savedAppointmentId = appointmentId;

                if (appointmentId) {
                    const { error: err } = await supabase
                        .from('appointments')
                        .update(payload)
                        .eq('id', appointmentId);
                    if (err) throw err;
                } else {
                    const { data, error: err } = await supabase
                        .from('appointments')
                        .insert([payload])
                        .select()
                        .single();
                    if (err) throw err;
                    savedAppointmentId = data.id;
                }

                // SUCCESS!
                toast.success(appointmentId ? '✅ Agendamento atualizado!' : '✅ Agendado com sucesso!', {
                    duration: 3000,
                    style: {
                        borderRadius: '12px',
                        background: '#10B981',
                        color: '#fff',
                        fontWeight: 'bold'
                    }
                });

                // 🤖 AUTOMATION SUITE
                if (!appointmentId && formData.patient_name) {
                    try {
                        const firstName = formData.patient_name.split(' ')[0];
                        const forms_date = parseISO(appointmentDateTime);
                        const formattedDate = format(forms_date, "dd/MM 'às' HH:mm");

                        await supabase.from('whatsapp_chat_history').insert({
                            clinic_id: profile.clinic_id,
                            patient_id: formData.patient_id,
                            agent_name: 'guardian',
                            direction: 'OUTBOUND',
                            message_type: 'TEXT',
                            message_content: `Olá ${firstName}, seu agendamento com o Dr. Marcelo foi confirmado para ${formattedDate}. Se precisar remarcar, nos avise! 😉`,
                            is_read: true
                        });

                        await supabase.from('appointment_confirmations').upsert({
                            clinic_id: profile.clinic_id,
                            appointment_id: savedAppointmentId,
                            confirmation_status: 'PENDING',
                            created_at: new Date().toISOString()
                        }, { onConflict: 'appointment_id' });

                        toast.success("Confirmação enviada e rastreada!", { icon: '🤖' });
                    } catch (waErr) {
                        console.error("Erro na automação CRM", waErr);
                    }
                }

                // 🛡️ SHIELDED FLOW - FINANCIAL SECURITY LOCK
                if (statusToSend === 'ARRIVED') {
                    // 1. Load Clinic Settings
                    const { data: clinicSettings } = await supabase
                        .from('clinics')
                        .select('block_debtors_scheduling')
                        .eq('id', profile.clinic_id)
                        .single();

                    // 2. Debt Radar - Check Patient Financial Status
                    const { data: patientData } = await supabase
                        .from('patients')
                        .select('bad_debtor, balance_due, name')
                        .eq('id', formData.patient_id)
                        .single();

                    const hasDebt = patientData && (patientData.bad_debtor || (patientData.balance_due || 0) > 0);
                    const shouldBlock = clinicSettings?.block_debtors_scheduling && hasDebt;

                    // 3. BLOCK CHECK-IN IF DEBTOR AND BLOCKING IS ENABLED
                    if (shouldBlock) {
                        toast.error('❌ Paciente possui débitos em atraso. Regularize os pagamentos antes de iniciar o atendimento.', {
                            duration: 8000,
                            style: {
                                borderRadius: '10px',
                                background: '#FEE2E2',
                                color: '#991B1B',
                                border: '2px solid #DC2626',
                                fontWeight: 'bold'
                            }
                        });

                        // CRITICAL: Rollback the status change
                        await supabase
                            .from('appointments')
                            .update({ status: 'CONFIRMED' })
                            .eq('id', savedAppointmentId);

                        setLoading(false);
                        return; // ABORT MISSION
                    }

                    // 4. Warning for debts (if blocking is disabled)
                    if (hasDebt && !clinicSettings?.block_debtors_scheduling) {
                        toast('⚠️ Atenção: Paciente possui débitos pendentes!', {
                            icon: '💰',
                            style: {
                                borderRadius: '10px',
                                background: '#FEF2F2',
                                color: '#B91C1C',
                                border: '1px solid #F87171'
                            },
                            duration: 6000
                        });
                    }

                    // 5. Queue Insertion (Only if not blocked)
                    const { data: existingQueue } = await supabase
                        .from('attendance_queue')
                        .select('id')
                        .eq('appointment_id', savedAppointmentId)
                        .maybeSingle();

                    if (!existingQueue) {
                        await supabase.from('attendance_queue').insert({
                            clinic_id: profile.clinic_id,
                            patient_id: formData.patient_id,
                            professional_id: formData.doctor_id,
                            appointment_id: savedAppointmentId,
                            status: 'WAITING',
                            type: typeToSend,
                            arrival_time: new Date().toISOString()
                        });
                        toast.success('✅ Paciente na Fila de Espera!', { icon: '🛡️' });
                    }
                }

                onSuccess();
                onClose();
            } catch (err: any) {
                console.error('Save Error:', err);
                if (err.message?.includes("invalid input value for enum")) {
                    toast.error("Erro interno: Tipo de agendamento inválido.");
                } else {
                    toast.error(`Erro ao salvar: ${err.message || 'Dados inválidos'}`);
                }
            } finally {
                setLoading(false);
            }
        };

        // INTERCEPT CRITICAL ACTIONS WITH PIN
        if (formData.status === 'COMPLETED') {
            setPendingSave(() => executeSave);
            setIsPinModalOpen(true);
            return;
        }

        // EXECUTE NORMALLY IF NOT CRITICAL
        await executeSave();
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
            <div className="flex flex-col h-full bg-white dark:bg-slate-900 w-full">
                {/* Header - Sticky */}
                <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                    <h2 className="text-xl font-light text-slate-900 dark:text-white tracking-tight">
                        {appointmentId ? 'Editar Agendamento' : 'Novo Agendamento'}
                    </h2>
                    <div className="flex items-center gap-2">
                        {/* Mobile Close Button (Drawer handle does this but explicit button is nice) */}
                        {!isMobile && <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><X size={20} /></button>}
                    </div>
                </div>

                <div className="flex-1 overflow-y-scroll p-6 space-y-6" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                    {/* Patient Section */}
                    <div className="space-y-3">
                        {!formData.patient_id ? (
                            <>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Paciente</label>
                                <PatientSearch
                                    onSelect={(p) => setFormData(prev => ({ ...prev, patient_id: p.id, patient_name: p.name, patient_phone: p.phone }))}
                                    onAddNew={(name) => {
                                        setQuickName(name);
                                        setViewMode('quick-register');
                                    }}
                                    selectedId={formData.patient_id}
                                />
                            </>
                        ) : (
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{formData.patient_name}</h3>
                                    {formData.patient_phone && (
                                        <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                                            <Phone className="w-3.5 h-3.5" /> {formData.patient_phone}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={() => setFormData(prev => ({ ...prev, patient_id: '', patient_name: '', patient_phone: '' }))}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                                    title="Alterar paciente"
                                >
                                    <User className="w-4 h-4 text-slate-400" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* TYPE SELECTOR - MOVED TO TOP WITH GHL COLORS */}
                    {formData.patient_id && (
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Tipo de Atendimento</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setFormData(prev => ({ ...prev, type: 'EVALUATION' }))}
                                    className={`py-4 px-4 rounded-2xl text-sm font-bold transition-all border-2 ${formData.type === 'EVALUATION'
                                        ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-500 shadow-sm'
                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-amber-300'
                                        }`}
                                >
                                    Avaliação
                                </button>
                                <button
                                    onClick={() => setFormData(prev => ({ ...prev, type: 'TREATMENT' }))}
                                    className={`py-4 px-4 rounded-2xl text-sm font-bold transition-all border-2 ${formData.type === 'TREATMENT'
                                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-500 shadow-sm'
                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-300'
                                        }`}
                                >
                                    Procedimento
                                </button>
                                <button
                                    onClick={() => setFormData(prev => ({ ...prev, type: 'RETURN' }))}
                                    className={`py-4 px-4 rounded-2xl text-sm font-bold transition-all border-2 ${formData.type === 'RETURN'
                                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-500 shadow-sm'
                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                                        }`}
                                >
                                    Retorno
                                </button>
                                <button
                                    onClick={() => setFormData(prev => ({ ...prev, type: 'URGENCY' }))}
                                    className={`py-4 px-4 rounded-2xl text-sm font-bold transition-all border-2 ${formData.type === 'URGENCY'
                                        ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-500 shadow-sm'
                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-red-300'
                                        }`}
                                >
                                    Urgência
                                </button>
                            </div>
                        </div>
                    )}

                    {/* GROUPED CARD: Date, Time, Professional, Duration */}
                    {formData.patient_id && (
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5" /> Data
                                    </label>
                                    <input
                                        type="date"
                                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 ring-blue-500 focus:border-transparent"
                                        value={formData.date}
                                        onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5" /> Horário
                                    </label>
                                    <input
                                        type="time"
                                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 ring-blue-500 focus:border-transparent"
                                        value={formData.time}
                                        onChange={e => setFormData(prev => ({ ...prev, time: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                                        <User className="w-3.5 h-3.5" /> Profissional
                                    </label>
                                    <select
                                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 ring-blue-500 focus:border-transparent"
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
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5" /> Duração
                                    </label>
                                    <select
                                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 ring-blue-500 focus:border-transparent"
                                        value={formData.duration}
                                        onChange={e => setFormData(prev => ({ ...prev, duration: Number(e.target.value) }))}
                                    >
                                        {[15, 30, 45, 60, 90, 120].map(m => (
                                            <option key={m} value={m}>{m} min</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* iOS-STYLE SEGMENTED CONTROL FOR STATUS */}
                    {formData.patient_id && (
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Status</label>
                            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                <div className="grid grid-cols-2 gap-1">
                                    <button
                                        onClick={() => setFormData(prev => ({ ...prev, status: 'CONFIRMED' }))}
                                        className={`py-2.5 px-3 rounded-lg text-xs font-semibold transition-all ${formData.status === 'CONFIRMED'
                                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                            : 'text-slate-600 dark:text-slate-400'
                                            }`}
                                    >
                                        Confirmado
                                    </button>
                                    <button
                                        onClick={() => setFormData(prev => ({ ...prev, status: 'ARRIVED' }))}
                                        className={`py-2.5 px-3 rounded-lg text-xs font-semibold transition-all ${formData.status === 'ARRIVED'
                                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                            : 'text-slate-600 dark:text-slate-400'
                                            }`}
                                    >
                                        Chegou
                                    </button>
                                    <button
                                        onClick={() => setFormData(prev => ({ ...prev, status: 'IN_PROGRESS' }))}
                                        className={`py-2.5 px-3 rounded-lg text-xs font-semibold transition-all ${formData.status === 'IN_PROGRESS'
                                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                            : 'text-slate-600 dark:text-slate-400'
                                            }`}
                                    >
                                        Em Atendimento
                                    </button>
                                    <button
                                        onClick={() => setFormData(prev => ({ ...prev, status: 'COMPLETED' }))}
                                        className={`py-2.5 px-3 rounded-lg text-xs font-semibold transition-all ${formData.status === 'COMPLETED'
                                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                            : 'text-slate-600 dark:text-slate-400'
                                            }`}
                                    >
                                        Finalizado
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    {formData.patient_id && (
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Observações</label>
                            <textarea
                                className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm resize-none h-24 focus:ring-2 ring-blue-500 focus:border-transparent"
                                placeholder="Adicione detalhes sobre o agendamento..."
                                value={formData.notes}
                                onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            />
                        </div>
                    )}

                    {
                        conflict && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 text-sm rounded-lg flex items-center gap-2">
                                <AlertTriangle size={16} />
                                {conflict}
                            </div>
                        )
                    }
                </div >

                {/* Footer Actions - Sticky iOS Style */}
                <div className="sticky bottom-0 left-0 right-0 p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex gap-3">
                    {appointmentId && (
                        <button
                            onClick={() => setIsDeleteDialogOpen(true)}
                            disabled={loading}
                            className="flex-[2] py-3 px-4 border-2 border-red-500 text-red-600 dark:text-red-400 rounded-xl font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-all disabled:opacity-50"
                        >
                            Cancelar Agendamento
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className={`py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 ${appointmentId ? 'flex-[3]' : 'flex-1'
                            }`}
                    >
                        {loading ? '⏳ Salvando...' : (appointmentId ? 'Salvar Alterações' : 'Confirmar Agendamento')}
                    </button>
                </div>

                {/* Delete Confirmation Dialog */}
                {isDeleteDialogOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setIsDeleteDialogOpen(false)}>
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                                    <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                                        Cancelar este agendamento?
                                    </h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        Esta ação não pode ser desfeita e o horário ficará livre na agenda.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setIsDeleteDialogOpen(false)}
                                    className="flex-1 py-2.5 px-4 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                                >
                                    Manter Agendamento
                                </button>
                                <button
                                    onClick={() => {
                                        setIsDeleteDialogOpen(false);
                                        handleDelete();
                                    }}
                                    className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all"
                                >
                                    Confirmar Cancelamento
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div >
        );
    };

    if (isMobile) {
        return (
            <Drawer.Root open={isOpen} onOpenChange={(o) => (!o && !isPinModalOpen) && onClose()}>
                <Drawer.Portal>
                    <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50 transition-opacity" />
                    <Drawer.Content className="!bg-white dark:!bg-slate-900 fixed bottom-0 left-0 right-0 h-[92vh] z-50 rounded-t-[10px] flex flex-col outline-none after:hidden">
                        <Drawer.Title className="sr-only">
                            {appointmentId ? 'Editar Agendamento' : 'Novo Agendamento'}
                        </Drawer.Title>
                        <Drawer.Description className="sr-only">
                            {appointmentId ? 'Formulário para editar os detalhes do agendamento' : 'Formulário para criar um novo agendamento'}
                        </Drawer.Description>
                        {/* Handle visual indicator */}
                        <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-300 dark:bg-slate-700 my-4" />
                        {renderContent()}
                        <SecurityPinModal
                            isOpen={isPinModalOpen}
                            onClose={() => setIsPinModalOpen(false)}
                            onSuccess={async () => {
                                if (pendingSave) await pendingSave();
                            }}
                            title="Confirmar Finalização"
                            description="Digite seu PIN para finalizar este atendimento."
                        />
                    </Drawer.Content>
                </Drawer.Portal>
            </Drawer.Root>
        );
    }

    return (
        <Sheet open={isOpen} onOpenChange={(o) => (!o && !isPinModalOpen) && onClose()}>
            <SheetContent side="right" className="w-[400px] sm:w-[540px] p-0 border-l border-slate-200 dark:border-slate-800 overflow-y-auto">
                <SheetTitle className="sr-only">
                    {appointmentId ? 'Editar Agendamento' : 'Novo Agendamento'}
                </SheetTitle>
                <SheetDescription className="sr-only">
                    {appointmentId ? 'Formulário para editar os detalhes do agendamento' : 'Formulário para criar um novo agendamento'}
                </SheetDescription>
                {renderContent()}
                <SecurityPinModal
                    isOpen={isPinModalOpen}
                    onClose={() => setIsPinModalOpen(false)}
                    onSuccess={async () => {
                        if (pendingSave) await pendingSave();
                    }}
                    title="Confirmar Finalização"
                    description="Digite seu PIN para finalizar este atendimento."
                />
            </SheetContent>
        </Sheet>
    );
};
