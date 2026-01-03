import { useState } from "react";
import { Zap, UserPlus, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { ResponsiveModal } from "../ui/responsive-modal";
import { toast } from "react-hot-toast";
import { supabase } from "../../src/lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

interface PatientQuickActionsProps {
    onOpenFullRegistration: () => void; // Callback para abrir a Sheet completa
    onSuccess?: () => void; // Callback para atualizar a lista
}

/**
 * PatientQuickActions - Dual Action Pattern
 * 
 * Fornece duas opções de cadastro:
 * 1. ⚡ Cadastro Relâmpago (Amber): Nome + Telefone (5 segundos)
 * 2. 👤+ Cadastro Completo (Blue): Sheet com todos os campos
 * 
 * Ideal para: Recepção, Agenda, Atendimento Telefônico
 */
export function PatientQuickActions({ onOpenFullRegistration, onSuccess }: PatientQuickActionsProps) {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ name: "", phone: "" });

    // ✨ Máscara de Telefone Automática
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, ""); // Remove não-números
        if (value.length > 11) value = value.slice(0, 11); // Limita tamanho

        // Aplica máscara (XX) XXXXX-XXXX
        if (value.length > 2) {
            value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
        }
        if (value.length > 10) {
            value = `${value.slice(0, 10)}-${value.slice(10)}`;
        }

        setFormData(prev => ({ ...prev, phone: value }));
    };

    const handleQuickSave = async () => {
        // 1. Validação Local
        if (!formData.name || formData.phone.length < 14) {
            toast.error("Preencha nome e telefone válido!");
            return;
        }

        if (!profile?.clinic_id) {
            toast.error("Erro ao identificar clínica");
            return;
        }

        setLoading(true);
        try {
            // 2. 🛡️ BLINDAGEM: Verifica duplicidade antes de inserir
            const { data: existingPatient, error: searchError } = await supabase
                .from("patients")
                .select("id, name")
                .eq("clinic_id", profile.clinic_id)
                .eq("phone", formData.phone)
                .maybeSingle(); // maybeSingle não joga erro se não achar, retorna null

            if (searchError) {
                console.error("Erro ao buscar duplicatas:", searchError);
            }

            if (existingPatient) {
                // CENÁRIO: PACIENTE JÁ EXISTE
                toast.error("⚠️ Telefone já cadastrado!", {
                    duration: 6000,
                    icon: "⚠️",
                });
                toast(`Este número pertence a ${existingPatient.name}`, {
                    duration: 6000,
                    icon: "📋",
                });
                setLoading(false);
                return; // PARE AQUI. Não cadastre duplicado.
            }

            // 3. Inserção (Se passou pela blindagem)
            const { data: newPatient, error } = await supabase
                .from("patients")
                .insert({
                    name: formData.name,
                    phone: formData.phone,
                    clinic_id: profile.clinic_id,
                    status: "active",
                    created_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (error) throw error;

            // 4. Sucesso + Actionable Toast
            const patientName = formData.name;
            toast.success(`⚡ ${patientName} cadastrado!`, {
                duration: 5000,
                icon: "✅",
            });

            // Toast secundário com ação
            setTimeout(() => {
                toast(`Deseja completar a ficha agora?`, {
                    duration: 5000,
                    icon: "📋",
                });
            }, 500);

            // Limpeza
            setFormData({ name: "", phone: "" });
            onSuccess?.();

        } catch (err: any) {
            console.error(err);
            toast.error("Erro ao salvar. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-2">

            {/* --- 1. BOTÃO CADASTRO RELÂMPAGO (AMBER) --- */}
            <ResponsiveModal
                title="⚡ Cadastro Relâmpago"
                description="Preencha apenas o essencial para agilizar o atendimento telefônico"
                trigger={
                    <Button
                        variant="outline"
                        className="border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-900/50 transition-colors"
                    >
                        <Zap className="mr-2 h-4 w-4 fill-current" />
                        <span className="hidden sm:inline font-semibold">Rápido</span>
                        <span className="inline sm:hidden">⚡</span>
                    </Button>
                }
            >
                <div className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="quick-name" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                            Nome do Paciente
                        </Label>
                        <Input
                            id="quick-name"
                            autoFocus
                            placeholder="Ex: Ana Silva"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            onKeyDown={e => {
                                if (e.key === 'Enter') document.getElementById('quick-phone')?.focus();
                            }}
                            className="font-medium"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="quick-phone" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                            Celular / WhatsApp
                        </Label>
                        <Input
                            id="quick-phone"
                            placeholder="(00) 00000-0000"
                            type="tel"
                            value={formData.phone}
                            onChange={handlePhoneChange}
                            onKeyDown={e => e.key === 'Enter' && handleQuickSave()}
                            className="font-medium"
                        />
                    </div>

                    <Button
                        onClick={handleQuickSave}
                        disabled={loading || !formData.name || formData.phone.length < 14}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-md shadow-amber-500/20 active:scale-95 transition-all mt-2 dark:bg-amber-600 dark:hover:bg-amber-700"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Verificando...
                            </>
                        ) : (
                            <>
                                <Zap className="mr-2 h-4 w-4 fill-current" />
                                Salvar Registro
                            </>
                        )}
                    </Button>

                    <p className="text-[10px] text-center text-slate-400 dark:text-slate-500">
                        Dica: Pressione <kbd className="font-bold border rounded px-1 bg-slate-100 dark:bg-slate-800">Enter</kbd> para salvar
                    </p>
                </div>
            </ResponsiveModal>

            {/* --- 2. BOTÃO CADASTRO COMPLETO (BLUE) --- */}
            <Button
                onClick={onOpenFullRegistration}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-medium"
            >
                <UserPlus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Novo Paciente</span>
                <span className="inline sm:hidden">Novo</span>
            </Button>

        </div>
    );
}
