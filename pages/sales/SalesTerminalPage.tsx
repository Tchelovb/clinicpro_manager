import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../utils/format';
import { Search, ShoppingCart, User, FileText, CheckSquare, Square, Trash2, Banknote } from 'lucide-react';
import toast from 'react-hot-toast';
import { PaymentModal } from '../../components/sales/PaymentModal';
import { cn } from '../../lib/utils';

// Interfaces simplificadas para o exemplo
interface Budget { id: string; created_at: string; total_value: number; doctor: { name: string }; items: BudgetItem[] }
interface BudgetItem { id: string; procedure_name: string; unit_value: number; region: string; tooth_number: number; treatment_id: string; total_value: number; quantity: number }

export const SalesTerminalPage: React.FC = () => {
    const { user } = useAuth();

    // Estados
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

    const [cartItems, setCartItems] = useState<BudgetItem[]>([]);
    const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
    const [discount, setDiscount] = useState<number>(0);

    const [isPaymentOpen, setIsPaymentOpen] = useState(false);

    // Busca Paciente
    useEffect(() => {
        if (searchTerm.length < 3) return;
        const delayDebounce = setTimeout(async () => {
            const { data } = await supabase.from('patients').select('id, name, cpf').ilike('name', `%${searchTerm}%`).limit(5);
            setSearchResults(data || []);
        }, 500);
        return () => clearTimeout(delayDebounce);
    }, [searchTerm]);

    // Carrega Orçamentos - LEI DO FECHAMENTO
    // BUSCA TUDO. Sem exceção. DRAFT, WAITING_CLOSING, APPROVED.
    // Se existe, a recepção vê. Só esconde o que já foi vendido/encerrado.
    const loadBudgets = async (patientId: string) => {
        const { data, error } = await supabase
            .from('budgets')
            .select(`
                id, created_at, total_value, final_value, status,
                sales_rep_id,
                doctor:users!doctor_id(name),
                items:budget_items(id, procedure_name, unit_value, region, tooth_number, total_value, quantity)
            `)
            .eq('patient_id', patientId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error loading budgets:', error);
            setBudgets([]);
            return;
        }

        // Filtra no frontend para evitar problemas de sintaxe
        const filtered = (data || []).filter((b: any) =>
            b.status !== 'CLOSED' && b.status !== 'REJECTED'
        );

        setBudgets(filtered as any);
        console.log(`Loaded ${filtered.length} budgets for patient ${patientId}`, filtered);
    };

    const handleSelectPatient = (patient: any) => {
        console.log('🔍 Patient selected:', patient);
        setSelectedPatient(patient);
        setSearchTerm('');
        setSearchResults([]);
        loadBudgets(patient.id);
        setCartItems([]);
        setSelectedItemIds(new Set());
        setSelectedBudget(null);
    };

    const handleSelectBudget = (budget: Budget) => {
        // Em vez de carregar no carrinho, redireciona para o Checkout
        // que tem o ritual completo de vendas
        console.log('🚀 Redirecting to checkout for budget:', budget.id);
        window.location.href = `/sales/checkout/${budget.id}`;
    };

    const toggleItem = (id: string) => {
        const newSet = new Set(selectedItemIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedItemIds(newSet);
    };

    // Cálculos
    const subtotal = cartItems
        .filter(i => selectedItemIds.has(i.id))
        .reduce((sum, i) => sum + i.total_value, 0); // Changed from unit_value to total_value

    const totalFinal = Math.max(0, subtotal - discount);

    // Lógica de Confirmação (Vinda do Modal)
    const handlePaymentSuccess = async (paymentData: any) => {
        if (!selectedPatient) return;

        try {
            const selectedItems = cartItems.filter(i => selectedItemIds.has(i.id));

            // 1. Criar Parcela (Entrada)
            const { data: installment, error: instError } = await supabase.from('financial_installments').insert({
                clinic_id: user?.clinic_id, // Assumindo contexto
                patient_id: selectedPatient.id,
                description: `Venda PDV - ${selectedItems.length} procedimentos`,
                amount: paymentData.paidAmount,
                due_date: new Date().toISOString(), // Hoje
                status: 'PAID', // Já entra pago
                payment_method: paymentData.method,
                created_at: new Date().toISOString()
            }).select().single();

            if (instError) throw instError;

            // 2. Se houver refinanciamento, criar parcela futura
            if (paymentData.isPartial && paymentData.remainderAction === 'reschedule') {
                const { error: rescheduleError } = await supabase.from('financial_installments').insert({
                    clinic_id: user?.clinic_id,
                    patient_id: selectedPatient.id,
                    description: `Saldo Restante - Venda PDV`,
                    amount: paymentData.remainderAmount,
                    due_date: paymentData.rescheduleDate,
                    status: 'PENDING'
                });
                if (rescheduleError) throw rescheduleError;
            }

            // 3. Atualizar Status Clínico (O Gatilho Mágico)
            // Aqui precisaríamos ligar o budget_item ao treatment_item. 
            // Em V1, vamos supor que o budget já gerou treatment_items ou vamos gerar agora.
            // Simplificação: Vamos criar treatment_items novos prontos para execução.

            const treatmentsPayload = selectedItems.map(item => ({
                clinic_id: user?.clinic_id, // Assumindo
                patient_id: selectedPatient.id,
                procedure_name: item.procedure_name,
                status: 'NOT_STARTED', // PRONTO PARA O DENTISTA
                unit_value: item.unit_value,
                total_value: item.total_value,
                quantity: item.quantity,

                budget_id: selectedBudget?.id // Linka ao orçamento selecionado
            }));

            const { error: treatmentError } = await supabase.from('treatment_items').insert(treatmentsPayload);
            if (treatmentError) throw treatmentError;

            // 4. Log de Auditoria
            const { error: auditError } = await supabase.from('system_audit_logs').insert({
                clinic_id: user?.clinic_id,
                user_id: user?.id,
                user_name: user?.name || 'Desconhecido',
                action_type: 'CREATE', // Creating a new transaction record
                entity_type: 'TRANSACTION',
                entity_id: installment?.id,
                // changes_summary: Venda PDV...
                changes_summary: `Venda PDV de ${formatCurrency(paymentData.paidAmount)} em ${paymentData.method}. Refinanciado: ${formatCurrency(paymentData.remainderAmount || 0)}.`
            });
            // Note: Ignoring audit error to not block UI success

            toast.success('Venda realizada com sucesso! Procedimentos liberados.');

            // Limpeza
            setCartItems([]);
            setSelectedPatient(null);
            setDiscount(0);

        } catch (error) {
            console.error(error);
            toast.error('Erro ao processar venda. Verifique os dados.');
        }
    };

    return (
        <div className="flex h-screen bg-slate-100 overflow-hidden">

            {/* ESQUERDA: Busca e Origem (30%) */}
            <aside className="w-[30%] bg-white border-r flex flex-col z-10 shadow-xl">
                <div className="p-6 bg-slate-50 border-b">
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
                        <ShoppingCart className="text-blue-600" /> Terminal de Vendas
                    </h1>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-lg"
                            placeholder="Buscar paciente..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        {/* Dropdown de Resultados */}
                        {searchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto">
                                {searchResults.map(p => (
                                    <div
                                        key={p.id}
                                        onClick={() => handleSelectPatient(p)}
                                        className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 flex items-center gap-3"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                            {p.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800">{p.name}</p>
                                            <p className="text-xs text-slate-500">CPF: {p.cpf}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {selectedPatient ? (
                        <>
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-center gap-3">
                                <User className="text-blue-600" />
                                <div>
                                    <p className="text-xs text-blue-500 uppercase font-bold">Cliente Selecionado</p>
                                    <p className="font-bold text-blue-900">{selectedPatient.name}</p>
                                </div>
                                <button onClick={() => setSelectedPatient(null)} className="ml-auto text-blue-400 hover:text-blue-600">
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-4 mb-2">Orçamentos Abertos</h3>
                            {budgets.length === 0 ? (
                                <p className="text-sm text-slate-400 italic text-center py-4">Nenhum orçamento pendente.</p>
                            ) : (
                                budgets.map(b => (
                                    <div
                                        key={b.id}
                                        onClick={() => handleSelectBudget(b)}
                                        className="bg-white p-4 rounded-xl border hover:border-blue-400 cursor-pointer shadow-sm transition-all hover:shadow-md group"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-bold text-slate-700">Orçamento #{b.id.slice(0, 4)}</span>
                                            <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded font-medium">
                                                {new Date(b.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 mb-2">Dr. {b.doctor?.name || 'Clínica'}</p>
                                        <div className="flex justify-between items-end">
                                            <span className="text-xs text-slate-400">{b.items.length} itens</span>
                                            <span className="font-bold text-emerald-600 text-lg">{formatCurrency(b.total_value)}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </>
                    ) : (
                        <div className="text-center py-20 text-slate-400">
                            <ShoppingCart size={48} className="mx-auto mb-4 opacity-20" />
                            <p>Busque um paciente para iniciar.</p>
                        </div>
                    )}
                </div>
            </aside>

            {/* DIREITA: Carrinho e Checkout (70%) */}
            <main className="flex-1 flex flex-col bg-white">
                {/* Header Carrinho */}
                <div className="h-16 border-b flex items-center justify-between px-8 bg-white">
                    <h2 className="text-lg font-bold text-slate-800">Itens Selecionados</h2>
                    <span className="text-sm text-slate-500">{selectedItemIds.size} itens marcados</span>
                </div>

                {/* Lista de Itens */}
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
                    {cartItems.length > 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b">
                                    <tr>
                                        <th className="w-12 p-4 text-center">
                                            <CheckSquare size={16} className="text-slate-400 mx-auto" />
                                        </th>
                                        <th className="p-4 text-xs font-bold text-slate-500 uppercase">Procedimento</th>
                                        <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Valor</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {cartItems.map(item => {
                                        const isSelected = selectedItemIds.has(item.id);
                                        return (
                                            <tr
                                                key={item.id}
                                                className={cn("transition-colors", isSelected ? "bg-white" : "bg-slate-50 opacity-60")}
                                                onClick={() => toggleItem(item.id)}
                                            >
                                                <td className="p-4 text-center cursor-pointer">
                                                    {isSelected
                                                        ? <CheckSquare className="text-blue-600 mx-auto" />
                                                        : <Square className="text-slate-300 mx-auto" />}
                                                </td>
                                                <td className="p-4">
                                                    <p className="font-bold text-slate-800">{item.procedure_name}</p>
                                                    <p className="text-xs text-slate-500">
                                                        {item.tooth_number ? `Dente ${item.tooth_number}` : (item.region || 'Geral')}
                                                    </p>
                                                </td>
                                                <td className="p-4 text-right font-medium text-slate-700">
                                                    {formatCurrency(item.unit_value)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-200 rounded-2xl">
                            <FileText size={64} className="mb-4" />
                            <p className="text-xl font-medium">O carrinho está vazio</p>
                            <p>Selecione um orçamento à esquerda.</p>
                        </div>
                    )}
                </div>

                {/* Footer Checkout */}
                <div className="h-32 bg-white border-t p-6 flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-20">
                    <div className="flex gap-8">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Subtotal</p>
                            <p className="text-xl font-medium text-slate-600">{formatCurrency(subtotal)}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Desconto</p>
                            <input
                                type="number"
                                value={discount}
                                onChange={e => setDiscount(Number(e.target.value))}
                                className="w-32 border-b-2 border-slate-200 focus:border-blue-500 outline-none text-lg font-medium text-slate-600 bg-transparent"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-sm font-bold text-slate-500 uppercase">Total a Pagar</p>
                            <p className="text-4xl font-bold text-slate-900">{formatCurrency(totalFinal)}</p>
                        </div>
                        <button
                            onClick={() => setIsPaymentOpen(true)}
                            disabled={totalFinal <= 0 || !selectedPatient}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white h-16 px-8 rounded-xl font-bold text-lg shadow-lg shadow-green-200 transition-all active:scale-95 flex items-center gap-3"
                        >
                            <Banknote size={24} />
                            RECEBER
                        </button>
                    </div>
                </div>
            </main>

            {/* MODAL DE PAGAMENTO */}
            <PaymentModal
                open={isPaymentOpen}
                onOpenChange={setIsPaymentOpen}
                totalAmount={totalFinal}
                patientName={selectedPatient?.name || ''}
                onConfirm={handlePaymentSuccess}
            />
        </div>
    );
};
