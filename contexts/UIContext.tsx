import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { Sheet, SheetContent } from '../components/ui/sheet';
import { Drawer, DrawerContent } from '../components/ui/drawer';

// ==========================================
// INTERFACES
// ==========================================
interface UIContextType {
    openDetail: (content: ReactNode, options?: DetailOptions) => void;
    closeDetail: () => void;
    isMobile: boolean;
}

interface DetailOptions {
    title?: string;
    size?: 'default' | 'lg' | 'xl' | 'full';
    onClose?: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function useUI() {
    const context = useContext(UIContext);
    if (!context) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
}

// ==========================================
// PROVIDER
// ==========================================
export function UIProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [content, setContent] = useState<ReactNode | null>(null);
    const [options, setOptions] = useState<DetailOptions>({});
    const isMobile = useMediaQuery('(max-width: 768px)'); // Mobile breakpoint

    const openDetail = (view: ReactNode, opts?: DetailOptions) => {
        setContent(view);
        setOptions(opts || {});
        setIsOpen(true);
    };

    const closeDetail = () => {
        setIsOpen(false);
        // Call onClose callback if provided
        if (options.onClose) {
            options.onClose();
        }
        setTimeout(() => {
            setContent(null);
            setOptions({});
        }, 300); // Clear after animation
    };

    // Determine sheet width based on size option (Desktop only)
    const getSheetWidth = () => {
        if (isMobile) return 'w-full';

        switch (options.size) {
            case 'lg':
                return 'w-[720px] sm:max-w-[720px]';
            case 'xl':
                return 'w-[960px] sm:max-w-[960px]';
            case 'full':
                return 'w-full sm:max-w-full';
            case 'default':
            default:
                return 'w-[540px] sm:max-w-[540px]';
        }
    };

    return (
        <UIContext.Provider value={{ openDetail, closeDetail, isMobile }}>
            {children}

            {/* GLOBAL HYBRID CONTAINER */}
            {isMobile ? (
                // MOBILE: APPLE STYLE DRAWER (Bottom-Up, 95% Height)
                <Drawer open={isOpen} onOpenChange={setIsOpen}>
                    <DrawerContent className="h-[95vh] rounded-t-[10px] outline-none">
                        <div className="h-full overflow-y-auto">
                            {content}
                        </div>
                    </DrawerContent>
                </Drawer>
            ) : (
                // DESKTOP: JIRA STYLE SHEET (Right-Side, Context Preserved)
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetContent
                        className={`${getSheetWidth()} p-0 border-l border-slate-200 dark:border-slate-800 shadow-xl`}
                        side="right"
                    >
                        <div className="h-full overflow-y-auto">
                            {content}
                        </div>
                    </SheetContent>
                </Sheet>
            )}
        </UIContext.Provider>
    );
}
