import React from 'react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '../ui/sheet';
import { Button } from '../ui/button';
import { Loader2, Save, X } from 'lucide-react';

export type SheetSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | 'full';

interface BaseSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    size?: SheetSize;
    children: React.ReactNode;
    footer?: React.ReactNode;
    showDefaultFooter?: boolean;
    onSave?: () => void;
    onCancel?: () => void;
    saving?: boolean;
    saveLabel?: string;
    cancelLabel?: string;
    saveDisabled?: boolean;
}

const sizeClasses: Record<SheetSize, string> = {
    'sm': 'sm:max-w-sm',   // 384px - Formulários muito simples
    'md': 'sm:max-w-md',   // 448px - Formulários simples
    'lg': 'sm:max-w-lg',   // 512px - Formulários padrão
    'xl': 'sm:max-w-xl',   // 576px - Formulários complexos
    '2xl': 'sm:max-w-2xl', // 672px - Formulários com listas
    '4xl': 'sm:max-w-4xl', // 896px - Formulários muito complexos
    'full': 'sm:max-w-full' // Full width
};

/**
 * BaseSheet - Componente base para todos os Sheets do sistema
 * 
 * @example
 * ```tsx
 * <BaseSheet
 *   open={open}
 *   onOpenChange={setOpen}
 *   title="Novo Paciente"
 *   description="Cadastre um novo paciente no sistema"
 *   size="xl"
 *   onSave={handleSave}
 *   saving={saving}
 * >
 *   <div className="space-y-6">
 *     <Input label="Nome" />
 *     <Input label="CPF" />
 *   </div>
 * </BaseSheet>
 * ```
 */
export const BaseSheet: React.FC<BaseSheetProps> = ({
    open,
    onOpenChange,
    title,
    description,
    size = 'xl',
    children,
    footer,
    showDefaultFooter = true,
    onSave,
    onCancel,
    saving = false,
    saveLabel = 'Salvar',
    cancelLabel = 'Cancelar',
    saveDisabled = false
}) => {
    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        } else {
            onOpenChange(false);
        }
    };

    const handleSave = () => {
        if (onSave) {
            onSave();
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className={`${sizeClasses[size]} overflow-y-auto`}>
                {/* Header */}
                <SheetHeader>
                    <SheetTitle className="text-2xl">{title}</SheetTitle>
                    {description && (
                        <SheetDescription>{description}</SheetDescription>
                    )}
                </SheetHeader>

                {/* Content */}
                <div className="mt-6">
                    {children}
                </div>

                {/* Footer */}
                {footer ? (
                    <div className="mt-6 pt-6 border-t">
                        {footer}
                    </div>
                ) : showDefaultFooter && (onSave || onCancel) ? (
                    <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t">
                        <Button
                            variant="outline"
                            onClick={handleCancel}
                            disabled={saving}
                        >
                            {cancelLabel}
                        </Button>
                        {onSave && (
                            <Button
                                onClick={handleSave}
                                disabled={saving || saveDisabled}
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        {saveLabel}
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                ) : null}
            </SheetContent>
        </Sheet>
    );
};

export default BaseSheet;
