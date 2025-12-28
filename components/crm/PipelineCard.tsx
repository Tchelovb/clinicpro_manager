import React from 'react';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { AlertCircle, MessageCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PipelineCardProps {
    lead: {
        id: string;
        name: string;
        phone: string;
        value?: number;
        desired_treatment?: string;
        created_at: string;
        updated_at: string;
        stage_id: string;
    };
    onClick: () => void;
    onWhatsAppClick?: (phone: string) => void;
}

export function PipelineCard({ lead, onClick, onWhatsAppClick }: PipelineCardProps) {
    // Calculate days in current stage
    const daysInStage = Math.floor(
        (new Date().getTime() - new Date(lead.updated_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    const isStagnant = daysInStage > 3;

    // Format currency
    const formatCurrency = (value?: number) => {
        if (!value) return 'R$ 0,00';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    // Get initials for avatar
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const handleWhatsAppClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onWhatsAppClick && lead.phone) {
            onWhatsAppClick(lead.phone);
        } else if (lead.phone) {
            // Open WhatsApp directly
            const cleanPhone = lead.phone.replace(/\D/g, '');
            window.open(`https://wa.me/55${cleanPhone}`, '_blank');
        }
    };

    return (
        <div
            onClick={onClick}
            className={cn(
                'bg-white dark:bg-slate-800 rounded-lg border shadow-sm hover:shadow-md transition-all cursor-pointer group',
                isStagnant
                    ? 'border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10'
                    : 'border-slate-200 dark:border-slate-700'
            )}
        >
            {/* Header */}
            <div className="p-3 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-start gap-2">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                                lead.name
                            )}&background=random`}
                        />
                        <AvatarFallback className="text-xs">
                            {getInitials(lead.name)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                            {lead.name}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {lead.phone}
                        </p>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="p-3 space-y-2">
                {/* Value Badge */}
                <div className="flex items-center justify-between">
                    <Badge
                        variant={lead.value && lead.value > 0 ? 'default' : 'secondary'}
                        className={cn(
                            'font-bold text-xs',
                            lead.value && lead.value > 0
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                        )}
                    >
                        {formatCurrency(lead.value)}
                    </Badge>
                </div>

                {/* Interest/Treatment */}
                {lead.desired_treatment && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                        {lead.desired_treatment}
                    </p>
                )}
            </div>

            {/* Footer */}
            <div className="p-3 pt-0 flex items-center justify-between">
                {/* Time in Stage */}
                <div
                    className={cn(
                        'flex items-center gap-1 text-xs',
                        isStagnant
                            ? 'text-red-600 dark:text-red-400 font-bold'
                            : 'text-slate-500 dark:text-slate-400'
                    )}
                >
                    {isStagnant && <AlertCircle className="h-3 w-3" />}
                    <span>
                        Há {daysInStage} {daysInStage === 1 ? 'dia' : 'dias'}
                    </span>
                </div>

                {/* WhatsApp Quick Action */}
                <button
                    onClick={handleWhatsAppClick}
                    className="p-1.5 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors opacity-0 group-hover:opacity-100"
                    title="Abrir WhatsApp"
                >
                    <MessageCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </button>
            </div>
        </div>
    );
}
