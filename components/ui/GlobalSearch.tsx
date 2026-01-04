
import React, { useEffect } from 'react';
import { useSearchStore } from '../../stores/useSearchStore';
import { Drawer, DrawerContent, DrawerTitle } from './drawer'; // Usando Drawer oficial
import SearchContent from './SearchContent';

export interface GlobalSearchProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export function GlobalSearch({ isOpen: externalIsOpen, onClose: externalOnClose }: GlobalSearchProps) {
    const { isOpen: storeIsOpen, setOpen } = useSearchStore();

    // Determine strict state: priority to external prop if passed
    const isVisible = externalIsOpen !== undefined ? externalIsOpen : storeIsOpen;

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            if (externalOnClose) externalOnClose();
            setOpen(false);
        } else {
            setOpen(true);
        }
    };

    // Keyboard shortcut listener (Cmd+K)
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen(true);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, [setOpen]);

    return (
        <Drawer open={isVisible} onOpenChange={handleOpenChange}>
            <DrawerContent className="h-[96vh] rounded-t-[20px] outline-none bg-[#F5F6FA] dark:bg-[#0B0B0C]">
                <DrawerTitle className="sr-only">Busca Global</DrawerTitle>

                {/* SearchContent é a Busca Oficial do Sistema */}
                <div className="flex-1 overflow-y-auto rounded-t-[20px]">
                    <SearchContent />
                </div>

            </DrawerContent>
        </Drawer>
    );
}

