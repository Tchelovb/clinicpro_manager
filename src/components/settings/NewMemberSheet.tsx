import React, { useState, useEffect, useRef } from 'react';
import { X, Save, User, Mail, Lock, Stethoscope, Award, Camera, UploadCloud } from 'lucide-react';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface NewMemberSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any; // Recebe dados para edição
}

const NewMemberSheet = ({ isOpen: open, onClose: onOpenChange, onSuccess, initialData }: NewMemberSheetProps) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Estados do Formulário
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [photoUrl, setPhotoUrl] = useState('');

    // Dados Clínicos
    const [cro, setCro] = useState('');
    const [specialty, setSpecialty] = useState('');
    const [agendaColor, setAgendaColor] = useState('#3B82F6');
    const [commission, setCommission] = useState('0');

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Efeito: Carrega dados se for EDIÇÃO
    useEffect(() => {
        if (open && initialData) {
            setName(initialData.name || '');
            setEmail(initialData.email || '');
            setPassword('');
            setPhotoUrl(initialData.photo_url || '');

            const roles = [];
            if (initialData.role) roles.push(initialData.role.toLowerCase());
            setSelectedRoles(roles);

            setCro(initialData.cro || '');
            setSpecialty(initialData.specialty || '');
            setAgendaColor(initialData.agenda_color || '#3B82F6');
            setCommission(String(initialData.commission_percent || '0'));
        } else if (open && !initialData) {
            // Limpa se for NOVO
            setName(''); setEmail(''); setPassword(''); setSelectedRoles([]); setPhotoUrl('');
            setCro(''); setSpecialty(''); setCommission('0');
        }
    }, [open, initialData]);

    if (!open) return null;

    // 🛡️ UPLOAD SEGURO (MÁXIMO 2MB)
    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('Selecione uma imagem.');
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Regra de Ouro: Tamanho Máximo
            if (file.size > 2 * 1024 * 1024) {
                throw new Error('A imagem é muito grande! Use arquivos menores que 2MB.');
            }

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
            setPhotoUrl(data.publicUrl);
            toast.success('Foto carregada!');

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setUploading(false);
        }
    };

    const toggleRole = (role: string) => setSelectedRoles([role]);
    const isClinical = selectedRoles.includes('dentist') || selectedRoles.includes('doctor');
    const isEditing = !!initialData;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.clinic_id) return;

        setLoading(true);
        try {
            const primaryRole = selectedRoles[0] || 'secretary';

            const payload = {
                name,
                role: primaryRole.toUpperCase(),
                photo_url: photoUrl, // URL leve
                cro: isClinical ? cro : null,
                specialty: isClinical ? specialty : null,
                agenda_color: isClinical ? agendaColor : null,
                commission_percent: isClinical ? Number(commission) : 0
            };

            if (isEditing) {
                // Atualiza direto no banco
                const { error } = await supabase
                    .from('users')
                    .update(payload)
                    .eq('id', initialData.id);
                if (error) throw error;
                toast.success('Perfil atualizado!');
            } else {
                // Cria via Edge Function (Auth)
                const { error } = await supabase.functions.invoke('create-user', {
                    body: {
                        ...payload,
                        email,
                        password,
                        clinic_id: user.clinic_id,
                    }
                });
                if (error) throw error;
                toast.success('Colaborador criado!');
            }

            onSuccess();
            onOpenChange();

        } catch (error: any) {
            console.error('Erro:', error);
            toast.error(error.message || 'Erro ao salvar.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onOpenChange} />

            <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            {isEditing ? 'Editar Colaborador' : 'Novo Colaborador'}
                        </h2>
                        <p className="text-sm text-gray-500">Dados cadastrais e profissionais.</p>
                    </div>
                    <button onClick={onOpenChange} className="p-2 hover:bg-gray-200 rounded-full">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* FOTO DE PERFIL */}
                    <div className="flex flex-col items-center justify-center mb-6">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <div className="w-24 h-24 rounded-full bg-gray-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
                                {uploading ? (
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                ) : photoUrl ? (
                                    <img src={photoUrl} alt="Perfil" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-10 h-10 text-gray-300" />
                                )}
                            </div>
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="text-white w-8 h-8" />
                            </div>
                            <div className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full shadow-md border-2 border-white">
                                <UploadCloud size={14} />
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Clique para alterar (Max 2MB)</p>
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/jpeg, image/png, image/webp" className="hidden" />
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                            <input required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} disabled={isEditing} className={`w-full px-4 py-2 border border-gray-300 rounded-lg outline-none ${isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`} />
                        </div>

                        {!isEditing && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                                <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500" />
                            </div>
                        )}
                    </div>

                    <hr className="border-gray-100" />

                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <Award size={12} /> Função
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            {['admin', 'dentist', 'secretary', 'financial'].map(role => (
                                <button
                                    key={role}
                                    type="button"
                                    onClick={() => toggleRole(role)}
                                    className={`p-3 rounded-xl border text-left capitalize ${selectedRoles.includes(role) ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600'}`}
                                >
                                    {role === 'dentist' ? 'Dentista' : role === 'secretary' ? 'Recepção' : role === 'financial' ? 'Financeiro' : 'Admin'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {isClinical && (
                        <div className="space-y-4 bg-blue-50 p-4 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-2">
                            <h3 className="text-xs font-bold text-blue-600 uppercase flex gap-2"><Stethoscope size={14} /> Dados Profissionais</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-gray-700">CRO</label>
                                    <input value={cro} onChange={e => setCro(e.target.value)} className="w-full p-2 text-sm border rounded-lg" placeholder="1234" />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-700">Especialidade</label>
                                    <input value={specialty} onChange={e => setSpecialty(e.target.value)} className="w-full p-2 text-sm border rounded-lg" />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-700">Cor Agenda</label>
                                    <input type="color" value={agendaColor} onChange={e => setAgendaColor(e.target.value)} className="w-12 h-8 rounded cursor-pointer" />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-700">Comissão (%)</label>
                                    <input type="number" value={commission} onChange={e => setCommission(e.target.value)} className="w-full p-2 text-sm border rounded-lg" />
                                </div>
                            </div>
                        </div>
                    )}
                </form>

                <div className="p-6 border-t border-gray-100 bg-gray-50">
                    <button onClick={handleSubmit} disabled={loading || uploading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50">
                        {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /> : <><Save size={20} /> Salvar Tudo</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NewMemberSheet;
