// ProfessionalStatement.tsx – Painel de Fechamento de Honorários
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { X, Search, Calendar, Save, Loader2, DollarSign, Percent, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

// Helper to format currency
const fmtCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export const ProfessionalStatement: React.FC = () => {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [professionals, setProfessionals] = useState<Array<{ id: string; name: string }>>([]);
    const [selectedProf, setSelectedProf] = useState<string>('');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [items, setItems] = useState<Array<any>>([]);

    // Fetch list of professionals for the dropdown
    useEffect(() => {
        if (!profile?.clinic_id) return;
        const fetchProfs = async () => {
            const { data, error } = await supabase
                .from('professionals')
                .select('id, name')
                .eq('clinic_id', profile.clinic_id)
                .order('name');
            if (error) console.error(error);
            else setProfessionals(data || []);
        };
        fetchProfs();
    }, [profile]);

    const loadData = async () => {
        if (!profile?.clinic_id || !selectedProf) return;
        setLoading(true);
        try {
            // Build query on the view that already calcula o repasse
            let query = supabase
                .from('view_professional_production_pending')
                .select('*')
                .eq('professional_id', selectedProf)
                .eq('clinic_id', profile.clinic_id)
                .eq('status', 'COMPLETED'); // status is already filtered in view but keep for safety

            if (startDate) query = query.gte('production_date', startDate);
            if (endDate) query = query.lte('production_date', endDate);

            const { data, error } = await query;
            if (error) throw error;
            setItems(data || []);
        } catch (e) {
            console.error(e);
            toast.error('Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    // Summary calculations
    const totalProduced = items.reduce((acc, cur) => acc + (cur.total_charged || 0), 0);
    const totalRepasses = items.reduce((acc, cur) => acc + (cur.unit_commission_value || 0), 0);
    const clinicMargin = totalProduced - totalRepasses;

    const handleGeneratePdf = () => {
        window.print(); // simple print, can be enhanced with html2pdf later
    };

    const handleConfirmPayment = async () => {
        if (!profile?.clinic_id) return;
        setSaving(true);
        try {
            const { error } = await supabase.from('expenses').insert([
                {
                    clinic_id: profile.clinic_id,
                    description: 'Repasse de Honorários',
                    amount: totalRepasses,
                    expense_category: 'Repasse de Honorários',
                    expense_date: new Date().toISOString().split('T')[0],
                    created_at: new Date().toISOString(),
                },
            ]);
            if (error) throw error;
            toast.success('Despesa de repasse criada');
        } catch (e) {
            console.error(e);
            toast.error('Falha ao confirmar pagamento');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <select
                    value={selectedProf}
                    onChange={(e) => setSelectedProf(e.target.value)}
                    className="border rounded p-2 bg-white dark:bg-slate-700"
                >
                    <option value="">Selecione o Profissional</option>
                    {professionals.map((p) => (
                        <option key={p.id} value={p.id}>
                            {p.name}
                        </option>
                    ))}
                </select>
                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border rounded p-2 bg-white dark:bg-slate-700"
                />
                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border rounded p-2 bg-white dark:bg-slate-700"
                />
                <button
                    onClick={loadData}
                    disabled={loading || !selectedProf}
                    className="flex items-center justify-center bg-primary-600 text-white rounded p-2 hover:bg-primary-700 transition"
                >
                    {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : <Search size={16} className="mr-2" />}
                    Buscar
                </button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-gray-50 dark:bg-slate-900 rounded-lg text-center">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Produzido</h3>
                    <p className="text-xl font-bold text-primary-600">{fmtCurrency(totalProduced)}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-slate-900 rounded-lg text-center">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">Total de Repasses</h3>
                    <p className="text-xl font-bold text-green-600">{fmtCurrency(totalRepasses)}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-slate-900 rounded-lg text-center">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">Margem da Clínica</h3>
                    <p className="text-xl font-bold text-red-600">{fmtCurrency(clinicMargin)}</p>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-100 dark:bg-slate-800">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Data</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Paciente</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Procedimento</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Preço de Venda</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Regra Aplicada</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Repasse</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800">
                        {items.map((it) => (
                            <tr key={it.item_id} className="border-b border-gray-100 dark:border-gray-700">
                                <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
                                    {format(new Date(it.production_date), 'dd/MM/yyyy')}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">{it.patient_name}</td>
                                <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">{it.procedure_name}</td>
                                <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 text-right">
                                    {fmtCurrency(it.total_charged)}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
                                    {it.fee_type === 'FIXED'
                                        ? `R$ ${it.fee_value.toFixed(2)}`
                                        : `${it.fee_value}%`}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 text-right">
                                    {fmtCurrency(it.unit_commission_value)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-4 mt-6">
                <button
                    onClick={handleGeneratePdf}
                    className="px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-slate-600 transition"
                >
                    Gerar Extrato (PDF/Print)
                </button>
                <button
                    onClick={handleConfirmPayment}
                    disabled={saving}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition flex items-center"
                >
                    {saving && <Loader2 className="animate-spin mr-2" size={16} />}
                    Confirmar Pagamento
                </button>
            </div>
        </div>
    );
};
