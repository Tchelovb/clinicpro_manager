# Cloudflare Pages - Build Configuration

## Build Settings
- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Root directory:** `/`

## Environment Variables (Configure no Cloudflare Dashboard)
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Deploy Steps

### 1. Prepare o Repositório
```bash
git add .
git commit -m "Prepare for Cloudflare Pages deploy"
git push origin main
```

### 2. Configure no Cloudflare Pages
1. Acesse: https://dash.cloudflare.com/
2. Pages → Create a project
3. Connect to Git → Selecione seu repositório
4. Configure:
   - Framework preset: **Vite**
   - Build command: **npm run build**
   - Build output directory: **dist**
5. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Save and Deploy

### 3. Deploy Automático
- Cada push para `main` dispara deploy automático
- Preview deployments para outras branches

## Troubleshooting

### Build Fails
- Verifique os logs no Cloudflare Dashboard
- Certifique-se que as env vars estão configuradas
- Rode `npm run build` localmente primeiro

### Runtime Errors
- Verifique o console do browser
- Confirme que as env vars estão corretas
- Verifique conexão com Supabase

## Performance
- Cloudflare CDN global
- HTTPS automático
- Cache otimizado
- Edge computing

## Custo
- **FREE** até 500 builds/mês
- Bandwidth ilimitado
- Custom domains incluídos
