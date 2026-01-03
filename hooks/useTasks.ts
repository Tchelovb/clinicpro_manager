import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../src/lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import toast from 'react-hot-toast';

export interface Task {
    id: string;
    title: string;
    priority: 'high' | 'medium' | 'low';
    status: boolean; // completed
    created_at: string;
    user_id: string;
}

export const useTasks = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ["tasks", user?.id],
        queryFn: async () => {
            if (!user) return [];
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data as Task[];
        },
        enabled: !!user,
        staleTime: 1000 * 60 * 5 // Cache por 5 minutos
    });

    const createTask = useMutation({
        mutationFn: async (title: string) => {
            if (!user) throw new Error("Sem user");
            const newTask = {
                user_id: user.id,
                title,
                status: false,
                priority: 'medium'
            };
            const { data, error } = await supabase.from('tasks').insert(newTask).select().single();
            if (error) throw error;
            return data;
        },
        onMutate: async (newTitle) => {
            await queryClient.cancelQueries({ queryKey: ["tasks", user?.id] });
            const previousTasks = queryClient.getQueryData(["tasks", user?.id]);

            // Optimistic Add
            queryClient.setQueriesData({ queryKey: ["tasks", user?.id] }, (old: any) => {
                const tempTask = {
                    id: Math.random().toString(),
                    title: newTitle,
                    priority: 'medium',
                    status: false,
                    created_at: new Date().toISOString(),
                    user_id: user?.id
                };
                return old ? [tempTask, ...old] : [tempTask];
            });
            return { previousTasks };
        },
        onError: (err, newTitle, context) => {
            if (context?.previousTasks) {
                queryClient.setQueriesData({ queryKey: ["tasks", user?.id] }, context.previousTasks);
            }
            toast.error("Erro ao criar tarefa");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks", user?.id] });
        }
    });

    const toggleTask = useMutation({
        mutationFn: async ({ id, status }: { id: string, status: boolean }) => {
            const { error } = await supabase.from('tasks').update({ status }).eq('id', id);
            if (error) throw error;
        },
        onMutate: async ({ id, status }) => {
            await queryClient.cancelQueries({ queryKey: ["tasks", user?.id] });
            const previousTasks = queryClient.getQueryData(["tasks", user?.id]);

            // Optimistic Toggle
            queryClient.setQueriesData({ queryKey: ["tasks", user?.id] }, (old: any) => {
                return old?.map((t: Task) => t.id === id ? { ...t, status } : t);
            });
            return { previousTasks };
        },
        onError: (err, vars, context) => {
            if (context?.previousTasks) {
                queryClient.setQueriesData({ queryKey: ["tasks", user?.id] }, context.previousTasks);
            }
            toast.error("Erro ao atualizar tarefa");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks", user?.id] });
        }
    });

    return {
        tasks: query.data || [],
        isLoading: query.isLoading,
        createTask: createTask.mutate,
        toggleTask: toggleTask.mutate
    };
};
