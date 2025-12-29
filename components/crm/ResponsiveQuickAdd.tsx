import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Drawer } from 'vaul';

interface ResponsiveQuickAddProps {
    onSave: () => void;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    value: string;
    onTitleChange: (title: string) => void;
    onValueChange: (value: string) => void;
}

/**
 * ResponsiveQuickAdd - Steve Jobs Style
 * 
 * Desktop (≥768px): Popover contextual ao lado do botão
 * Mobile (<768px): Drawer (Bottom Sheet) nativo com física iOS/Android
 */
export function ResponsiveQuickAdd({ onSave, isOpen, onOpenChange, title, value, onTitleChange, onValueChange }: ResponsiveQuickAddProps) {
    const handleSave = () => {
        if (!title) return;
        onSave();
        onTitleChange('');
        onValueChange('');
        onOpenChange(false);
    };

    const handleCancel = () => {
        onTitleChange('');
        onValueChange('');
        onOpenChange(false);
    };

    // Form Content (reutilizado em ambos)
    const FormContent = (
        <div className="space-y-3">
            <h4 className="font-bold text-sm text-slate-900">Nova Oportunidade</h4>

            <div className="space-y-2">
                <div>
                    <label className="text-xs font-medium text-slate-600 uppercase">Título</label>
                    <Input
                        value={title}
                        onChange={(e) => onTitleChange(e.target.value)}
                        placeholder="Ex: Cervicoplastia"
                        className="mt-1 h-8 text-sm"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleSave();
                            }
                        }}
                    />
                </div>

                <div>
                    <label className="text-xs font-medium text-slate-600 uppercase">Valor (R$)</label>
                    <Input
                        type="number"
                        value={value}
                        onChange={(e) => onValueChange(e.target.value)}
                        placeholder="15000"
                        className="mt-1 h-8 text-sm"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleSave();
                            }
                        }}
                    />
                </div>
            </div>

            <div className="flex gap-2">
                <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-8 text-xs"
                    onClick={handleCancel}
                >
                    Cancelar
                </Button>
                <Button
                    size="sm"
                    className="flex-1 h-8 text-xs bg-blue-600 hover:bg-blue-700"
                    onClick={handleSave}
                >
                    Salvar
                </Button>
            </div>
        </div>
    );

    return (
        <>
            {/* DESKTOP: Popover (≥768px) */}
            <div className="hidden md:block">
                <Popover open={isOpen} onOpenChange={onOpenChange}>
                    <PopoverTrigger asChild>
                        <Button
                            size="sm"
                            className="h-9 w-9 p-0 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                            title="Adicionar Nova Oportunidade"
                        >
                            <Plus size={18} />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64" align="end">
                        {FormContent}
                    </PopoverContent>
                </Popover>
            </div>

            {/* MOBILE: Drawer (Bottom Sheet) (<768px) */}
            <div className="md:hidden">
                <Button
                    size="sm"
                    className="h-9 w-9 p-0 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                    title="Adicionar Nova Oportunidade"
                    onClick={() => onOpenChange(true)}
                >
                    <Plus size={18} />
                </Button>

                <Drawer.Root open={isOpen} onOpenChange={onOpenChange}>
                    <Drawer.Portal>
                        <Drawer.Overlay className="fixed inset-0 bg-black/40" />
                        <Drawer.Content className="bg-white flex flex-col rounded-t-[10px] h-[50%] mt-24 fixed bottom-0 left-0 right-0">
                            <div className="p-4 bg-white rounded-t-[10px] flex-1">
                                <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-300 mb-4" />
                                {FormContent}
                            </div>
                        </Drawer.Content>
                    </Drawer.Portal>
                </Drawer.Root>
            </div>
        </>
    );
}
