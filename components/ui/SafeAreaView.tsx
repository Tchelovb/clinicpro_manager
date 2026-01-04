import React from 'react';

export interface SafeAreaViewProps {
    /** Conteúdo do container */
    children: React.ReactNode;
    /** Aplicar padding top (notch/status bar) */
    top?: boolean;
    /** Aplicar padding bottom (home indicator) */
    bottom?: boolean;
    /** Aplicar padding lateral (bordas arredondadas) */
    sides?: boolean;
    /** Cor de fundo */
    backgroundColor?: string;
    /** Classes adicionais */
    className?: string;
}

/**
 * SafeAreaView - Container com Margens Seguras App-Ready
 * 
 * Componente que garante que o conteúdo não seja cortado por:
 * - Notch do iPhone (topo)
 * - Home Indicator (rodapé)
 * - Bordas arredondadas (laterais)
 * 
 * Usa CSS env() para safe-area-inset (iOS) e fallback para Android.
 * Preparado para conversão nativa com Capacitor.
 * 
 * @example
 * // Container completo (topo + rodapé + laterais)
 * <SafeAreaView top bottom sides>
 *   <Header />
 *   <Content />
 *   <Footer />
 * </SafeAreaView>
 * 
 * // Apenas rodapé (para botões fixos)
 * <SafeAreaView bottom>
 *   <PrimaryButton>Salvar</PrimaryButton>
 * </SafeAreaView>
 */
export const SafeAreaView: React.FC<SafeAreaViewProps> = ({
    children,
    top = false,
    bottom = false,
    sides = false,
    backgroundColor,
    className = '',
}) => {
    // Padding dinâmico baseado em safe-area-inset
    const paddingClasses = [
        top && 'pt-[env(safe-area-inset-top)]',
        bottom && 'pb-[env(safe-area-inset-bottom)]',
        sides && 'px-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]',
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div
            className={`
                ${paddingClasses}
                ${backgroundColor || ''}
                ${className}
            `}
            style={{
                // Fallback para navegadores que não suportam env()
                paddingTop: top ? 'max(env(safe-area-inset-top), 0px)' : undefined,
                paddingBottom: bottom ? 'max(env(safe-area-inset-bottom), 0px)' : undefined,
                paddingLeft: sides ? 'max(env(safe-area-inset-left), 0px)' : undefined,
                paddingRight: sides ? 'max(env(safe-area-inset-right), 0px)' : undefined,
            }}
        >
            {children}
        </div>
    );
};

/**
 * SafeAreaContainer - Container Full-Screen com Safe Area
 * 
 * Wrapper completo para páginas que ocupam toda a tela.
 * Garante que o conteúdo respeite todas as áreas seguras.
 * 
 * @example
 * <SafeAreaContainer>
 *   <AppContent />
 * </SafeAreaContainer>
 */
export const SafeAreaContainer: React.FC<{
    children: React.ReactNode;
    className?: string;
}> = ({ children, className = '' }) => {
    return (
        <SafeAreaView
            top
            bottom
            sides
            className={`min-h-screen flex flex-col ${className}`}
        >
            {children}
        </SafeAreaView>
    );
};
