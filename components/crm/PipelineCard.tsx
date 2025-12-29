import React from 'react';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { AlertCircle, MessageCircle, User, UserCheck } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Opportunity } from '../../types/crm';

interface PipelineCardProps {
    opportunity: Opportunity;
    onClick: () => void;
    onDragStart?: (oppId: string) => void;
}

export function PipelineCard({ opportunity, onClick, onDragStart }: PipelineCardProps) {
    // Detect type: Lead or Patient
    const isPatient = !!opportunity.patient_id;
    const isLead = !!opportunity.lead_id;

    // Get name and phone from correct source
    const name = opportunity.patients?.name || opportunity.leads?.name || 'Sem nome';
    const phone = opportunity.patients?.phone || opportunity.leads?.phone || '';
    const photoUrl = opportunity.patients?.profile_photo_url;

    // Calculate days in current stage
    const daysInStage = Math.floor(
        (new Date().getTime() - new Date(opportunity.updated_at).getTime()) / (1000 * 60 * 60 * 24)
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
        if (phone) {
            const cleanPhone = phone.replace(/\D/g, '');
            window.open(`https://wa.me/55${cleanPhone}`, '_blank');
        }
    };

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.effectAllowed = 'move';
        if (onDragStart) {
            onDragStart(opportunity.id);
        }
    };

    return (
        <div
            onClick={onClick}
            draggable={!!onDragStart}
            onDragStart={handleDragStart}
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
                    {/* Avatar with Type Indicator */}
                    <div className="relative">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                            {isPatient && photoUrl ? (
                                <AvatarImage src={photoUrl} />
                            ) : (
                                <AvatarImage
                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                                        name
                                    )}&background=random`}
                                />
                            )}
                            <AvatarFallback className="text-xs">
                                {getInitials(name)}
                            </AvatarFallback>
                        </Avatar>
                        {/* Type Badge */}
                        <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 rounded-full p-0.5">
                            {isPatient ? (
                                <UserCheck className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                            ) : (
                                <User className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                            )}
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                            {name}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {phone}
                        </p>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="p-3 space-y-2">
                {/* Value Badge */}
                <div className="flex items-center justify-between">
                    <Badge
                        variant={opportunity.monetary_value && opportunity.monetary_value > 0 ? 'default' : 'secondary'}
                        className={cn(
                            'font-bold text-xs',
                            opportunity.monetary_value && opportunity.monetary_value > 0
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                        )}
                    >
                        {formatCurrency(opportunity.monetary_value)}
                    </Badge>
                </div>

                {/* Title */}
                {opportunity.title && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                        {opportunity.title}
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
                {phone && (
                    <button
                        onClick={handleWhatsAppClick}
                        className="p-1.5 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors opacity-0 group-hover:opacity-100"
                        title="Abrir WhatsApp"
                    >
                        <MessageCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </button>
                )}
            </div>
        </div>
    );
}

