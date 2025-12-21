# 🤖 BOS Auto-Pilot - Geração Automática de Insights

## 📋 Visão Geral

O BOS Auto-Pilot executa automaticamente a função `fn_generate_recovery_insights()` **todos os dias às 6h da manhã** para todas as clínicas ativas do sistema.

---

## 🎯 O Que o Auto-Pilot Faz

1. **6h da manhã** (horário de Brasília)
2. Busca todas as clínicas com `status = 'ACTIVE'`
3. Para cada clínica, executa a varredura de orçamentos high-ticket parados
4. Gera até 5 insights priorizados por valor + urgência
5. Salva na tabela `ai_insights` automaticamente

---

## ⚙️ Métodos de Configuração

### **Método 1: pg_cron (Nativo do Postgres)**

**Vantagens:**
- ✅ Executa dentro do próprio Supabase
- ✅ Não depende de serviços externos
- ✅ Gratuito

**Como Configurar:**

Execute o script SQL em **Supabase → SQL Editor**:

```sql
-- Habilitar extensão
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Criar função master
CREATE OR REPLACE FUNCTION public.fn_generate_all_insights()
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
    clinic_record RECORD;
BEGIN
    FOR clinic_record IN 
        SELECT id, name FROM public.clinics WHERE status = 'ACTIVE' OR status IS NULL
    LOOP
        PERFORM public.fn_generate_recovery_insights(clinic_record.id);
    END LOOP;
END;
$$;

-- Agendar (9h UTC = 6h Brasília)
SELECT cron.schedule(
    'bos-daily-insights',
    '0 9 * * *',
    $$SELECT public.fn_generate_all_insights()$$
);
```

**Verificar se está rodando:**
```sql
SELECT * FROM cron.job;
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

---

### **Método 2: GitHub Actions (Alternativa)**

**Vantagens:**
- ✅ Funciona mesmo se Supabase não suportar pg_cron
- ✅ Logs visíveis no GitHub
- ✅ 100% gratuito (GitHub Actions Free Tier)

**Como Configurar:**

1. **Certifique-se de que o repositório está no GitHub**

2. **Adicione secrets no GitHub:**
   - Vá em `Settings → Secrets and variables → Actions`
   - Adicione:
     - `SUPABASE_URL` = sua URL do Supabase
     - `SUPABASE_SERVICE_KEY` = sua Service Role Key (Supabase → Settings → API)

3. **O arquivo já está criado:**
   - `.github/workflows/bos-auto-pilot.yml`

4. **Commit e Push:**
   ```bash
   git add .github/workflows/bos-auto-pilot.yml
   git commit -m "feat: BOS Auto-Pilot - daily insights generation"
   git push
   ```

5. **Testar execução manual:**
   - GitHub → Actions → "BOS Daily Insights Generator" → "Run workflow"

---

## 📊 Monitoramento

### Ver Insights Gerados Hoje:
```sql
SELECT 
    clinic_id,
    priority,
    title,
    generated_at
FROM public.ai_insights 
WHERE generated_at >= CURRENT_DATE
ORDER BY clinic_id, priority;
```

### Histórico de Execuções (se usar pg_cron):
```sql
SELECT 
    runid,
    job_id,
    status,
    start_time,
    end_time
FROM cron.job_run_details 
WHERE jobname = 'bos-daily-insights'
ORDER BY start_time DESC 
LIMIT 20;
```

---

## 🎛️ Ajustes de Horário

### Mudar horário de execução:

**pg_cron:**
```sql
-- Cancelar job existente
SELECT cron.unschedule('bos-daily-insights');

-- Criar novo horário (exemplo: 8h Brasília = 11h UTC)
SELECT cron.schedule(
    'bos-daily-insights',
    '0 11 * * *',  -- Novo horário
    $$SELECT public.fn_generate_all_insights()$$
);
```

**GitHub Actions:**
- Edite `.github/workflows/bos-auto-pilot.yml`
- Linha `cron: '0 9 * * *'` → ajuste conforme necessário
- Formato: `minuto hora * * *` (0-23h UTC)

---

## 🧪 Testar Agora (Manual)

```sql
-- Executar para todas as clínicas
SELECT public.fn_generate_all_insights();

-- Ou para uma clínica específica
SELECT public.fn_generate_recovery_insights('550e8400-e29b-41d4-a716-446655440000'::uuid);
```

---

## 🔒 Segurança

- ✅ Função usa `SECURITY DEFINER` - executa com permissões corretas
- ✅ RLS ativo - usuários só veem insights da própria clínica
- ✅ Service Key segura nos secrets do GitHub

---

## 📝 Logs e Troubleshooting

### Se os insights não aparecerem:

1. **Verificar se há orçamentos elegíveis:**
```sql
SELECT * FROM public.vw_bos_money_on_table LIMIT 10;
```

2. **Verificar execução da função:**
```sql
-- Testar manualmente
SELECT public.fn_generate_recovery_insights('SEU_CLINIC_ID'::uuid);

-- Ver se gerou algo
SELECT * FROM public.ai_insights 
WHERE clinic_id = 'SEU_CLINIC_ID'::uuid 
ORDER BY generated_at DESC;
```

3. **Verificar cron (se usar pg_cron):**
```sql
SELECT * FROM cron.job_run_details 
WHERE status = 'failed' 
ORDER BY start_time DESC;
```

---

**Próximos Passos:**
1. Escolha o método (pg_cron ou GitHub Actions)
2. Execute o script de configuração
3. Aguarde 24h ou teste manualmente
4. Monitore os insights no Intelligence Center

🚀 **O BOS agora trabalha enquanto você dorme!**
