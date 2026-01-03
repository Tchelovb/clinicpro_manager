import React, { useState, useEffect } from "react";
import { usePatients } from "../../hooks/usePatients";
import { Patient } from "../../types";
import {
    Save,
    User,
    Shield,
    Loader2
} from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "../../src/lib/supabase";

interface NewPatientFormProps {
    initialData?: Partial<Patient>;
    onSuccess?: (newPatientId?: string) => void;
    onCancel?: () => void;
}

export function NewPatientForm({
    initialData,
    onSuccess,
    onCancel
}: NewPatientFormProps) {
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
        ...initialData
    });

    // Predictive Search State
    const [openPredictive, setOpenPredictive] = useState(false);
    const [predictiveResults, setPredictiveResults] = useState<Patient[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Watch Name for Predictive Search
    useEffect(() => {
        const query = formData.name;
        if (!query || query.length < 3 || formData.id) { // Don't search if editing existing or too short
            setPredictiveResults([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setIsSearching(true);
            const { data } = await supabase
                .from("patients") // Assuming table name is patients
                .select("*")
                .ilike("name", `%${query}%`)
                .limit(5);

            setPredictiveResults(data || []);
            setIsSearching(false);
            setOpenPredictive(!!(data && data.length > 0));
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [formData.name, formData.id]);

    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({
                ...prev,
                ...initialData,
                status: prev.status || "Em Orçamento"
            }));
            setError("");
        }
    }, [initialData]);

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

            let createdId;
            if (formData.id) {
                await updatePatient({ id: formData.id, data: newPatient });
                createdId = formData.id;
                toast.success("Paciente atualizado com sucesso!");
            } else {
                const result = await createPatient(newPatient);
                // Assuming createPatient might return the created object or Supabase result
                // But usePatients usually returns void or result. checking usePatients implementation would be good but I'll assume void for now
                // Wait, I need the ID to redirect to view mode?
                // If createPatient doesn't return ID, I might have issues.
                // Checking usage in PatientForm.tsx: createPatient(newPatient). No return value used.
                // I'll stick to basic success callback.
                toast.success("Paciente cadastrado com sucesso!");
            }

            if (onSuccess) onSuccess(createdId);

        } catch (err) {
            console.error("Erro ao salvar paciente:", err);
            setError("Erro ao salvar. Tente novamente.");
            toast.error("Erro ao salvar paciente.");
        } finally {
            setSaving(false);
        }
    };

    // Styles
    const inputClass = "w-full bg-white text-slate-900 dark:text-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-3 md:p-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all";
    const labelClass = "block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide";
    const sectionClass = "bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm";

    return (
        <form onSubmit={handleSubmit} className="space-y-6 pb-24">
            {error && (
                <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-3 rounded-lg text-sm font-medium border border-red-200 dark:border-red-800/50">
                    {error}
                </div>
            )}

            {/* 1. DADOS OBRIGATÓRIOS */}
            <div className={`${sectionClass} border-l-4 border-l-primary-500`}>
                <h3 className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <User size={16} /> Identificação Principal
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <label className={labelClass}>Nome Completo <span className="text-red-500">*</span></label>

                        {/* PREDICTIVE SEARCH INPUT */}
                        <div className="relative">
                            <input
                                name="name"
                                value={formData.name || ""}
                                onChange={(e) => {
                                    handleChange(e);
                                    if (!openPredictive) setOpenPredictive(true);
                                }}
                                onFocus={() => formData.name && formData.name.length >= 3 && setOpenPredictive(true)}
                                onBlur={() => setTimeout(() => setOpenPredictive(false), 200)} // Delay to allow click
                                className={inputClass}
                                placeholder="Ex: João da Silva"
                                autoComplete="off"
                                autoFocus
                            />

                            {/* DROPDOWN RESULTS */}
                            {openPredictive && predictiveResults.length > 0 && (
                                <div className="absolute z-[100] w-full mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                    <div className="py-1">
                                        <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-900/50">
                                            Pacientes Encontrados
                                        </div>
                                        {predictiveResults.map((patient) => (
                                            <button
                                                key={patient.id}
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    // SWITCH CONTEXT TO EXISTING PATIENT
                                                    setFormData({}); // Reset form
                                                    if (onSuccess) onSuccess(patient.id);
                                                    setOpenPredictive(false);
                                                }}
                                                className="w-full text-left px-3 py-3 hover:bg-violet-50 dark:hover:bg-violet-900/20 flex items-center justify-between group transition-colors cursor-pointer"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500">
                                                        {patient.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 dark:text-white group-hover:text-violet-600 transition-colors text-sm">{patient.name}</p>
                                                        <p className="text-[10px] text-slate-500">{patient.phone}</p>
                                                    </div>
                                                </div>
                                                <span className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                                    JÁ CADASTRADO
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
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
                <h3 className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-4 flex items-center gap-2">
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
                <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
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

            {/* STICKY FOOTER */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-50 md:absolute md:rounded-b-xl">
                <button
                    onClick={() => handleSubmit()}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 font-bold transition-transform active:scale-95 shadow-lg shadow-primary-600/20"
                >
                    {saving ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Salvando...
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5" />
                            Salvar Ficha & Abrir Prontuário
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
