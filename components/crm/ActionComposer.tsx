import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { StickyNote, MessageCircle, CheckSquare, Send } from 'lucide-react';
import { cn } from '../../lib/utils';

type ComposerMode = 'note' | 'whatsapp' | 'task';

interface ActionComposerProps {
    onSend: (type: ComposerMode, content: string) => void;
    disabled?: boolean;
}

export function ActionComposer({ onSend, disabled }: ActionComposerProps) {
    const [mode, setMode] = useState<ComposerMode>('note');
    const [content, setContent] = useState('');
    const [isSending, setIsSending] = useState(false);

    const modes = [
        { id: 'note' as ComposerMode, label: 'Nota', icon: StickyNote, color: 'blue' },
        { id: 'whatsapp' as ComposerMode, label: 'WhatsApp', icon: MessageCircle, color: 'emerald' },
        { id: 'task' as ComposerMode, label: 'Tarefa', icon: CheckSquare, color: 'orange' }
    ];

    const currentMode = modes.find(m => m.id === mode)!;

    const handleSend = async () => {
        if (!content.trim()) return;

        setIsSending(true);
        try {
            await onSend(mode, content.trim());
            setContent('');
        } catch (error) {
            console.error('Error sending:', error);
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            handleSend();
        }
    };

    const getButtonColor = () => {
        switch (currentMode.color) {
            case 'blue': return 'bg-blue-600 hover:bg-blue-700';
            case 'emerald': return 'bg-emerald-600 hover:bg-emerald-700';
            case 'orange': return 'bg-orange-600 hover:bg-orange-700';
            default: return 'bg-blue-600 hover:bg-blue-700';
        }
    };

    const getPlaceholder = () => {
        switch (mode) {
            case 'note': return 'Digite uma nota interna... (Ctrl+Enter para enviar)';
            case 'whatsapp': return 'Mensagem para o cliente via WhatsApp...';
            case 'task': return 'Descreva a tarefa...';
        }
    };

    return (
        <div className="border-t bg-white dark:bg-slate-900">
            {/* Mode Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-700">
                {modes.map((m) => {
                    const Icon = m.icon;
                    return (
                        <button
                            key={m.id}
                            onClick={() => setMode(m.id)}
                            className={cn(
                                'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2',
                                mode === m.id
                                    ? `border-${m.color}-500 text-${m.color}-600 bg-${m.color}-50/50`
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            {m.label}
                        </button>
                    );
                })}
            </div>

            {/* Input Area */}
            <div className="p-4">
                <div className="flex gap-2">
                    <Textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={getPlaceholder()}
                        disabled={disabled || isSending}
                        className="min-h-[80px] resize-none"
                        rows={3}
                    />
                    <Button
                        onClick={handleSend}
                        disabled={!content.trim() || disabled || isSending}
                        className={cn('px-6 text-white', getButtonColor())}
                    >
                        {isSending ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        ) : (
                            <>
                                <Send className="h-4 w-4 mr-2" />
                                Enviar
                            </>
                        )}
                    </Button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                    Dica: Pressione <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs">Ctrl+Enter</kbd> para enviar rapidamente
                </p>
            </div>
        </div>
    );
}
