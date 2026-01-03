import { Zap, UserPlus } from 'lucide-react';
import { ResponsiveModal } from '../ui/responsive-modal';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useState } from 'react';
import { supabase } from '../../src/lib/supabase';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

/**
 * PatientQuickAdd - Cadastro Relâmpago de Pacientes
 * 
 * Permite cadastro rápido (Nome + Telefone) para agilizar atendimento
 * Ideal para: Agendamentos telefônicos, emergências, recepção lotada
 */
export function PatientQuickAdd() {
    const { profile } = useAuth();
    const [quickName, setQuickName] = useState('');
    const [quickPhone, setQuickPhone] = useState('');
    const [loading, setLoading] = useState(false);

    const handleQuickSave = async () => {
        if (!quickName || !quickPhone) {
            toast.error('Preencha nome e telefone');
            return;
        }

        if (!profile?.clinic_id) {
            toast.error('Erro ao identificar clínica');
            return;
        }

        setLoading(true);

        try {
            // Salva paciente com dados mínimos
            const { data, error } = await supabase
                .from('patients')
                .insert({
                    name: quickName,
                    phone: quickPhone,
                    clinic_id: profile.clinic_id,
                    // Campos opcionais ficam null (serão preenchidos depois)
                })
                .select()
                .single();

            if (error) throw error;

            toast.success(`✅ ${quickName} cadastrado com sucesso!`, {
                duration: 3000,
            });

            // Limpa formulário
            setQuickName('');
            setQuickPhone('');

            // TODO: Opcional - Perguntar se deseja completar cadastro agora
            // if (confirm('Deseja completar o cadastro agora?')) {
            //   openPatientSheet(data.id);
            // }

        } catch (error: any) {
            console.error('Erro ao salvar paciente rápido:', error);
            toast.error('Erro ao salvar paciente');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ResponsiveModal
            title="⚡ Cadastro Relâmpago"
            description="Adicione apenas o essencial para agilizar o atendimento"
            trigger={
                <Button
                    variant="outline"
                    className="border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 gap-2 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-600 dark:hover:bg-amber-900"
                    title="Cadastro Rápido (Nome + Tel)"
                >
                    <Zap size={16} className="fill-current" />
                    <span className="hidden sm:inline">Rápido</span>
                </Button>
            }
        >
            <div className="space-y-4 pt-2">
                <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                        Nome do Paciente
                    </label>
                    <Input
                        autoFocus
                        placeholder="Ex: Maria Souza"
                        value={quickName}
                        onChange={e => setQuickName(e.target.value)}
                        className="mt-1"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && quickPhone) {
                                handleQuickSave();
                            }
                        }}
                    />
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                        Celular / WhatsApp
                    </label>
                    <Input
                        placeholder="(00) 00000-0000"
                        value={quickPhone}
                        onChange={e => setQuickPhone(e.target.value)}
                        className="mt-1"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleQuickSave();
                            }
                        }}
                    />
                </div>

                <Button
                    onClick={handleQuickSave}
                    disabled={loading || !quickName || !quickPhone}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold dark:bg-amber-600 dark:hover:bg-amber-700"
                >
                    <Zap size={16} className="mr-2 fill-white" />
                    {loading ? 'Salvando...' : 'Salvar Agora'}
                </Button>
            </div>
        </ResponsiveModal>
    );
}
