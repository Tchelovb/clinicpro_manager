import React, { useEffect } from 'react';
import { useSearchStore } from '../../stores/useSearchStore';
import { CommandDialog } from './command';
import { DialogTitle } from './dialog';
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
        <CommandDialog open={isOpen} onOpenChange={setOpen}>
            <DialogTitle className="sr-only">Busca Global</DialogTitle>
            <SearchContent onSelectResult={() => setOpen(false)} />
        </CommandDialog>
    );
}
