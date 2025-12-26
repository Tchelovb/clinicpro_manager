import React, { useState, useEffect } from 'react';
import { DollarSign, Calendar, AlertTriangle, CheckCircle2, Clock, Phone, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { receivablesService, Installment, ReceivablesStats } from '../../services/receivablesService';
import { InstallmentDetailSheet } from './InstallmentDetailSheet';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

const STATUS_CONFIG = {
    PENDING: {
        label: 'A Vencer',
        color: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-700',
        icon: Clock
    },
    OVERDUE: {
        label: 'Vencidas',
        color: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-700',
        icon: AlertTriangle
    },
    PAID: {
        label: 'Pagas',
        color: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-700',
        icon: CheckCircle2
    }
};

export const ReceivablesKanban: React.FC = () => {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [installments, setInstallments] = useState<Installment[]>([]);
    const [stats, setStats] = useState<ReceivablesStats | null>(null);
    const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);

    useEffect(() => {
        if (profile?.clinic_id) {
            loadData();
        }
    }, [profile?.clinic_id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const clinicId = profile?.clinic_id!;

            const [installmentsData, statsData] = await Promise.all([
                receivablesService.getInstallments(clinicId),
                receivablesService.getStats(clinicId)
            ]);

            setInstallments(installmentsData);
            setStats(statsData);
        } catch (error) {
            console.error('Error loading receivables:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsPaid = async (installment: Installment) => {
        try {
            await receivablesService.markAsPaid(
                installment.id,
                'CASH', // TODO: Allow user to select payment method
                new Date().toISOString()
            );
            await loadData();
        } catch (error) {
            console.error('Error marking as paid:', error);
            alert('Erro ao marcar como pago');
        }
    };

    const groupedInstallments = {
        PENDING: installments.filter(i => i.status === 'PENDING'),
        OVERDUE: installments.filter(i => i.status === 'OVERDUE'),
        PAID: installments.filter(i => i.status === 'PAID')
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header Stats */}
            <div className="grid grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">A Receber</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    R$ {stats?.totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <Clock className="text-blue-600" size={32} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Vencidas</p>
                                <p className="text-2xl font-bold text-red-600">
                                    R$ {stats?.totalOverdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-xs text-slate-400">{stats?.overdueCount} parcelas</p>
                            </div>
                            <AlertTriangle className="text-red-600" size={32} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Recebido</p>
                                <p className="text-2xl font-bold text-green-600">
                                    R$ {stats?.totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <CheckCircle2 className="text-green-600" size={32} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Esta Semana</p>
                                <p className="text-2xl font-bold text-violet-600">
                                    R$ {stats?.dueThisWeek.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <Calendar className="text-violet-600" size={32} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Kanban Board */}
            <div className="grid grid-cols-3 gap-4">
                {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                    const items = groupedInstallments[status as keyof typeof groupedInstallments];
                    const Icon = config.icon;

                    return (
                        <div key={status} className="space-y-3">
                            {/* Column Header */}
                            <div className={cn(
                                "p-3 rounded-lg border-2",
                                config.color,
                                config.borderColor
                            )}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Icon className={config.textColor} size={20} />
                                        <h3 className={cn("font-bold", config.textColor)}>
                                            {config.label}
                                        </h3>
                                    </div>
                                    <Badge variant="outline" className={config.textColor}>
                                        {items.length}
                                    </Badge>
                                </div>
                            </div>

                            {/* Column Items */}
                            <div className="space-y-2 min-h-[400px]">
                                {items.map(installment => {
                                    const dueDate = new Date(installment.due_date);
                                    const today = new Date();
                                    const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

                                    return (
                                        <Card
                                            key={installment.id}
                                            className={cn(
                                                "cursor-pointer hover:shadow-md transition-all border-l-4",
                                                status === 'OVERDUE' && 'border-l-red-500',
                                                status === 'PENDING' && 'border-l-blue-500',
                                                status === 'PAID' && 'border-l-green-500'
                                            )}
                                            onClick={() => setSelectedInstallment(installment)}
                                        >
                                            <CardContent className="p-4 space-y-3">
                                                {/* Patient Name */}
                                                <div>
                                                    <p className="font-bold text-slate-800">
                                                        {installment.patient?.name}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        Parcela {installment.installment_number}/{installment.total_installments}
                                                    </p>
                                                </div>

                                                {/* Amount */}
                                                <div className="flex items-center justify-between">
                                                    <span className="text-2xl font-bold text-violet-600">
                                                        R$ {installment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </span>
                                                </div>

                                                {/* Due Date */}
                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                    <Calendar size={14} />
                                                    <span>
                                                        {dueDate.toLocaleDateString('pt-BR')}
                                                    </span>
                                                    {status === 'OVERDUE' && (
                                                        <Badge variant="destructive" className="ml-auto text-xs">
                                                            {daysOverdue} dias
                                                        </Badge>
                                                    )}
                                                </div>

                                                {/* Contact */}
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <Phone size={12} />
                                                    <span>{installment.patient?.phone}</span>
                                                </div>

                                                {/* Actions */}
                                                {status !== 'PAID' && (
                                                    <div className="pt-2 border-t border-slate-100">
                                                        <Button
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleMarkAsPaid(installment);
                                                            }}
                                                            className="w-full bg-green-600 hover:bg-green-700"
                                                        >
                                                            <CheckCircle2 size={14} className="mr-1" />
                                                            Marcar como Pago
                                                        </Button>
                                                    </div>
                                                )}

                                                {status === 'PAID' && installment.paid_date && (
                                                    <div className="text-xs text-green-600 flex items-center gap-1">
                                                        <CheckCircle2 size={12} />
                                                        Pago em {new Date(installment.paid_date).toLocaleDateString('pt-BR')}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })}

                                {items.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-12 text-center opacity-50">
                                        <Icon className="text-slate-300 mb-2" size={48} />
                                        <p className="text-sm text-slate-400">
                                            Nenhuma parcela {config.label.toLowerCase()}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Installment Detail Sheet */}
            <InstallmentDetailSheet
                installment={selectedInstallment}
                open={!!selectedInstallment}
                onOpenChange={(open) => !open && setSelectedInstallment(null)}
                onUpdate={loadData}
            />
        </div>
    );
};
