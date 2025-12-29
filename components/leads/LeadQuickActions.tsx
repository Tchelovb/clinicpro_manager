import { useState } from "react";
import { Zap, UserPlus, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { ResponsiveModal } from "../ui/responsive-modal";
import { toast } from "react-hot-toast";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

interface LeadQuickActionsProps {
    onOpenFullRegistration: () => void;
    onSuccess?: () => void;
}

/**
 * LeadQuickActions - Dual Action Pattern for Leads
 * 
 * Similar to PatientQuickActions but for lead registration
 * 1. ⚡ Quick Add (Amber): Name + Phone + Origin
 * 2. 👤+ Full Registration (Blue): Opens LeadDetailSheet
 */
export function LeadQuickActions({ onOpenFullRegistration, onSuccess }: LeadQuickActionsProps) {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        source: "Instagram"
    });

    // Phone mask
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, "");
        if (value.length > 11) value = value.slice(0, 11);

        if (value.length > 2) {
            value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
        }
        if (value.length > 10) {
            value = `${value.slice(0, 10)}-${value.slice(10)}`;
        }

        setFormData(prev => ({ ...prev, phone: value }));
    };

    const handleQuickSave = async () => {
        // Validation
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
            // Check for duplicates
            const { data: existingLead } = await supabase
                .from("leads")
                .select("id, name")
                .eq("clinic_id", profile.clinic_id)
                .eq("phone", formData.phone)
                .maybeSingle();

            if (existingLead) {
                toast.error("⚠️ Telefone já cadastrado!", {
                    duration: 6000,
                    icon: "⚠️",
                });
                toast(`Este número pertence a ${existingLead.name}`, {
                    duration: 6000,
                    icon: "📋",
                });
                setLoading(false);
                return;
            }

            // Insert new lead
            const { data: newLead, error } = await supabase
                .from("leads")
                .insert({
                    name: formData.name,
                    phone: formData.phone,
                    source: formData.source,
                    clinic_id: profile.clinic_id,
                    status: 'NEW',
                    created_at: new Date().toISOString(),
                    last_interaction: new Date().toISOString(),
                })
                .select()
                .single();

            if (error) throw error;

            // Success toast
            toast.success(`⚡ ${formData.name} cadastrado!`, {
                duration: 5000,
                icon: "✅",
            });

            setTimeout(() => {
                toast(`Lead pronto para qualificação!`, {
                    duration: 5000,
                    icon: "📋",
                });
            }, 500);

            // Cleanup
            setFormData({ name: "", phone: "", source: "Instagram" });
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
            {/* Quick Add (Amber) */}
            <ResponsiveModal
                title="⚡ Cadastro Relâmpago de Lead"
                description="Cadastre rapidamente um novo contato"
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
                        <Label htmlFor="lead-quick-name" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                            Nome do Lead
                        </Label>
                        <Input
                            id="lead-quick-name"
                            autoFocus
                            placeholder="Ex: João Silva"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            onKeyDown={e => {
                                if (e.key === 'Enter') document.getElementById('lead-quick-phone')?.focus();
                            }}
                            className="font-medium"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="lead-quick-phone" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                            Celular / WhatsApp
                        </Label>
                        <Input
                            id="lead-quick-phone"
                            placeholder="(00) 00000-0000"
                            type="tel"
                            value={formData.phone}
                            onChange={handlePhoneChange}
                            onKeyDown={e => {
                                if (e.key === 'Enter') document.getElementById('lead-quick-source')?.focus();
                            }}
                            className="font-medium"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="lead-quick-source" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                            Origem
                        </Label>
                        <Select value={formData.source} onValueChange={(value) => setFormData({ ...formData, source: value })}>
                            <SelectTrigger id="lead-quick-source">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Instagram">Instagram</SelectItem>
                                <SelectItem value="Google">Google</SelectItem>
                                <SelectItem value="Facebook">Facebook</SelectItem>
                                <SelectItem value="Indicação">Indicação</SelectItem>
                                <SelectItem value="Tráfego Pago">Tráfego Pago</SelectItem>
                                <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                                <SelectItem value="Outro">Outro</SelectItem>
                            </SelectContent>
                        </Select>
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
                                Salvar Lead
                            </>
                        )}
                    </Button>

                    <p className="text-[10px] text-center text-slate-400 dark:text-slate-500">
                        Dica: Pressione <kbd className="font-bold border rounded px-1 bg-slate-100 dark:bg-slate-800">Enter</kbd> para navegar
                    </p>
                </div>
            </ResponsiveModal>

            {/* Full Registration (Blue) */}
            <Button
                onClick={onOpenFullRegistration}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-medium"
            >
                <UserPlus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Novo Lead</span>
                <span className="inline sm:hidden">Novo</span>
            </Button>
        </div>
    );
}
