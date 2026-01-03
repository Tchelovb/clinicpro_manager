import React, { useState, useEffect, useRef } from 'react';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Pencil } from 'lucide-react';
import { cn } from '../../src/lib/utils';

interface InlineEditFieldProps {
    value: string | number;
    onSave: (newValue: string | number) => void;
    type?: 'text' | 'currency' | 'phone' | 'textarea';
    label?: string;
    className?: string;
    placeholder?: string;
}

export function InlineEditField({
    value,
    onSave,
    type = 'text',
    label,
    className,
    placeholder = 'Clique para editar'
}: InlineEditFieldProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value);
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

    useEffect(() => {
        setEditValue(value);
    }, [value]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            if (inputRef.current instanceof HTMLInputElement) {
                inputRef.current.select();
            }
        }
    }, [isEditing]);

    const handleSave = () => {
        if (editValue !== value) {
            onSave(editValue);
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && type !== 'textarea') {
            e.preventDefault();
            handleSave();
        }
        if (e.key === 'Escape') {
            setEditValue(value);
            setIsEditing(false);
        }
    };

    const formatDisplay = (val: string | number) => {
        if (!val) return placeholder;

        if (type === 'currency') {
            const numValue = typeof val === 'string' ? parseFloat(val) : val;
            return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            }).format(numValue || 0);
        }

        if (type === 'phone') {
            const phone = String(val).replace(/\D/g, '');
            if (phone.length === 11) {
                return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
            }
            return val;
        }

        return val;
    };

    if (isEditing) {
        const Component = type === 'textarea' ? Textarea : Input;
        return (
            <Component
                ref={inputRef as any}
                type={type === 'currency' ? 'number' : 'text'}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className={cn('border-blue-500 ring-2 ring-blue-200', className)}
                placeholder={placeholder}
            />
        );
    }

    return (
        <div
            onClick={() => setIsEditing(true)}
            className={cn(
                'group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 rounded px-2 py-1 transition-colors relative',
                !value && 'text-slate-400',
                className
            )}
        >
            {label && (
                <div className="text-xs font-medium text-slate-500 mb-1">{label}</div>
            )}
            <div className="flex items-center gap-2">
                <span className={cn(!value && 'italic')}>{formatDisplay(value)}</span>
                <Pencil className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
        </div>
    );
}
