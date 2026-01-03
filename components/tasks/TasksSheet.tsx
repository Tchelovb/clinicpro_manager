import React, { useState, useEffect } from 'react';
import { X, Plus, CheckCircle2, Circle, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../src/lib/utils';

interface Task {
    id: string;
    title: string;
    description?: string;
    status: boolean;
    priority: 'low' | 'medium' | 'high';
    due_date?: string;
    created_at: string;
}

interface TasksSheetProps {
    isOpen: boolean;
    onClose: () => void;
}

const PRIORITY_COLORS = {
    low: 'bg-slate-100 text-slate-600 border-slate-200',
    medium: 'bg-amber-50 text-amber-600 border-amber-200',
    high: 'bg-red-50 text-red-600 border-red-200'
};

export function TasksSheet({ isOpen, onClose }: TasksSheetProps) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        if (isOpen && user) {
            loadTasks();
        }
    }, [isOpen, user]);

    const loadTasks = async () => {
        if (!user) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTasks(data || []);
        } catch (error) {
            console.error('Error loading tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const createTask = async () => {
        if (!newTaskTitle.trim() || !user) return;

        try {
            const { data, error } = await supabase
                .from('tasks')
                .insert({
                    user_id: user.id,
                    title: newTaskTitle,
                    status: false,
                    priority: 'medium'
                })
                .select()
                .single();

            if (error) throw error;

            setTasks([data, ...tasks]);
            setNewTaskTitle('');
        } catch (error) {
            console.error('Error creating task:', error);
        }
    };

    const toggleTask = async (taskId: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('tasks')
                .update({ status: !currentStatus })
                .eq('id', taskId);

            if (error) throw error;

            setTasks(tasks.map(t =>
                t.id === taskId ? { ...t, status: !currentStatus } : t
            ));
        } catch (error) {
            console.error('Error toggling task:', error);
        }
    };

    const deleteTask = async (taskId: string) => {
        try {
            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', taskId);

            if (error) throw error;

            setTasks(tasks.filter(t => t.id !== taskId));
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Sheet */}
            <div className="fixed right-0 top-0 bottom-0 w-full md:w-[480px] bg-white dark:bg-slate-900 shadow-2xl z-50 animate-in slide-in-from-right duration-300">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                    <div>
                        <h2 className="text-2xl font-light text-slate-900 dark:text-white">Tarefas do Dia</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            {tasks.filter(t => !t.status).length} pendentes
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                        <X className="h-5 w-5 text-slate-500" />
                    </button>
                </div>

                {/* New Task Input */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && createTask()}
                            placeholder="Nova tarefa..."
                            className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-0 focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder:text-slate-400"
                        />
                        <button
                            onClick={createTask}
                            disabled={!newTaskTitle.trim()}
                            className="px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 text-white rounded-xl transition-colors"
                        >
                            <Plus className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Tasks List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-3">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent" />
                        </div>
                    ) : tasks.length === 0 ? (
                        <div className="text-center py-12">
                            <CalendarIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500 font-light">Nenhuma tarefa criada</p>
                        </div>
                    ) : (
                        tasks.map((task) => (
                            <div
                                key={task.id}
                                className={cn(
                                    "p-4 rounded-[20px] border backdrop-blur-md transition-all",
                                    "hover:shadow-md",
                                    task.status
                                        ? "bg-slate-50/50 dark:bg-slate-800/50 opacity-60"
                                        : "bg-white/80 dark:bg-slate-800/80"
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    {/* Checkbox */}
                                    <button
                                        onClick={() => toggleTask(task.id, task.status)}
                                        className="mt-1 flex-shrink-0"
                                    >
                                        {task.status ? (
                                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                                        ) : (
                                            <Circle className="h-5 w-5 text-slate-300 hover:text-blue-500 transition-colors" />
                                        )}
                                    </button>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <p className={cn(
                                            "font-medium text-slate-900 dark:text-white",
                                            task.status && "line-through text-slate-500"
                                        )}>
                                            {task.title}
                                        </p>
                                        {task.description && (
                                            <p className="text-sm text-slate-500 mt-1">{task.description}</p>
                                        )}

                                        {/* Priority Badge */}
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className={cn(
                                                "text-xs px-2 py-1 rounded-lg border",
                                                PRIORITY_COLORS[task.priority]
                                            )}>
                                                {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Delete */}
                                    <button
                                        onClick={() => deleteTask(task.id)}
                                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}
