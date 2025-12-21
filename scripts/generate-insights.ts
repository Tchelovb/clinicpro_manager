// Script para gerar insights automaticamente do BOS
// Execute: npm run generate:insights

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Carrega variáveis de ambiente do .env.local
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ ERRO: Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não encontradas!');
    console.log('💡 Certifique-se de que o arquivo .env.local existe e contém as chaves do Supabase.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateInsights() {
    try {
        console.log('🔍 Buscando clínica ativa...\n');

        // Busca a primeira clínica cadastrada
        const { data: clinics, error: clinicError } = await supabase
            .from('clinics')
            .select('id, name')
            .limit(1)
            .single();

        if (clinicError || !clinics) {
            console.error('❌ Erro ao buscar clínica:', clinicError?.message);
            return;
        }

        console.log(`✅ Clínica: ${clinics.name}`);
        console.log(`📋 ID: ${clinics.id}\n`);
        console.log('🤖 Gerando insights de recovery...\n');

        // Chama a função SQL que gera os insights
        const { error } = await supabase.rpc('fn_generate_recovery_insights', {
            p_clinic_id: clinics.id
        });

        if (error) {
            console.error('❌ Erro ao gerar insights:', error.message);
            console.log('\n💡 Dica: Certifique-se de que o script SQL bos_intelligence.sql foi executado no Supabase.');
            return;
        }

        console.log('✅ Insights gerados com sucesso!\n');

        // Busca e exibe os insights gerados
        const { data: insights, error: insightsError } = await supabase
            .from('ai_insights')
            .select('*')
            .eq('clinic_id', clinics.id)
            .order('created_at', { ascending: false })
            .limit(5);

        if (insightsError) {
            console.error('❌ Erro ao buscar insights:', insightsError.message);
            return;
        }

        if (!insights || insights.length === 0) {
            console.log('ℹ️  Nenhum insight encontrado.');
            console.log('💡 Isso pode significar que não há orçamentos high-ticket parados no momento.');
            return;
        }

        console.log('📊 ÚLTIMOS INSIGHTS GERADOS:\n');
        console.log('═'.repeat(80) + '\n');

        insights.forEach((insight, i) => {
            const priorityEmoji = insight.priority === 'HIGH' ? '🔴' : insight.priority === 'MEDIUM' ? '🟡' : '🟢';
            console.log(`${i + 1}. ${priorityEmoji} [${insight.priority}] ${insight.title}`);
            console.log(`   📝 ${insight.description}`);
            console.log(`   🎯 ${insight.action_label || 'Ver detalhes'}: ${insight.action_link || 'N/A'}`);
            console.log('');
        });

        console.log('═'.repeat(80));
        console.log('\n🎯 Acesse o Dashboard para visualizar os insights no Radar de Inteligência!\n');

    } catch (error) {
        console.error('❌ Erro geral:', error);
    }
}

generateInsights();
