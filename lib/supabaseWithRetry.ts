import { PostgrestFilterBuilder } from '@supabase/postgrest-js';

interface RetryOptions {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    onRetry?: (attempt: number, error: any) => void;
}

/**
 * 🔄 Wrapper de Retry com Exponential Backoff
 * 
 * Automaticamente retenta operações que falharam devido a problemas de rede transitórios.
 * Usa exponential backoff para evitar sobrecarregar o servidor.
 * 
 * @param operation - Função assíncrona a ser executada com retry
 * @param options - Configurações de retry
 * @returns Resultado da operação
 * @throws Último erro se todas as tentativas falharem
 */
export async function withRetry<T>(
    operation: () => PromiseLike<T>,
    options: RetryOptions = {}
): Promise<T> {
    const {
        maxRetries = 3,
        baseDelay = 1000,
        maxDelay = 8000,
        onRetry
    } = options;

    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error: any) {
            lastError = error;

            // 🛡️ Não retenta erros de validação ou lógica de negócio
            // Apenas retenta erros de rede/conexão
            const isNetworkError =
                error.message?.includes('Failed to fetch') ||
                error.message?.includes('ERR_HTTP2_PROTOCOL_ERROR') ||
                error.message?.includes('ERR_CONNECTION_RESET') ||
                error.message?.includes('NetworkError') ||
                error.code === 'PGRST301' || // Supabase connection error
                error.code === 'PGRST116';   // Supabase timeout

            if (!isNetworkError) {
                // Erro de validação/lógica - não retenta
                throw error;
            }

            if (attempt < maxRetries - 1) {
                const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
                console.warn(
                    `🔄 [RETRY] Tentativa ${attempt + 1}/${maxRetries} após ${delay}ms`,
                    error.message || error
                );

                onRetry?.(attempt + 1, error);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    // Todas as tentativas falharam
    console.error('❌ [RETRY] Todas as tentativas falharam:', lastError);
    throw lastError;
}

/**
 * 🎯 Helper para aplicar retry em queries do Supabase
 * 
 * Uso:
 * ```typescript
 * const { data, error } = await withRetry(() => 
 *   supabase.from('table').select('*').eq('id', 123)
 * );
 * ```
 */
export async function supabaseQueryWithRetry<T>(
    queryBuilder: PostgrestFilterBuilder<any, any, T>
): Promise<{ data: T | null; error: any }> {
    try {
        const result = await withRetry(() => queryBuilder);
        return result as { data: T | null; error: any };
    } catch (error) {
        return { data: null, error };
    }
}
