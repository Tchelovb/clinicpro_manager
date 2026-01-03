import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: 3, // Aumentado de 2 para 3 tentativas
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 30s
      refetchOnWindowFocus: false,
      networkMode: 'online', // Só tenta quando online
    },
    mutations: {
      retry: 2, // Aumentado de 1 para 2
      networkMode: 'online',
    },
  },
});
