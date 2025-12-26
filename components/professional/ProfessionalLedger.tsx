import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Calendar, FileText, Scissors, Pill, ArrowDownCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { professionalLedgerService, ProfessionalLedgerEntry, ProfessionalBalance } from '../../services/professionalLedgerService';
import { cn } from '../../lib/utils';

interface ProfessionalLedgerProps {
    professionalId: string;
    className?: string;
}

const CATEGORY_CONFIG = {
    COMMISSION: {
        label: 'Comissão',
        icon: DollarSign,
        color: 'text-green-600',
        bgColor: 'bg-green-50'
    },
    LAB_COST: {
        label: 'Custo Lab',
        icon: Scissors,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50'
    },
    MATERIAL_COST: {
        label: 'Material',
        icon: Pill,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
    },
    ADJUSTMENT: {
        label: 'Ajuste',
        icon: FileText,
        color: 'text-slate-600',
        bgColor: 'bg-slate-50'
    },
    WITHDRAWAL: {
        label: 'Saque',
        icon: ArrowDownCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50'
    }
};

export const ProfessionalLedger: React.FC<ProfessionalLedgerProps> = ({
    professionalId,
    className
}) => {
    const [loading, setLoading] = useState(true);
    const [entries, setEntries] = useState<ProfessionalLedgerEntry[]>([]);
    const [balance, setBalance] = useState<ProfessionalBalance | null>(null);
    const [filter, setFilter] = useState<'ALL' | 'CREDIT' | 'DEBIT'>('ALL');

    useEffect(() => {
        loadData();
    }, [professionalId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [entriesData, balanceData] = await Promise.all([
                professionalLedgerService.getLedgerEntries(professionalId),
                professionalLedgerService.getProfessionalBalance(professionalId)
            ]);

            setEntries(entriesData);
            setBalance(balanceData);
        } catch (error) {
            console.error('Error loading ledger:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredEntries = filter === 'ALL'
        ? entries
        : entries.filter(e => e.entry_type === filter);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600" />
            </div>
        );
    }

    return (
        <div className={cn("space-y-6", className)}>
            {/* Balance Cards */}
            <div className="grid grid-cols-4 gap-4">
                <Card className="border-2 border-green-200 bg-green-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-green-700 font-medium">Créditos</p>
                                <p className="text-2xl font-bold text-green-800">
                                    R$ {balance?.total_credits.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <TrendingUp className="text-green-600" size={32} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-2 border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-red-700 font-medium">Débitos</p>
                                <p className="text-2xl font-bold text-red-800">
                                    R$ {balance?.total_debits.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <TrendingDown className="text-red-600" size={32} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-2 border-violet-200 bg-violet-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-violet-700 font-medium">Saldo Atual</p>
                                <p className="text-2xl font-bold text-violet-800">
                                    R$ {balance?.current_balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <DollarSign className="text-violet-600" size={32} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-2 border-blue-200 bg-blue-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-blue-700 font-medium">Disponível</p>
                                <p className="text-2xl font-bold text-blue-800">
                                    R$ {balance?.available_for_withdrawal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <ArrowDownCircle className="text-blue-600" size={32} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
                <Button
                    variant={filter === 'ALL' ? 'default' : 'outline'}
                    onClick={() => setFilter('ALL')}
                    size="sm"
                >
                    Todos
                </Button>
                <Button
                    variant={filter === 'CREDIT' ? 'default' : 'outline'}
                    onClick={() => setFilter('CREDIT')}
                    size="sm"
                    className={filter === 'CREDIT' ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                    Créditos
                </Button>
                <Button
                    variant={filter === 'DEBIT' ? 'default' : 'outline'}
                    onClick={() => setFilter('DEBIT')}
                    size="sm"
                    className={filter === 'DEBIT' ? 'bg-red-600 hover:bg-red-700' : ''}
                >
                    Débitos
                </Button>
            </div>

            {/* Ledger Entries */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Extrato de Movimentações</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {filteredEntries.length === 0 ? (
                            <div className="text-center py-12 text-slate-400">
                                <FileText size={48} className="mx-auto mb-3 opacity-20" />
                                <p>Nenhuma movimentação encontrada</p>
                            </div>
                        ) : (
                            filteredEntries.map(entry => {
                                const config = CATEGORY_CONFIG[entry.category];
                                const Icon = config.icon;
                                const isCredit = entry.entry_type === 'CREDIT';

                                return (
                                    <div
                                        key={entry.id}
                                        className={cn(
                                            "flex items-center justify-between p-4 rounded-lg border-l-4 hover:shadow-md transition-all",
                                            isCredit ? "border-l-green-500 bg-green-50" : "border-l-red-500 bg-red-50"
                                        )}
                                    >
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className={cn(
                                                "p-3 rounded-lg",
                                                config.bgColor
                                            )}>
                                                <Icon className={config.color} size={20} />
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge variant="outline" className="text-xs">
                                                        {config.label}
                                                    </Badge>
                                                    <Badge
                                                        variant={isCredit ? "default" : "destructive"}
                                                        className="text-xs"
                                                    >
                                                        {isCredit ? 'Crédito' : 'Débito'}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-slate-800 font-medium">
                                                    {entry.description}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                                    <Calendar size={12} />
                                                    <span>
                                                        {new Date(entry.created_at).toLocaleDateString('pt-BR', {
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <p className={cn(
                                                "text-2xl font-bold",
                                                isCredit ? "text-green-600" : "text-red-600"
                                            )}>
                                                {isCredit ? '+' : '-'} R$ {entry.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
