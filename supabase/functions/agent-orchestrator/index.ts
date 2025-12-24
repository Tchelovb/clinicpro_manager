import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AgentEvent {
    agent: 'sniper' | 'guardian' | 'caretaker'
    event: string
    data: Record<string, any>
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Initialize Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey)

        // Parse request body
        const { agent, event, data }: AgentEvent = await req.json()

        console.log(`[AGENT ORCHESTRATOR] Received event from ${agent.toUpperCase()}: ${event}`)
        console.log(`[AGENT ORCHESTRATOR] Data:`, data)

        // Route to appropriate agent handler
        let result
        switch (agent) {
            case 'sniper':
                result = await handleSniper(supabase, event, data)
                break
            case 'guardian':
                result = await handleGuardian(supabase, event, data)
                break
            case 'caretaker':
                result = await handleCaretaker(supabase, event, data)
                break
            default:
                throw new Error(`Unknown agent: ${agent}`)
        }

        return new Response(
            JSON.stringify({ success: true, result }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        )

    } catch (error) {
        console.error('[AGENT ORCHESTRATOR] Error:', error)
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500
            }
        )
    }
})

/**
 * SNIPER AGENT: Lead Capture & Qualification
 * Handles ALL leads with priority-based approach
 */
async function handleSniper(supabase: any, event: string, data: any) {
    const { lead_id, clinic_id, name, procedure, priority, is_high_ticket, phone } = data

    console.log(`\n🎯 ========== SNIPER AGENT ACTIVATED ==========`)
    console.log(`📋 Lead ID: ${lead_id}`)
    console.log(`👤 Name: ${name}`)
    console.log(`💉 Procedure: ${procedure}`)
    console.log(`⚡ Priority: ${priority}`)
    console.log(`💎 High-Ticket: ${is_high_ticket ? 'YES' : 'NO'}`)
    console.log(`📱 Phone: ${phone}`)

    // Priority-based logging
    if (priority === 'HIGH') {
        console.log(`\n🔥 [SNIPER ALERT] LEAD VIP DETECTADO: ${name}`)
        console.log(`   Procedimento: ${procedure}`)
        console.log(`   Ação: Notificar Dr. Marcelo + Abordagem VIP`)
    } else {
        console.log(`\n✅ [SNIPER] Lead Padrão: ${name}`)
        console.log(`   Procedimento: ${procedure}`)
        console.log(`   Ação: Abordagem padrão para agenda`)
    }

    // Update agent_logs with delivered status
    const { error: logError } = await supabase
        .from('agent_logs')
        .update({
            status: 'DELIVERED',
            message_sent: `Sniper acionado para ${name} (${priority})`,
            updated_at: new Date().toISOString()
        })
        .eq('entity_id', lead_id)
        .eq('agent_name', 'sniper')
        .order('created_at', { ascending: false })
        .limit(1)

    if (logError) {
        console.error('[SNIPER] Error updating log:', logError)
    }

    // TODO Phase 3: Integrate OpenAI for message generation
    // TODO Phase 3: Integrate WhatsApp API for sending
    // TODO Phase 3: If HIGH priority, send push notification to Dr. Marcelo

    console.log(`✅ [SNIPER] Processamento concluído\n`)

    return {
        agent: 'sniper',
        action: 'logged',
        priority,
        next_steps: priority === 'HIGH'
            ? 'VIP approach + Dr. Marcelo notification (Phase 3)'
            : 'Standard approach + scheduling (Phase 3)'
    }
}

/**
 * GUARDIAN AGENT: Payment Recovery
 * Handles overdue installments with intelligent follow-up
 */
async function handleGuardian(supabase: any, event: string, data: any) {
    const {
        installment_id,
        clinic_id,
        patient_name,
        patient_phone,
        amount,
        days_overdue,
        attempts_count
    } = data

    console.log(`\n🛡️ ========== GUARDIAN AGENT ACTIVATED ==========`)
    console.log(`📋 Installment ID: ${installment_id}`)
    console.log(`👤 Patient: ${patient_name}`)
    console.log(`💰 Amount: R$ ${amount}`)
    console.log(`📅 Days Overdue: ${days_overdue}`)
    console.log(`🔄 Attempt #${attempts_count + 1}`)
    console.log(`📱 Phone: ${patient_phone}`)

    // Determine approach based on days overdue
    let approach = 'friendly_reminder'
    if (days_overdue > 7) approach = 'negotiation'
    if (days_overdue > 15) approach = 'urgent'

    console.log(`\n💬 [GUARDIAN] Abordagem: ${approach}`)
    console.log(`   Mensagem: "Olá ${patient_name}, identificamos pendência de R$ ${amount}..."`)

    // Update agent_logs
    const { error: logError } = await supabase
        .from('agent_logs')
        .update({
            status: 'DELIVERED',
            message_sent: `Guardian acionado - ${approach} (${days_overdue}d overdue)`,
            updated_at: new Date().toISOString()
        })
        .eq('entity_id', installment_id)
        .eq('agent_name', 'guardian')
        .order('created_at', { ascending: false })
        .limit(1)

    if (logError) {
        console.error('[GUARDIAN] Error updating log:', logError)
    }

    // TODO Phase 3: Generate personalized recovery message with OpenAI
    // TODO Phase 3: Send WhatsApp message
    // TODO Phase 3: If urgent, escalate to human team

    console.log(`✅ [GUARDIAN] Processamento concluído\n`)

    return {
        agent: 'guardian',
        action: 'logged',
        approach,
        next_steps: 'WhatsApp recovery message (Phase 3)'
    }
}

/**
 * CARETAKER AGENT: Post-Op Follow-up & Retention
 * Handles completed treatments with care and upsell opportunities
 */
async function handleCaretaker(supabase: any, event: string, data: any) {
    const {
        treatment_id,
        clinic_id,
        patient_name,
        patient_phone,
        procedure,
        recovery_days,
        category
    } = data

    console.log(`\n💚 ========== CARETAKER AGENT ACTIVATED ==========`)
    console.log(`📋 Treatment ID: ${treatment_id}`)
    console.log(`👤 Patient: ${patient_name}`)
    console.log(`💉 Procedure: ${procedure}`)
    console.log(`🏥 Category: ${category}`)
    console.log(`⏱️ Recovery Days: ${recovery_days}`)
    console.log(`📱 Phone: ${patient_phone}`)

    // Determine follow-up schedule
    const followUpSchedule = [
        { hours: 24, message: 'Como está se sentindo após o procedimento?' },
        { days: 7, message: 'Acompanhamento semanal - tudo bem?' },
        { days: 30, message: 'Satisfação + NPS + Upsell' }
    ]

    console.log(`\n💬 [CARETAKER] Sequência de Follow-up:`)
    followUpSchedule.forEach(f => {
        const timing = f.hours ? `${f.hours}h` : `${f.days}d`
        console.log(`   ${timing}: ${f.message}`)
    })

    // Update agent_logs
    const { error: logError } = await supabase
        .from('agent_logs')
        .update({
            status: 'DELIVERED',
            message_sent: `Caretaker acionado - Follow-up pós ${procedure}`,
            updated_at: new Date().toISOString()
        })
        .eq('entity_id', treatment_id)
        .eq('agent_name', 'caretaker')
        .order('created_at', { ascending: false })
        .limit(1)

    if (logError) {
        console.error('[CARETAKER] Error updating log:', logError)
    }

    // TODO Phase 3: Schedule automated follow-up messages
    // TODO Phase 3: Implement NPS collection after 30 days
    // TODO Phase 3: Intelligent upsell suggestions based on procedure

    console.log(`✅ [CARETAKER] Processamento concluído\n`)

    return {
        agent: 'caretaker',
        action: 'logged',
        follow_up_count: followUpSchedule.length,
        next_steps: 'Automated follow-up sequence (Phase 3)'
    }
}
