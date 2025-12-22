import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { Budget, BudgetItem } from "../types";
import {
    ArrowLeft,
    Calendar,
    CheckCircle2,
    Clock,
    Coins,
    CreditCard,
    DollarSign,
    FileText,
    MessageCircle,
    Percent,
    Printer,
    Save,
    Shield,
    Smile,
    Zap,
} from "lucide-react";
import { toast } from "react-hot-toast";

const BudgetDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { profile } = useAuth();

    const [budget, setBudget] = useState<Budget | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [patientName, setPatientName] = useState("");

    // Editor State
    const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
    const [discountValue, setDiscountValue] = useState(0);
    const [downPayment, setDownPayment] = useState(0);
    const [installments, setInstallments] = useState(1);

    // Expiry
    const [expiresAt, setExpiresAt] = useState("");

    useEffect(() => {
        fetchBudget();
    }, [id]);

    const fetchBudget = async () => {
        if (!id) return;
        try {
            const { data, error } = await supabase
                .from("budgets")
                .select(`
          *,
          patient:patients(name),
          items:budget_items(*)
        `)
                .eq("id", id)
                .single();

            if (error) throw error;

            if (data) {
                setBudget({
                    ...data,
                    items: data.items.map((i: any) => ({
                        id: i.id,
                        procedure: i.procedure_name,
                        region: i.region,
                        face: i.face,
                        tooth_number: i.tooth_number,
                        quantity: i.quantity,
                        unitValue: i.unit_value,
                        total: i.total_value
                    }))
                });
                setPatientName(data.patient?.name || "Paciente");

                // Initialize local state from DB
                setDiscountType(data.discount_type || "PERCENTAGE");
                setDiscountValue(data.discount_value || 0);
                setDownPayment(data.down_payment_value || 0);
                setInstallments(data.installments_count || 1);
                setExpiresAt(data.expires_at ? new Date(data.expires_at).toISOString().split('T')[0] : "");
            }
        } catch (err) {
            console.error("Error fetching budget:", err);
            toast.error("Erro ao carregar orçamento.");
        } finally {
            setLoading(false);
        }
    };

    // --- CALCULATIONS ---
    const calculateTotals = () => {
        if (!budget) return { gross: 0, discount: 0, final: 0, installmentValue: 0 };

        const gross = budget.items.reduce((acc, item) => acc + item.total, 0);

        let discountAmount = 0;
        if (discountType === "PERCENTAGE") {
            discountAmount = (gross * discountValue) / 100;
        } else {
            discountAmount = discountValue;
        }

        const final = Math.max(0, gross - discountAmount);
        const valueToFinance = Math.max(0, final - downPayment);
        const installmentValue = installments > 0 ? valueToFinance / installments : 0;

        return { gross, discount: discountAmount, final, valueToFinance, installmentValue };
    };

    const { gross, discount, final, installmentValue } = calculateTotals();

    // --- ACTIONS ---

    const handleSave = async (newStatus?: string) => {
        if (!budget) return;
        setSaving(true);
        try {
            const updates: any = {
                discount_type: discountType,
                discount_value: discountValue,
                down_payment_value: downPayment,
                installments_count: installments,
                expires_at: expiresAt || null,
                total_value: gross, // Ensure integrity
                final_value: final, // Ensure integrity
                updated_at: new Date().toISOString()
            };

            if (newStatus) updates.status = newStatus;

            const { error } = await supabase
                .from("budgets")
                .update(updates)
                .eq("id", budget.id);

            if (error) throw error;

            // Log to negotiation logs if approved
            if (newStatus === "APPROVED") {
                await supabase.from("budget_negotiation_logs").insert({
                    budget_id: budget.id,
                    user_id: profile?.id,
                    action: "APPROVED",
                    details: `Aprovado por R$ ${final.toFixed(2)} (${installments}x de R$ ${(final / installments).toFixed(2)})`
                });
                toast.success("Orçamento aprovado com sucesso!");
            } else {
                toast.success("Alterações salvas.");
            }

            setBudget(prev => prev ? { ...prev, ...updates } : null);

        } catch (err) {
            console.error("Error saving budget:", err);
            toast.error("Erro ao salvar.");
        } finally {
            setSaving(false);
        }
    };

    const handleWhatsApp = () => {
        if (!budget) return;
        const itemsList = budget.items.map(i => `• ${i.procedure}`).join('\n');
        const message = `Olá ${patientName}, segue o resumo do seu orçamento:\n\n${itemsList}\n\n*Total:* R$ ${final.toLocaleString('pt-BR')}\n*Condição:* ${installments}x de R$ ${installmentValue.toLocaleString('pt-BR')}\n\nPodemos avançar?`;
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    };

    if (loading) return <div className="p-8 text-center">Carregando editor...</div>;
    if (!budget) return <div className="p-8 text-center">Orçamento não encontrado.</div>;

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200">
            {/* --- 1. HEADER --- */}
            <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-20 px-6 py-4 shadow-sm transition-colors">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-bold text-slate-900 dark:text-white">{patientName}</h1>
                                <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded uppercase tracking-wide">
                                    {budget.option_label || "Proposta Principal"}
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 font-mono mt-0.5">#{budget.id.slice(0, 8).toUpperCase()}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Status Badge */}
                        <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 border
                ${budget.status === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-200' :
                                budget.status === 'NEGOTIATING' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800' :
                                    'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                            }`}>
                            {budget.status === 'APPROVED' ? <CheckCircle2 size={14} /> :
                                budget.status === 'NEGOTIATING' ? <MessageCircle size={14} /> : <FileText size={14} />}
                            {budget.status === 'DRAFT' ? 'Rascunho' :
                                budget.status === 'NEGOTIATING' ? 'Em Negociação' :
                                    budget.status === 'APPROVED' ? 'Aprovado' : budget.status}
                        </div>

                        {/* Expiry Warning */}
                        {expiresAt && (
                            <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                                <Clock size={14} />
                                <span>Vence em {new Date(expiresAt).toLocaleDateString('pt-BR')}</span>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* --- 2. ÁREA CLÍNICA (LEFT - 8 cols) --- */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                            <h2 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                <Zap size={18} className="text-indigo-500" />
                                Planejamento Clínico
                            </h2>
                            <span className="text-xs text-slate-400 font-medium">Items: {budget.items.length}</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm item-table">
                                <thead className="bg-[#F8FAFC] dark:bg-slate-900/50">
                                    <tr className="text-left text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                                        <th className="py-3 px-4">Procedimento</th>
                                        <th className="py-3 px-4 text-center">Região/Dente</th>
                                        <th className="py-3 px-4 text-center">Qtd</th>
                                        <th className="py-3 px-4 text-right">Valor Unit.</th>
                                        <th className="py-3 px-4 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {budget.items.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-100 dark:border-slate-800/50 last:border-0">
                                            <td className="py-3 px-4">
                                                <div className="font-medium text-slate-800 dark:text-slate-200">{item.procedure}</div>
                                                <div className="text-xs text-slate-400">Clínica Geral</div>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                {item.tooth_number ? (
                                                    <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded text-xs font-bold">
                                                        {item.tooth_number} {item.face && `(${item.face})`}
                                                    </span>
                                                ) : item.region || "-"}
                                            </td>
                                            <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-400">{item.quantity}</td>
                                            <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">
                                                R$ {item.unitValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="py-3 px-4 text-right font-bold text-slate-800 dark:text-slate-200">
                                                R$ {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
                                    <tr>
                                        <td colSpan={4} className="py-3 px-4 text-right text-slate-500 dark:text-slate-400 font-medium">Subtotal:</td>
                                        <td className="py-3 px-4 text-right font-bold text-slate-800 dark:text-slate-200">
                                            R$ {gross.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Negotiation Logs Placeholder (Optional) */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 opacity-70 hover:opacity-100 transition-opacity">
                        <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-2">
                            <Shield size={16} /> Histórico de Negociação
                        </h3>
                        <p className="text-xs text-slate-400">Os logs de aprovação e alteração de valores são registrados automaticamente para auditoria.</p>
                    </div>
                </div>

                {/* --- 3. PAINEL FINANCEIRO (RIGHT - 4 cols) --- */}
                <div className="lg:col-span-4 space-y-4">

                    {/* Simulator Card */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-indigo-100 dark:border-slate-700 overflow-hidden relative transition-colors">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                        <div className="p-5 space-y-6">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <DollarSign size={20} className="text-indigo-600 dark:text-indigo-400" />
                                Condição Comercial
                            </h3>

                            {/* Expiry Date Input */}
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">Validade da Proposta</label>
                                <input
                                    type="date"
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 dark:text-slate-200"
                                    value={expiresAt}
                                    onChange={(e) => setExpiresAt(e.target.value)}
                                />
                            </div>

                            <hr className="border-slate-100 dark:border-slate-700" />

                            {/* Discount Control */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Desconto</label>
                                    <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-0.5">
                                        <button
                                            onClick={() => setDiscountType("PERCENTAGE")}
                                            className={`px-2 py-0.5 rounded text-xs font-bold transition-all ${discountType === 'PERCENTAGE' ? 'bg-white dark:bg-slate-600 shadow text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}
                                        >%</button>
                                        <button
                                            onClick={() => setDiscountType("FIXED")}
                                            className={`px-2 py-0.5 rounded text-xs font-bold transition-all ${discountType === 'FIXED' ? 'bg-white dark:bg-slate-600 shadow text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}
                                        >R$</button>
                                    </div>
                                </div>
                                <div className="relative">
                                    <input
                                        type="number"
                                        className="w-full text-right bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-lg font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none hover:bg-white dark:hover:bg-slate-800 transition-colors"
                                        value={discountValue}
                                        onChange={(e) => setDiscountValue(Number(e.target.value))}
                                    />
                                    <span className="absolute left-3 top-3 text-slate-400">
                                        {discountType === 'PERCENTAGE' ? <Percent size={14} /> : 'R$'}
                                    </span>
                                </div>
                                {discount > 0 && (
                                    <p className="text-xs text-right text-green-600 mt-1 font-medium">
                                        - R$ {discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                )}
                            </div>

                            {/* Down Payment */}
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">Entrada</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        className="w-full text-right bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-lg font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none hover:bg-white dark:hover:bg-slate-800 transition-colors"
                                        value={downPayment}
                                        onChange={(e) => setDownPayment(Number(e.target.value))}
                                    />
                                    <span className="absolute left-3 top-3 text-slate-400 text-xs font-bold">R$</span>
                                </div>
                            </div>

                            {/* Installments with Dynamic Value */}
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">Parcelamento</label>
                                <select
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 dark:text-slate-200"
                                    value={installments}
                                    onChange={(e) => setInstallments(Number(e.target.value))}
                                >
                                    {[1, 2, 3, 4, 5, 6, 10, 12, 18, 24].map(n => {
                                        const valueToFinanceForOption = Math.max(0, final - downPayment);
                                        const installmentVal = n > 0 ? valueToFinanceForOption / n : 0;
                                        return (
                                            <option key={n} value={n}>
                                                {n}x {n === 1 ? '(À Vista)' : `de R$ ${installmentVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            {/* Summary Box */}
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 space-y-2 border border-indigo-100 dark:border-indigo-900/50">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Valor Bruto</span>
                                    <span className="text-slate-500 line-through decoration-red-400">R$ {gross.toLocaleString('pt-BR')}</span>
                                </div>
                                <div className="flex justify-between items-center text-lg font-black text-indigo-700">
                                    <span>Valor Final</span>
                                    <span>R$ {final.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="pt-2 border-t border-indigo-200/50 mt-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-indigo-800 uppercase">
                                            {installments}x de
                                        </span>
                                        <span className="text-xl font-black text-indigo-600">
                                            R$ {installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* --- 4. AÇÕES COMERCIAIS --- */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 grid gap-3">
                            <button
                                onClick={() => handleSave()}
                                disabled={saving}
                                className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-white py-3 rounded-lg font-bold transition shadow-sm"
                            >
                                <Save size={18} /> Salvar Proposta
                            </button>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={handleWhatsApp}
                                    className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1da851] text-white py-3 rounded-lg font-bold transition shadow-sm"
                                >
                                    <MessageCircle size={18} /> WhatsApp
                                </button>
                                <button className="flex items-center justify-center gap-2 bg-slate-800 dark:bg-slate-900 hover:bg-slate-900 dark:hover:bg-black text-white py-3 rounded-lg font-bold transition shadow-sm">
                                    <Printer size={18} /> PDF
                                </button>
                            </div>

                            {budget.status !== 'APPROVED' && (
                                <button
                                    onClick={() => handleSave("APPROVED")}
                                    disabled={saving}
                                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-bold transition shadow-lg shadow-indigo-200 mt-2"
                                >
                                    <CheckCircle2 size={18} /> Aprovar e Gerar Contrato
                                </button>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default BudgetDetail;
