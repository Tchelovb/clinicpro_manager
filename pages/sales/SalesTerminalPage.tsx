import React, { useState, useEffect } from 'react';
import {
    Check, CreditCard, Calendar, ArrowLeft, ShieldAlert,
    Lock, Wallet, ChevronRight, Search, Clock, DollarSign, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '../../utils/format';
import toast from 'react-hot-toast';
import { addDays } from 'date-fns';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

// --- MODAL DE PIN ---
const PinModal = ({ isOpen, onClose, onConfirm, actionType, value }: any) => {
    const [pin, setPin] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        // Em produção, validar o hash do PIN no banco
        if (pin === '1234') {
            onConfirm();
            setPin('');
        } else {
            toast.error('PIN Incorreto');
            setPin('');
        }
    };

    const title = actionType === 'FINISH_SALE' ? 'Autorizar Venda' : 'Autorizar Alteração';
    const description = actionType === 'FINISH_SALE'
        ? `Digite seu PIN para confirmar o recebimento de ${formatCurrency(value)}`
        : 'Digite o PIN do gestor para remover este item.';
    const colorClass = actionType === 'FINISH_SALE' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600';

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl">
                <div className="flex flex-col items-center mb-6">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${colorClass}`}>
                        {actionType === 'FINISH_SALE' ? <Check size={24} /> : <Lock size={24} />}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">{title}</h3>
                    <p className="text-sm text-center text-slate-500 mt-1">{description}</p>
                </div>
                <input type="password" autoFocus className="w-full text-center text-3xl font-bold tracking-widest border-b-2 border-gray-200 py-2 focus:border-indigo-500 outline-none mb-8" maxLength={4} value={pin} onChange={e => setPin(e.target.value)} placeholder="••••" />
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl">Cancelar</button>
                    <button onClick={handleSubmit} className="flex-1 py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow-lg">Confirmar</button>
                </div>
            </motion.div>
        </div>
    );
};

// --- PASSO 1: CONFERÊNCIA ---
const StepConference = ({ items, onToggleItem, onNext, totals, patientName }: any) => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col bg-white">
        <div className="p-8 border-b border-gray-100">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Conferência de Itens</h2>
                    <p className="text-slate-500">Paciente: <span className="font-bold text-indigo-600">{patientName}</span></p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-400 uppercase font-bold">TOTAL A PAGAR</p>
                    <p className="text-3xl font-bold text-indigo-600">{formatCurrency(totals.selectedTotal)}</p>
                </div>
            </div>
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1"><ShieldAlert size={12} /> Desmarcar itens requer autorização (PIN).</p>
        </div>
        <div className="flex-1 overflow-y-auto p-8 pb-64">
            <div className="space-y-3">
                {items.map((item: any) => (
                    <div key={item.id} className={`flex items-center p-4 rounded-xl border transition-all ${item.selected ? 'border-indigo-100 bg-white shadow-sm' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
                        <div onClick={() => onToggleItem(item)} className={`w-8 h-8 md:w-6 md:h-6 rounded border-2 cursor-pointer flex items-center justify-center mr-4 transition-colors ${item.selected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300 hover:border-red-400'}`}>
                            {item.selected && <Check size={18} className="md:w-3.5 md:h-3.5" />}
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-slate-800">{item.procedure_name}</p>
                            <p className="text-xs text-gray-500">{item.quantity}x • {item.region || 'Região Geral'} {item.face ? `(${item.face})` : ''}</p>
                        </div>
                        <div className="font-bold text-slate-900">{formatCurrency(item.total_value || (item.unit_value * item.quantity))}</div>
                    </div>
                ))}
            </div>
        </div>
        <div className="p-6 border-t border-gray-200 bg-white shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.2)] flex justify-end fixed bottom-0 md:bottom-0 left-0 w-full z-50 md:relative md:w-auto md:shadow-none md:bg-gray-50 md:backdrop-blur-none">
            <button onClick={onNext} className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-transform active:scale-95">
                Confirmar e Negociar <ChevronRight size={20} />
            </button>
        </div>
    </motion.div>
);

// --- PASSO 2: PAGAMENTO ---
const StepNegotiation = ({ negotiation, setNegotiation, totals, onNext, onBack }: any) => {
    const discountAmount = (totals.selectedTotal * negotiation.discount) / 100;
    const finalTotal = totals.selectedTotal - discountAmount;
    const remaining = finalTotal - negotiation.entry;
    const installmentCount = negotiation.installments || 1;
    const installmentValue = remaining / installmentCount;

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="h-full flex flex-col p-8 bg-white">
            <button onClick={onBack} className="flex items-center text-gray-400 hover:text-slate-800 gap-2 mb-6 font-bold text-sm w-fit"><ArrowLeft size={16} /> Voltar</button>
            <h2 className="text-3xl font-bold text-slate-900 mb-8">Pagamento</h2>
            <div className="flex-1 overflow-y-auto pb-64">
                <div className="grid grid-cols-2 gap-4 mb-4 md:mb-8">
                    {['PIX', 'CARTÃO', 'DINHEIRO', 'BOLETO'].map(m => (
                        <button key={m} onClick={() => setNegotiation({ ...negotiation, method: m })} className={`p-6 md:p-6 rounded-2xl border-2 text-left transition-all active:scale-95 ${negotiation.method === m ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-500' : 'border-gray-100 hover:border-gray-200'}`}>
                            <span className="block text-xs font-bold text-gray-400 uppercase mb-2">{m}</span>
                            <span className="block text-lg font-bold text-slate-800">{m === 'PIX' ? '5% Off' : m === 'CARTÃO' ? 'Até 12x' : '-'}</span>
                        </button>
                    ))}
                </div>
                <div className="bg-gray-50 p-6 rounded-2xl space-y-6 border border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase">Entrada</label>
                            <input type="number" value={negotiation.entry} onChange={e => setNegotiation({ ...negotiation, entry: Number(e.target.value) })} className="w-full mt-1 p-4 md:p-3 bg-white border border-gray-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500 text-lg md:text-base" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase">{negotiation.method === 'BOLETO' ? '1º Vencimento' : 'Parcelas'}</label>
                            {negotiation.method === 'BOLETO' ? (
                                <input type="date" value={negotiation.firstDueDate} onChange={e => setNegotiation({ ...negotiation, firstDueDate: e.target.value })} className="w-full mt-1 p-4 md:p-3 bg-white border border-gray-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500 text-slate-600 text-lg md:text-base" />
                            ) : (
                                <select value={negotiation.installments} onChange={e => setNegotiation({ ...negotiation, installments: Number(e.target.value) })} className="w-full mt-1 p-4 md:p-3 bg-white border border-gray-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500 text-lg md:text-base" disabled={['PIX', 'DINHEIRO'].includes(negotiation.method)}>
                                    {[1, 2, 3, 4, 5, 6, 10, 12, 18, 24].map(x => <option key={x} value={x}>{x}x</option>)}
                                </select>
                            )}
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase">Desconto %</label>
                            <input type="number" value={negotiation.discount} onChange={e => setNegotiation({ ...negotiation, discount: Number(e.target.value) })} className="w-full mt-1 p-4 md:p-3 bg-white border border-gray-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500 text-lg md:text-base" />
                        </div>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                        <span className="text-gray-500 font-medium">Parcela Final</span>
                        <span className="text-3xl font-bold text-indigo-700">{installmentCount}x {formatCurrency(installmentValue)}</span>
                    </div>
                </div>
            </div>
            <div className="p-4 border-t border-gray-200 bg-white shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.2)] fixed bottom-0 md:bottom-0 left-0 w-full z-50 md:relative md:shadow-none">
                <button onClick={onNext} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-black transition-all shadow-xl">
                    <FileText size={20} className="inline mr-2" />
                    Revisar Lançamento
                </button>
            </div>
        </motion.div>
    );
};

// --- PASSO 3: FINALIZAR ---
const StepFinish = ({ onBack, onFinish, totals, negotiation }: any) => {
    const discount = (totals.selectedTotal * negotiation.discount) / 100;
    const finalTotal = totals.selectedTotal - discount;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col p-8 bg-white items-center justify-center text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-6"><Check size={40} /></div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Tudo Pronto!</h2>
            <p className="text-gray-500 mb-8 max-w-md">Confirme o recebimento de <strong className="text-emerald-600">{formatCurrency(finalTotal)}</strong> via <strong className="uppercase">{negotiation.method}</strong>.</p>
            <div className="flex gap-4 w-full max-w-md">
                <button onClick={onBack} className="flex-1 py-4 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition-colors">Voltar</button>
                <button onClick={onFinish} className="flex-[2] py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition-transform active:scale-95 flex items-center justify-center gap-2">
                    <Check size={20} /> Aprovar e Lançar Venda
                </button>
            </div>
        </motion.div>
    );
};

// --- COMPONENTE PRINCIPAL ---
export function SalesTerminalPage() {
    const { user } = useAuth();
    const [queue, setQueue] = useState<any[]>([]);
    const [selectedBudget, setSelectedBudget] = useState<any>(null);
    const [step, setStep] = useState(1);
    const [items, setItems] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [pinModalOpen, setPinModalOpen] = useState(false);
    const [itemToUncheck, setItemToUncheck] = useState<any>(null);
    const [authAction, setAuthAction] = useState<'UNCHECK_ITEM' | 'FINISH_SALE' | null>(null);
    const [loading, setLoading] = useState(true);

    const [viewMode, setViewMode] = useState<'QUEUE' | 'TERMINAL'>('QUEUE'); // Mobile Navigation Control

    const [negotiation, setNegotiation] = useState({
        method: 'CARTÃO', installments: 1, entry: 0, discount: 0, firstDueDate: ''
    });

    // --- BUSCA DE DADOS (CORRIGIDA) ---
    const fetchSalesQueue = async () => {
        // Nota: Removido check de clinic_id para garantir que apareça em dev, 
        // mas em produção o RLS do Supabase já filtra por usuário.
        // DEBUG: Passo 1 - O Teste da Verdade
        console.log("🔍 Buscando orçamentos para a clínica:", user?.clinic_id);

        try {
            let query = supabase
                .from('budgets')
                .select(`
          id, total_value, created_at, status,
          patient:patients(id, name),
          doctor:users!doctor_id(name),
          items:budget_items(*)
        `)
                //.eq('clinic_id', user.clinic_id) // DEBUG: Passo 3 - O Problema do clinic_id
                // AMPLIA OS STATUS ACEITOS para garantir que não suma
                .in('status', ['DRAFT', 'PENDING', 'WAITING_CLOSING'])
                .order('created_at', { ascending: false });

            // Se NÃO tiver busca, limita aos 10 últimos (Performance + UX)
            if (!searchTerm) {
                query = query.limit(10);
            }

            const { data, error } = await query;
            console.log("📋 O que tem no banco DE VERDADE:", data);
            console.log("❌ Erro se houver:", error);

            if (error) throw error;

            const formatted = data.map((b: any) => ({
                id: b.id,
                patientName: b.patient?.name || 'Paciente Sem Nome',
                patientId: b.patient?.id,
                doctorName: b.doctor?.name || 'Clínica',
                totalValue: b.total_value,
                createdAt: new Date(b.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                // Mapeia os itens do orçamento para o formato do terminal
                items: b.items.map((i: any) => ({ ...i, selected: true }))
            }));

            // Filtro local adicional se tiver busca (para refinar o nome)
            const finalQueue = searchTerm
                ? formatted.filter((b: any) => b.patientName.toLowerCase().includes(searchTerm.toLowerCase()))
                : formatted;

            setQueue(finalQueue);
        } catch (err) {
            console.error(err);
            toast.error('Erro ao carregar fila');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSalesQueue();
        // Realtime para atualizar quando o Dr. salvar lá
        const channel = supabase.channel('sales_terminal_updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'budgets' }, fetchSalesQueue)
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [searchTerm]); // Recarrega se mudar a busca para tirar o limit

    const totals = {
        selectedTotal: items.filter(i => i.selected).reduce((acc, i) => acc + (i.total_value || (i.unit_value * i.quantity)), 0)
    };

    // --- LÓGICA DE SALVAMENTO REAL ---
    const finalizeSale = async () => {
        const loadingToast = toast.loading('Processando Transação Segura...');

        try {
            // Preparando os Arrays
            const discountAmount = (totals.selectedTotal * negotiation.discount) / 100;
            const finalValue = totals.selectedTotal - discountAmount;

            // 1. Array Clínico (Tratamentos)
            const clinicalItemsPayload = items.filter(i => i.selected).map(item => ({
                procedure_name: item.procedure_name,
                region: item.region,
                face: item.face,
                unit_value: item.unit_value,
                total_value: item.total_value || (item.unit_value * item.quantity),
                quantity: item.quantity
            }));

            // 2. Array Financeiro (Parcelas Calculadas)
            const installmentsPayload = [];
            const installmentValue = (finalValue - negotiation.entry) / (negotiation.installments || 1);

            // Se tiver entrada, poderia ser uma parcela 0 ou um lançamento de caixa separado.
            // Aqui focamos nas parcelas a vencer:
            for (let i = 1; i <= (negotiation.installments || 1); i++) {
                installmentsPayload.push({
                    description: `Parcela ${i}/${negotiation.installments} - ${selectedBudget.patientName}`,
                    amount: installmentValue,
                    due_date: addDays(new Date(negotiation.firstDueDate || new Date()), i * 30).toISOString(),
                    installment_number: i
                });
            }

            // 3. O Payload Mestre
            const payload = {
                budget_id: selectedBudget.id,
                patient_id: selectedBudget.patientId,
                clinic_id: user?.clinic_id, // Importante: Multi-tenancy
                created_by: user?.id,

                // Valores Totais
                total_value: totals.selectedTotal,
                discount_value: discountAmount,
                final_value: finalValue,

                // Configuração
                payment_method: negotiation.method,
                installments_count: negotiation.installments,

                // Os Arrays Prontos
                clinical_items: clinicalItemsPayload,
                installments_data: installmentsPayload
            };

            // 4. A Chamada RPC (Tudo ou Nada)
            const { data, error } = await supabase.rpc('process_sale_transaction', { payload });

            if (error) throw error;

            toast.dismiss(loadingToast);
            toast.success('Venda Lançada com Sucesso! 🚀');

            // Reset da Tela
            setSelectedBudget(null);
            fetchSalesQueue(); // Atualiza a fila para sumir o orçamento processado

        } catch (error: any) {
            console.error(error);
            toast.dismiss(loadingToast);
            toast.error('Erro na transação: ' + error.message);
        }
    };

    // Handlers de UI
    const handleSelectBudget = (budget: any) => {
        setSelectedBudget(budget);
        setItems(budget.items);
        setStep(1);
        setNegotiation({ method: 'CARTÃO', installments: 1, entry: 0, discount: 0, firstDueDate: '' });
        setViewMode('TERMINAL'); // Switch to Terminal View on Mobile
    };

    const handleBackToQueue = () => {
        setViewMode('QUEUE');
        setSelectedBudget(null);
    };

    const handleToggleItem = (item: any) => {
        if (item.selected) {
            setItemToUncheck(item);
            setAuthAction('UNCHECK_ITEM');
            setPinModalOpen(true);
        } else {
            setItems(items.map(i => i.id === item.id ? { ...i, selected: true } : i));
        }
    };

    const onPinConfirmed = () => {
        if (authAction === 'UNCHECK_ITEM') {
            setItems(items.map(i => i.id === itemToUncheck.id ? { ...i, selected: false } : i));
            toast.success('Item removido com autorização');
        } else if (authAction === 'FINISH_SALE') {
            finalizeSale();
        }
        setPinModalOpen(false);
        setAuthAction(null);
        setItemToUncheck(null);
    };

    return (
        <div className="flex h-[100dvh] bg-gray-50 font-sans overflow-hidden">
            {/* COLUNA ESQUERDA: RECEPÇÃO (Mobile: Full Screen if QUEUE / Desktop: 4/12) */}
            <div className={`bg-white border-r border-gray-200 flex flex-col z-20 shadow-lg md:w-4/12 md:flex ${viewMode === 'QUEUE' ? 'w-full flex' : 'hidden'}`}>
                <div className="p-6 border-b border-gray-100">
                    <h1 className="text-2xl font-bold text-slate-800 mb-1">Terminal de Vendas</h1>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">AGUARDANDO APROVAÇÃO</p>
                    <div className="relative">
                        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar paciente..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto pb-32">
                    {loading && <div className="p-6 text-center text-gray-400">Carregando fila...</div>}
                    {!loading && queue.length === 0 && <div className="p-6 text-center text-gray-400">Nenhum orçamento pendente.</div>}
                    {queue.map(budget => (
                        <div key={budget.id} onClick={() => handleSelectBudget(budget)} className={`p-5 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors group relative ${selectedBudget?.id === budget.id ? 'bg-indigo-50/50 border-l-4 border-l-indigo-600' : 'border-l-4 border-l-transparent'}`}>
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold text-sm">{budget.patientName.charAt(0).toUpperCase()}</div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-sm">{budget.patientName}</h3>
                                        <div className="flex items-center gap-1 text-[10px] text-gray-400"><Clock size={10} /> {budget.createdAt}</div>
                                    </div>
                                </div>
                                <ChevronRight size={16} className={`text-gray-300 transition-transform ${selectedBudget?.id === budget.id ? 'text-indigo-600 rotate-90' : 'group-hover:translate-x-1'}`} />
                            </div>
                            <div className="flex justify-between items-end pl-13">
                                <span className="text-xs text-gray-400">{budget.items.length} itens</span>
                                <span className="font-bold text-slate-900">{formatCurrency(budget.totalValue)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* COLUNA DIREITA (Mobile: Full Screen if TERMINAL / Desktop: Flex-1) */}
            <div className={`bg-gray-50 relative overflow-hidden flex flex-col md:flex-1 md:flex ${viewMode === 'TERMINAL' ? 'w-full flex h-full fixed inset-0 z-30' : 'hidden'}`}>
                {selectedBudget ? (
                    <>
                        <div className="h-16 bg-white border-b px-4 md:px-8 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <button onClick={handleBackToQueue} className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full">
                                    <ArrowLeft size={20} />
                                </button>
                                <div className="font-bold text-lg text-slate-800">Terminal <span className="text-indigo-600">Vendas</span></div>
                            </div>
                            <div className="flex items-center gap-4">
                                {[1, 2, 3].map(n => (
                                    <div key={n} className={`flex items-center gap-2 ${step >= n ? 'opacity-100' : 'opacity-30'}`}>
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= n ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>{n}</div>
                                        <span className="text-sm font-medium hidden lg:inline">{n === 1 ? 'Conferência' : n === 2 ? 'Pagamento' : 'Finalizar'}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="w-20"></div>
                        </div>
                        <div className="flex-1 relative overflow-hidden pb-36">
                            <AnimatePresence mode="wait">
                                {step === 1 && <StepConference key="conf" items={items} onToggleItem={handleToggleItem} onNext={() => setStep(2)} totals={totals} patientName={selectedBudget.patientName} />}
                                {step === 2 && <StepNegotiation key="neg" negotiation={negotiation} setNegotiation={setNegotiation} totals={totals} onBack={() => setStep(1)} onNext={() => setStep(3)} />}
                                {step === 3 && <StepFinish key="fin" totals={totals} negotiation={negotiation} onBack={() => setStep(2)} onFinish={() => { setAuthAction('FINISH_SALE'); setPinModalOpen(true); }} />}
                            </AnimatePresence>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6"><Wallet size={48} className="opacity-20 text-gray-500" /></div>
                        <h2 className="text-xl font-bold text-gray-400">Pronto para vender</h2>
                        <p className="max-w-xs text-center text-sm mt-2 opacity-60">Selecione um paciente na fila à esquerda para iniciar o recebimento.</p>
                    </div>
                )}
            </div>
            <PinModal isOpen={pinModalOpen} onClose={() => setPinModalOpen(false)} onConfirm={onPinConfirmed} actionType={authAction} value={totals.selectedTotal} />
        </div>
    );
}
