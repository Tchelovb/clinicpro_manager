import React from 'react';
import { LucideIcon } from 'lucide-react';
import { PrimaryButton } from './PrimaryButton';

export interface EmptyStateProps {
    /** Ícone a ser exibido */
    icon: LucideIcon;
    /** Título principal */
    title: string;
    /** Descrição */
    description: string;
    /** Texto do botão de ação (opcional) */
    actionLabel?: string;
    /** Callback do botão de ação */
    onAction?: () => void;
    /** Ícone do botão de ação */
    actionIcon?: React.ReactNode;
}

/**
 * EmptyState - Tela Amigável para Estados Vazios
 * 
 * Componente para quando não há dados a exibir.
 * Padrão em apps nativos para melhorar UX.
 * 
 * Preparado para conversão nativa com:
 * - Visual limpo e amigável
 * - Ícone grande e ilustrativo
 * - Mensagem clara e ação sugerida
 * - Touch-friendly button
 * - Dark mode integrado
 * 
 * @example
 * <EmptyState
 *   icon={Calendar}
 *   title="Nenhuma cirurgia hoje"
 *   description="Você não tem procedimentos agendados para hoje. Que tal aproveitar para organizar a agenda?"
 *   actionLabel="Ver Agenda Completa"
 *   onAction={() => navigate('/agenda')}
 *   actionIcon={<ArrowRight />}
 * />
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    actionIcon,
}) => {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            {/* Icon */}
            <div className="
                w-24 h-24 rounded-full
                bg-slate-100 dark:bg-slate-800
                flex items-center justify-center
                mb-6
                animate-pulse
            ">
                <Icon
                    size={48}
                    className="text-slate-400 dark:text-slate-500"
                    strokeWidth={1.5}
                />
            </div>

            {/* Title */}
            <h3 className="
                text-xl font-bold 
                text-slate-900 dark:text-white
                mb-2
            ">
                {title}
            </h3>

            {/* Description */}
            <p className="
                text-sm text-slate-600 dark:text-slate-400
                max-w-md
                mb-6
            ">
                {description}
            </p>

            {/* Action Button */}
            {actionLabel && onAction && (
                <PrimaryButton
                    variant="solid"
                    onClick={onAction}
                    rightIcon={actionIcon}
                >
                    {actionLabel}
                </PrimaryButton>
            )}
        </div>
    );
};

/**
 * EmptyStateCard - Empty State dentro de um Card
 * 
 * Variante para usar dentro de containers/cards
 * 
 * @example
 * <GlassCard>
 *   <EmptyStateCard
 *     icon={Users}
 *     title="Nenhum paciente"
 *     description="Comece adicionando seu primeiro paciente"
 *     actionLabel="Adicionar Paciente"
 *     onAction={() => navigate('/patients/new')}
 *   />
 * </GlassCard>
 */
export const EmptyStateCard: React.FC<EmptyStateProps> = (props) => {
    return (
        <div className="py-8">
            <EmptyState {...props} />
        </div>
    );
};
