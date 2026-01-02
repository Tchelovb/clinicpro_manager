import React, { useState } from 'react';
import {
    User, Tag, ChevronRight, ArrowLeft, Check,
    Calendar, FileText, DollarSign, ShieldCheck,
    Search, Trash2, Plus, ShoppingBag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '../../utils/format';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { useBudgetStudio } from '../../hooks/useBudgetStudio';
import { addDays } from 'date-fns';

// --- PASSO 1: CONFIGURAÇÃO ---
const StepConfiguration = ({ onNext, config, setConfig }: any) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -50 }}
        className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto text-center px-4"
    >
        <div className="bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-gray-100 w-full">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-indigo-600">
                <User size={28} />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Novo Orçamento</h2>
            <p className="text-slate-500 mb-8">Quem será o responsável por esta negociação?</p>

            <div className="space-y-5 text-left">
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Profissional</label>
                    <select
                        value={config.professional}
                        onChange={e => setConfig({ ...config, professional: e.target.value })}
                        className="w-full mt-2 p-3 bg-gray-50 border border-gray-200 rounded-xl font-semibold text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    >
                        <option value="dr-marcelo">Dr. Marcelo Vilas Bôas</option>
                        <option value="dra-julia">Dra. Julia</option>
                    </select>
                </div>

                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Tabela de Preços</label>
                    <select
                        value={config.table}
                        onChange={e => setConfig({ ...config, table: e.target.value })}
                        className="w-full mt-2 p-3 bg-gray-50 border border-gray-200 rounded-xl font-semibold text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    >
                        <option value="particular-2026">Particular 2026 (Padrão)</option>
                        <option value="convenio">Convênio / Parceiros</option>
                        <option value="black-friday">Campanha Black Friday</option>
                    </select>
                </div>
            </div>

            <button onClick={onNext} className="w-full mt-8 bg-slate-900 hover:bg-black text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-transform active:scale-[0.98]">
                Iniciar <ChevronRight size={20} />
            </button>
        </div>
    </motion.div>
);


const calculateQuantityFromRegion = (text: string) => {
    const parts = text.split(/[\s,;-]+/).filter(part => part.trim().length > 0);
    return parts.length > 0 ? parts.length : 1;
};

// --- PASSO 2: SELEÇÃO ---
const StepSelection = ({ onNext, onBack, cart, addItem, removeItem, procedures, config }: any) => {
    const [selectedProc, setSelectedProc] = useState<any>(null);
    const [region, setRegion] = useState('');
    const [face, setFace] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [showNewProcModal, setShowNewProcModal] = useState(false);

    const filteredProcs = searchTerm
        ? procedures.filter((p: any) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
        : [];


    const handleAddItem = () => {
        if (!selectedProc) return toast.error('Selecione um procedimento');

        // 1. Detecta se há múltiplos dentes/regiões separados por vírgula, espaço, ponto e vírgula
        const regions = region.split(/[\s,;.-]+/).filter(r => r.trim().length > 0);

        // 2. Se tiver múltiplas regiões, cria UM ITEM PARA CADA
        if (regions.length > 0) {
            // Adiciona múltiplos itens
            regions.forEach(singleRegion => {
                addItem({
                    ...selectedProc,
                    // uniqueId: Math.random(), // O hook useBudgetStudio deve gerar IDs se necessário, ou passamos aqui
                    quantity: 1, // Sempre 1 por linha para controle clínico individual
                    region: singleRegion, // "11", depois "12", depois "13"
                    face: face // Mantém a face selecionada para todos
                });
            });

            toast.success(`${regions.length} itens adicionados individualmente!`);
        } else {
            // Caso padrão (sem região específica ou região única)
            addItem({
                ...selectedProc,
                quantity: quantity,
                region: region,
                face: face
            });
            toast.success('Item adicionado!');
        }

        setSelectedProc(null);
        setSearchTerm('');
        setRegion('');
        setFace('');
        setQuantity(1);
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col bg-white max-w-5xl mx-auto border-x border-gray-100 shadow-sm">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><ArrowLeft size={20} /></button>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Adicionar Itens</h2>
                        <p className="text-xs text-gray-400">Tabela ativa: <span className="text-indigo-600 font-bold">{config?.table || 'Padrão'}</span></p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-400 uppercase">Subtotal Atual</p>
                    <p className="text-2xl font-bold text-indigo-600">
                        {formatCurrency(cart.reduce((acc: number, item: any) => acc + (item.unit_value * item.quantity), 0))}
                    </p>
                </div>
            </div>

            {/* Barra de Inserção */}
            <div className="p-6 bg-slate-50 border-b border-gray-200">
                <div className="flex flex-col md:flex-row gap-3 items-end">
                    <div className="flex-grow relative z-20 w-full md:w-auto">
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Procedimento</label>
                        <div className="relative">
                            <div className="absolute left-3 top-3 text-gray-400"><Search size={16} /></div>
                            <input
                                type="text"
                                placeholder="Digite para buscar..."
                                value={searchTerm}
                                onChange={e => {
                                    setSearchTerm(e.target.value);
                                    if (!e.target.value) setSelectedProc(null);
                                }}
                                className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                            />
                            {searchTerm && !selectedProc && filteredProcs.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto z-50">
                                    {filteredProcs.map((proc: any) => (
                                        <div
                                            key={proc.id}
                                            onClick={() => {
                                                setSelectedProc(proc);
                                                setSearchTerm(proc.name);
                                            }}
                                            className="p-3 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-0 flex justify-between"
                                        >
                                            <span className="font-medium text-slate-700">{proc.name}</span>
                                            <span className="text-sm text-gray-500">{formatCurrency(proc.base_price)}</span>
                                        </div>
                                    ))}
                                    <div
                                        onClick={() => setShowNewProcModal(true)}
                                        className="p-3 bg-gray-50 text-indigo-600 font-bold text-sm cursor-pointer hover:bg-gray-100 flex items-center gap-2"
                                    >
                                        <Plus size={14} /> Cadastrar "{searchTerm}" agora
                                    </div>
                                </div>
                            )}
                        </div>
                        {selectedProc && (
                            <div className="absolute right-3 top-9 text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                {formatCurrency(selectedProc.base_price)}
                            </div>
                        )}
                    </div>

                    <div className="w-full md:w-48">
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Dente / Região</label>
                        <input
                            type="text"
                            placeholder="Ex: 11, 21, 22"
                            value={region}
                            onChange={e => setRegion(e.target.value)}
                            className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>

                    <div className="w-full md:w-32">
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Face</label>
                        <select
                            value={face}
                            onChange={e => setFace(e.target.value)}
                            className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                        >
                            <option value="">-</option>
                            <option value="V">Vestibular</option>
                            <option value="L">Lingual</option>
                            <option value="M">Mesial</option>
                            <option value="D">Distal</option>
                            <option value="I">Incisal/Ocl.</option>
                        </select>
                    </div>

                    <div className="w-full md:w-20">
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Qtd</label>
                        <input
                            type="number" min="1"
                            value={quantity}
                            onChange={e => setQuantity(Number(e.target.value))}
                            className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none text-center"
                        />
                    </div>

                    <button
                        onClick={handleAddItem}
                        disabled={!selectedProc}
                        className="w-full md:w-auto bg-slate-900 hover:bg-black disabled:bg-gray-300 text-white p-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md h-[50px] md:h-auto"
                    >
                        <Plus size={20} />
                        <span className="md:hidden">Adicionar</span>
                    </button>
                </div>
            </div>

            {/* Lista MOBILE (Cards) */}
            <div className="flex-1 overflow-y-auto p-4 md:hidden space-y-3 pb-24">
                {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-300">
                        <ShoppingBag size={48} className="mb-4 opacity-20" />
                        <p className="text-center">Toque em "+" acima para adicionar</p>
                    </div>
                ) : (
                    cart.map((item: any) => (
                        <div key={item.uniqueId} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 relative">
                            <button
                                onClick={() => removeItem(item.uniqueId)}
                                className="absolute top-4 right-4 text-gray-300 hover:text-red-500"
                            >
                                <Trash2 size={18} />
                            </button>
                            <h4 className="font-bold text-slate-800 pr-8">{item.name}</h4>
                            <div className="flex gap-2 mt-2">
                                <span className="bg-gray-100 text-xs px-2 py-1 rounded text-gray-600 font-bold">
                                    {item.region || 'Geral'} {item.face && `(${item.face})`}
                                </span>
                                <span className="bg-indigo-50 text-xs px-2 py-1 rounded text-indigo-600 font-bold">
                                    {item.quantity}x {formatCurrency(item.unit_value)}
                                </span>
                            </div>
                            <div className="mt-3 pt-3 border-t border-gray-50 flex justify-between items-center">
                                <span className="text-xs font-bold text-gray-400 uppercase">Total Item</span>
                                <span className="font-bold text-slate-900">{formatCurrency(item.unit_value * item.quantity)}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Lista DESKTOP (Tabela) */}
            <div className="hidden md:block flex-1 overflow-y-auto p-0">
                {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-300">
                        <ShoppingBag size={48} className="mb-4 opacity-20" />
                        <p>A lista está vazia. Adicione procedimentos acima.</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 sticky top-0 z-10 text-xs uppercase text-gray-400 font-bold">
                            <tr>
                                <th className="p-4 pl-6">Procedimento</th>
                                <th className="p-4">Dente/Região</th>
                                <th className="p-4 text-center">Face</th>
                                <th className="p-4 text-center">Qtd</th>
                                <th className="p-4 text-right">Unitário</th>
                                <th className="p-4 text-right">Total</th>
                                <th className="p-4 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {cart.map((item: any) => (
                                <tr key={item.uniqueId} className="hover:bg-indigo-50/30 transition-colors group">
                                    <td className="p-4 pl-6">
                                        <p className="font-bold text-slate-800">{item.name}</p>
                                        <p className="text-[10px] text-gray-400">{item.category}</p>
                                    </td>
                                    <td className="p-4 text-sm text-gray-600">{item.region || '-'}</td>
                                    <td className="p-4 text-center text-sm text-gray-600">{item.face || '-'}</td>
                                    <td className="p-4 text-center font-medium">{item.quantity}</td>
                                    <td className="p-4 text-right text-gray-500 text-sm">{formatCurrency(item.unit_value)}</td>
                                    <td className="p-4 text-right font-bold text-slate-800">{formatCurrency(item.unit_value * item.quantity)}</td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => removeItem(item.uniqueId)} className="text-gray-300 hover:text-red-500 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end fixed bottom-0 left-0 w-full md:relative md:w-auto z-30">
                <button
                    onClick={onNext}
                    disabled={cart.length === 0}
                    className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 md:py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-lg md:text-base"
                >
                    Ir para Negociação <ChevronRight size={18} />
                </button>
            </div>

            {showNewProcModal && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="font-bold text-lg mb-4">Cadastro Rápido</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Nome do Procedimento</label>
                                <input type="text" defaultValue={searchTerm} className="w-full p-2 border rounded-lg" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Valor Base (R$)</label>
                                <input type="number" className="w-full p-2 border rounded-lg" />
                            </div>
                        </div>
                        <div className="flex gap-2 mt-6 justify-end">
                            <button onClick={() => setShowNewProcModal(false)} className="px-4 py-2 text-gray-500 font-bold">Cancelar</button>
                            <button onClick={() => { setShowNewProcModal(false); toast.success('Cadastrado! (Simulação)'); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold">Salvar</button>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

// --- PASSO 3: NEGOCIAÇÃO (Corrigido) ---
const StepNegotiation = ({ onNext, onBack, cart, negotiation, setNegotiation }: any) => {
    const subtotal = cart.reduce((acc: number, item: any) => acc + (item.unit_value * item.quantity), 0);

    const discountValue = (subtotal * negotiation.discount) / 100;
    const totalWithDiscount = subtotal - discountValue;
    const remaining = totalWithDiscount - negotiation.entry;
    const installmentCount = Math.max(1, negotiation.installments);
    const installmentValue = remaining / installmentCount;

    return (
        <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="flex flex-col md:flex-row h-full bg-white">
            {/* Esquerda: Resumo Estático */}
            <div className="w-full md:w-4/12 bg-gray-50 p-8 border-r border-gray-200 hidden md:block">
                <button onClick={onBack} className="mb-6 flex items-center text-gray-500 hover:text-black gap-2 text-sm font-bold uppercase tracking-wider">
                    <ArrowLeft size={16} /> Voltar
                </button>
                <h2 className="text-2xl font-bold mb-6 text-slate-800">Resumo</h2>
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                    {cart.map((item: any) => (
                        <div key={item.uniqueId} className="flex justify-between text-sm text-gray-600">
                            <span>{item.quantity}x {item.name} {item.region && `(${item.region})`}</span>
                            <span className="font-medium text-slate-900">{formatCurrency(item.unit_value * item.quantity)}</span>
                        </div>
                    ))}
                </div>
                <div className="mt-6 pt-6 border-t border-gray-200 flex justify-between font-bold text-xl">
                    <span>Total</span>
                    <span>{formatCurrency(subtotal)}</span>
                </div>
            </div>

            {/* Direita: Calculadora */}
            <div className="w-full md:w-8/12 p-8 md:p-12 flex flex-col justify-center">
                <h2 className="text-3xl font-bold text-slate-900 mb-8">Condições de Pagamento</h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                    {['PIX', 'CARTÃO', 'BOLETO', 'DINHEIRO'].map(m => (
                        <button
                            key={m}
                            onClick={() => setNegotiation({ ...negotiation, method: m })}
                            className={`p-4 rounded-xl border-2 font-bold text-sm transition-all ${negotiation.method === m ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-100 text-gray-400 hover:border-gray-300'}`}
                        >
                            {m}
                        </button>
                    ))}
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Desconto (%)</label>
                            <div className="relative">
                                <input
                                    type="number" value={negotiation.discount}
                                    onChange={e => setNegotiation({ ...negotiation, discount: Number(e.target.value) })}
                                    className="w-full p-3 bg-gray-50 rounded-lg font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <span className="absolute right-3 top-3 text-gray-400">%</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Entrada (R$)</label>
                            <input
                                type="number" value={negotiation.entry}
                                onChange={e => setNegotiation({ ...negotiation, entry: Number(e.target.value) })}
                                className="w-full p-3 bg-gray-50 rounded-lg font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Parcelas</label>
                            <select
                                value={negotiation.installments}
                                onChange={e => setNegotiation({ ...negotiation, installments: Number(e.target.value) })}
                                className="w-full p-3 bg-gray-50 rounded-lg font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                disabled={negotiation.method === 'PIX' || negotiation.method === 'DINHEIRO'}
                            >
                                {[1, 2, 3, 4, 5, 6, 10, 12, 18, 24].map(x => <option key={x} value={x}>{x}x</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Saldo a parcelar</p>
                            <p className="font-bold text-slate-800">{formatCurrency(remaining)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-indigo-600 font-bold uppercase">Valor da Parcela</p>
                            <p className="text-3xl font-bold text-indigo-700">{negotiation.installments}x {formatCurrency(installmentValue)}</p>
                        </div>
                    </div>
                </div>

                <button onClick={onNext} className="w-full bg-slate-900 text-white py-5 rounded-xl font-bold text-lg hover:bg-black transition-all shadow-lg flex justify-center items-center gap-2">
                    <FileText size={20} />
                    Seguir para a revisão
                </button>
            </div>
        </motion.div>
    );
};

// --- PASSO 4: REVISÃO ---
const StepReview = ({ onBack, onSave, cart, negotiation, config, isSaving }: any) => {
    const subtotal = cart.reduce((acc: number, item: any) => acc + (item.unit_value * item.quantity), 0);
    const discountValue = (subtotal * negotiation.discount) / 100;
    const totalFinal = subtotal - discountValue;
    const remaining = totalFinal - negotiation.entry;
    const installmentCount = Math.max(1, negotiation.installments);
    const installmentValue = remaining / installmentCount;

    const installmentsList = Array.from({ length: installmentCount }).map((_, idx) => {
        const dueDate = addDays(new Date(), (idx + 1) * 30);
        return {
            number: idx + 1,
            date: dueDate.toLocaleDateString('pt-BR'),
            value: installmentValue
        };
    });

    return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex flex-col bg-gray-50 overflow-hidden">
            <div className="bg-white border-b px-8 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} disabled={isSaving} className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-50"><ArrowLeft /></button>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <ShieldCheck className="text-emerald-500" />
                        Revisão Final do Orçamento
                    </h2>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase font-bold">Valor Total</p>
                    <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalFinal)}</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-4xl mx-auto space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 font-bold text-gray-700 text-sm uppercase">
                            Itens do Tratamento
                        </div>
                        <div className="p-6">
                            <table className="w-full text-sm text-left">
                                <thead>
                                    <tr className="text-gray-400 border-b">
                                        <th className="pb-2 font-medium">Procedimento</th>
                                        <th className="pb-2 font-medium">Região</th>
                                        <th className="pb-2 font-medium text-right">Valor</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {cart.map((item: any, i: number) => (
                                        <tr key={i}>
                                            <td className="py-3 font-medium text-slate-900">{item.quantity}x {item.name}</td>
                                            <td className="py-3 text-gray-500">{item.region || '-'}</td>
                                            <td className="py-3 text-right font-medium">{formatCurrency(item.unit_value * item.quantity)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row">
                        <div className="w-full md:w-5/12 p-6 bg-slate-50 border-r border-gray-200 space-y-4">
                            <h3 className="font-bold text-slate-800 text-sm uppercase mb-4">Resumo Financeiro</h3>
                            <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span> <span>{formatCurrency(subtotal)}</span></div>
                            <div className="flex justify-between text-sm text-red-500"><span className="font-medium">Desconto ({negotiation.discount}%)</span> <span>- {formatCurrency(discountValue)}</span></div>
                            <div className="flex justify-between text-sm text-emerald-600 font-bold"><span className="uppercase">Total Final</span> <span>{formatCurrency(totalFinal)}</span></div>
                            <div className="border-t pt-4 mt-2">
                                <div className="flex justify-between text-sm mb-2"><span className="text-gray-500">Entrada</span> <span className="font-bold">{formatCurrency(negotiation.entry)}</span></div>
                                <div className="flex justify-between text-sm mb-2"><span className="text-gray-500">Forma Pagto</span> <span className="font-bold uppercase">{negotiation.method}</span></div>
                            </div>
                        </div>

                        <div className="w-full md:w-7/12 p-6">
                            <h3 className="font-bold text-slate-800 text-sm uppercase mb-4 flex items-center gap-2">
                                <Calendar size={16} /> Cronograma de Parcelas
                            </h3>
                            {negotiation.installments > 0 ? (
                                <div className="border rounded-xl overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 text-gray-500">
                                            <tr>
                                                <th className="px-4 py-2 text-left font-medium">#</th>
                                                <th className="px-4 py-2 text-left font-medium">Vencimento</th>
                                                <th className="px-4 py-2 text-right font-medium">Valor</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {installmentsList.map((inst) => (
                                                <tr key={inst.number} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 text-gray-500">{inst.number}/{installmentCount}</td>
                                                    <td className="px-4 py-3 font-medium">{inst.date}</td>
                                                    <td className="px-4 py-3 text-right font-bold text-slate-700">{formatCurrency(inst.value)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center p-4 text-gray-400 bg-gray-50 rounded-xl">Pagamento à Vista</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white border-t p-4 md:px-8 md:py-6 shadow-lg z-10 flex justify-end gap-3">
                <button onClick={onBack} disabled={isSaving} className="px-6 py-3 rounded-xl border border-gray-300 font-bold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50">
                    Editar
                </button>
                <button
                    onClick={onSave}
                    disabled={isSaving}
                    className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg shadow-lg shadow-emerald-200 flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
                >
                    {isSaving ? 'Salvando...' : (
                        <>
                            <Check size={24} />
                            Salvar e Finalizar
                        </>
                    )}
                </button>
            </div>
        </motion.div>
    );
};

// --- COMPONENTE PRINCIPAL ---
export function BudgetStudioPage() {
    const { id: patientId, budgetId } = useParams<{ id: string; budgetId?: string }>();
    const [step, setStep] = useState(1);
    const [config, setConfig] = useState({ professional: 'dr-marcelo', table: 'particular-2026' });

    const {
        items,
        procedures,
        addItem,
        removeItem,
        updateItem,
        saveBudget,
        loading
    } = useBudgetStudio(patientId!, budgetId);

    const [negotiation, setNegotiation] = useState({
        method: 'CARTÃO',
        installments: 1,
        entry: 0,
        discount: 0
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await saveBudget('PENDING', {
                final_value: items.reduce((acc, i) => acc + (i.unit_value * i.quantity), 0) * (1 - negotiation.discount / 100),
                status: 'PENDING'
            });
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const steps = [
        { num: 1, label: 'Config' },
        { num: 2, label: 'Itens' },
        { num: 3, label: 'Pagamento' },
        { num: 4, label: 'Revisão' },
    ];

    if (loading && step === 2) {
        return <div className="h-screen flex items-center justify-center">Carregando catálogo...</div>;
    }

    return (
        <div className="h-screen bg-gray-50 flex flex-col font-sans overflow-hidden">
            <header className="h-16 bg-white border-b flex items-center justify-between px-4 md:px-8 shrink-0">
                <div className="font-bold text-lg md:text-xl tracking-tight text-slate-900">ClinicPro <span className="text-indigo-600">Studio</span></div>
                <div className="flex items-center gap-2 md:gap-4">
                    {steps.map((s, i) => (
                        <React.Fragment key={s.num}>
                            {/* Desktop Stepper */}
                            <div className={`hidden md:flex items-center gap-2 ${step === s.num ? 'opacity-100' : 'opacity-40'}`}>
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= s.num ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'}`}>{s.num}</div>
                                <span className="text-sm font-medium">{s.label}</span>
                            </div>

                            {/* Mobile Stepper (Active Step Only - Condensed Text) */}
                            <div className={`md:hidden flex items-center gap-2 ${step === s.num ? 'block' : 'hidden'}`}>
                                <span className="text-sm font-bold text-slate-900">Passo {s.num} de 4: {s.label}</span>
                            </div>

                            {i < 3 && <div className={`w-4 h-px bg-gray-300 hidden md:block ${step > s.num ? 'bg-indigo-600' : ''}`} />}
                        </React.Fragment>
                    ))}
                </div>
                <div className="w-20"></div>
            </header>

            <main className="flex-1 relative overflow-hidden">
                <AnimatePresence mode="wait">
                    {step === 1 && <StepConfiguration key="1" config={config} setConfig={setConfig} onNext={() => setStep(2)} />}
                    {step === 2 && (
                        <StepSelection
                            key="2"
                            cart={items}
                            procedures={procedures}
                            addItem={addItem}
                            updateItem={updateItem}
                            removeItem={removeItem}
                            onBack={() => setStep(1)}
                            onNext={() => setStep(3)}
                            config={config}
                        />
                    )}
                    {step === 3 && <StepNegotiation key="3" cart={items} negotiation={negotiation} setNegotiation={setNegotiation} onBack={() => setStep(2)} onNext={() => setStep(4)} />}
                    {step === 4 && <StepReview key="4" cart={items} negotiation={negotiation} config={config} onBack={() => setStep(3)} onSave={handleSave} isSaving={isSaving} />}
                </AnimatePresence>
            </main>
        </div>
    );
}
