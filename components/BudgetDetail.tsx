import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBudget, useBudgetOperations } from '../hooks/useBudgets';
import { usePatient } from '../hooks/usePatients';
import {
    ArrowLeft, Edit, CheckCircle, XCircle, Printer,
    MessageCircle, Calendar, DollarSign, CreditCard,
    FileText, Loader, TrendingUp
} from 'lucide-react';

const BudgetDetail: React.FC = () => {
    const { patientId, id: budgetId } = useParams<{ patientId: string; id: string }>();
    const navigate = useNavigate();

    const { data: budget, isLoading: loadingBudget } = useBudget(budgetId);
    const { data: patient, isLoading: loadingPatient } = usePatient(patientId);
    const { approveBudget } = useBudgetOperations();

    const handleApprove = () => {
        if (!budgetId || !patientId) {
            alert('Erro: ID do orçamento ou paciente não encontrado');
            return;
        }
        approveBudget({ budgetId, patientId });
        // Navigate back after approval
        setTimeout(() => navigate(`/patients/${patientId}`), 1000);
    };

    if (loadingBudget || loadingPatient) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader className="animate-spin text-blue-600" size={48} />
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
                        className="text-blue-500 hover:text-blue-400"
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
            'PENDING': 'bg-yellow-600 text-white',
            'APPROVED': 'bg-emerald-600 text-white',
            'REJECTED': 'bg-red-600 text-white',
            'Em Análise': 'bg-blue-600 text-white',
            'Em Negociação': 'bg-purple-600 text-white',
            'Enviado': 'bg-cyan-600 text-white'
        };
        return colors[status] || 'bg-slate-600 text-white';
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

    return (
        <div className="min-h-screen bg-slate-950">
            {/* Header */}
            <div className="bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4">
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
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Edit size={18} />
                                Editar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Items */}
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <FileText size={20} />
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
                                                <div className="text-white font-semibold">
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
                        </div>

                        {/* Payment Info */}
                        {budget.payment_config && (
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <CreditCard size={20} />
                                    Condições de Pagamento
                                </h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-800/50 rounded-lg">
                                        <p className="text-slate-400 text-sm mb-1">Método</p>
                                        <p className="text-white font-semibold">{budget.payment_config.method}</p>
                                    </div>
                                    <div className="p-4 bg-slate-800/50 rounded-lg">
                                        <p className="text-slate-400 text-sm mb-1">Parcelas</p>
                                        <p className="text-white font-semibold">{budget.payment_config.installments}x</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Financial Summary */}
                        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white">
                            <h3 className="text-sm font-medium opacity-90 mb-2">Valor Total</h3>
                            <div className="text-4xl font-bold mb-4">
                                {formatCurrency(budget.final_value)}
                            </div>

                            <div className="space-y-2 pt-4 border-t border-blue-500/30">
                                <div className="flex justify-between text-sm">
                                    <span className="opacity-90">Subtotal:</span>
                                    <span className="font-medium">{formatCurrency(budget.total_value)}</span>
                                </div>
                                {budget.discount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="opacity-90">Desconto:</span>
                                        <span className="font-medium text-emerald-300">
                                            -{formatCurrency(budget.discount)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4">Ações</h3>
                            <div className="space-y-3">
                                {budget.status !== 'APPROVED' && (
                                    <button
                                        onClick={handleApprove}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                                    >
                                        <CheckCircle size={18} />
                                        Aprovar Proposta
                                    </button>
                                )}

                                <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors border border-slate-700">
                                    <Printer size={18} />
                                    Imprimir
                                </button>

                                <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
                                    <MessageCircle size={18} />
                                    Enviar WhatsApp
                                </button>

                                {budget.status !== 'REJECTED' && budget.status !== 'APPROVED' && (
                                    <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600/10 text-red-400 rounded-lg hover:bg-red-600/20 transition-colors border border-red-600/30">
                                        <XCircle size={18} />
                                        Rejeitar
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Patient Info */}
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4">Informações do Paciente</h3>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <p className="text-slate-400">Nome</p>
                                    <p className="text-white font-medium">{patient.name}</p>
                                </div>
                                {patient.phone && (
                                    <div>
                                        <p className="text-slate-400">Telefone</p>
                                        <p className="text-white font-medium">{patient.phone}</p>
                                    </div>
                                )}
                                {patient.email && (
                                    <div>
                                        <p className="text-slate-400">Email</p>
                                        <p className="text-white font-medium">{patient.email}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BudgetDetail;
