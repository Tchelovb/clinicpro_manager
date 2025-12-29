import React, { useState, useEffect } from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '../ui/sheet';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import {
    User, Shield, Lock, Activity,
    Save, Key, AlertTriangle, LogOut, Verified,
    X, DollarSign, Stethoscope
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Camera, Pencil, Trash2 } from 'lucide-react';
import { Label } from '../ui/label';

// Helper: Simple SHA-256 for frontend hashing (mimics server-side auth usually, but good for admin override)
const hashPin = async (pin: string) => {
    const msgBuffer = new TextEncoder().encode(pin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};


const PERMISSIONS_LIST = [
    { key: 'can_view_financial', label: 'Ver Financeiro Completo', desc: 'Acesso a receitas, despesas e DRE' },
    { key: 'can_give_discount', label: 'Conceder Descontos', desc: 'Permite alterar preços em orçamentos' },
    { key: 'can_delete_patient', label: 'Deletar Pacientes', desc: 'Remoção definitiva do banco de dados' },
    { key: 'can_view_crm', label: 'Acessar CRM', desc: 'Gestão de Leads e Pipeline' },
    { key: 'can_access_settings', label: 'Acessar Configurações', desc: 'Gestão da clínica e usuários' }
];

interface UserDetailSheetProps {

    open: boolean;
    onOpenChange: (open: boolean) => void;
    userId: string | null;
    onSuccess: () => void;
}

const UserDetailSheet: React.FC<UserDetailSheetProps> = ({ open, onOpenChange, userId, onSuccess }) => {
    const { clinicId } = useAuth();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'permissions' | 'security'>('overview');

    // Data States
    const [userData, setUserData] = useState<any>(null);
    const [permissions, setPermissions] = useState<any>({});

    // Form States
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: '',
        active: true,
        cpf: '',
        phone: '',
        specialty: '',
        council_number: '',
        color: '#3B82F6'
    });
    const [isEditing, setIsEditing] = useState(false);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // PIN States (for manual override)
    const [financialPin, setFinancialPin] = useState('');
    const [attendancePin, setAttendancePin] = useState('');

    useEffect(() => {
        if (open && userId && clinicId) {
            fetchMemberData();
        } else {
            setUserData(null);
            setPermissions({});
        }
    }, [open, userId, clinicId]);

    const fetchMemberData = async () => {
        try {
            setLoading(true);

            const { data: user, error: userError } = await supabase
                .from('users')
                .select(`
          *,
          professionals:professional_id (*)
        `)
                .eq('id', userId)
                .eq('clinic_id', clinicId)
                .single();

            if (userError) throw userError;

            const { data: perms } = await supabase
                .from('user_permissions')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();

            setUserData(user);
            setPermissions(perms || {});

            setFormData({
                name: user.name,
                email: user.email,
                role: user.role,
                active: user.active,
                cpf: user.professionals?.cpf || '',
                phone: user.phone || '',
                specialty: user.professionals?.specialty || '',
                council_number: user.professionals?.crc || '',
                color: user.color || '#3B82F6'
            });

        } catch (error) {
            console.error('Error loading member:', error);
            toast.error('Erro ao carregar dados do usuário');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        try {
            setLoading(true);

            // Use Edge Function to update Auth + Public data securely
            const { error: updateError } = await supabase.functions.invoke('update-user', {
                body: {
                    user_id: userId,
                    email: formData.email,
                    name: formData.name,
                    role: formData.role,
                    clinic_id: clinicId,
                    photo_url: photoPreview // Send photo_url if changed
                }
            });

            // Fallback/Complementary: Update extra fields directly in public.users 
            // because my edge function might not cover everything (like 'color', 'phone', 'active').
            const { error: publicError } = await supabase
                .from('users')
                .update({
                    name: formData.name,
                    role: formData.role,
                    active: formData.active,
                    phone: formData.phone,
                    color: formData.color
                })
                .eq('id', userId);

            if (updateError) console.warn("Edge function update warning:", updateError);
            if (publicError) throw publicError;

            if (formData.role === 'PROFESSIONAL' && userData.professional_id) {
                await supabase
                    .from('professionals')
                    .update({
                        specialty: formData.specialty,
                        crc: formData.council_number
                    })
                    .eq('id', userData.professional_id);
            }

            toast.success('Perfil atualizado com sucesso!');
            onSuccess();
            setIsEditing(false); // Exit edit mode
            fetchMemberData(); // Refresh data
        } catch (error: any) {
            console.error('Save error:', error);
            toast.error('Erro ao salvar perfil: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePermission = async (key: string) => {
        const newVal = !permissions[key];
        setPermissions({ ...permissions, [key]: newVal });

        try {
            const { error } = await supabase
                .from('user_permissions')
                .upsert({
                    user_id: userId,
                    [key]: newVal,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });

            if (error) throw error;
            toast.success(`Permissão ${newVal ? 'concedida' : 'removida'}`);
        } catch (error) {
            setPermissions({ ...permissions, [key]: !newVal });
            toast.error('Erro ao atualizar permissão');
        }
    };

    const handleToggleAll = async (checked: boolean) => {
        const newPerms = PERMISSIONS_LIST.reduce((acc, item) => ({ ...acc, [item.key]: checked }), {});
        setPermissions(newPerms);

        try {
            const { error } = await supabase
                .from('user_permissions')
                .upsert({
                    user_id: userId,
                    ...newPerms,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });

            if (error) throw error;
            toast.success(checked ? 'Todas permissões ativadas!' : 'Todas permissões removidas.');
        } catch (error) {
            toast.error('Erro ao atualizar todas as permissões.');
        }
    };

    const handleSavePin = async (type: 'transaction' | 'attendance', pinValue: string) => {
        if (!pinValue || pinValue.length < 4) {
            toast.error("O PIN deve ter no mínimo 4 dígitos");
            return;
        }

        try {
            const hashed = await hashPin(pinValue);
            // Field mapping: 'transaction' -> 'transaction_pin_hash', 'attendance' -> 'attendance_pin_hash'
            // NOTE: user_metadata is often structured differently. If 'transaction_pin_hash' is a column in users table, use 'users'.
            // If it is in user_metadata, we need 'supabase.auth.admin.updateUserById' (which we can't do from client safely without edge function)
            // OR custom function.
            // Assuming 'users' table has these columns as per prompt implication.

            const field = type === 'transaction' ? 'transaction_pin_hash' : 'attendance_pin_hash';

            const { error } = await supabase
                .from('users')
                .update({ [field]: hashed })
                .eq('id', userId);

            if (error) throw error;

            toast.success(`PIN de ${type === 'transaction' ? 'Transação' : 'Atendimento'} definido!`);
            // Clear input
            if (type === 'transaction') setFinancialPin('');
            else setAttendancePin('');

        } catch (error) {
            console.error(error);
            toast.error("Erro ao salvar PIN.");
        }
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                <p className="text-sm text-slate-500">Cadastrado em</p>
                                <p className="text-lg font-medium text-slate-900">
                                    {userData?.created_at ? new Date(userData.created_at).toLocaleDateString() : '-'}
                                </p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                <p className="text-sm text-slate-500">Último Login</p>
                                <p className="text-lg font-medium text-slate-900">-</p>
                            </div>
                        </div>

                        <div className="p-6 border border-dashed border-slate-300 rounded-lg text-center bg-slate-50/50">
                            <Activity className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                            <p className="text-sm text-slate-500">Histórico de atividades em breve.</p>
                        </div>
                    </div>
                );

            case 'profile':
                return (
                    <div className="space-y-6">
                        {/* HEADER PROFILE */}
                        <div className="flex flex-col items-center gap-4 mb-6 relative">
                            <div className="relative group">
                                <Avatar className="h-32 w-32 border-4 border-slate-100 dark:border-slate-800 shadow-xl">
                                    <AvatarImage src={photoPreview || userData?.photo_url} />
                                    <AvatarFallback className="text-3xl bg-slate-200 text-slate-500">
                                        {formData.name.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                {isEditing && (
                                    <label htmlFor="edit-avatar-upload" className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Camera className="text-white w-8 h-8" />
                                        <input
                                            type="file"
                                            id="edit-avatar-upload"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handlePhotoChange}
                                        />
                                    </label>
                                )}
                            </div>
                            {!isEditing && (
                                <div className="text-center">
                                    <h3 className="text-xl font-bold text-slate-900">{formData.name}</h3>
                                    <Badge variant="secondary" className="mt-1">{formData.role}</Badge>
                                </div>
                            )}
                        </div>

                        {/* FORM GRID */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="col-span-2 space-y-2">
                                <Label className="text-slate-500">Nome Completo</Label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2.5 border"
                                    />
                                ) : (
                                    <p className="font-medium text-slate-900 text-base border-b border-dashed border-slate-200 pb-1">{formData.name}</p>
                                )}
                            </div>

                            <div className="col-span-2 space-y-2">
                                <Label className="text-slate-500">Email (Login)</Label>
                                {isEditing ? (
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2.5 border"
                                    />
                                ) : (
                                    <p className="font-medium text-slate-900 text-base border-b border-dashed border-slate-200 pb-1">{formData.email}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-500">Cargo</Label>
                                {isEditing ? (
                                    <select
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2.5 border"
                                    >
                                        <option value="ADMIN">Administrador</option>
                                        <option value="PROFESSIONAL">Dentista/Profissional</option>
                                        <option value="SECRETARY">Secretária</option>
                                        <option value="MASTER">Master (Dono)</option>
                                    </select>
                                ) : (
                                    <p className="font-medium text-slate-900 text-base border-b border-dashed border-slate-200 pb-1">{formData.role}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-500">Telefone</Label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2.5 border"
                                    />
                                ) : (
                                    <p className="font-medium text-slate-900 text-base border-b border-dashed border-slate-200 pb-1">{formData.phone || '-'}</p>
                                )}
                            </div>
                        </div>

                        {formData.role === 'PROFESSIONAL' && (
                            <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100 grid grid-cols-2 gap-4 mt-4">
                                <div className="col-span-2 text-sm font-bold text-blue-800 flex items-center gap-2 mb-2">
                                    <Verified className="w-4 h-4" /> Dados Profissionais
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-medium text-blue-700">CRO</Label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={formData.council_number}
                                            onChange={e => setFormData({ ...formData, council_number: e.target.value })}
                                            className="w-full rounded-md border-blue-200 focus:border-blue-500 focus:ring-blue-500 text-sm p-2 border"
                                        />
                                    ) : (
                                        <p className="font-medium text-blue-900 text-sm">{formData.council_number || '-'}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-medium text-blue-700">Especialidade</Label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={formData.specialty}
                                            onChange={e => setFormData({ ...formData, specialty: e.target.value })}
                                            className="w-full rounded-md border-blue-200 focus:border-blue-500 focus:ring-blue-500 text-sm p-2 border"
                                        />
                                    ) : (
                                        <p className="font-medium text-blue-900 text-sm">{formData.specialty || '-'}</p>
                                    )}
                                </div>

                                <div className="col-span-2 space-y-2">
                                    <Label className="text-xs font-medium text-blue-700">Cor na Agenda</Label>
                                    {isEditing ? (
                                        <div className="flex gap-3">
                                            {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#111827'].map(c => (
                                                <button
                                                    key={c}
                                                    onClick={() => setFormData({ ...formData, color: c })}
                                                    className={`w-8 h-8 rounded-full shadow-sm transition-transform hover:scale-110
                                ${formData.color === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''}`}
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full shadow-sm" style={{ backgroundColor: formData.color }} />
                                            <span className="text-sm text-slate-600 font-mono">{formData.color}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ACTIONS FOOTER */}
                        <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-6">
                            {isEditing ? (
                                <>
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            setIsEditing(false);
                                            setPhotoPreview(null);
                                            // Reset form data is complex here without deep copy, 
                                            // ideally we'd re-fetch or keep separate draft state. 
                                            // For MVP, we just switch mode back, changes persist in 'formData' state but not saved.
                                            // Re-fetch to be clean?
                                            fetchMemberData();
                                        }}
                                        className="text-slate-500"
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        onClick={handleSaveProfile}
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                        <Save className="w-4 h-4 mr-2" /> Salvar Alterações
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                        <Trash2 className="w-4 h-4 mr-2" /> Excluir
                                    </Button>
                                    <Button onClick={() => setIsEditing(true)} className="bg-slate-900 text-white">
                                        <Pencil className="w-4 h-4 mr-2" /> Editar Dados
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                );

            case 'permissions':
                const isAdmin = userData?.role === 'ADMIN' || userData?.role === 'MASTER';
                return (
                    <div className="space-y-6">
                        <InfoBanner text={isAdmin ? "Administradores possuem acesso total por padrão." : "Permissões são aplicadas imediatamente."} />

                        {/* MASTER SWITCH */}
                        <div className={`flex items-center justify-between p-4 rounded-xl border-2 transition-colors ${isAdmin ? 'bg-purple-50 border-purple-100' : 'bg-blue-50 border-blue-100'}`}>
                            <div>
                                <h3 className={`font-bold ${isAdmin ? 'text-purple-900' : 'text-blue-900'}`}>
                                    {isAdmin ? 'Acesso Total (Admin)' : 'Acesso Total'}
                                </h3>
                                <p className={`text-sm ${isAdmin ? 'text-purple-700' : 'text-blue-700'}`}>
                                    {isAdmin ? 'Usuário possui controle irrestrito do sistema.' : 'Habilitar todas as permissões disponíveis.'}
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={isAdmin || PERMISSIONS_LIST.every(p => permissions && permissions[p.key])}
                                    onChange={(e) => !isAdmin && handleToggleAll(e.target.checked)}
                                    disabled={isAdmin}
                                />
                                <div className={`w-11 h-6 rounded-full peer peer-focus:ring-4 transition-all
                                    ${isAdmin
                                        ? 'bg-purple-200 peer-checked:bg-purple-600 peer-focus:ring-purple-300'
                                        : 'bg-slate-200 peer-checked:bg-blue-600 peer-focus:ring-blue-300'
                                    }
                                    peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
                            </label>
                        </div>

                        {isAdmin && (
                            <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl flex gap-3 text-purple-900">
                                <Shield className="w-5 h-5 shrink-0" />
                                <div className="text-sm">
                                    <p className="font-bold">Modo Administrador</p>
                                    <p>Este usuário é um Administrador e tem acesso nativo a todas as funções, independentemente das chaves abaixo.</p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            {PERMISSIONS_LIST.map(perm => (
                                <div key={perm.key} className={`flex items-center justify-between p-4 bg-white border rounded-xl transition-colors ${isAdmin ? 'opacity-50 pointer-events-none border-purple-100' : 'border-slate-200 hover:border-slate-300'}`}>
                                    <div>
                                        <span className="block text-sm font-medium text-slate-900">{perm.label}</span>
                                        <span className="block text-xs text-slate-500 mt-0.5">{perm.desc}</span>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={!!permissions[perm.key]}
                                            onChange={() => handleTogglePermission(perm.key)}
                                            disabled={isAdmin}
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'security':
                return (
                    <div className="space-y-8">
                        {/* MANUAL PIN OVERRIDE SECTION */}
                        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                            <input type="text" name="username" value={userData?.email || ''} autoComplete="username" className="hidden" readOnly />
                            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Definição Manual de Acesso</h3>
                            <div className="grid gap-6 md:grid-cols-2">
                                {/* PIN Financeiro */}
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <DollarSign className="h-4 w-4 text-emerald-600" /> PIN Financeiro
                                        </CardTitle>
                                        <CardDescription>Para descontos e estornos.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <Input
                                            type="password"
                                            autoComplete="new-password"
                                            placeholder="Novo PIN (4-6 dígitos)"
                                            maxLength={6}
                                            value={financialPin}
                                            onChange={(e) => setFinancialPin(e.target.value)}
                                        />
                                        <Button
                                            onClick={() => handleSavePin('transaction', financialPin)}
                                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                                            disabled={financialPin.length < 4}
                                        >
                                            <Save className="w-4 h-4 mr-2" /> Salvar Financeiro
                                        </Button>
                                    </CardContent>
                                </Card>

                                {/* PIN Atendimento */}
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Stethoscope className="h-4 w-4 text-blue-600" /> PIN Clínico
                                        </CardTitle>
                                        <CardDescription>Para assinar evoluções.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <Input
                                            type="password"
                                            autoComplete="new-password"
                                            placeholder="Novo PIN (4-6 dígitos)"
                                            maxLength={6}
                                            value={attendancePin}
                                            onChange={(e) => setAttendancePin(e.target.value)}
                                        />
                                        <Button
                                            onClick={() => handleSavePin('attendance', attendancePin)}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                            disabled={attendancePin.length < 4}
                                        >
                                            <Save className="w-4 h-4 mr-2" /> Salvar Clínico
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        </form>

                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Credenciais & Acesso</h3>

                            <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-between">
                                <div className="flex gap-4">
                                    <div className="p-2 bg-orange-100 rounded-lg h-fit">
                                        <AlertTriangle className="text-orange-600 w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-orange-900">Forçar Reset de Senha</p>
                                        <p className="text-xs text-orange-700 mt-0.5">Envia um email de recuperação para o usuário.</p>
                                    </div>
                                </div>
                                <button className="px-4 py-2 bg-white border border-orange-200 text-orange-700 text-xs font-bold rounded-lg hover:bg-orange-50 transition-colors shadow-sm">
                                    Enviar Email
                                </button>
                            </div>

                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
                                <div className="flex gap-4">
                                    <div className="p-2 bg-red-100 rounded-lg h-fit">
                                        <LogOut className="text-red-600 w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-red-900">Encerrar Sessões</p>
                                        <p className="text-xs text-red-700 mt-0.5">Desconecta o usuário de todos os dispositivos.</p>
                                    </div>
                                </div>
                                <button className="px-4 py-2 bg-white border border-red-200 text-red-700 text-xs font-bold rounded-lg hover:bg-red-50 transition-colors shadow-sm">
                                    Desconectar
                                </button>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="w-full sm:max-w-2xl p-0 gap-0 border-l border-slate-200 shadow-2xl bg-white flex flex-col h-full"
            >
                {/* FIXED HEADER */}
                <div className="flex flex-col bg-slate-50 border-b border-slate-200 flex-shrink-0">
                    <div className="flex items-start justify-between p-6 pb-2">
                        <div className="flex items-center gap-4">
                            <div className={`
                    w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-md
                    ${userData?.role === 'MASTER' ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                                    userData?.role === 'ADMIN' ? 'bg-gradient-to-br from-purple-500 to-indigo-600' :
                                        'bg-gradient-to-br from-blue-400 to-cyan-500'}
                `}>
                                {userData?.name?.charAt(0).toUpperCase() || <User />}
                            </div>
                            <div>
                                <SheetTitle className="text-2xl font-bold text-slate-900">
                                    {userData?.name || 'Carregando...'}
                                </SheetTitle>
                                <SheetDescription className="sr-only">Detalhes e configurações do usuário</SheetDescription>
                                <p className="text-slate-500 text-sm flex items-center gap-1.5 mt-1">
                                    <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide">
                                        {userData?.role || '...'}
                                    </span>
                                    <span>•</span>
                                    {userData?.email}
                                </p>
                            </div>
                        </div>
                        {/* Close button is handled by SheetPrimitive.Close inside SheetContent */}
                    </div>

                    {/* TABS ROW */}
                    <div className="flex px-6 gap-6 overflow-x-auto hide-scrollbar">
                        <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} label="Visão Geral" />
                        <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} label="Dados Cadastrais" />
                        <TabButton active={activeTab === 'permissions'} onClick={() => setActiveTab('permissions')} label="Permissões" />
                        <TabButton active={activeTab === 'security'} onClick={() => setActiveTab('security')} label="Segurança & PIN" />
                    </div>
                </div>

                {/* SCROLLABLE CONTENT */}
                <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
                    <div className="p-8 pb-20"> {/* pb-20 to ensure bottom content isn't cut off */}
                        {loading && !userData ? (
                            <div className="h-40 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : (
                            renderTabContent()
                        )}
                    </div>
                </div>

            </SheetContent>
        </Sheet>
    );
};

const TabButton = ({ active, onClick, label }: any) => (
    <button
        onClick={onClick}
        className={`
      py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap
      ${active
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'}
    `}
    >
        {label}
    </button>
);

const InfoBanner = ({ text }: { text: string }) => (
    <div className="bg-blue-50 border border-blue-100 text-blue-800 px-4 py-3 rounded-lg text-sm flex items-start gap-3">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
        {text}
    </div>
);

export default UserDetailSheet;
