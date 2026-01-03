import React from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from '../Sidebar';
import { MobileTabBar } from '../ui/MobileTabBar';
import { SheetProvider } from './SheetProvider';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { cn } from '../../src/lib/utils';
import { useGlobalSheets } from '../../stores/useGlobalSheets';

interface AppShellProps {
    children: React.ReactNode;
    className?: string; // Para customizações de página
}

/**
 * 🛡️ APPSHELL (COFRE)
 * Wrapper principal do sistema. Gerencia layout responsivo,
 * áreas de segurança (safe-area) e provedores globais.
 */
export const AppShell: React.FC<AppShellProps> = ({ children, className }) => {
    const isDesktop = useMediaQuery('(min-width: 768px)');
    const location = useLocation();
    const [isSidebarExpanded, setIsSidebarExpanded] = React.useState(true); // Default open on desktop

    // Conectar TabBar ao Store Global
    const { openSheet } = useGlobalSheets();

    // Handler para ações da TabBar
    const handleTabAction = (action: string) => {
        if (action === 'menu') {
            // No futuro: Open Menu Drawer
        } else if (action === 'search') {
            openSheet('search');
        } else if (action === 'add') {
            openSheet('new-appointment');
        }
    };

    return (
        <div className="flex h-screen w-full bg-[#F5F6FA] dark:bg-[#0B0B0C] overflow-hidden">

            {/* 1. Sidebar Inteligente (Desktop Apenas) */}
            <aside className="hidden md:flex flex-none h-full z-30">
                <Sidebar isExpanded={isSidebarExpanded} setIsExpanded={setIsSidebarExpanded} />
            </aside>

            {/* 2. Área de Conteúdo Principal */}
            <main className={cn(
                "flex-1 flex flex-col h-full overflow-hidden relative transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]",
                // Mobile: Espaço para TabBar embaixo
                "pb-[80px] md:pb-0",
                // Desktop: Margem Esquerda para Sidebar Fixa
                isSidebarExpanded ? "md:ml-64" : "md:ml-20",
                className
            )}>
                {/* Scroll Container Nativo */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth touch-pan-y">
                    {children}
                </div>
            </main>

            {/* 3. Mobile Tab Bar (Smartphone Apenas) */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-40">
                {/* MobileTabBar conectada ao store global se precisasse passar props, 
                    mas ela pode usar navegação interna. 
                    Se precisar interceptar o botão (+), MobileTabBar precisa aceitar onAction.
                */}
                <MobileTabBar onAction={handleTabAction} />
            </div>

            {/* 4. Gerenciador de Gavetas (Global) */}
            <SheetProvider />

        </div>
    );
};
