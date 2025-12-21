# 🚀 GUIA DE ATIVAÇÃO - MOTOR DE INTELIGÊNCIA NATIVA

## Passo a Passo para Executar no Supabase

---

## 📋 PRÉ-REQUISITOS

- [x] Acesso ao Supabase Dashboard
- [x] Permissões de administrador no projeto
- [x] Extensão `pg_cron` disponível (Supabase Pro ou superior)

---

## 🔧 ETAPA 1: EXECUTAR AS SQL VIEWS

### 1.1. Acessar o SQL Editor
1. Abra o **Supabase Dashboard**
2. Vá em **SQL Editor** (menu lateral esquerdo)
3. Clique em **New Query**

### 1.2. Executar intelligence_center_views.sql
1. Abra o arquivo: `sql/intelligence_center_views.sql`
2. Copie **TODO o conteúdo**
3. Cole no SQL Editor do Supabase
4. Clique em **Run** (ou pressione Ctrl+Enter)

**Resultado Esperado:**
```
✅ view_marketing_metrics created
✅ view_sales_metrics created
✅ view_customer_ltv created
✅ view_clinical_production_enhanced created
✅ view_operational_efficiency created
✅ view_financial_metrics_enhanced created
✅ view_receivables created
✅ view_intelligence_360 created
```

---

## 🤖 ETAPA 2: EXECUTAR O MOTOR DE INSIGHTS

### 2.1. Executar native_insights_engine.sql
1. Abra o arquivo: `sql/native_insights_engine.sql`
2. Copie **TODO o conteúdo**
3. Cole no SQL Editor do Supabase
4. Clique em **Run**

**Resultado Esperado:**
```
✅ Function generate_native_insights created
✅ Function trigger_native_insights created
✅ Function run_insights_engine_for_all_clinics created
✅ Triggers created on budgets, leads, treatment_items
```

---

## ⏰ ETAPA 3: CONFIGURAR CRON JOB

### 3.1. Habilitar pg_cron (se necessário)

**No SQL Editor, execute:**
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

### 3.2. Agendar Execução Horária

**Execute:**
```sql
SELECT cron.schedule(
    'native-insights-engine-hourly',
    '0 * * * *',
    $$SELECT run_insights_engine_for_all_clinics();$$
);
```

**Resultado Esperado:**
```
✅ Job scheduled: native-insights-engine-hourly
```

### 3.3. Agendar Limpeza Diária

**Execute:**
```sql
SELECT cron.schedule(
    'cleanup-old-insights-daily',
    '0 3 * * *',
    $$
    DELETE FROM public.ai_insights
    WHERE status = 'RESOLVED'
      AND created_at < NOW() - INTERVAL '30 days';
    $$
);
```

### 3.4. Verificar Jobs Agendados

**Execute:**
```sql
SELECT * FROM cron.job;
```

**Resultado Esperado:**
```
jobid | schedule   | command                                    | nodename
------+------------+-------------------------------------------+---------
1     | 0 * * * *  | SELECT run_insights_engine_for_all_clinics() | ...
2     | 0 3 * * *  | DELETE FROM public.ai_insights...         | ...
```

---

## 🧪 ETAPA 4: TESTE INICIAL

### 4.1. Executar Motor Manualmente

**Execute:**
```sql
SELECT run_insights_engine_for_all_clinics();
```

**Resultado Esperado:**
```
NOTICE: Native Insights Engine: X novos insights gerados para clinic_id ...
```

### 4.2. Verificar Insights Gerados

**Execute:**
```sql
SELECT 
    priority,
    category,
    COUNT(*) as total
FROM public.ai_insights
WHERE status = 'OPEN'
GROUP BY priority, category
ORDER BY 
    CASE priority
        WHEN 'CRITICAL' THEN 1
        WHEN 'HIGH' THEN 2
        WHEN 'MEDIUM' THEN 3
        WHEN 'LOW' THEN 4
    END;
```

**Resultado Esperado:**
```
priority  | category    | total
----------+-------------+------
CRITICAL  | SALES       | 2
HIGH      | MARKETING   | 5
MEDIUM    | OPERATIONAL | 3
```

### 4.3. Ver Detalhes dos Insights

**Execute:**
```sql
SELECT 
    priority,
    title,
    description,
    category,
    created_at
FROM public.ai_insights
WHERE status = 'OPEN'
ORDER BY 
    CASE priority
        WHEN 'CRITICAL' THEN 1
        WHEN 'HIGH' THEN 2
        WHEN 'MEDIUM' THEN 3
        WHEN 'LOW' THEN 4
    END,
    created_at DESC
LIMIT 10;
```

---

## 🔍 ETAPA 5: TESTE COM DADOS SIMULADOS

### 5.1. Criar Lead de Teste (Sentinela de Marketing)

**Execute:**
```sql
DO $$
DECLARE
    v_clinic_id UUID;
    v_lead_id UUID;
BEGIN
    -- Pegar sua clínica
    SELECT id INTO v_clinic_id 
    FROM public.clinics 
    WHERE status = 'ACTIVE' 
    LIMIT 1;
    
    -- Criar lead sem contato
    INSERT INTO public.leads (
        clinic_id,
        name,
        email,
        phone,
        source,
        priority,
        created_at
    ) VALUES (
        v_clinic_id,
        'TESTE - Lead Sem Contato',
        'teste@clinicpro.com',
        '11999999999',
        'Instagram',
        'HIGH',
        NOW() - INTERVAL '13 hours'
    ) RETURNING id INTO v_lead_id;
    
    RAISE NOTICE 'Lead criado: %', v_lead_id;
    
    -- Executar motor
    PERFORM generate_native_insights(v_clinic_id);
END $$;
```

### 5.2. Verificar Se Insight Foi Gerado

**Execute:**
```sql
SELECT 
    priority,
    title,
    description
FROM public.ai_insights
WHERE title LIKE '%TESTE%'
ORDER BY created_at DESC;
```

**Resultado Esperado:**
```
priority | title                                    | description
---------+------------------------------------------+-------------
HIGH     | 🔥 Lead Quente Sem Contato: TESTE...   | Lead cadastrado há 13 horas...
```

### 5.3. Limpar Dados de Teste

**Execute:**
```sql
DELETE FROM public.ai_insights WHERE title LIKE '%TESTE%';
DELETE FROM public.leads WHERE name LIKE '%TESTE%';
```

---

## 📊 ETAPA 6: MONITORAMENTO

### 6.1. Dashboard de Insights Ativos

**Execute regularmente:**
```sql
SELECT 
    priority,
    category,
    COUNT(*) as total,
    MIN(created_at) as oldest,
    MAX(created_at) as newest
FROM public.ai_insights
WHERE status = 'OPEN'
GROUP BY priority, category;
```

### 6.2. Insights Mais Antigos Não Resolvidos

**Execute:**
```sql
SELECT 
    priority,
    title,
    EXTRACT(DAY FROM NOW() - created_at) as days_open
FROM public.ai_insights
WHERE status = 'OPEN'
ORDER BY created_at ASC
LIMIT 10;
```

### 6.3. Logs de Execução do CRON

**Execute:**
```sql
SELECT 
    jobname,
    status,
    return_message,
    start_time,
    end_time
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;
```

---

## ✅ CHECKLIST DE ATIVAÇÃO

- [ ] **Etapa 1:** Views do Intelligence Center executadas
- [ ] **Etapa 2:** Motor de Insights Nativo executado
- [ ] **Etapa 3:** CRON Jobs agendados
- [ ] **Etapa 4:** Teste inicial realizado
- [ ] **Etapa 5:** Sentinelas testadas com dados simulados
- [ ] **Etapa 6:** Monitoramento configurado

---

## 🚨 TROUBLESHOOTING

### Erro: "extension pg_cron does not exist"
**Solução:** 
- Verifique se seu plano do Supabase suporta pg_cron (Pro ou superior)
- Ou execute o motor manualmente via API/Backend

### Erro: "permission denied for function"
**Solução:**
```sql
GRANT EXECUTE ON FUNCTION generate_native_insights(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION run_insights_engine_for_all_clinics() TO authenticated;
```

### Nenhum insight gerado
**Possíveis causas:**
1. Não há dados que atendam aos critérios das sentinelas
2. Insights já foram gerados anteriormente (verifica duplicatas)
3. Clinic_id incorreto

**Verificar:**
```sql
-- Ver se há orçamentos parados
SELECT * FROM public.budgets 
WHERE status IN ('DRAFT', 'PENDING') 
  AND final_value > 15000 
  AND created_at < NOW() - INTERVAL '3 days';

-- Ver se há leads sem contato
SELECT l.* FROM public.leads l
WHERE l.created_at < NOW() - INTERVAL '12 hours'
  AND NOT EXISTS (
      SELECT 1 FROM public.lead_interactions li
      WHERE li.lead_id = l.id
  );
```

---

## 🎯 PRÓXIMOS PASSOS

Após ativar o motor:

1. **Integrar com Interface**
   - A aba "Insights & Alertas" já está conectada
   - Badge de alertas será atualizado automaticamente

2. **Configurar Notificações**
   - Implementar push notifications para CRITICAL
   - Email diário com resumo de HIGH

3. **Integrar com ChatBOS**
   - BOS lerá `ai_insights` automaticamente
   - Comando "O que tenho pendente?" funcionará

4. **Ajustar Thresholds**
   - Personalizar valores (R$ 15k, 12h, etc.)
   - Adicionar novas sentinelas específicas

---

## 📞 SUPORTE

Se encontrar problemas:
1. Verifique os logs: `SELECT * FROM cron.job_run_details`
2. Execute manualmente: `SELECT generate_native_insights('sua-clinic-uuid')`
3. Verifique permissões: `\dp public.ai_insights`

---

**🎉 Parabéns! O Motor de Inteligência Nativa está ativo e monitorando sua clínica 24/7!**
