import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Printer, FileText, ArrowLeft, Share2 } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { AppCard } from '../../components/ui/AppCard';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

export const SalesReceiptPage = () => {
    const { saleId } = useParams();
    const navigate = useNavigate();
    const [sale, setSale] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSale = async () => {
            // Busca a Venda + Paciente + Itens Vendidos
            const { data, error } = await supabase
                .from('sales')
                .select(`
          *,
          patients (name, cpf, email),
          budget_items (
            procedure_name,
            total_value,
            quantity
          )
        `)
                .eq('id', saleId)
                .single();

            if (error) {
                toast.error("Erro ao carregar recibo.");
                navigate('/sales/checkout'); // Volta se der erro
            } else {
                setSale(data);
            }
            setLoading(false);
        };

        fetchSale();
    }, [saleId]);

    if (loading) return <div className="p-8 text-center">Gerando recibo...</div>;
    if (!sale) return null;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">

            {/* CARD DE SUCESSO (Animação de entrada) */}
            <div className="max-w-md w-full animate-in zoom-in-95 duration-300">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <CheckCircle size={40} className="text-green-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">Pagamento Confirmado!</h1>
                    <p className="text-slate-500">Venda #{sale.id.substring(0, 8).toUpperCase()}</p>
                </div>

                <AppCard className="mb-6 border-t-4 border-t-green-500">
                    <div className="p-2 border-b border-slate-100 pb-4 mb-4 text-center">
                        <p className="text-sm text-slate-400 uppercase tracking-wide font-bold">Valor Total Pago</p>
                        <p className="text-4xl font-bold text-slate-800 mt-2">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.total_value)}
                        </p>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Paciente</span>
                            <span className="font-medium text-slate-800">{sale.patients.name}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Método</span>
                            <span className="font-medium text-slate-800 uppercase">{sale.payment_method}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Data</span>
                            <span className="font-medium text-slate-800">
                                {new Date(sale.created_at).toLocaleDateString()} às {new Date(sale.created_at).toLocaleTimeString().substring(0, 5)}
                            </span>
                        </div>
                    </div>

                    {/* Lista Resumida dos Itens */}
                    <div className="mt-6 pt-4 border-t border-dashed border-slate-200">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-2">Itens Inclusos</p>
                        {sale.budget_items.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-sm mb-1 text-slate-600">
                                <span>{item.quantity}x {item.procedure_name}</span>
                                <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total_value)}</span>
                            </div>
                        ))}
                    </div>
                </AppCard>

                {/* AÇÕES */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => toast.success("Imprimindo...")}
                        className="bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-bold flex items-center justify-center hover:bg-slate-50 transition-colors"
                    >
                        <Printer size={18} className="mr-2" /> Imprimir
                    </button>

                    <button
                        onClick={() => toast.success("Enviado via WhatsApp!")}
                        className="bg-green-600 text-white py-3 rounded-xl font-bold flex items-center justify-center hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
                    >
                        <Share2 size={18} className="mr-2" /> WhatsApp
                    </button>

                    <button
                        onClick={() => navigate('/sales/checkout')} // Volta para vender mais
                        className="col-span-2 text-slate-400 text-sm font-medium py-2 hover:text-slate-600 transition-colors flex items-center justify-center"
                    >
                        <ArrowLeft size={16} className="mr-1" /> Voltar ao Terminal
                    </button>
                </div>

            </div>
        </div>
    );
};
