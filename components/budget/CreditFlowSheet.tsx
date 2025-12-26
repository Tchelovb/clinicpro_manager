import React, { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../ui/sheet';
import { BudgetWithCreditFlow } from './BudgetWithCreditFlow';
import { Button } from '../ui/button';
import { CreditCard, X } from 'lucide-react';

interface CreditFlowSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    patientId?: string;
    budgetValue: number;
    onConfirm?: (data: any) => void;
}

/**
 * Sheet component for Credit Analysis + Payment Simulation flow
 * Uses shadcn Sheet for modern, accessible modal experience
 */
export const CreditFlowSheet: React.FC<CreditFlowSheetProps> = ({
    open,
    onOpenChange,
    patientId,
    budgetValue,
    onConfirm
}) => {
    const handleConfirm = (data: any) => {
        if (onConfirm) {
            onConfirm(data);
        }
        onOpenChange(false);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-4xl overflow-y-auto">
                <SheetHeader className="mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-violet-100 rounded-lg">
                                <CreditCard className="text-violet-600" size={24} />
                            </div>
                            <div>
                                <SheetTitle className="text-2xl">Análise de Crédito & Pagamento</SheetTitle>
                                <SheetDescription className="text-base">
                                    Configure as melhores condições de pagamento para o paciente
                                </SheetDescription>
                            </div>
                        </div>
                    </div>
                </SheetHeader>

                <BudgetWithCreditFlow
                    patientId={patientId}
                    budgetValue={budgetValue}
                    onConfirm={handleConfirm}
                />
            </SheetContent>
        </Sheet>
    );
};
