// Script simplificado - execute com: npm run generate:insights
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ ERRO: Variáveis de ambiente não encontradas!');
    console.log('Certifique-se de que o arquivo .env.local existe.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('🔍 Buscando clínica...\n');

    const { data: clinic, error: clinicError } = await supabase
        .from('clinics')
        .select('id, name')
        .limit(1)
        .single();

    if (clinicError) {
        console.error('❌', clinicError.message);
        process.exit(1);
    }

    console.log(`✅ Clínica: ${clinic.name}`);
    console.log(`📋 ID: ${clinic.id}\n`);
    console.log('🤖 Gerando insights...\n');

    const { error } = await supabase.rpc('fn_generate_recovery_insights', {
        p_clinic_id: clinic.id
    });

    if (error) {
        console.error('❌', error.message);
        console.log('\n💡 Execute o script SQL bos_intelligence.sql primeiro!');
        process.exit(1);
    }

    console.log('✅ Insights gerados!\n');

    const { data: insights } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('clinic_id', clinic.id)
        .order('created_at', { ascending: false })
        .limit(5);

    if (insights && insights.length > 0) {
        console.log('📊 INSIGHTS:\n');
        insights.forEach((i, idx) => {
            console.log(`${idx + 1}. [${i.priority}] ${i.title}`);
            console.log(`   ${i.description}\n`);
        });
    } else {
        console.log('ℹ️  Nenhum insight gerado (sem orçamentos high-ticket parados).');
    }
}

main().catch(console.error);
