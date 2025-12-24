import React, { useState, useEffect } from 'react';
import { BaseSheet } from '../shared/BaseSheet';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { CalendarIcon, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface Expense {
    id?: string;
    description: string;
    amount: number;
    category_id: string;
    supplier_id?: string;
    due_date: Date;
    payment_date?: Date;
    status: 'PENDING' | 'PAID' | 'OVERDUE';
    notes?: string;
}

interface Category {
    id: string;
    name: string;
}

interface Supplier {
    id: string;
    name: string;
}

interface ExpenseSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    expense: Expense | null;
    categories: Category[];
    suppliers: Supplier[];
    onSave: (data: Expense) => Promise<void>;
}

export const ExpenseSheet: React.FC<ExpenseSheetProps> = ({
    open,
    onOpenChange,
    expense,
    categories,
    suppliers,
    onSave
}) => {
    const [formData, setFormData] = useState<Expense>({
        description: '',
        amount: 0,
        category_id: '',
        supplier_id: '',
        due_date: new Date(),
        status: 'PENDING',
        notes: ''
    });

    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (expense) {
            setFormData(expense);
        } else {
            setFormData({
                description: '',
                amount: 0,
                category_id: '',
                supplier_id: '',
                due_date: new Date(),
                status: 'PENDING',
                notes: ''
            });
        }
    }, [expense, open]);

    const handleChange = (field: keyof Expense, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        if (!formData.description || !formData.category_id || formData.amount <= 0) {
            toast.error('Preencha todos os campos obrigatórios');
            return;
        }

        try {
            setSaving(true);
            await onSave(formData);
            toast.success('Despesa salva com sucesso!');
            onOpenChange(false);
        } catch (error) {
            console.error('Erro ao salvar:', error);
            toast.error('Erro ao salvar despesa');
        } finally {
            setSaving(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    return (
        <BaseSheet
            open={open}
            onOpenChange={onOpenChange}
            title={expense ? 'Editar Despesa' : 'Nova Despesa'}
            description="Registre uma despesa ou conta a pagar"
            size="lg"
            onSave={handleSubmit}
            saving={saving}
            saveDisabled={!formData.description || !formData.category_id || formData.amount <= 0}
        >
            <div className="space-y-6">
                {/* Descrição */}
                <div>
                    <Label htmlFor="description">Descrição *</Label>
                    <Input
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        placeholder="Ex: Aluguel do consultório"
                        className="mt-1.5"
                    />
                </div>

                {/* Valor e Categoria */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="amount" className="flex items-center gap-1.5">
                            <DollarSign className="w-3.5 h-3.5" />
                            Valor *
                        </Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.amount}
                            onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
                            className="mt-1.5"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            {formatCurrency(formData.amount)}
                        </p>
                    </div>

                    <div>
                        <Label htmlFor="category">Categoria *</Label>
                        <Select
                            value={formData.category_id}
                            onValueChange={(value) => handleChange('category_id', value)}
                        >
                            <SelectTrigger className="mt-1.5">
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Fornecedor */}
                <div>
                    <Label htmlFor="supplier">Fornecedor (Opcional)</Label>
                    <Select
                        value={formData.supplier_id || ''}
                        onValueChange={(value) => handleChange('supplier_id', value)}
                    >
                        <SelectTrigger className="mt-1.5">
                            <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">Nenhum</SelectItem>
                            {suppliers.map(sup => (
                                <SelectItem key={sup.id} value={sup.id}>
                                    {sup.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Data de Vencimento */}
                <div>
                    <Label>Data de Vencimento *</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal mt-1.5"
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {formData.due_date ? (
                                    format(formData.due_date, "PPP", { locale: ptBR })
                                ) : (
                                    <span>Selecione uma data</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={formData.due_date}
                                onSelect={(date) => handleChange('due_date', date)}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Status */}
                <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                        value={formData.status}
                        onValueChange={(value: 'PENDING' | 'PAID' | 'OVERDUE') => handleChange('status', value)}
                    >
                        <SelectTrigger className="mt-1.5">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="PENDING">Pendente</SelectItem>
                            <SelectItem value="PAID">Pago</SelectItem>
                            <SelectItem value="OVERDUE">Vencido</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Observações */}
                <div>
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                        id="notes"
                        value={formData.notes || ''}
                        onChange={(e) => handleChange('notes', e.target.value)}
                        placeholder="Informações adicionais..."
                        className="mt-1.5"
                        rows={3}
                    />
                </div>

                {/* Resumo */}
                <div className="bg-muted rounded-lg p-4 border">
                    <h4 className="text-sm font-bold mb-2">Resumo</h4>
                    <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Valor:</span>
                            <span className="font-bold">{formatCurrency(formData.amount)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Vencimento:</span>
                            <span className="font-medium">
                                {format(formData.due_date, "dd/MM/yyyy")}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Status:</span>
                            <span className={`font-medium ${formData.status === 'PAID' ? 'text-green-600' :
                                    formData.status === 'OVERDUE' ? 'text-red-600' :
                                        'text-yellow-600'
                                }`}>
                                {formData.status === 'PAID' ? 'Pago' :
                                    formData.status === 'OVERDUE' ? 'Vencido' :
                                        'Pendente'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </BaseSheet>
    );
};

export default ExpenseSheet;
