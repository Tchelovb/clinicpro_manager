# 🔧 Troubleshooting - Página em Branco no Cloudflare Pages

## 🔍 Diagnóstico

A página está carregando em branco. Possíveis causas:

### 1. ⚠️ Variáveis de Ambiente Não Configuradas

**Sintoma**: Página branca, erro no console relacionado a Supabase

**Solução**:
1. Acesse o Cloudflare Pages Dashboard
2. Vá em Settings → Environment Variables
3. Adicione:
   ```
   VITE_SUPABASE_URL = https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY = sua-chave-anonima
   ```
4. Clique em "Save"
5. Faça um novo deploy (Settings → Deployments → Retry deployment)

### 2. ❌ Erro de Build

**Sintoma**: Deploy falha ou página branca

**Solução**:
```bash
# Limpar e rebuildar localmente
npm run build

# Se funcionar localmente, o problema é no Cloudflare
# Verifique os logs de build no Cloudflare Pages
```

### 3. 🔐 Erro de Autenticação

**Sintoma**: Página branca após tentar fazer login

**Solução**:
1. Verifique se as URLs de redirect estão configuradas no Supabase
2. Vá em Authentication → URL Configuration
3. Adicione:
   - Site URL: `https://seu-dominio.pages.dev`
   - Redirect URLs: `https://seu-dominio.pages.dev/**`

### 4. 📦 Problema com Rotas (SPA)

**Sintoma**: Página inicial funciona, mas rotas internas não

**Solução**:
Crie um arquivo `_redirects` na pasta `public/`:
```
/*    /index.html   200
```

Isso garante que todas as rotas sejam tratadas pelo React Router.

## 🛠️ Passos de Correção Imediata

### Passo 1: Verificar Console do Navegador

Abra o DevTools (F12) e vá na aba Console. Procure por:
- ❌ Erros em vermelho
- ⚠️ Avisos em amarelo
- 🔍 Mensagens de rede (Network tab)

**Erros Comuns:**
- `Supabase URL is required` → Variáveis de ambiente não configuradas
- `Failed to fetch` → Problema de CORS ou URL incorreta
- `404 Not Found` → Problema de roteamento

### Passo 2: Verificar Variáveis de Ambiente

No Cloudflare Pages:
1. Settings → Environment Variables
2. Verifique se `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão configuradas
3. **IMPORTANTE**: Variáveis devem começar com `VITE_` para serem expostas no frontend

### Passo 3: Verificar Build Logs

No Cloudflare Pages:
1. Deployments → Selecione o último deployment
2. View build log
3. Procure por erros durante o build

### Passo 4: Testar Localmente

```bash
# Build local
npm run build

# Servir o build localmente
npx serve dist

# Acesse http://localhost:3000
# Se funcionar, o problema é na configuração do Cloudflare
```

### Passo 5: Verificar Supabase

1. Acesse o Supabase Dashboard
2. Settings → API
3. Copie:
   - Project URL (VITE_SUPABASE_URL)
   - anon public key (VITE_SUPABASE_ANON_KEY)
4. Cole no Cloudflare Pages Environment Variables

## 🔄 Solução Rápida

Se a página continuar em branco:

1. **Limpe o cache do Cloudflare**:
   - Cloudflare Dashboard → Caching → Purge Everything

2. **Force um novo deploy**:
   ```bash
   git commit --allow-empty -m "trigger deploy"
   git push origin main
   ```

3. **Verifique se o domínio está correto**:
   - Deve ser `https://clinicpro-manager.pages.dev` ou similar
   - Não deve ter `/dashboard` no final ao acessar pela primeira vez

## 📞 Debug Avançado

Se nada funcionar, adicione temporariamente ao `index.html`:

```html
<script>
  console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('Build OK');
</script>
```

Isso mostrará no console se as variáveis estão sendo carregadas.

## ✅ Checklist Final

- [ ] Variáveis de ambiente configuradas no Cloudflare
- [ ] Build concluído sem erros
- [ ] Arquivo `_redirects` criado em `public/`
- [ ] URLs de redirect configuradas no Supabase
- [ ] Cache do Cloudflare limpo
- [ ] Novo deploy realizado
- [ ] Console do navegador sem erros

---

**Se o problema persistir, me envie:**
1. Screenshot do console do navegador (F12)
2. Screenshot dos logs de build do Cloudflare
3. Screenshot das variáveis de ambiente configuradas
