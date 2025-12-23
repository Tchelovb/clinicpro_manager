import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBudget, useBudgetOperations } from '../hooks/useBudgets';
import { usePatient } from '../hooks/usePatients';
import {
    ArrowLeft, Edit, CheckCircle, XCircle, Printer,
    MessageCircle, DollarSign, Loader, FileText, CreditCard
} from 'lucide-react';

const BudgetDetail: React.FC = () => {
    const { patientId, id: budgetId } = useParams<{ patientId: string; id: string }>();
    const navigate = useNavigate();

    const { data: budget, isLoading: loadingBudget } = useBudget(budgetId);
    const { data: patient, isLoading: loadingPatient } = usePatient(patientId);
    const { approveBudget } = useBudgetOperations();

    if (loadingBudget || loadingPatient) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader className="animate-spin text-slate-600" size={48} />
            </div>
        );
    }

    if (!budget || !patient) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">Proposta não encontrada</h2>
                    <button
                        onClick={() => navigate(-1)}
                        className="text-slate-500 hover:text-slate-400"
                    >
                        ← Voltar
                    </button>
                </div>
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            'DRAFT': 'bg-slate-700 text-slate-300',
            'PENDING': 'bg-slate-700 text-slate-300',
            'APPROVED': 'bg-slate-700 text-slate-300',
            'REJECTED': 'bg-slate-700 text-slate-300',
            'Em Análise': 'bg-slate-700 text-slate-300',
            'Em Negociação': 'bg-slate-700 text-slate-300',
            'Enviado': 'bg-slate-700 text-slate-300'
        };
        return colors[status] || 'bg-slate-700 text-slate-300';
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('pt-BR');
    };

    // v4.0 FIX - Log version
    console.log("🚀 BudgetDetail PAGE v4.0 LOADED - REAL FIX APPLIED");

    const handleApprove = async () => {
        if (!budgetId || !patientId) {
            console.error("❌ Erro: ID inválido na página de detalhes.", { budgetId, patientId });
            return;
        }
        console.log("✅ Aprovando orçamento (Page View):", { budgetId, patientId });
        await approveBudget({ budgetId, patientId });
        navigate(`/patients/${patientId}`);
    };

    const handleWhatsApp = () => {
        const itemsList = budget.items?.map((i: any) => `• ${i.procedure_name || i.procedure}`).join('\n') || '';
        const message = `Olá ${patient.name}, segue o resumo do seu orçamento:\n\n${itemsList}\n\n*Total:* ${formatCurrency(budget.final_value)}\n\nPodemos avançar?`;
        window.open(`https://wa.me/${patient.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
    };

    return (
        <div className="min-h-screen bg-slate-950">
            {/* Header */}
            <div className="bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 md:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate(`/patients/${patientId}`)}
                                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="text-slate-400" size={20} />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-white">
                                    Proposta #{budget.id.slice(0, 8)}
                                </h1>
                                <p className="text-slate-400 text-sm">
                                    {patient.name} • {formatDate(budget.created_at)}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className={`px-4 py-2 rounded-lg font-medium text-sm ${getStatusColor(budget.status)}`}>
                                {budget.status}
                            </span>
                            <button
                                onClick={() => navigate(`/budgets/new?id=${budgetId}&patient_id=${patientId}`)}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors border border-slate-600"
                            >
                                <Edit size={18} />
                                Editar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content - Single Column Layout */}
            <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
                <div className="space-y-6">

                    {/* 1. PROCEDIMENTOS */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <FileText size={20} className="text-slate-500" />
                            Procedimentos
                        </h2>
                        <div className="space-y-3">
                            {budget.items && budget.items.length > 0 ? (
                                budget.items.map((item: any, index: number) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700"
                                    >
                                        <div className="flex-1">
                                            <h3 className="font-medium text-white">{item.procedure_name || item.procedure}</h3>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                                                {item.region && <span>Região: {item.region}</span>}
                                                {item.tooth_number && <span>Dente: {item.tooth_number}</span>}
                                                <span>Qtd: {item.quantity}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-white font-semibold text-lg">
                                                {formatCurrency(item.total_value || item.total)}
                                            </div>
                                            <div className="text-xs text-slate-400">
                                                {formatCurrency(item.unit_value || item.unitValue)} × {item.quantity}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-slate-400 text-center py-8">Nenhum procedimento adicionado</p>
                            )}
                        </div>

                        {/* Subtotal */}
                        <div className="mt-6 pt-6 border-t border-slate-800">
                            <div className="flex justify-between items-center text-lg">
                                <span className="text-slate-400 font-medium">Subtotal:</span>
                                <span className="text-white font-bold text-xl">
                                    {formatCurrency(budget.total_value)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 2. CONDIÇÕES DE PAGAMENTO */}
                    {budget.payment_config && (
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <CreditCard size={20} className="text-slate-500" />
                                Condições de Pagamento
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                                    <p className="text-slate-400 text-sm mb-2">Método</p>
                                    <p className="text-white font-semibold text-lg">{budget.payment_config.method}</p>
                                </div>
                                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                                    <p className="text-slate-400 text-sm mb-2">Parcelas</p>
                                    <p className="text-white font-semibold text-lg">{budget.payment_config.installments}x</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 3. RESUMO FINANCEIRO - Design Sóbrio */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-slate-400">Valor Total</h3>
                            <DollarSign className="text-slate-600" size={24} />
                        </div>
                        <div className="text-5xl font-bold text-white mb-6">
                            {formatCurrency(budget.final_value)}
                        </div>

                        <div className="space-y-3 pt-4 border-t border-slate-800">
                            <div className="flex justify-between text-base">
                                <span className="text-slate-400">Subtotal:</span>
                                <span className="font-medium text-slate-300">{formatCurrency(budget.total_value)}</span>
                            </div>
                            {budget.discount > 0 && (
                                <div className="flex justify-between text-base">
                                    <span className="text-slate-400">Desconto:</span>
                                    <span className="font-medium text-slate-300">
                                        -{formatCurrency(budget.discount)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 4. AÇÕES - Design Profissional */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <h3 className="text-xl font-bold text-white mb-6">Ações</h3>
                        <div className="space-y-3">
                            {budget.status !== 'APPROVED' && (
                                <button
                                    onClick={handleApprove}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors font-medium text-base border border-slate-600"
                                >
                                    <CheckCircle size={20} />
                                    Aprovar Proposta
                                </button>
                            )}

                            <button className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors border border-slate-700 font-medium">
                                <Printer size={20} />
                                Imprimir
                            </button>

                            <button
                                onClick={handleWhatsApp}
                                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors font-medium border border-slate-600"
                            >
                                <MessageCircle size={20} />
                                Enviar WhatsApp
                            </button>

                            {budget.status !== 'REJECTED' && budget.status !== 'APPROVED' && (
                                <button className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-slate-800 text-slate-400 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700 font-medium">
                                    <XCircle size={20} />
                                    Rejeitar
                                </button>
                            )}
                        </div>
                    </div>

                    {/* 5. INFORMAÇÕES DO PACIENTE */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <h3 className="text-xl font-bold text-white mb-6">Informações do Paciente</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                                <p className="text-slate-400 text-sm mb-2">Nome</p>
                                <p className="text-white font-medium text-lg">{patient.name}</p>
                            </div>
                            {patient.phone && (
                                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                                    <p className="text-slate-400 text-sm mb-2">Telefone</p>
                                    <p className="text-white font-medium text-lg">{patient.phone}</p>
                                </div>
                            )}
                            {patient.email && (
                                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 md:col-span-2">
                                    <p className="text-slate-400 text-sm mb-2">Email</p>
                                    <p className="text-white font-medium text-lg">{patient.email}</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default BudgetDetail;
