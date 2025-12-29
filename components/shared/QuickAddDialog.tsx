import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Loader2 } from 'lucide-react';
import { QuickAddConfig, QuickAddField, QuickAddResult } from '../../types/quickAdd';

interface QuickAddDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    config: QuickAddConfig;
    onSave: (data: Record<string, any>) => Promise<QuickAddResult | null>;
    isLoading?: boolean;
}

export function QuickAddDialog({
    open,
    onOpenChange,
    config,
    onSave,
    isLoading = false
}: QuickAddDialogProps) {
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Inicializar valores padrão quando o dialog abre
    React.useEffect(() => {
        if (open) {
            const defaultData: Record<string, any> = {};
            config.fields.forEach(field => {
                if (field.defaultValue !== undefined) {
                    defaultData[field.name] = field.defaultValue;
                }
            });
            setFormData(defaultData);
            setErrors({});
        }
    }, [open, config.fields]);

    const handleChange = (fieldName: string, value: any) => {
        setFormData(prev => ({ ...prev, [fieldName]: value }));
        // Limpar erro do campo ao editar
        if (errors[fieldName]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[fieldName];
                return newErrors;
            });
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        config.fields.forEach(field => {
            if (field.required && !formData[field.name]) {
                newErrors[field.name] = `${field.label} é obrigatório`;
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        await onSave(formData);
    };

    const renderField = (field: QuickAddField) => {
        const value = formData[field.name] ?? '';
        const error = errors[field.name];

        switch (field.type) {
            case 'text':
                return (
                    <div key={field.name} className="space-y-2">
                        <Label htmlFor={field.name}>
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <Input
                            id={field.name}
                            value={value}
                            onChange={(e) => handleChange(field.name, e.target.value)}
                            placeholder={field.placeholder}
                            className={error ? 'border-red-500' : ''}
                        />
                        {error && <p className="text-xs text-red-500">{error}</p>}
                    </div>
                );

            case 'number':
                return (
                    <div key={field.name} className="space-y-2">
                        <Label htmlFor={field.name}>
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <Input
                            id={field.name}
                            type="number"
                            value={value}
                            onChange={(e) => handleChange(field.name, parseFloat(e.target.value) || '')}
                            placeholder={field.placeholder}
                            className={error ? 'border-red-500' : ''}
                        />
                        {error && <p className="text-xs text-red-500">{error}</p>}
                    </div>
                );

            case 'select':
                return (
                    <div key={field.name} className="space-y-2">
                        <Label htmlFor={field.name}>
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <Select
                            value={value}
                            onValueChange={(val) => handleChange(field.name, val)}
                        >
                            <SelectTrigger className={error ? 'border-red-500' : ''}>
                                <SelectValue placeholder={field.placeholder || `Selecione ${field.label.toLowerCase()}`} />
                            </SelectTrigger>
                            <SelectContent>
                                {field.options?.map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {error && <p className="text-xs text-red-500">{error}</p>}
                    </div>
                );

            case 'textarea':
                return (
                    <div key={field.name} className="space-y-2">
                        <Label htmlFor={field.name}>
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <Textarea
                            id={field.name}
                            value={value}
                            onChange={(e) => handleChange(field.name, e.target.value)}
                            placeholder={field.placeholder}
                            className={error ? 'border-red-500' : ''}
                            rows={3}
                        />
                        {error && <p className="text-xs text-red-500">{error}</p>}
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Novo {config.entityName}</DialogTitle>
                    <DialogDescription>
                        Preencha os dados abaixo para criar um novo {config.entityName.toLowerCase()}.
                        Campos marcados com * são obrigatórios.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        {config.fields.map(field => renderField(field))}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                'Salvar'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
