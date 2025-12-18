
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { BudgetItem, LeadStatus } from '../types';
import {
    ArrowLeft, Plus, Trash2, Save, CheckCircle,
    DollarSign, CreditCard, ShoppingCart, XCircle, Briefcase, TrendingUp, MoreVertical
} from 'lucide-react';

// Inputs larger on mobile for touch
const inputClass = "w-full bg-white text-gray-900 border border-gray-200 rounded-lg p-3 md:p-2.5 text-base md:text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all shadow-input h-12 md:h-10";
const labelClass = "block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase";

const BudgetForm: React.FC = () => {
    const { id, budgetId } = useParams<{ id: string, budgetId?: string }>();
    const navigate = useNavigate();
    const { profile } = useAuth();
    const { patients, createBudget, updateBudget, approveBudget, cancelBudget, sendToNegotiation, procedures, leads, priceTables, professionals } = useData();
    const patient = patients.find(p => p.id === id);
    const existingBudget = budgetId && patient ? patient.budgets?.find(b => b.id === budgetId) : null;
    const existingOpportunity = existingBudget
        ? leads.find(l => l.budgetId === existingBudget.id && l.status !== LeadStatus.LOST && l.status !== LeadStatus.WON)
        : null;

    const [items, setItems] = useState<BudgetItem[]>([]);
    const [discount, setDiscount] = useState<number>(0);
    const [paymentMethod, setPaymentMethod] = useState<'Pix' | 'Cartão' | 'Boleto' | 'Dinheiro'>('Pix');
    const [installments, setInstallments] = useState<number>(1);
    const [selectedProcedure, setSelectedProcedure] = useState(procedures.length > 0 ? procedures[0].name : '');
    const [selectedPriceTableId, setSelectedPriceTableId] = useState('');
    const [selectedProfessionalId, setSelectedProfessionalId] = useState('');
    const [region, setRegion] = useState('');
    const [price, setPrice] = useState(0);
    const [qty, setQty] = useState(1);

    // Mobile Action Menu
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    useEffect(() => {
        if (procedures.length > 0 && !selectedProcedure) {
            setSelectedProcedure(procedures[0].name);
            setPrice(procedures[0].price);
        }
    }, [procedures, selectedProcedure]);

    // Pricing Logic with Price Tables
    useEffect(() => {
        const proc = procedures.find(p => p.name === selectedProcedure);
        if (proc) {
            let finalPrice = proc.price;
            if (selectedPriceTableId) {
                const table = priceTables.find(t => t.id === selectedPriceTableId);
                const item = table?.items?.find((i: any) => i.procedureId === proc.id || i.procedureId === proc.name); // Fallback to name if ID fails
                if (item) {
                    finalPrice = item.price;
                }
            }
            setPrice(finalPrice);
        }
    }, [selectedProcedure, procedures, selectedPriceTableId, priceTables]);

    useEffect(() => {
        if (existingBudget) {
            setItems(existingBudget.items);
            setDiscount(existingBudget.discount || 0);
            if (existingBudget.paymentConfig) {
                setPaymentMethod(existingBudget.paymentConfig.method);
                setInstallments(existingBudget.paymentConfig.installments);
            }
            if (existingBudget.priceTableId) {
                setSelectedPriceTableId(existingBudget.priceTableId);
            }
            if (existingBudget.doctorId) {
                setSelectedProfessionalId(existingBudget.doctorId);
            }
        } else {
            // Auto-select "Particular" price table by default
            if (priceTables.length > 0 && !selectedPriceTableId) {
                const particularTable = priceTables.find(pt => pt.type === 'PARTICULAR');
                if (particularTable) {
                    setSelectedPriceTableId(particularTable.id);
                }
            }
            // Auto-select logged-in user if they have a professional_id
            if (profile?.id && !selectedProfessionalId) {
                const userProfessional = professionals.find(p => p.id === profile.id);
                if (userProfessional) {
                    setSelectedProfessionalId(profile.id);
                }
            }
        }
    }, [existingBudget, priceTables, professionals, profile, selectedProfessionalId, selectedPriceTableId]);

    if (!patient) return <div className="p-8">Paciente não encontrado.</div>;

    const handleAddItem = () => {
        const newItem: BudgetItem = {
            id: Math.random().toString(36).substr(2, 5),
            procedure: selectedProcedure,
            region: region || 'Geral',
            quantity: qty,
            unitValue: price,
            total: price * qty
        };
        setItems([...items, newItem]);
        setRegion('');
        setQty(1);
    };

    const handleRemoveItem = (itemId: string) => {
        setItems(items.filter(i => i.id !== itemId));
    };

    const subtotal = items.reduce((acc, item) => acc + item.total, 0);
    const finalTotal = Math.max(0, subtotal - discount);

    const handleSave = () => {
        // Validation
        if (!selectedPriceTableId) {
            alert("Por favor, selecione uma tabela de preços.");
            return;
        }
        if (!selectedProfessionalId) {
            alert("Por favor, selecione um profissional responsável.");
            return;
        }
        if (items.length === 0) {
            alert("Adicione pelo menos um procedimento ao orçamento.");
            return;
        }

        const budgetPayload = {
            doctorName: professionals.find(p => p.id === selectedProfessionalId)?.name || 'Profissional',
            doctorId: selectedProfessionalId,
            items: items,
            totalValue: subtotal,
            discount: discount,
            finalValue: finalTotal,
            paymentConfig: { method: paymentMethod, installments },
            priceTableId: selectedPriceTableId
        };

        if (existingBudget && budgetId) {
            updateBudget(patient.id, budgetId, budgetPayload);
        } else {
            createBudget(patient.id, budgetPayload);
        }
        navigate(`/patients/${patient.id}`);
    };

    const handleCreateOpportunity = () => {
        if (!existingBudget || !budgetId) {
            alert("É necessário salvar o orçamento antes de criar a oportunidade.");
            return;
        }
        const newLeadId = sendToNegotiation(patient.id, budgetId);
        navigate(`/crm/${newLeadId}`);
    };

    const handleReject = () => {
        if (!existingBudget || !budgetId) {
            alert("Salve o orçamento primeiro.");
            return;
        }
        const reason = window.prompt("Motivo da perda/reprovação:");
        if (reason !== null && reason.trim() !== "") {
            cancelBudget(patient.id, budgetId, reason);
            navigate(`/patients/${patient.id}`);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-900 transition-colors pb-24 md:pb-0">
            <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 py-4 flex flex-row justify-between items-center gap-4 z-20 shadow-sm sticky top-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-gray-500 dark:text-gray-400">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-gray-800 dark:text-white line-clamp-1">{existingBudget ? 'Editar Orçamento' : 'Novo Orçamento'}</h1>
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <span className="font-medium text-primary-600 dark:text-primary-400 truncate">{patient.name}</span>
                        </p>
                    </div>
                </div>

                {/* Desktop Buttons */}
                <div className="hidden md:flex flex-wrap gap-2 w-full md:w-auto">
                    {existingBudget && (
                        <>
                            <button onClick={handleReject} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg font-medium hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-xs md:text-sm">
                                <XCircle size={16} /> Perda
                            </button>
                            {existingOpportunity ? (
                                <button onClick={() => navigate(`/crm/${existingOpportunity.id}`)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-lg font-medium hover:bg-purple-100 transition-colors text-xs md:text-sm">
                                    <TrendingUp size={16} /> Ver Oportunidade
                                </button>
                            ) : (
                                <button onClick={handleCreateOpportunity} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-lg font-medium hover:bg-yellow-100 transition-colors text-xs md:text-sm">
                                    <Briefcase size={16} /> Criar Oportunidade
                                </button>
                            )}
                        </>
                    )}
                    <button onClick={handleSave} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 border border-gray-300 bg-white rounded-lg text-gray-700 font-medium hover:bg-gray-50 text-xs md:text-sm">
                        <Save size={18} /> Salvar
                    </button>
                    {existingBudget && (existingBudget.status === 'Em Análise' || existingBudget.status === 'Em Negociação') && (
                        <button onClick={() => { approveBudget(patient.id, existingBudget.id); navigate(`/patients/${patient.id}`); }} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 shadow-sm text-xs md:text-sm">
                            <CheckCircle size={18} /> Aprovar
                        </button>
                    )}
                </div>

                {/* Mobile Menu Trigger */}
                {existingBudget && (
                    <button className="md:hidden p-2 text-gray-600" onClick={() => setShowMobileMenu(!showMobileMenu)}>
                        <MoreVertical size={24} />
                    </button>
                )}
            </div>

            {/* Mobile Menu Dropdown */}
            {showMobileMenu && existingBudget && (
                <div className="md:hidden bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-4 flex flex-col gap-3 animate-in slide-in-from-top-2 absolute top-[70px] left-0 right-0 z-50 shadow-lg">
                    <button onClick={handleReject} className="flex items-center gap-3 p-3 text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg font-medium">
                        <XCircle size={20} /> Registrar Perda/Reprovação
                    </button>
                    {existingOpportunity ? (
                        <button onClick={() => navigate(`/crm/${existingOpportunity.id}`)} className="flex items-center gap-3 p-3 text-purple-700 bg-purple-50 dark:bg-purple-900/20 rounded-lg font-medium">
                            <TrendingUp size={20} /> Ver Oportunidade CRM
                        </button>
                    ) : (
                        <button onClick={handleCreateOpportunity} className="flex items-center gap-3 p-3 text-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg font-medium">
                            <Briefcase size={20} /> Enviar para CRM
                        </button>
                    )}
                </div>
            )}

            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-xl shadow-card border border-primary-100 dark:border-slate-700 ring-1 ring-primary-50 dark:ring-0">

                        {/* Price Table & Professional Selectors */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            {/* Price Table Selector */}
                            <div>
                                <label className={labelClass}>Tabela de Preços</label>
                                <div className="relative">
                                    <select
                                        className={inputClass}
                                        value={selectedPriceTableId}
                                        onChange={(e) => setSelectedPriceTableId(e.target.value)}
                                    >
                                        <option value="">Selecione uma tabela...</option>
                                        <optgroup label="Particular">
                                            {priceTables.filter(pt => pt.type === 'PARTICULAR' || pt.type === 'OUTROS').map(pt => (
                                                <option key={pt.id} value={pt.id}>💲 {pt.name}</option>
                                            ))}
                                        </optgroup>
                                        <optgroup label="Convênios & Parcerias">
                                            {priceTables.filter(pt => pt.type === 'CONVENIO' || pt.type === 'PARCERIA').map(pt => (
                                                <option key={pt.id} value={pt.id}>💳 {pt.name} {pt.external_code ? `(${pt.external_code})` : ''}</option>
                                            ))}
                                        </optgroup>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                                        {priceTables.find(pt => pt.id === selectedPriceTableId)?.type === 'CONVENIO' ? <CreditCard size={18} /> : <DollarSign size={18} />}
                                    </div>
                                </div>
                            </div>

                            {/* Professional Selector */}
                            <div>
                                <label className={labelClass}>Profissional Responsável</label>
                                <select
                                    className={inputClass}
                                    value={selectedProfessionalId}
                                    onChange={(e) => setSelectedProfessionalId(e.target.value)}
                                    required
                                >
                                    <option value="">Selecione um profissional...</option>
                                    {professionals.filter(p => p.active).map(prof => (
                                        <option key={prof.id} value={prof.id}>Dr. {prof.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide mb-4 flex items-center gap-2">
                            <Plus className="text-primary-600 dark:text-primary-400" size={16} /> Adicionar Procedimento
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                            <div className="md:col-span-4">
                                <label className={labelClass}>Procedimento</label>
                                <select className={inputClass} value={selectedProcedure} onChange={e => setSelectedProcedure(e.target.value)}>
                                    {procedures.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                                </select>
                            </div>
                            <div className="md:col-span-3">
                                <label className={labelClass}>Região</label>
                                <input type="text" className={inputClass} placeholder="Geral" value={region} onChange={e => setRegion(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 md:col-span-3 gap-4">
                                <div>
                                    <label className={labelClass}>Valor Unit.</label>
                                    <input type="number" className={inputClass} value={price} onChange={e => setPrice(parseFloat(e.target.value))} />
                                </div>
                                <div>
                                    <label className={labelClass}>Qtd</label>
                                    <input type="number" className={inputClass} value={qty} onChange={e => setQty(parseInt(e.target.value))} min={1} />
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <button onClick={handleAddItem} className="w-full bg-primary-600 hover:bg-primary-700 text-white p-3 md:p-2.5 rounded-lg font-medium text-sm flex justify-center items-center gap-2 shadow-sm transition-transform active:scale-95">
                                    <Plus size={18} /> Incluir
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {items.map((item, index) => (
                            <div key={item.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-card border border-gray-200 dark:border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div className="flex items-start gap-4 flex-1">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold text-xs mt-1 shrink-0">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800 dark:text-white leading-tight">{item.procedure}</h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Região: {item.region} • {item.quantity}x R$ {item.unitValue.toLocaleString('pt-BR')}</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between w-full md:w-auto gap-6 border-t md:border-t-0 border-gray-100 dark:border-slate-700 pt-3 md:pt-0">
                                    <span className="font-bold text-gray-900 dark:text-white text-lg">R$ {item.total.toLocaleString('pt-BR')}</span>
                                    <button onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded-lg transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {items.length === 0 && (
                            <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-gray-300 dark:border-slate-700">
                                <div className="bg-primary-50 dark:bg-primary-900/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ShoppingCart className="text-primary-500 dark:text-primary-400" size={32} />
                                </div>
                                <h3 className="text-gray-900 dark:text-white font-medium">Nenhum procedimento adicionado</h3>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 border-t md:border-t-0 md:border-l border-gray-200 dark:border-slate-700 w-full md:w-96 p-6 md:h-full md:overflow-y-auto shadow-[-4px_0_15px_rgba(0,0,0,0.02)] z-10 mb-20 md:mb-0">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                        <DollarSign className="text-green-600 dark:text-green-400" size={20} /> Pagamento
                    </h3>
                    <div className="space-y-6">
                        <div>
                            <label className={labelClass}>Forma de Pagamento</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['Pix', 'Cartão', 'Boleto', 'Dinheiro'].map(method => (
                                    <button key={method} onClick={() => setPaymentMethod(method as any)} className={`py-3 md:py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${paymentMethod === method ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>{method}</button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Parcelamento</label>
                            <select className={inputClass} value={installments} onChange={e => setInstallments(parseInt(e.target.value))}>
                                <option value={1}>À vista (1x)</option>
                                <option value={2}>2x sem juros</option>
                                <option value={3}>3x sem juros</option>
                                <option value={4}>4x sem juros</option>
                                <option value={6}>6x sem juros</option>
                                <option value={10}>10x sem juros</option>
                                <option value={12}>12x sem juros</option>
                            </select>
                        </div>
                        <div className="border-t border-gray-200 dark:border-slate-700 pt-6 space-y-3">
                            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400"><span>Subtotal</span><span>R$ {subtotal.toLocaleString('pt-BR')}</span></div>
                            <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                                <span>Desconto</span>
                                <div className="flex items-center gap-1 w-24">
                                    <span className="text-gray-400">- R$</span>
                                    <input type="number" className="w-full border-b border-gray-300 bg-transparent text-right outline-none p-0 text-sm" value={discount} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} />
                                </div>
                            </div>
                            <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white pt-2 border-t border-dashed border-gray-200 dark:border-slate-700">
                                <span>Total</span>
                                <span>R$ {finalTotal.toLocaleString('pt-BR')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MOBILE FIXED BOTTOM ACTION BAR */}
            <div className="fixed bottom-0 left-0 right-0 p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 md:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex gap-3 safe-bottom">
                <button
                    onClick={handleSave}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold shadow-sm flex justify-center items-center gap-2 active:scale-95 transition-transform"
                >
                    <Save size={20} /> Salvar
                </button>
                {existingBudget && (existingBudget.status === 'Em Análise' || existingBudget.status === 'Em Negociação') ? (
                    <button
                        onClick={() => { approveBudget(patient.id, existingBudget.id); navigate(`/patients/${patient.id}`); }}
                        className="flex-[2] bg-green-600 text-white py-3 rounded-xl font-bold shadow-md flex justify-center items-center gap-2 active:scale-95 transition-transform"
                    >
                        <CheckCircle size={20} /> Aprovar
                    </button>
                ) : (
                    <button
                        onClick={handleSave}
                        className="flex-[2] bg-primary-600 text-white py-3 rounded-xl font-bold shadow-md flex justify-center items-center gap-2 active:scale-95 transition-transform"
                    >
                        <CheckCircle size={20} /> Finalizar
                    </button>
                )}
            </div>
        </div>
    );
};

export default BudgetForm;
