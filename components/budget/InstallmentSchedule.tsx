import React from 'react';
import { Calendar, DollarSign } from 'lucide-react';

interface InstallmentScheduleProps {
    installments: number;
    installmentValue: number;
    downPayment: number;
    totalValue: number;
}

export const InstallmentSchedule: React.FC<InstallmentScheduleProps> = ({
    installments,
    installmentValue,
    downPayment,
    totalValue
}) => {
    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    // Gerar datas de vencimento (30 dias entre cada parcela)
    const generateSchedule = () => {
        const schedule = [];
        const today = new Date();

        // Entrada (se houver)
        if (downPayment > 0) {
            schedule.push({
                number: 0,
                description: 'Entrada',
                value: downPayment,
                dueDate: today,
                isDownPayment: true
            });
        }

        // Parcelas
        for (let i = 1; i <= installments; i++) {
            const dueDate = new Date(today);
            dueDate.setDate(today.getDate() + (30 * i));

            schedule.push({
                number: i,
                description: `Parcela ${i}/${installments}`,
                value: installmentValue,
                dueDate,
                isDownPayment: false
            });
        }

        return schedule;
    };

    const schedule = generateSchedule();

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-600/20 rounded-lg">
                    <Calendar className="text-purple-400" size={20} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">Cronograma de Pagamentos</h2>
                    <p className="text-sm text-slate-400">
                        {schedule.length} {schedule.length === 1 ? 'pagamento' : 'pagamentos'} • Total: {formatCurrency(totalValue)}
                    </p>
                </div>
            </div>

            <div className="space-y-3">
                {schedule.map((item, index) => (
                    <div
                        key={index}
                        className={`flex items-center justify-between p-4 rounded-lg border transition-all ${item.isDownPayment
                                ? 'bg-emerald-900/20 border-emerald-700/50'
                                : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                            }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${item.isDownPayment
                                    ? 'bg-emerald-600/20 text-emerald-400'
                                    : 'bg-purple-600/20 text-purple-400'
                                }`}>
                                {item.isDownPayment ? (
                                    <DollarSign size={18} />
                                ) : (
                                    <span className="text-sm font-bold">{item.number}</span>
                                )}
                            </div>

                            <div>
                                <h4 className="font-bold text-white">{item.description}</h4>
                                <div className="flex items-center gap-2 text-sm text-slate-400">
                                    <Calendar size={14} />
                                    <span>{formatDate(item.dueDate)}</span>
                                    {item.isDownPayment && (
                                        <span className="px-2 py-0.5 bg-emerald-900/50 text-emerald-300 rounded text-xs font-bold">
                                            HOJE
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className="text-lg font-black text-white">
                                {formatCurrency(item.value)}
                            </div>
                            {!item.isDownPayment && installments > 1 && (
                                <div className="text-xs text-slate-500">
                                    em {30 * item.number} dias
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Resumo Final */}
            <div className="mt-6 pt-6 border-t border-slate-800">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 rounded-lg p-4">
                        <p className="text-xs text-slate-400 mb-1">Primeira Parcela</p>
                        <p className="text-lg font-bold text-white">
                            {formatDate(schedule[0].dueDate)}
                        </p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-4">
                        <p className="text-xs text-slate-400 mb-1">Última Parcela</p>
                        <p className="text-lg font-bold text-white">
                            {formatDate(schedule[schedule.length - 1].dueDate)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
