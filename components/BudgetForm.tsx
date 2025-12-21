import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BudgetItem, LeadStatus } from '../types';
import { usePatient } from '../hooks/usePatients';
import { useBudget, useBudgetOperations } from '../hooks/useBudgets';
import { useProcedures } from '../hooks/useProcedures';
import { usePriceTables } from '../hooks/usePriceTables';
import { useProfessionals } from '../hooks/useProfessionals';
import { useLeads } from '../hooks/useLeads';
import {
    ArrowLeft, Plus, Trash2, Save, CheckCircle,
    DollarSign, Briefcase, TrendingUp, MoreVertical, Loader, FileText
} from 'lucide-react';
import { DocumentGeneratorModal } from './documents/DocumentGeneratorModal';

// Inputs larger on mobile for touch
const inputClass = "w-full bg-white text-gray-900 border border-gray-200 rounded-lg p-3 md:p-2.5 text-base md:text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all shadow-input h-12 md:h-10";
const labelClass = "block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase";

const BudgetForm: React.FC = () => {
    const { id, budgetId } = useParams<{ id: string, budgetId?: string }>();
    const navigate = useNavigate();
    const { profile } = useAuth();

    // Hooks
    const { data: patient, isLoading: loadingPatient } = usePatient(id || '');
    const { data: existingBudget, isLoading: loadingBudget } = useBudget(budgetId);
    const { createBudget, updateBudget, approveBudget, isCreating, isUpdating } = useBudgetOperations();
    const { procedures } = useProcedures();
    const { priceTables } = usePriceTables();
    const { professionals } = useProfessionals();
    const { leads, createLead } = useLeads();

    const existingOpportunity = existingBudget
        ? leads.find(l => l.budgetId === existingBudget.id && l.status !== LeadStatus.LOST && l.status !== LeadStatus.WON)
        : null;

    // Local State
    const [items, setItems] = useState<BudgetItem[]>([]);
    const [discount, setDiscount] = useState<number>(0);
    const [paymentMethod, setPaymentMethod] = useState<'Pix' | 'Cartão' | 'Boleto' | 'Dinheiro'>('Pix');
    const [installments, setInstallments] = useState<number>(1);
    const [selectedProcedure, setSelectedProcedure] = useState('');
    const [selectedPriceTableId, setSelectedPriceTableId] = useState('');
    const [selectedProfessionalId, setSelectedProfessionalId] = useState('');
    const [region, setRegion] = useState('');
    const [price, setPrice] = useState(0);
    const [qty, setQty] = useState(1);
    const [categoryId, setCategoryId] = useState('');

    // UI State
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showDocModal, setShowDocModal] = useState(false);

    // Initial Load - Procedure
    useEffect(() => {
        if (procedures.length > 0 && !selectedProcedure) {
            setSelectedProcedure(procedures[0].name);
            setPrice(procedures[0].price);
        }
    }, [procedures, selectedProcedure]);

    // Initial Load - Existing Budget
    useEffect(() => {
        if (existingBudget) {
            setItems(existingBudget.items || []);
            setDiscount(existingBudget.discount || 0);
            if (existingBudget.paymentConfig) {
                setPaymentMethod(existingBudget.paymentConfig.method);
                setInstallments(existingBudget.paymentConfig.installments);
            }
            if (existingBudget.priceTableId) setSelectedPriceTableId(existingBudget.priceTableId);
            if (existingBudget.doctorId) setSelectedProfessionalId(existingBudget.doctorId);
            if (existingBudget.categoryId) setCategoryId(existingBudget.categoryId);
        } else if (!loadingBudget) {
            // Defaults for new budget
            if (priceTables.length > 0 && !selectedPriceTableId) {
                const particularTable = priceTables.find(pt => pt.type === 'PARTICULAR');
                if (particularTable) setSelectedPriceTableId(particularTable.id);
            }
            // Auto-select logged user
            if (profile?.id && !selectedProfessionalId) {
                if (profile.professional_id) {
                    setSelectedProfessionalId(profile.professional_id);
                }
            }
        }
    }, [existingBudget, loadingBudget, priceTables, profile]);

    // Pricing Logic
    useEffect(() => {
        const proc = procedures.find(p => p.name === selectedProcedure);
        if (proc) {
            let finalPrice = proc.price;
            if (selectedPriceTableId) {
                const table = priceTables.find(t => t.id === selectedPriceTableId);
                const item = table?.items?.find((i: any) => i.procedureId === proc.id || i.procedure_name === proc.name || i.procedureName === proc.name);
                if (item) {
                    finalPrice = item.price;
                }
            }
            setPrice(finalPrice);
        }
    }, [selectedProcedure, procedures, selectedPriceTableId, priceTables]);

    if (loadingPatient) return <div className="p-8 flex justify-center"><Loader className="animate-spin text-blue-600" /></div>;
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
        setQty(1);
    };

    const handleRemoveItem = (itemId: string) => {
        setItems(items.filter(i => i.id !== itemId));
    };

    const subtotal = items.reduce((acc, item) => acc + item.total, 0);
    const finalTotal = Math.max(0, subtotal - discount);

    // BOS: Margin Calculation
    const totalCost = items.reduce((acc, item) => {
        const proc = procedures.find(p => p.name === item.procedure);
        return acc + (proc?.cost?.total_cost || 0) * item.quantity;
    }, 0);
    const marginValue = finalTotal - totalCost;
    const marginPercent = finalTotal > 0 ? (marginValue / finalTotal) * 100 : 0;
    const isMarginLow = marginPercent < 20;

    const handleSave = () => {
        if (!selectedPriceTableId || !selectedProfessionalId || items.length === 0) {
            alert("Preencha todos os campos obrigatórios e adicione itens.");
            return;
        }

        const budgetPayload = {
            doctorId: selectedProfessionalId,
            items: items,
            totalValue: subtotal,
            discount: discount,
            finalValue: finalTotal,
            paymentConfig: { method: paymentMethod, installments },
            priceTableId: selectedPriceTableId,
            categoryId: categoryId || undefined
        };

        if (existingBudget && budgetId) {
            updateBudget({ budgetId, data: budgetPayload }, {
                onSuccess: () => navigate(`/patients/${patient.id}`)
            });
        } else {
            createBudget({ patientId: patient.id, data: budgetPayload }, {
                onSuccess: () => navigate(`/patients/${patient.id}`)
            });
        }
    };

    const handleCreateOpportunity = () => {
        if (!existingBudget || !budgetId) {
            alert("É necessário salvar o orçamento antes.");
            return;
        }
        createLead({
            name: patient.name,
            phone: patient.phone,
            status: LeadStatus.NEGOTIATION,
            source: 'Orçamento',
            budgetId: budgetId,
            value: finalTotal
        }, {
            onSuccess: (data) => navigate(`/crm/${data.id}`)
        });
    };

    const handleApprove = () => {
        if (!existingBudget) return;
        approveBudget({ budgetId: existingBudget.id, patientId: patient.id }, {
            onSuccess: () => navigate(`/patients/${patient.id}`)
        });
    }

    const selectedProfessional = professionals.find(p => p.id === selectedProfessionalId);

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-900 transition-colors pb-24 md:pb-0">
            {/* HEADER */}
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

                {/* DESKTOP BUTTONS */}
                <div className="hidden md:flex gap-2">
                    <button onClick={() => setShowDocModal(true)} className="flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white rounded-lg text-gray-700 font-medium hover:bg-gray-50 text-sm">
                        <FileText size={18} /> Contratos
                    </button>

                    {existingBudget && (
                        <>
                            {existingOpportunity ? (
                                <button onClick={() => navigate(`/crm/${existingOpportunity.id}`)} className="flex items-center gap-2 px-4 py-2 border border-purple-200 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-100">
                                    <TrendingUp size={16} /> Ver CRM
                                </button>
                            ) : (
                                <button onClick={handleCreateOpportunity} className="flex items-center gap-2 px-4 py-2 border border-yellow-200 bg-yellow-50 text-yellow-700 rounded-lg text-sm font-medium hover:bg-yellow-100">
                                    <Briefcase size={16} /> Criar CRM
                                </button>
                            )}
                        </>
                    )}
                    <button onClick={handleSave} disabled={isCreating || isUpdating} className="flex items-center gap-2 px-6 py-2 border border-blue-600 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 text-sm shadow-sm">
                        {isCreating || isUpdating ? <Loader size={18} className="animate-spin" /> : <Save size={18} />} Salvar
                    </button>
                    {existingBudget && (existingBudget.status === 'Em Análise' || existingBudget.status === 'Em Negociação' || existingBudget.status === 'Enviado') && (
                        <button onClick={handleApprove} className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 shadow-sm text-sm">
                            <CheckCircle size={18} /> Aprovar
                        </button>
                    )}
                </div>

                {/* MOBILE MENU TRIGGER */}
                {existingBudget && (
                    <button className="md:hidden p-2 text-gray-600" onClick={() => setShowMobileMenu(!showMobileMenu)}>
                        <MoreVertical size={24} />
                    </button>
                )}
            </div>

            {/* MOBILE DROPDOWN */}
            {showMobileMenu && existingBudget && (
                <div className="md:hidden bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-4 flex flex-col gap-3 absolute top-[70px] left-0 right-0 z-50 shadow-lg animate-in slide-in-from-top-2">
                    <button onClick={() => setShowDocModal(true)} className="flex items-center gap-3 p-3 text-gray-700 bg-gray-50 dark:bg-gray-800 rounded-lg font-medium border border-gray-200">
                        <FileText size={20} /> Gerar Documentos
                    </button>
                    <button onClick={handleCreateOpportunity} className="flex items-center gap-3 p-3 text-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg font-medium">
                        <Briefcase size={20} /> Enviar para CRM
                    </button>
                </div>
            )}

            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                {/* LEFT CONTENT */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-xl shadow-card border border-primary-100 dark:border-slate-700 ring-1 ring-primary-50 dark:ring-0">
                        {/* SELECTORS */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className={labelClass}>Tabela de Preços</label>
                                <select className={inputClass} value={selectedPriceTableId} onChange={e => setSelectedPriceTableId(e.target.value)}>
                                    <option value="">Selecione...</option>
                                    {priceTables.map(pt => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Profissional</label>
                                <select className={inputClass} value={selectedProfessionalId} onChange={e => setSelectedProfessionalId(e.target.value)}>
                                    <option value="">Selecione...</option>
                                    {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className={labelClass}>Categoria (BOS)</label>
                                <select className={inputClass} value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                                    <option value="">Selecione...</option>
                                    <option>Cirurgias Estéticas da Face</option>
                                    <option>Harmonização Facial</option>
                                    <option>Implantodontia</option>
                                    <option>Ortodontia</option>
                                    <option>Clínica Geral</option>
                                </select>
                            </div>
                        </div>

                        {/* ADD ITEM */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                            <div className="md:col-span-4">
                                <label className={labelClass}>Procedimento</label>
                                <select className={inputClass} value={selectedProcedure} onChange={e => setSelectedProcedure(e.target.value)}>
                                    {procedures.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                </select>
                            </div>
                            <div className="md:col-span-3">
                                <label className={labelClass}>Região</label>
                                <input className={inputClass} value={region} onChange={e => setRegion(e.target.value)} placeholder="Ex: 11, 12, Sup..." />
                            </div>
                            <div className="grid grid-cols-2 md:col-span-3 gap-4">
                                <div><label className={labelClass}>Valor</label><input type="number" className={inputClass} value={price} onChange={e => setPrice(parseFloat(e.target.value))} /></div>
                                <div><label className={labelClass}>Qtd</label><input type="number" className={inputClass} value={qty} onChange={e => setQty(parseInt(e.target.value))} /></div>
                            </div>
                            <div className="md:col-span-2">
                                <button onClick={handleAddItem} className="w-full bg-primary-600 text-white p-3 md:p-2.5 rounded-lg font-medium shadow-sm"><Plus size={18} /> Incluir</button>
                            </div>
                        </div>
                    </div>

                    {/* ITEMS LIST */}
                    <div className="space-y-3">
                        {items.map((item, idx) => (
                            <div key={item.id || idx} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-card border border-gray-200 flex justify-between items-center">
                                <div>
                                    <h4 className="font-bold">{item.procedure}</h4>
                                    <p className="text-sm text-gray-500">{item.quantity}x R$ {item.unitValue}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-bold">R$ {item.total}</span>
                                    <button onClick={() => handleRemoveItem(item.id)} className="text-red-500"><Trash2 size={18} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT SIDEBAR (TOTALS) */}
                <div className="bg-white dark:bg-slate-800 border-l border-gray-200 w-full md:w-96 p-6 shadow-xl z-20">
                    <h3 className="font-bold mb-6 flex items-center gap-2 text-lg"><DollarSign className="text-green-600" /> Resumo</h3>

                    <div className="space-y-4">
                        <div>
                            <label className={labelClass}>Desconto (R$)</label>
                            <input type="number" className={inputClass} value={discount} onChange={e => setDiscount(parseFloat(e.target.value))} />
                        </div>
                        <div>
                            <label className={labelClass}>Método</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['Pix', 'Cartão', 'Boleto', 'Dinheiro'].map(m => (
                                    <button key={m} onClick={() => setPaymentMethod(m as any)} className={`p-2 border rounded-lg text-sm ${paymentMethod === m ? 'bg-primary-600 text-white' : 'hover:bg-gray-50'}`}>{m}</button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Parcelas</label>
                            <select className={inputClass} value={installments} onChange={e => setInstallments(parseInt(e.target.value))}>
                                {[1, 2, 3, 4, 5, 6, 10, 12].map(n => <option key={n} value={n}>{n}x</option>)}
                            </select>
                        </div>

                        <div className="border-t pt-4 mt-4">
                            <div className="flex justify-between mb-2"><span>Subtotal</span><span>R$ {subtotal.toLocaleString('pt-BR')}</span></div>
                            <div className="flex justify-between mb-2 text-red-500"><span>Desconto</span><span>- R$ {discount.toLocaleString('pt-BR')}</span></div>
                            <div className="flex justify-between font-bold text-xl mt-4"><span>Total</span><span>R$ {finalTotal.toLocaleString('pt-BR')}</span></div>

                            {/* BOS MARGIN DISPLAY (Admin Only) */}
                            {profile?.role === 'ADMIN' && (
                                <div className={`mt-4 p-3 rounded-lg border ${isMarginLow ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                                    <div className="flex justify-between text-xs font-bold uppercase mb-1">
                                        <span>Margem Real (BOS)</span>
                                        <span>{marginPercent.toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                        <div className={`h-2 rounded-full ${isMarginLow ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min(100, Math.max(0, marginPercent))}%` }}></div>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Lucro Est.:</span>
                                        <span className="font-bold">R$ {marginValue.toLocaleString('pt-BR')}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* MOBILE SAVE BUTTON */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t z-50">
                <button onClick={handleSave} className="w-full bg-primary-600 text-white py-3 rounded-xl font-bold shadow-lg">Salvar Orçamento</button>
            </div>

            <DocumentGeneratorModal
                isOpen={showDocModal}
                onClose={() => setShowDocModal(false)}
                budget={{ ...existingBudget, final_value: finalTotal, payment_config: { method: paymentMethod } }} // Pass current values for preview
                patient={patient}
                items={items}
                professional={selectedProfessional}
            />
        </div>
    );
};

export default BudgetForm;
