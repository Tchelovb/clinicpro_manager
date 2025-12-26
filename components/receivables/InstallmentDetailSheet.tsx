import React, { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../ui/sheet';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Separator } from '../ui/separator';
import { Calendar, DollarSign, User, Phone, Mail, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { Installment, receivablesService } from '../../services/receivablesService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface InstallmentDetailSheetProps {
    installment: Installment | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdate?: () => void;
}

export const InstallmentDetailSheet: React.FC<InstallmentDetailSheetProps> = ({
    installment,
    open,
    onOpenChange,
    onUpdate
}) => {
    const [loading, setLoading] = useState(false);

    if (!installment) return null;

    const handleMarkAsPaid = async () => {
        try {
            setLoading(true);
            await receivablesService.markAsPaid(
                installment.id,
                'CASH', // TODO: Allow user to select payment method
                new Date().toISOString()
            );

            if (onUpdate) onUpdate();
            onOpenChange(false);
        } catch (error) {
            console.error('Error marking as paid:', error);
            alert('Erro ao marcar como pago');
        } finally {
            setLoading(false);
        }
    };

    const dueDate = new Date(installment.due_date);
    const today = new Date();
    const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    const isOverdue = installment.status === 'OVERDUE';
    const isPaid = installment.status === 'PAID';

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
                <SheetHeader className="mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <SheetTitle className="text-2xl">Detalhes da Parcela</SheetTitle>
                            <SheetDescription>
                                Parcela {installment.installment_number} de {installment.total_installments}
                            </SheetDescription>
                        </div>
                        <Badge
                            variant={isPaid ? "default" : isOverdue ? "destructive" : "outline"}
                            className="text-sm"
                        >
                            {isPaid ? 'Paga' : isOverdue ? 'Vencida' : 'A Vencer'}
                        </Badge>
                    </div>
                </SheetHeader>

                <div className="space-y-6">
                    {/* Patient Info */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-blue-100 rounded-lg">
                                    <User className="text-blue-600" size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg text-slate-800">
                                        {installment.patient?.name}
                                    </h3>
                                    <div className="space-y-1 mt-2">
                                        {installment.patient?.phone && (
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <Phone size={14} />
                                                <span>{installment.patient.phone}</span>
                                            </div>
                                        )}
                                        {installment.patient?.email && (
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <Mail size={14} />
                                                <span>{installment.patient.email}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Details */}
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600">Valor da Parcela</span>
                                <span className="text-3xl font-bold text-violet-600">
                                    R$ {installment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600">Data de Vencimento</span>
                                <div className="flex items-center gap-2">
                                    <Calendar size={16} className="text-slate-400" />
                                    <span className="font-medium">
                                        {format(dueDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                    </span>
                                </div>
                            </div>

                            {isOverdue && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <div className="flex items-center gap-2 text-red-800">
                                        <AlertTriangle size={16} />
                                        <span className="font-bold text-sm">
                                            Vencida há {daysOverdue} dias
                                        </span>
                                    </div>
                                </div>
                            )}

                            {isPaid && installment.paid_date && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                    <div className="flex items-center gap-2 text-green-800">
                                        <CheckCircle2 size={16} />
                                        <span className="font-bold text-sm">
                                            Paga em {format(new Date(installment.paid_date), "dd/MM/yyyy")}
                                        </span>
                                    </div>
                                    {installment.payment_method && (
                                        <p className="text-xs text-green-700 mt-1">
                                            Método: {installment.payment_method}
                                        </p>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Notes */}
                    {installment.notes && (
                        <Card>
                            <CardContent className="pt-6">
                                <h4 className="font-bold text-sm text-slate-700 mb-2">Observações</h4>
                                <p className="text-sm text-slate-600">{installment.notes}</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Actions */}
                    {!isPaid && (
                        <div className="flex gap-3">
                            <Button
                                onClick={handleMarkAsPaid}
                                disabled={loading}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                                <CheckCircle2 size={16} className="mr-2" />
                                {loading ? 'Processando...' : 'Marcar como Pago'}
                            </Button>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
};
