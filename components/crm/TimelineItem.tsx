import React from 'react';
import { StickyNote, MessageCircle, CheckSquare, Info, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../../lib/utils';

interface TimelineItemData {
    id: string;
    type: 'note' | 'whatsapp' | 'task' | 'system';
    content: string;
    created_at: string;
    user_name?: string;
    completed?: boolean;
    direction?: 'sent' | 'received'; // for whatsapp
    onTaskToggle?: (id: string, completed: boolean) => void;
}

interface TimelineItemProps {
    data: TimelineItemData;
}

export function TimelineItem({ data }: TimelineItemProps) {
    const formatDate = (dateString: string) => {
        return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    };

    // Note (Internal)
    if (data.type === 'note') {
        return (
            <div className="mb-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 rounded-r-lg p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                        <StickyNote className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                                {data.content}
                            </p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                                <User className="h-3 w-3" />
                                <span>{data.user_name || 'Sistema'}</span>
                                <span>•</span>
                                <span>{formatDate(data.created_at)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // WhatsApp Message
    if (data.type === 'whatsapp') {
        const isSent = data.direction === 'sent';
        return (
            <div className={cn('mb-4 flex animate-in fade-in slide-in-from-bottom-2', isSent ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                    'max-w-[80%] rounded-lg p-3 shadow-sm',
                    isSent
                        ? 'bg-emerald-500 text-white rounded-br-none'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-bl-none'
                )}>
                    <div className="flex items-start gap-2">
                        <MessageCircle className={cn('h-4 w-4 flex-shrink-0 mt-0.5', isSent ? 'text-white' : 'text-emerald-600')} />
                        <div className="flex-1">
                            <p className={cn('text-sm whitespace-pre-wrap', isSent ? 'text-white' : 'text-slate-700 dark:text-slate-300')}>
                                {data.content}
                            </p>
                            <span className={cn('text-xs mt-1 block', isSent ? 'text-emerald-100' : 'text-slate-500')}>
                                {formatDate(data.created_at)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Task
    if (data.type === 'task') {
        return (
            <div className="mb-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="bg-white dark:bg-slate-800 border-l-4 border-orange-400 rounded-r-lg p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                        <input
                            type="checkbox"
                            checked={data.completed}
                            onChange={(e) => {
                                if (data.onTaskToggle) {
                                    data.onTaskToggle(data.id, e.target.checked);
                                }
                            }}
                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                            <p className={cn(
                                'text-sm text-slate-700 dark:text-slate-300',
                                data.completed && 'line-through text-slate-400'
                            )}>
                                {data.content}
                            </p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                                <CheckSquare className="h-3 w-3" />
                                <span>{data.user_name || 'Sistema'}</span>
                                <span>•</span>
                                <span>{formatDate(data.created_at)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // System Event
    if (data.type === 'system') {
        return (
            <div className="mb-4 flex justify-center animate-in fade-in">
                <div className="bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-1.5 flex items-center gap-2">
                    <Info className="h-3 w-3 text-slate-400" />
                    <span className="text-xs text-slate-500 dark:text-slate-400">{data.content}</span>
                    <span className="text-xs text-slate-400">• {formatDate(data.created_at)}</span>
                </div>
            </div>
        );
    }

    return null;
}
