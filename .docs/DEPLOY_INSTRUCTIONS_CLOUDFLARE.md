# 🚀 Guia de Deploy: ClinicPro Elite no Cloudflare Pages

O seu código já foi preparado e enviado para o GitHub com segurança (arquivo `.env` bloqueado). Agora, siga estes passos para colocar o sistema no ar.

## 1. Conectar ao Cloudflare
1. Acesse o painel do [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Vá em **Workers & Pages**.
3. Clique em **Create Application** > **Pages**.
4. Clique em **Connect to Git** e selecione sua conta GitHub.
5. Escolha o repositório `clinicpro_manager`.

## 2. Configurações de Build
O Cloudflare deve detectar automaticamente, mas confirme:
- **Project Name**: `clinicpro-elite` (ou sua preferência)
- **Production Branch**: `main`
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Build Output Directory**: `dist`

## 3. Variáveis de Ambiente (Segredos) 🔐
Esta é a parte mais importante. Como bloqueamos o arquivo `.env` para não vazar, você precisa cadastrar as chaves manualmente no Cloudflare.

Clique em **Environment Variables (Production)** e adicione:

| Variable Name | Valor (Copie do seu Supabase/Google console) |
| :--- | :--- |
| `VITE_SUPABASE_URL` | *Sua URL do Projeto Supabase* |
| `VITE_SUPABASE_ANON_KEY` | *Sua Chave Anon Pública* |
| `VITE_BS_API_KEY` | *Sua chave da API de Busca (se houver)* |
| `VITE_GOOGLE_CLIENT_ID` | *Seu ID do Google Cloud (para Agenda)* |

> **Dica**: Você pode copiar esses valores do seu arquivo local (se tiver um backup) ou direto do painel do Supabase > Project Settings > API.

## 4. Finalizar
Clique em **Save and Deploy**. O Cloudflare vai baixar seu código, instalar as dependências, rodar o build e publicar o site em uma URL segura (`https://clinicpro-elite.pages.dev`).

---
**Status Atual**:
- Codigo: Sincronizado com GitHub (`main`). ✅
- Segurança: `.gitignore` blindado. ✅
- Build Local: Testado e Aprovado. ✅
