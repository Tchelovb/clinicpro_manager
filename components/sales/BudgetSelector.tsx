import React, { useEffect, useState } from 'react';
import { supabase } from '../../src/lib/supabase';
import { FileText, Calendar, ChevronRight, AlertCircle } from 'lucide-react';
import { cn } from '../../src/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BudgetSelectorProps {
    patientId: string;
    onSelectBudget: (budget: any) => void;
}

export const BudgetSelector: React.FC<BudgetSelectorProps> = ({ patientId, onSelectBudget }) => {
    const [budgets, setBudgets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBudgets = async () => {
            setLoading(true);
            // Fetch budgets that are DRAFT (Orcamento) or PENDING (Aprovado mas nao pago? actually PENDING usually means waiting approval)
            // User prompt says: "Lista orçamentos com status DRAFT ou PENDING"
            const { data, error } = await supabase
                .from('budgets')
                .select('*, items:budget_items(*)')
                .eq('patient_id', patientId)
                .in('status', ['DRAFT', 'PENDING'])
                .order('created_at', { ascending: false });

            if (data) setBudgets(data);
            setLoading(false);
        };

        if (patientId) {
            fetchBudgets();
        }
    }, [patientId]);

    if (loading) return <div className="p-4 text-center text-slate-400 text-sm">Carregando orçamentos...</div>;

    if (budgets.length === 0) {
        return (
            <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                <FileText className="mx-auto text-slate-300 mb-2" size={32} />
                <p className="text-sm font-medium text-slate-500">Nenhum orçamento pendente.</p>
                <p className="text-xs text-slate-400">Crie um novo orçamento no perfil do paciente.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Orçamentos Disponíveis</h3>
            {budgets.map(budget => (
                <button
                    key={budget.id}
                    onClick={() => onSelectBudget(budget)}
                    className="w-full bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 hover:ring-1 hover:ring-blue-300 transition-all text-left group relative overflow-hidden"
                >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

                    <div className="flex justify-between items-start mb-2">
                        <span className="bg-blue-50 text-blue-700 text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wide">
                            #{budget.id.slice(0, 8)}
                        </span>
                        <span className="text-slate-400 text-xs flex items-center gap-1">
                            <Calendar size={12} />
                            {format(new Date(budget.created_at), "dd MMM yyyy", { locale: ptBR })}
                        </span>
                    </div>

                    <div className="mb-3">
                        <h4 className="font-bold text-slate-700 text-sm line-clamp-1">{budget.title || `Orçamento de ${format(new Date(budget.created_at), "dd/MM")}`}</h4>
                        <p className="text-xs text-slate-400">{budget.items?.length || 0} itens</p>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                        <span className="font-black text-slate-700">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(budget.total_value || 0)}
                        </span>
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <ChevronRight size={14} />
                        </div>
                    </div>
                </button>
            ))}
        </div>
    );
};
