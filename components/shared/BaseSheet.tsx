import React from 'react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '../ui/sheet';
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from '../ui/drawer';
import { Button } from '../ui/button';
import { Loader2, Save, X } from 'lucide-react';
import { useMediaQuery } from '../../hooks/useMediaQuery';

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
    '2xl': 'sm:max-w-3xl', // FIX: Increased to 3xl (768px for "2xl")
    '4xl': 'sm:max-w-[1000px]', // FIX: Hardcoded 1000px for "4xl" to ensure comfort on desktop
    'full': 'sm:max-w-full' // Full width
};

/**
 * BaseSheet - Componente base para todos os Sheets do sistema
 * 
 * Agora com suporte automático para Drawer em Mobile (iPhone Standard)
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
    const isMobile = useMediaQuery("(max-width: 640px)");

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

    const FooterContent = () => {
        if (footer) return <div className="mt-6 pt-6 border-t">{footer}</div>;

        if (showDefaultFooter && (onSave || onCancel)) {
            return (
                <div className={`mt-6 pt-6 border-t flex items-center ${isMobile ? 'flex-col-reverse gap-3' : 'justify-end gap-3'}`}>
                    <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={saving}
                        className={isMobile ? 'w-full' : ''}
                    >
                        {cancelLabel}
                    </Button>
                    {onSave && (
                        <Button
                            onClick={handleSave}
                            disabled={saving || saveDisabled}
                            className={isMobile ? 'w-full' : ''}
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
            );
        }
        return null;
    };

    if (isMobile) {
        return (
            <Drawer open={open} onOpenChange={onOpenChange}>
                <DrawerContent className="h-[100dvh] flex flex-col rounded-t-[10px]">
                    <DrawerHeader className="text-left">
                        <DrawerTitle>{title}</DrawerTitle>
                        {description && (
                            <DrawerDescription>{description}</DrawerDescription>
                        )}
                    </DrawerHeader>

                    <div className="px-4 flex-1 overflow-y-auto">
                        {children}
                    </div>

                    <div className="p-4 pb-[max(20px,env(safe-area-inset-bottom))]">
                        <FooterContent />
                    </div>
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className={`${sizeClasses[size]} overflow-y-auto w-full`}>
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
                <FooterContent />
            </SheetContent>
        </Sheet>
    );
};

export default BaseSheet;
