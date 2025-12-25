import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const { agent, event, data } = await req.json()
        console.log(`🚀 [AGENTE V2] Acionado: ${agent}`)

        // 1. Conexão Supabase
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // --- MUDANÇA VISUAL PARA CONFIRMAR ATUALIZAÇÃO ---
        let aiMessage = "✅ ATUALIZADO V2! (Gemini pensando...)";

        // 2. Tenta usar o Gemini
        if (agent === 'sniper') {
            const { data: settings } = await supabase
                .from('system_settings')
                .select('value')
                .eq('key', 'gemini_api_key')
                .single()

            const GEMINI_KEY = settings?.value;

            if (GEMINI_KEY) {
                const prompt = `
                Aja como Carol, assistente do Dr. Marcelo.
                Lead: ${data.name}. Procedimento: ${data.procedure}.
                Escreva uma frase curta e elegante de WhatsApp para iniciar contato.
                Apenas o texto.
            `;
                try {
                    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_KEY}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
                    });
                    const json = await response.json();
                    if (json.candidates?.[0]?.content?.parts?.[0]?.text) {
                        aiMessage = json.candidates[0].content.parts[0].text;
                    }
                } catch (e) {
                    console.error("Erro Gemini:", e);
                }
            }
        }

        // 3. Resposta para o Banco
        return new Response(JSON.stringify({ success: true, message: aiMessage }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        })
    }
})