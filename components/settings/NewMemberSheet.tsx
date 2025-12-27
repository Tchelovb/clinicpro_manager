import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { Loader2, UserPlus, Shield, Mail, Key, User, Camera } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useAuth } from '@/contexts/AuthContext';

interface NewMemberSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export const NewMemberSheet: React.FC<NewMemberSheetProps> = ({ open, onOpenChange, onSuccess }) => {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'PROFESSIONAL'
    });
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

    const handleCreate = async () => {
        if (!formData.name || !formData.email || !formData.password) {
            toast.error('Preencha todos os campos obrigatórios');
            return;
        }

        if (formData.password.length < 6) {
            toast.error('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('create-user', {
                body: {
                    email: formData.email,
                    name: formData.name,
                    role: formData.role,
                    password: formData.password,
                    clinic_id: profile?.clinic_id,
                    photo_url: photoPreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random&color=fff&size=128`
                }
            });

            if (error) throw error;

            toast.success(`Usuário ${formData.name} criado com sucesso!`);
            onSuccess();
            onOpenChange(false);
            onOpenChange(false);
            setFormData({ name: '', email: '', password: '', role: 'PROFESSIONAL' });
            setPhotoPreview(null);

        } catch (error: any) {
            console.error('Erro ao criar usuário:', error);
            toast.error(error.message || 'Erro ao criar usuário');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-md flex flex-col h-full bg-slate-50 dark:bg-slate-900 p-0 gap-0 border-l border-slate-200 dark:border-slate-800">

                {/* Fixed Header */}
                <SheetHeader className="p-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex-none">
                    <SheetTitle className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                            <UserPlus size={20} />
                        </div>
                        Novo Colaborador
                    </SheetTitle>
                </SheetHeader>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    <div className="flex flex-col items-center justify-center gap-2">
                        <div className="relative group cursor-pointer">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoChange}
                                className="hidden"
                                id="avatar-upload"
                            />
                            <Label htmlFor="avatar-upload" className="cursor-pointer block">
                                <Avatar className="h-24 w-24 border-4 border-slate-100 dark:border-slate-800 shadow-xl transition-transform group-hover:scale-105">
                                    <AvatarImage src={photoPreview || undefined} alt="Avatar" />
                                    <AvatarFallback className="bg-slate-200 dark:bg-slate-700 text-slate-400">
                                        <User size={32} />
                                    </AvatarFallback>
                                </Avatar>
                                {/* Overlay Icon */}
                                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="text-white h-8 w-8" />
                                </div>
                                {!photoPreview && (
                                    <div className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-1.5 border-2 border-white shadow-sm">
                                        <Camera className="text-white h-3 w-3" />
                                    </div>
                                )}
                            </Label>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">Toque para alterar a foto</p>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg flex gap-3 items-start">
                            <Shield className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" size={18} />
                            <div className="space-y-1">
                                <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300">Acesso Imediato</h4>
                                <p className="text-xs text-blue-700 dark:text-blue-400">
                                    Ao cadastrar, o login é criado na hora. Entregue o e-mail e senha para o colaborador acessar o sistema.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-2">
                                <User size={14} /> Nome Completo
                            </Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ex: Dra. Ana Silva"
                                className="bg-white dark:bg-slate-800"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-2">
                                <Mail size={14} /> E-mail de Acesso
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                placeholder="ana.silva@clinicapro.com.br"
                                className="bg-white dark:bg-slate-800"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-2">
                                <Key size={14} /> Senha Provisória
                            </Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type="text"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="Ex: Mudar@123"
                                    className="bg-white dark:bg-slate-800 pr-10 font-mono"
                                />
                                <div className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium pointer-events-none">
                                    TEXTO
                                </div>
                            </div>
                            <p className="text-xs text-slate-500">Informe esta senha ao usuário. Ele poderá alterá-la depois.</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role" className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-2">
                                <Shield size={14} /> Permissão de Acesso
                            </Label>
                            <Select
                                value={formData.role}
                                onValueChange={(val) => setFormData({ ...formData, role: val })}
                            >
                                <SelectTrigger className="bg-white dark:bg-slate-800">
                                    <SelectValue placeholder="Selecione o cargo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PROFESSIONAL">Dentista / Profissional de Saúde</SelectItem>
                                    <SelectItem value="SECRETARY">Secretária / Recepção</SelectItem>
                                    <SelectItem value="ADMIN">Administrador (Gerente)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                    </div>
                </div>

                {/* Fixed Footer */}
                <SheetFooter className="p-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex-none flex-col sm:flex-row gap-2">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                        className="w-full sm:w-auto"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleCreate}
                        disabled={loading}
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Criando Acesso...
                            </>
                        ) : (
                            <>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Cadastrar e Criar Acesso
                            </>
                        )}
                    </Button>
                </SheetFooter>

            </SheetContent>
        </Sheet>
    );
};
