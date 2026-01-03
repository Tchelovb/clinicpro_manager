import React, { useEffect } from 'react';
import { useSearchStore } from '../../stores/useSearchStore';
import { Dialog, DialogContent, DialogTitle } from './dialog';
import { SearchContent } from './SearchContent';

export function GlobalSearch() {
    const { isOpen, setOpen } = useSearchStore();

    // Keyboard shortcut listener
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen(!isOpen);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, [isOpen, setOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={setOpen}>
            <DialogContent className="max-w-full w-full h-full p-0 border-0 bg-transparent shadow-none">
                <DialogTitle className="sr-only">Busca Global</DialogTitle>
                <SearchContent onSelectResult={() => setOpen(false)} />
            </DialogContent>
        </Dialog>
    );
}
