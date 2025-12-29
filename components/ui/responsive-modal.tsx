import React, { useState } from 'react';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from './dialog';
import { Drawer } from 'vaul';

interface ResponsiveModalProps {
    trigger: React.ReactNode;
    title: string;
    description?: string;
    children: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

/**
 * ResponsiveModal - Steve Jobs UX Pattern
 * 
 * Desktop (≥768px): Dialog centralizado com overlay
 * Mobile (<768px): Drawer (Bottom Sheet) com puxador
 * 
 * @example
 * <ResponsiveModal
 *   title="Novo Paciente"
 *   trigger={<Button>+ Novo Paciente</Button>}
 * >
 *   <Input placeholder="Nome" />
 *   <Button>Salvar</Button>
 * </ResponsiveModal>
 */
export function ResponsiveModal({ trigger, title, description, children, open: controlledOpen, onOpenChange: setControlledOpen }: ResponsiveModalProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isMobile = useMediaQuery("(max-width: 768px)");

    const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setOpen = setControlledOpen || setInternalOpen;

    if (isMobile) {
        // MOBILE: Drawer (Bottom Sheet)
        return (
            <Drawer.Root open={open} onOpenChange={setOpen}>
                <Drawer.Trigger asChild>
                    {trigger}
                </Drawer.Trigger>
                <Drawer.Portal>
                    <Drawer.Overlay className="fixed inset-0 bg-black/40" />
                    <Drawer.Content className="bg-white dark:bg-slate-900 flex flex-col rounded-t-[10px] h-[85%] mt-24 fixed bottom-0 left-0 right-0">
                        <div className="p-4 bg-white dark:bg-slate-900 rounded-t-[10px] flex-1 overflow-y-auto">
                            {/* Puxador (Handle) */}
                            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-300 mb-4" />

                            {/* Header */}
                            <div className="mb-4">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                    {title}
                                </h2>
                                {description && (
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                        {description}
                                    </p>
                                )}
                            </div>

                            {/* Content */}
                            {children}
                        </div>
                    </Drawer.Content>
                </Drawer.Portal>
            </Drawer.Root>
        );
    }

    // DESKTOP: Dialog (Modal Centralizado)
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description && <DialogDescription>{description}</DialogDescription>}
                </DialogHeader>
                {children}
            </DialogContent>
        </Dialog>
    );
}

// Export DialogTrigger for advanced usage
export { DialogTrigger } from './dialog';
