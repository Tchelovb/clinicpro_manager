import React, { useState, useEffect } from "react";
import { usePatients } from "../../hooks/usePatients";
import { Patient } from "../../types";
import { supabase } from "../../lib/supabase";
import {
    Save,
    User,
    MapPin,
    Shield,
    File,
    Loader2,
    Phone,
    ArrowLeft
} from "lucide-react";
import { BaseSheet } from "../ui/BaseSheet";
import toast from "react-hot-toast";

interface NewPatientSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
    initialData?: Partial<Patient>; // For pre-filling from search or edit mode
}

export function NewPatientSheet({
    open,
    onOpenChange,
    onSuccess,
    initialData
}: NewPatientSheetProps) {
    const { createPatient, updatePatient } = usePatients();
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    // Initialize form data
    const [formData, setFormData] = useState<Partial<Patient>>({
        status: "Em Orçamento",
        gender: "Não Informado",
        marital_status: "SINGLE",
        contact_preference: "WHATSAPP",
        insurance: "Particular",
        patient_score: "STANDARD",
        sentiment_status: "NEUTRAL",
        is_active: true,
        bad_debtor: false,
        ...initialData // Merge initial data if provided (e.g. from search)
    });

    // Reset or Update when opening/initialData changes
    useEffect(() => {
        if (open) {
            setFormData(prev => ({
                ...prev,
                ...initialData,
                status: prev.status || "Em Orçamento"
            }));
            setError("");
        }
    }, [open, initialData]);

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >
    ) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (error && (e.target.name === "name" || e.target.name === "phone")) {
            setError("");
        }
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!formData.name || !formData.phone) {
            setError("Nome completo e Telefone são obrigatórios.");
            toast.error("Preencha os campos obrigatórios.");
            return;
        }

        try {
            setSaving(true);
            setError("");

            const compositeAddress = [
                formData.street,
                formData.number,
                formData.neighborhood,
                formData.city,
                formData.state,
            ]
                .filter(Boolean)
                .join(", ");

            const newPatient = {
                name: formData.name,
                phone: formData.phone,
                email: formData.email || null,
                cpf: formData.cpf || null,
                birth_date: formData.birth_date || null,
                gender: formData.gender || null,
                address: compositeAddress || null,
                clinical_status: "Em Tratamento",
                total_approved: 0,
                total_paid: 0,
                balance_due: 0,

                // Classificação e Status
                patient_score: formData.patient_score || "STANDARD",
                sentiment_status: formData.sentiment_status || "NEUTRAL",
                is_active: formData.is_active !== undefined ? formData.is_active : true,
                bad_debtor: formData.bad_debtor || false,

                // Novos campos
                contact_preference: formData.contact_preference || "WHATSAPP",
                origin: formData.origin || "Instagram",
                zip_code: formData.zip_code || null,
                street: formData.street || null,
                number: formData.number || null,
                complement: formData.complement || null,
                neighborhood: formData.neighborhood || null,
                city: formData.city || null,
                state: formData.state || null,

                // Dossiê High-Ticket
                nickname: formData.nickname || null,
                occupation: formData.occupation || null,
                instagram_handle: formData.instagram_handle || null,
                marital_status: formData.marital_status || null,
                wedding_anniversary: formData.wedding_anniversary || null,
                vip_notes: formData.vip_notes || null,
            };

            if (formData.id) {
                await updatePatient({ id: formData.id, data: newPatient });
                toast.success("Paciente atualizado com sucesso!");
            } else {
                await createPatient(newPatient);
                toast.success("Paciente cadastrado com sucesso!");
            }

            onOpenChange(false);
            if (onSuccess) onSuccess();

        } catch (err) {
            console.error("Erro ao salvar paciente:", err);
            setError("Erro ao salvar. Tente novamente.");
            toast.error("Erro ao salvar paciente.");
        } finally {
            setSaving(false);
        }
    };

    // Styles
    const inputClass = "w-full bg-white text-gray-900 border border-gray-200 rounded-lg p-3 md:p-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all";
    const labelClass = "block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide";
    const sectionClass = "bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm";

    return (
        <BaseSheet
            open={open}
            onOpenChange={onOpenChange}
            title={formData.id ? "Editar Paciente" : "Novo Paciente"}
            description="Preencha a ficha cadastral completa."
            size="xl" // Requested max-w-xl
            footer={
                <>
                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="w-full md:w-auto px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => handleSubmit()}
                        disabled={saving}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 font-medium transition-colors shadow-sm"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Salvar Ficha
                            </>
                        )}
                    </button>
                </>
            }
        >
            <form id="patient-form" onSubmit={handleSubmit} className="space-y-6 pb-4">

                {error && (
                    <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm font-medium border border-red-200">
                        {error}
                    </div>
                )}

                {/* 1. DADOS OBRIGATÓRIOS */}
                <div className={`${sectionClass} border-l-4 border-l-primary-500`}>
                    <h3 className="text-xs font-bold text-primary-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <User size={16} /> Identificação Principal
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Nome Completo <span className="text-red-500">*</span></label>
                            <input
                                name="name"
                                value={formData.name || ""}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder="Ex: João da Silva"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Telefone / WhatsApp <span className="text-red-500">*</span></label>
                            <input
                                name="phone"
                                value={formData.phone || ""}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder="(00) 00000-0000"
                            />
                        </div>
                    </div>
                </div>

                {/* 1.5. DOSSIÊ HIGH-TICKET */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 p-5 rounded-xl border border-purple-100 dark:border-purple-800/30">
                    <h3 className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <User size={16} /> 💎 Dossiê High-Ticket
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Apelido</label>
                            <input name="nickname" value={formData.nickname || ""} onChange={handleChange} className={inputClass} placeholder="Como gosta de ser chamado" />
                        </div>
                        <div>
                            <label className={labelClass}>Profissão</label>
                            <input name="occupation" value={formData.occupation || ""} onChange={handleChange} className={inputClass} placeholder="Ex: Empresário" />
                        </div>
                        <div>
                            <label className={labelClass}>Instagram</label>
                            <input name="instagram_handle" value={formData.instagram_handle || ""} onChange={handleChange} className={inputClass} placeholder="@usuario" />
                        </div>
                        <div>
                            <label className={labelClass}>Aniversário Casamento</label>
                            <input name="wedding_anniversary" type="date" value={formData.wedding_anniversary || ""} onChange={handleChange} className={inputClass} />
                        </div>
                        <div className="col-span-1 md:col-span-2">
                            <label className={labelClass}>Notas VIP</label>
                            <textarea name="vip_notes" value={formData.vip_notes || ""} onChange={handleChange} className={`${inputClass} h-20 resize-none`} placeholder="Preferências pessoais, café sem açúcar, etc..." />
                        </div>
                    </div>
                </div>

                {/* 2. CLASSIFICAÇÃO */}
                <div className={sectionClass}>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Shield size={16} /> Classificação
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Score do Paciente</label>
                            <select name="patient_score" value={formData.patient_score || "STANDARD"} onChange={handleChange} className={inputClass}>
                                <option value="DIAMOND">💎 DIAMOND</option>
                                <option value="GOLD">🥇 GOLD</option>
                                <option value="STANDARD">⭐ STANDARD</option>
                                <option value="RISK">⚠️ RISK</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Origem</label>
                            <select name="origin" value={formData.origin || "Instagram"} onChange={handleChange} className={inputClass}>
                                <option>Instagram</option>
                                <option>Indicação</option>
                                <option>Google</option>
                                <option>Passante</option>
                            </select>
                        </div>
                    </div>
                </div>

            </form>
        </BaseSheet>
    );
}
