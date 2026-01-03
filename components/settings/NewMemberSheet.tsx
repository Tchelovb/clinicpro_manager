import React, { useState, useEffect } from 'react';
import {
    X, Save, User, Mail, Lock, Stethoscope, Award,
    Calendar, DollarSign, ShieldCheck,
    Percent, KeyRound, Clock, Users, Briefcase, BadgeCheck, Building2, AlertTriangle, Check
} from 'lucide-react';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface NewMemberSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any;
}

// 1. CARGOS INDEPENDENTES (UI -> DB Logic)
const CARGOS = [
    { id: 'ADMIN', label: 'Administrador (Dono)', icon: ShieldCheck, dbRole: 'ADMIN' },
    { id: 'GERENTE', label: 'Gerente Operacional', icon: Building2, dbRole: 'ADMIN' }, // Gerentes têm acesso admin
    { id: 'PROFISSIONAL', label: 'Profissional de Saúde', icon: Stethoscope, dbRole: 'PROFESSIONAL' },
    { id: 'COMERCIAL', label: 'Consultor Comercial', icon: Briefcase, dbRole: 'RECEPTIONIST' }, // Usa interface leve
    { id: 'RECEPCIONISTA', label: 'Recepcionista', icon: Users, dbRole: 'RECEPTIONIST' }
];

// 2. COMPETÊNCIAS (Capabilities)
const COMPETENCIAS = [
    { id: 'dono', label: 'DONO *.*', sub: 'Acesso total e visão estratégica.' },
    { id: 'agendamentos', label: 'AGENDAMENTOS', sub: 'Gestão de horários e confirmações.' },
    { id: 'cobranca', label: 'COBRANÇA', sub: 'Recuperação de inadimplência.' },
    { id: 'vendedor', label: 'VENDEDOR', sub: 'Fechamento de contratos e metas.' },
    { id: 'crc', label: 'CRC (CAPTAÇÃO)', sub: 'Gestão de leads e novos pacientes.' },
    { id: 'producao', label: 'PRODUÇÃO', sub: 'Execução clínica e assinatura.' },
    { id: 'avaliacao', label: 'AVALIAÇÃO', sub: 'Diagnóstico e orçamentos técnicos.' }
];

const NewMemberSheet = ({ isOpen, onClose, onSuccess, initialData }: NewMemberSheetProps) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');

    // --- Estados do Formulário ---
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [gender, setGender] = useState<'M' | 'F' | ''>('');
    const [cpf, setCpf] = useState('');

    // Cargo e Funções
    const [accessRole, setAccessRole] = useState('RECEPCIONISTA');
    const [capabilities, setCapabilities] = useState<string[]>([]);

    // Profissional
    const [cro, setCro] = useState('');
    const [specialty, setSpecialty] = useState('');

    // Financeiro
    const [clinicalSplit, setClinicalSplit] = useState('0');
    const [salesCommission, setSalesCommission] = useState('0');
    const [collectionCommission, setCollectionCommission] = useState('0');

    // Agenda
    const [agendaColor, setAgendaColor] = useState('#3b82f6');
    const [isGoogleConnected, setIsGoogleConnected] = useState(false);

    // AGENDA STATE
    const [schedule, setSchedule] = useState([
        { day: 1, label: 'Segunda', start: '08:00', end: '18:00', active: true },
        { day: 2, label: 'Terça', start: '08:00', end: '18:00', active: true },
        { day: 3, label: 'Quarta', start: '08:00', end: '18:00', active: true },
        { day: 4, label: 'Quinta', start: '08:00', end: '18:00', active: true },
        { day: 5, label: 'Sexta', start: '08:00', end: '18:00', active: true },
        { day: 6, label: 'Sábado', start: '08:00', end: '12:00', active: false },
        { day: 0, label: 'Domingo', start: '08:00', end: '12:00', active: false },
    ]);

    // LOAD SCHEDULE
    useEffect(() => {
        if (isOpen && initialData) {
            const loadSchedule = async () => {
                const { data } = await supabase
                    .from('professional_schedules')
                    .select('*')
                    .eq('professional_id', initialData.id)
                    .is('date_specific', null);

                if (data && data.length > 0) {
                    setSchedule(prev => prev.map(dayItem => {
                        const saved = data.find((d: any) => d.day_of_week === dayItem.day);
                        if (saved) {
                            return {
                                ...dayItem,
                                active: saved.is_working_day,
                                start: saved.start_time?.slice(0, 5) || '08:00',
                                end: saved.end_time?.slice(0, 5) || '18:00'
                            };
                        }
                        return dayItem; // Mantém default se não achar no banco
                    }));
                }
            };
            loadSchedule();
        }
    }, [isOpen, initialData]);

    // Segurança
    const [pin, setPin] = useState('');
    // REMOVIDO: attendancePin (agora unificado em 'pin')

    // --- Inicialização ---
    useEffect(() => {
        if (isOpen && initialData) {
            setName(initialData.name || '');
            setEmail(initialData.email || '');
            setGender(initialData.gender || '');
            setCpf(initialData.cpf || '');
            setCro(initialData.cro || '');
            setSpecialty(initialData.specialty || '');

            // Configurar Role da UI
            // Se for MASTER/ADMIN, selecionamos o cargo correspondente se existir, ou deixamos genérico
            // Mas o importante aqui é o select 'accessRole' refletir algo da UI
            const cargoEncontrado = CARGOS.find(c => c.dbRole === initialData.role);
            if (cargoEncontrado) {
                setAccessRole(cargoEncontrado.id);
            } else if (['ADMIN', 'MASTER'].includes(initialData.role)) {
                // Se for admin, pode não ter um cargo visual "Dono" na lista de cargos,
                // mas as competências vão resolver.
                setAccessRole('GERENTE'); // Default para admin se não achar
            } else {
                setAccessRole('RECEPCIONISTA');
            }

            // Mapear Competências do Banco para UI
            const isAdmin = ['ADMIN', 'MASTER'].includes(initialData.role);
            let caps: string[] = [];

            if (isAdmin) {
                // 👑 SE FOR ADMIN, MARCA TUDO AUTOMATICAMENTE
                caps = ['dono', 'producao', 'avaliacao', 'vendedor', 'crc', 'agendamentos', 'cobranca'];
            } else {
                // Carregamento Normal
                if (initialData.is_clinical_provider) caps.push('producao');
                if (initialData.is_orcamentista) caps.push('avaliacao');
                if (initialData.is_sales_rep) caps.push('vendedor');
                if (initialData.is_crc_agent) caps.push('crc');
                if (initialData.can_schedule) caps.push('agendamentos');
                if (Number(initialData.collection_percent) > 0) caps.push('cobranca');
            }

            setCapabilities(caps);

            // PIN não é carregado por segurança
            setPin('');

            // Financeiro
            setClinicalSplit(String(initialData.commission_percent || 0));
            setSalesCommission(String(initialData.sales_commission_percent || 0));
            setCollectionCommission(String(initialData.collection_percent || 0));

        } else if (isOpen && !initialData) {
            // ... MODO CRIAR (Reset) ...
            setName('');
            setEmail('');
            setPassword('');
            setGender('');
            setCpf('');
            setAccessRole('RECEPCIONISTA');
            setCapabilities([]);
            setCro('');
            setSpecialty('');
            setClinicalSplit('0');
            setSalesCommission('0');
            setCollectionCommission('0');
            setPin('');
            setAgendaColor('#3b82f6');
        }
    }, [isOpen, initialData]);

    // --- Trava de Segurança (Sugestão Automática) ---
    useEffect(() => {
        if (!isOpen) return;

        // 🚫 NO MODO EDIÇÃO, NÃO FAZEMOS SUGESTÕES MÁGICAS
        if (initialData) return;

        // Se nenhuma competência foi selecionada (primeira vez), sugerimos baseado no cargo
        if (capabilities.length === 0 && accessRole) {
            if (accessRole === 'RECEPCIONISTA') {
                setCapabilities(prev => prev.includes('agendamentos') ? prev : [...prev, 'agendamentos']);
            }
            if (accessRole === 'COMERCIAL') {
                setCapabilities(prev => prev.includes('vendedor') ? prev : [...prev, 'vendedor', 'crc']);
            }
            if (accessRole === 'PROFISSIONAL') { // 'PROFISSIONAL' deve bater com o ID do cargo
                // Corrigindo para bater com o ID 'PROFISSIONAL'
                setCapabilities(prev => prev.includes('producao') ? prev : [...prev, 'producao']);
            }
        }
    }, [accessRole, isOpen, initialData]); // Adicionado initialData nas dependências, initialData]);

    // Check Google Auth Status
    useEffect(() => {
        if (activeTab === 'agenda' && initialData?.id) {
            const check = async () => {
                const { data } = await supabase.from('user_integrations').select('id').eq('user_id', initialData.id).eq('provider', 'google_calendar').maybeSingle();
                setIsGoogleConnected(!!data);
            };
            check();
        }
    }, [activeTab, initialData]);

    const toggleCap = (id: string) => {
        // Lógica especial para DONO: Marca tudo
        if (id === 'dono') {
            const isAdding = !capabilities.includes('dono');
            if (isAdding) {
                setCapabilities(['dono', 'producao', 'avaliacao', 'vendedor', 'crc', 'agendamentos', 'cobranca']);
            } else {
                setCapabilities(prev => prev.filter(c => c !== 'dono'));
            }
            return;
        }

        setCapabilities(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
    };

    // --- Submit ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !email || !gender) {
            toast.error("Preencha campos obrigatórios: Nome, Email, Sexo.");
            return;
        }

        setLoading(true);

        try {
            // Validar clinic_id
            const clinic_id = user?.clinic_id;
            if (!clinic_id) {
                throw new Error('Clinic ID não encontrado. Faça login novamente.');
            }

            // Configurar nome com prefixo
            let finalName = name;
            const isDoctor = capabilities.includes('producao') || accessRole === 'PROFESSIONAL';
            if (isDoctor) {
                if (gender === 'M' && !name.toLowerCase().includes('dr')) finalName = `Dr. ${name}`;
                if (gender === 'F' && !name.toLowerCase().includes('dra')) finalName = `Dra. ${name}`;
            }

            // Mapear UI Role -> DB Role
            const selectedCargo = CARGOS.find(c => c.id === accessRole);
            const dbRole = selectedCargo?.dbRole || 'RECEPTIONIST';

            // Corrigir Role se for DONO
            let finalRole = dbRole;
            if (capabilities.includes('dono')) {
                finalRole = 'ADMIN';
            }

            const payload = {
                name: finalName,
                gender,
                cpf,
                role: finalRole,
                is_clinical_provider: capabilities.includes('producao'),
                is_orcamentista: capabilities.includes('avaliacao'),
                is_sales_rep: capabilities.includes('vendedor'),
                is_crc_agent: capabilities.includes('crc'),  // ✅ NOVA COLUNA
                can_schedule: capabilities.includes('agendamentos'),  // ✅ NOVA COLUNA
                commission_percent: Number(clinicalSplit) || 30,
                sales_commission_percent: Number(salesCommission) || 0,
                collection_percent: Number(collectionCommission) || 0,
                cro: capabilities.includes('producao') ? cro : null,
                specialty: capabilities.includes('producao') ? specialty : null,
                agenda_color: capabilities.includes('producao') ? agendaColor : '#3B82F6',
                council: 'CRO',
                active: true,
                clinic_id: clinic_id,  // ✅ SEMPRE enviar
                updated_at: new Date().toISOString(),
                ...(pin && { transaction_pin_hash: pin })
            };

            console.log('📦 [SUBMIT] Payload:', payload);

            if (initialData) {
                // ✅ UPDATE MODE
                const { error: userError, data: updatedUser } = await supabase
                    .from('users')
                    .update(payload)
                    .eq('id', initialData.id)
                    .select()
                    .single();

                if (userError) {
                    console.error('❌ [SUBMIT] Erro ao atualizar users:', userError);
                    throw userError;
                }

                console.log('✅ [SUBMIT] Users atualizado com sucesso.');

                // ✅ Atualizar senha se foi fornecida
                // ✅ Atualizar senha se foi fornecida (Via Edge Function Segura)
                if (password && password.length >= 6) {
                    console.log('🔐 [SUBMIT] Atualizando senha via Edge Function...');

                    const { error: passwordError } = await supabase.functions.invoke('update-user-password', {
                        body: {
                            user_id: initialData.id,
                            password: password
                        }
                    });

                    if (passwordError) {
                        console.error('⚠️ [SUBMIT] Erro ao atualizar senha:', passwordError);
                        toast.error('Dados salvos, mas erro ao atualizar senha: ' + (passwordError.message || 'Erro desconhecido'));
                    } else {
                        console.log('✅ [SUBMIT] Senha atualizada com sucesso');
                        toast.success('Senha atualizada!');
                    }
                }

                // ✅ Sync Professionals table if clinical
                if (payload.is_clinical_provider) {
                    const profPayload = {
                        id: initialData.id,  // ✅ MESMO ID
                        clinic_id: clinic_id,
                        name: finalName,
                        specialty: specialty || null,
                        crc: cro || null,
                        council: 'CRO',
                        color: agendaColor || '#3B82F6',
                        photo_url: null,
                        is_active: true,
                        active: true,
                        payment_release_rule: 'FULL_ON_COMPLETION'
                    };

                    console.log('📦 [SUBMIT] Payload Professionals:', profPayload);

                    const { error: profError, data: updatedProf } = await supabase
                        .from('professionals')
                        .upsert(profPayload, { onConflict: 'id' })
                        .select()
                        .single();

                    if (profError) {
                        console.error('⚠️ [SUBMIT] Erro ao atualizar professionals:', profError);
                    } else {
                        console.log('✅ [SUBMIT] Professionals atualizado:', updatedProf);
                    }
                }

                // 3. SYNC AGENDA (SCHEDULE)
                if (isDoctor) {
                    console.log('📅 [SUBMIT] Sincronizando agenda...');

                    await supabase.from('professional_schedules')
                        .delete()
                        .eq('professional_id', initialData.id)
                        .is('date_specific', null);

                    const schedPayload = schedule.map(s => ({
                        professional_id: initialData.id,
                        clinic_id: clinic_id,
                        day_of_week: s.day,
                        start_time: s.start,
                        end_time: s.end,
                        is_working_day: s.active
                    }));

                    const { error: schedError } = await supabase
                        .from('professional_schedules')
                        .insert(schedPayload);

                    if (schedError) {
                        console.error('⚠️ [SUBMIT] Erro ao salvar agenda:', schedError);
                    } else {
                        console.log('✅ [SUBMIT] Agenda sincronizada');
                    }
                }

                console.log('🎉 [SUBMIT] Atualização concluída com sucesso!');
                toast.success("Dados atualizados!");

            } else {
                // ✅ CREATE MODE
                console.log('🆕 [SUBMIT] Modo CREATE');

                const createPayload = {
                    ...payload,
                    email,
                    password,
                    clinic_id: clinic_id
                };

                console.log('📦 [SUBMIT] Payload Create:', createPayload);

                const { error } = await supabase.functions.invoke('create-user', { body: createPayload });

                if (error) {
                    console.error('❌ [SUBMIT] Erro ao criar usuário:', error);
                    if (error.message?.includes('registered')) throw new Error('E-mail já está em uso.');
                    throw error;
                }

                console.log('✅ [SUBMIT] Usuário criado com sucesso!');
                toast.success("Usuário criado com sucesso!");
            }

            onSuccess();
            onClose();

        } catch (error: any) {
            console.error('❌ [SUBMIT] Erro fatal:', error);
            toast.error(error.message || "Erro ao salvar.");
        } finally {
            setLoading(false);
        }
    };

    // 1. Defina quais abas devem aparecer com base nas competências marcadas
    const getVisibleTabs = () => {
        const tabs = [
            { id: 'profile', label: 'Dados Pessoais' },
            { id: 'roles', label: 'Cargos e Funções' }
        ];

        // Só mostra Financeiro se for Vendedor, Cobrança ou Produção
        if (capabilities.includes('vendedor') || capabilities.includes('cobranca') || capabilities.includes('producao')) {
            tabs.push({ id: 'financial', label: 'Comissões' });
        }

        // SÓ MOSTRA AGENDA SE TIVER A COMPETÊNCIA PRODUÇÃO MARCADA
        if (capabilities.includes('producao')) {
            tabs.push({ id: 'agenda', label: 'Agenda' });
        }

        tabs.push({ id: 'security', label: 'Segurança' });
        return tabs;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

                {/* HEADER */}
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{initialData ? 'Editar Colaborador' : 'Novo Colaborador'}</h2>
                        <p className="text-xs text-gray-500">Gestão hierárquica e permissões.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full"><X size={20} /></button>
                </div>

                {/* TABS */}
                <div className="flex border-b px-6 bg-white overflow-x-auto scrollbar-hide">
                    {getVisibleTabs().map(t => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id)}
                            className={`px-4 py-3 text-sm font-medium relative whitespace-nowrap ${activeTab === t.id ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {t.label}
                            {activeTab === t.id && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-full" />}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl mx-auto">

                        {/* 1. PERFIL */}
                        {activeTab === 'profile' && (
                            <div className="animate-in fade-in space-y-4">
                                <div className="bg-white p-5 rounded-xl border shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">Nome Completo *</label>
                                        <input value={name} onChange={e => setName(e.target.value)} className="w-full p-2.5 bg-gray-50 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" required />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">CPF</label>
                                        <input value={cpf} onChange={e => setCpf(e.target.value)} placeholder="000.000.000-00" className="w-full p-2.5 bg-gray-50 border rounded-lg outline-none" required={capabilities.includes('producao')} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">Sexo *</label>
                                        <div className="flex gap-2">
                                            <button type="button" onClick={() => setGender('M')} className={`flex-1 p-2 rounded-lg border text-sm font-medium ${gender === 'M' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600'}`}>Masc</button>
                                            <button type="button" onClick={() => setGender('F')} className={`flex-1 p-2 rounded-lg border text-sm font-medium ${gender === 'F' ? 'bg-pink-600 text-white border-pink-600' : 'bg-white text-gray-600'}`}>Fem</button>
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-xs font-bold text-gray-600 uppercase mb-1 block">Email (Login) *</label>
                                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} disabled={!!initialData} className="w-full p-2.5 bg-gray-50 border rounded-lg outline-none disabled:opacity-60" required />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 2. CARGOS & FUNÇÕES */}
                        {/* 3. AGENDA (NOVO) */}
                        {/* 3. AGENDA (PREMIUM) */}
                        {activeTab === 'agenda' && (
                            <div className="animate-in fade-in space-y-6">
                                {/* INTEGRAÇÃO GOOGLE */}
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-2xl border border-blue-100 flex items-center justify-between shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-white p-2.5 rounded-xl shadow-sm">
                                            <Calendar size={24} className="text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-blue-900">Google Calendar</p>
                                            <p className="text-xs text-blue-700">Sincronize seus atendimentos com sua agenda pessoal.</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        disabled={!initialData?.id || isGoogleConnected}
                                        onClick={() => {
                                            if (!initialData?.id) return toast.error('Salve o usuário antes de vincular.');
                                            window.location.href = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-auth?user_id=${initialData.id}`;
                                        }}
                                        className={`px-5 py-2 border rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-2 ${isGoogleConnected
                                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 opacity-100 cursor-not-allowed'
                                            : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'}`}
                                    >
                                        {isGoogleConnected ? (
                                            <><Check size={18} className="stroke-2" /> Agenda Google Vinculada</>
                                        ) : (
                                            'Vincular Agora'
                                        )}
                                    </button>
                                </div>

                                {/* GRADE DE HORÁRIOS */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between px-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Horários de Atendimento na Clínica</label>
                                        <div className="flex items-center gap-1 text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full">
                                            <Clock size={10} /> PADRÃO CLÍNICA
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        {schedule.map((dayItem, idx) => (
                                            <div key={dayItem.day} className={`group flex items-center gap-3 p-3 border rounded-xl transition-all ${dayItem.active ? 'bg-white border-blue-200 shadow-sm' : 'bg-gray-50 border-gray-100 opacity-70'}`}>
                                                <div className="flex items-center gap-3 flex-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={dayItem.active}
                                                        onChange={(e) => {
                                                            const newSched = [...schedule];
                                                            newSched[idx].active = e.target.checked;
                                                            setSchedule(newSched);
                                                        }}
                                                        className="w-5 h-5 text-blue-600 rounded-md border-gray-300 focus:ring-blue-500 cursor-pointer"
                                                    />
                                                    <span className={`text-sm font-bold w-20 ${dayItem.active ? 'text-gray-700' : 'text-gray-400'}`}>{dayItem.label}</span>
                                                </div>

                                                <div className={`flex items-center gap-2 transition-opacity ${dayItem.active ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                                                    <div className="relative">
                                                        <input
                                                            type="time"
                                                            value={dayItem.start}
                                                            onChange={(e) => {
                                                                const newSched = [...schedule];
                                                                newSched[idx].start = e.target.value;
                                                                setSchedule(newSched);
                                                            }}
                                                            className="text-xs font-bold p-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                        />
                                                    </div>
                                                    <span className="text-gray-400 text-xs font-medium">até</span>
                                                    <div className="relative">
                                                        <input
                                                            type="time"
                                                            value={dayItem.end}
                                                            onChange={(e) => {
                                                                const newSched = [...schedule];
                                                                newSched[idx].end = e.target.value;
                                                                setSchedule(newSched);
                                                            }}
                                                            className="text-xs font-bold p-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* COR DA AGENDA (Mantida) */}
                                <div className="bg-white p-6 rounded-xl border shadow-sm">
                                    <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">Identificação Visual</h4>
                                    <p className="text-sm text-gray-500 mb-6">Cor que aparecerá nos agendamentos.</p>

                                    <div className="flex gap-4 flex-wrap">
                                        {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6', '#0f172a'].map(color => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setAgendaColor(color)}
                                                className={`w-12 h-12 rounded-full border-2 transition-all flex items-center justify-center ${agendaColor === color ? 'border-gray-900 scale-110 shadow-lg ring-2 ring-offset-2 ring-gray-200' : 'border-transparent hover:scale-105 hover:shadow'}`}
                                                style={{ backgroundColor: color }}
                                            >
                                                {agendaColor === color && <Check className="text-white drop-shadow-md" size={20} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'roles' && (
                            <div className="animate-in fade-in space-y-8">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase mb-3 block tracking-wider">1. Cargo Ocupacional (Nível de Acesso)</label>
                                    <div className="flex flex-col gap-2">
                                        {CARGOS.map(cargo => (
                                            <button key={cargo.id} type="button" onClick={() => setAccessRole(cargo.id)}
                                                className={`flex items-center gap-4 p-3 border rounded-xl transition-all text-left group ${accessRole === cargo.id ? 'bg-blue-50 border-blue-500 shadow-sm ring-1 ring-blue-500' : 'bg-white hover:bg-gray-50 border-gray-200'}`}
                                            >
                                                <div className={`p-2 rounded-lg transition-colors ${accessRole === cargo.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400 group-hover:text-gray-600'}`}>
                                                    <cargo.icon size={20} />
                                                </div>
                                                <span className={`font-bold text-sm ${accessRole === cargo.id ? 'text-blue-900' : 'text-gray-700'}`}>{cargo.label}</span>
                                                {accessRole === cargo.id && <BadgeCheck className="ml-auto text-blue-600" size={18} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase mb-3 block tracking-wider">2. Competências (O que faz no dia a dia?)</label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {COMPETENCIAS.map(comp => {
                                            const isRestricted = (comp.id === 'producao' || comp.id === 'avaliacao') && (accessRole === 'COMERCIAL' || accessRole === 'RECEPCIONISTA');
                                            const isSelected = capabilities.includes(comp.id);
                                            return (
                                                <label key={comp.id} className={`flex items-start gap-3 p-3 border rounded-xl transition-all ${isRestricted ? 'opacity-40 bg-gray-50 cursor-not-allowed' : isSelected ? 'bg-white border-blue-400 shadow-sm' : 'bg-white hover:bg-gray-50 cursor-pointer'}`}>
                                                    <div className="pt-0.5">
                                                        <input type="checkbox" disabled={isRestricted} checked={isSelected} onChange={() => toggleCap(comp.id)} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                                                    </div>
                                                    <div>
                                                        <p className={`text-sm font-bold ${isRestricted ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{comp.label}</p>
                                                        <p className="text-[10px] text-gray-500 leading-tight">{comp.sub}</p>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>

                                {capabilities.includes('producao') && (
                                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 animate-in slide-in-from-top-2">
                                        <label className="text-xs font-bold text-blue-800 uppercase mb-2 block flex items-center gap-2"><Stethoscope size={14} /> Dados do Profissional</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <input value={cro} onChange={e => setCro(e.target.value)} placeholder="Nº CRO" className="p-2 text-sm border rounded bg-white" />
                                            <input value={specialty} onChange={e => setSpecialty(e.target.value)} placeholder="Especialidade" className="p-2 text-sm border rounded bg-white" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 3. FINANCEIRO */}
                        {activeTab === 'financial' && (
                            <div className="animate-in fade-in space-y-4">
                                <div className="bg-white p-4 rounded-xl border flex justify-between items-center">
                                    <div><h4 className="font-bold text-gray-700">Comissão Clínica</h4><p className="text-xs text-gray-500">Sobre procedimentos (Produção).</p></div>
                                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border"><input type="number" disabled={!capabilities.includes('producao')} value={clinicalSplit} onChange={e => setClinicalSplit(e.target.value)} className="w-16 bg-transparent text-right font-bold outline-none" /><Percent size={14} className="text-gray-400" /></div>
                                </div>
                                <div className="bg-white p-4 rounded-xl border flex justify-between items-center">
                                    <div><h4 className="font-bold text-gray-700">Comissão de Vendas</h4><p className="text-xs text-gray-500">Sobre novos contratos (Vendedor).</p></div>
                                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border"><input type="number" value={salesCommission} onChange={e => setSalesCommission(e.target.value)} className="w-16 bg-transparent text-right font-bold outline-none" /><Percent size={14} className="text-gray-400" /></div>
                                </div>
                                <div className="bg-white p-4 rounded-xl border flex justify-between items-center">
                                    <div><h4 className="font-bold text-gray-700">Comissão de Cobrança</h4><p className="text-xs text-gray-500">Sobre recuperação de dívidas.</p></div>
                                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border"><input type="number" value={collectionCommission} onChange={e => setCollectionCommission(e.target.value)} className="w-16 bg-transparent text-right font-bold outline-none" /><Percent size={14} className="text-gray-400" /></div>
                                </div>
                            </div>
                        )}

                        {/* 4. SEGURANÇA (PIN ÚNICO) */}
                        {activeTab === 'security' && (
                            <div className="space-y-6 animate-in fade-in">
                                {!initialData && (
                                    <div className="bg-white p-4 rounded-xl border border-red-100">
                                        <label className="text-xs font-bold text-red-500 uppercase mb-2 block">Definir Senha de Login *</label>
                                        <div className="relative"><Lock className="absolute left-3 top-2.5 text-gray-400" size={16} /><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-10 p-2 border rounded-lg outline-none focus:border-red-500" placeholder="Mínimo 6 caracteres" /></div>
                                    </div>
                                )}

                                {initialData && (
                                    <div className="bg-white p-4 rounded-xl border border-amber-100">
                                        <label className="text-xs font-bold text-amber-600 uppercase mb-2 block flex items-center gap-2">
                                            <Lock size={14} /> Redefinir Senha de Acesso ao Sistema
                                        </label>
                                        <p className="text-xs text-gray-500 mb-3">Deixe em branco para manter a senha atual.</p>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={e => setPassword(e.target.value)}
                                                className="w-full pl-10 p-2 border rounded-lg outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                                                placeholder="Nova senha (mínimo 6 caracteres)"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-sm flex flex-col items-center">
                                    <div className="flex items-center gap-2 mb-4">
                                        <KeyRound size={20} className="text-blue-600" />
                                        <p className="text-sm font-bold text-gray-800">PIN ÚNICO DE SEGURANÇA</p>
                                    </div>

                                    <input
                                        type="password"
                                        maxLength={4}
                                        value={pin}
                                        onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                                        className="w-48 text-center text-3xl tracking-[1rem] font-bold p-4 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                                        placeholder="••••"
                                    />

                                    <p className="text-xs text-gray-500 mt-4 text-center max-w-[280px]">
                                        Este código de 4 dígitos será usado para <b>autorizar descontos</b> e <b>assinar prontuários eletrônicos</b>.
                                    </p>
                                </div>

                            </div>
                        )}

                    </form>
                </div>

                {/* FOOTER */}
                <div className="p-4 border-t bg-white flex justify-end gap-3 z-10">
                    <button onClick={onClose} className="px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                    <button onClick={handleSubmit} disabled={loading} className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md flex items-center gap-2 disabled:opacity-50">
                        {loading ? 'Processando...' : <><Save size={16} /> Salvar Colaborador</>}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default NewMemberSheet;
