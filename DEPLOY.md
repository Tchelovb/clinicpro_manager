# Guia de Implantação (Deployment)

## Variáveis de Ambiente
Para que o sistema funcione corretamente, as seguintes variáveis de ambiente devem ser configuradas no painel de controle do seu provedor de hospedagem (Cloudflare Pages, Vercel, Netlify, etc.):

- `VITE_SUPABASE_URL`: A URL do seu projeto Supabase.
- `VITE_SUPABASE_ANON_KEY`: A chave pública (anon) do seu projeto Supabase.
- `VITE_GEMINI_API_KEY`: A chave de API do Google Gemini (necessária para o módulo BOS Brain).

## Implantação no Cloudflare Pages
1. Conecte seu repositório GitHub ao Cloudflare Pages.
2. Selecione o branch `main`.
3. Configure as configurações de build:
   - **Framework Preset**: Vite / React (se disponível, ou None)
   - **Build Command**: `npm run build`
   - **Build Output Directory**: `dist`
4. Adicione as variáveis de ambiente listadas acima em **Settings > Environment Variables**.
5. Clique em **Save and Deploy**.

## Verificação Pós-Deploy
- Acesse a URL fornecida pelo Cloudflare.
- Faça login e verifique se os dados estão sendo carregados.
- Teste o chat BOS para confirmar que a chave do Gemini está funcionando.
