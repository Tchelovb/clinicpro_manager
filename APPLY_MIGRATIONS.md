# Como Aplicar as Migrations no Supabase

## Erro Atual
```
Failed to load resource: the server responded with a status of 400
Error fetching pillar scores
```

Este erro ocorre porque a função RPC `calculate_pillar_scores` não existe no banco de dados Supabase.

## Solução: Aplicar as Migrations

Você tem 2 opções para aplicar as migrations:

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **SQL Editor** (no menu lateral)
4. Copie e cole o conteúdo dos seguintes arquivos **nesta ordem**:

#### 1. Função de Cálculo dos Pilares
Arquivo: `supabase/migrations/20241224000000_calculate_pillar_scores.sql`

Copie todo o conteúdo e execute no SQL Editor.

#### 2. Protocolo S16 (Segurança PIN)
Arquivo: `supabase/migrations/20241224000001_s16_protocol.sql`

Copie todo o conteúdo e execute no SQL Editor.

### Opção 2: Via Supabase CLI (Avançado)

Se você tiver o Supabase CLI instalado:

```bash
# Instalar CLI (se necessário)
npm install -g supabase

# Fazer login
supabase login

# Linkar ao projeto
supabase link --project-ref SEU_PROJECT_REF

# Aplicar migrations
supabase db push
```

## Verificação

Após aplicar as migrations, teste no SQL Editor:

```sql
-- Testar a função
SELECT calculate_pillar_scores('SEU_CLINIC_ID_AQUI');
```

Se retornar um JSON com os pilares, está funcionando! ✅

## Migrations Disponíveis

- ✅ `20241224000000_calculate_pillar_scores.sql` - Motor 10x50 (Radar de Gestão)
- ✅ `20241224000001_s16_protocol.sql` - Protocolo de Segurança S16 (PIN)

## Próximos Passos

Depois de aplicar as migrations, recarregue a aplicação e o erro deve desaparecer.
