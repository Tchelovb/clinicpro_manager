// EDGE FUNCTION: gemini-chat v3
// Debug Mode: Atualiza status intermediário para identificar falha
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { name, treatment, phone, log_id, lead_id } = await req.json()

        // 1. Setup Supabase
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const supabase = createClient(supabaseUrl, supabaseKey)

        // 2. TESTE DE CONEXÃO: Atualizar status para PROCESSING
        if (log_id) {
            const { error: processingError } = await supabase
                .from('agent_logs')
                .update({ status: 'PROCESSING', action_taken: 'Checking Gemini...' })
                .eq('id', log_id)

            if (processingError) {
                throw new Error(`DB Connection Error: ${processingError.message}`)
            }
        }

        // 3. Buscar API Key
        const { data: settings, error: settingsError } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'gemini_api_key')
            .single()

        if (!settings?.value) throw new Error('API Key not found')

        // 4. Chamar Gemini
        const prompt = `
      Persona: Assistente comercial Dra. Glória.
      Doutor: Dr. Marcelo Vilas Bôas (Cirurgião Dentista, Especialista em Harmonização Facial e High Ticket).
      Contexto: Primeiro contato WhatsApp.
      Lead: ${name} (${treatment}).
      Tarefa: Mensagem curta (max 3 linhas), acolhedora, com pergunta final. Sem gírias.
    `.trim()

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${settings.value}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            }
        )

        if (!response.ok) {
            const errTxt = await response.text()
            throw new Error(`Gemini API Error: ${response.status} - ${errTxt}`)
        }

        const data = await response.json()
        const message = data.candidates?.[0]?.content?.parts?.[0]?.text

        if (!message) throw new Error('No message generate')

        // 5. Salvar Resultado
        if (log_id) {
            const { error: finalUpdateError } = await supabase
                .from('agent_logs')
                .update({
                    message_sent: message.trim(),
                    status: 'SENT',
                    action_taken: 'initial_contact',
                    updated_at: new Date().toISOString()
                })
                .eq('id', log_id)

            if (finalUpdateError) throw new Error(`Final Update Error: ${finalUpdateError.message}`)
        }

        return new Response(
            JSON.stringify({ success: true, message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        // Tenta salvar o erro no log
        const { log_id } = await req.json().catch(() => ({}))
        if (log_id) {
            const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
            const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            const supabase = createClient(supabaseUrl, supabaseKey)
            await supabase.from('agent_logs').update({
                status: 'FAILED',
                error_message: error.message
            }).eq('id', log_id)
        }

        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
