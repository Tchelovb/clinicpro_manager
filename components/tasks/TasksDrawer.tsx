import React, { useState, useEffect } from 'react';
import { MobileDrawer } from '../ui/MobileDrawer';
import { CheckCircle2, Circle, AlertCircle, Clock, Plus, Trash2 } from 'lucide-react';
import { cn } from '../../src/lib/utils';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { useTasks } from '../../hooks/useTasks';

interface Task {
    id: string;
    title: string;
    priority: 'high' | 'medium' | 'low';
    status: boolean; // completed
    created_at: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

const PRIORITY_ICONS = {
    high: <AlertCircle className="h-4 w-4 text-red-500" />,
    medium: <Clock className="h-4 w-4 text-amber-500" />,
    low: <Clock className="h-4 w-4 text-slate-400" />
};

const PRIORITY_LABELS = {
    high: 'Urgente',
    medium: 'Rotina',
    low: 'Baixa'
};

export function TasksDrawer({ isOpen, onClose }: Props) {
    const { user } = useAuth();
    // ✅ HOOK STATE (Performance Elite)
    const { tasks, createTask, toggleTask, isLoading: loading } = useTasks();
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const handleCreateTask = () => {
        if (!newTaskTitle.trim()) return;
        createTask(newTaskTitle, {
            onSuccess: () => {
                setNewTaskTitle('');
                setIsAdding(false);
                toast.success('Tarefa adicionada');
            }
        });
    };

    const handleToggleTask = (task: any) => {
        toggleTask({ id: task.id, status: !task.status });
    };

    return (
        <MobileDrawer isOpen={isOpen} onClose={onClose} title="Tarefas do Dia">
            {/* Botão de Adição Rápida (Padrão Apple) */}
            {!isAdding ? (
                <button
                    onClick={() => setIsAdding(true)}
                    className="w-full flex items-center gap-3 p-5 mb-4 rounded-2xl bg-slate-100 dark:bg-white/5 text-blue-600 dark:text-blue-400 font-medium active:scale-95 transition-transform"
                >
                    <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    Adicionar nova tarefa...
                </button>
            ) : (
                <div className="mb-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-blue-100 dark:border-blue-900/30">
                    <input
                        autoFocus
                        type="text"
                        placeholder="O que precisa ser feito?"
                        className="w-full bg-transparent border-none focus:ring-0 text-lg mb-4 placeholder:text-slate-400"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateTask()}
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setIsAdding(false)}
                            className="px-4 py-2 text-slate-500 font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleCreateTask}
                            disabled={loading || !newTaskTitle.trim()}
                            className="px-6 py-2 bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50"
                        >
                            Adicionar
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-3 pb-8">
                {tasks.map((task) => (
                    <div
                        key={task.id}
                        onClick={() => handleToggleTask(task)}
                        className={cn(
                            "group flex items-center justify-between p-5 rounded-3xl transition-all duration-300 cursor-pointer",
                            task.status
                                ? "bg-slate-50/50 dark:bg-white/5 opacity-60"
                                : "bg-white dark:bg-white/10 border border-slate-100 dark:border-white/5 shadow-sm active:scale-[0.98]"
                        )}
                    >
                        <div className="flex items-center gap-4">
                            <div className="transition-transform active:scale-75 flex-shrink-0">
                                {task.status ? (
                                    <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                                ) : (
                                    <Circle className="h-7 w-7 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors" />
                                )}
                            </div>
                            <div>
                                <p className={cn(
                                    "text-lg font-medium tracking-tight text-slate-900 dark:text-white",
                                    task.status && "line-through text-slate-400"
                                )}>
                                    {task.title}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    {PRIORITY_ICONS[task.priority]}
                                    <span className="text-xs uppercase tracking-widest font-bold text-slate-400">
                                        {PRIORITY_LABELS[task.priority]}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {tasks.length === 0 && !loading && (
                    <div className="text-center py-10 text-slate-400">
                        <p>Nenhuma tarefa pendente</p>
                    </div>
                )}
            </div>
        </MobileDrawer >
    );
}
