# 🚀 Guia de Instalação: WhatsApp Server (Evolution API + Cloudflare)

**Objetivo:** Transformar seu PC em um servidor WhatsApp profissional com custo zero

**Tempo estimado:** 30-40 minutos

---

## 📋 Pré-requisitos

- ✅ Windows 10/11
- ✅ PC que ficará ligado 24/7
- ✅ Conexão estável com internet
- ✅ Conta Cloudflare (gratuita)

---

## 🏗️ FASE 1: Instalação do Docker

Docker é um "simulador de servidor" que permite rodar programas complexos sem bagunçar seu Windows.

### Passo 1.1: Download

1. Acesse: https://www.docker.com/products/docker-desktop
2. Clique em **"Download for Windows"**
3. Aguarde o download (arquivo ~500MB)

### Passo 1.2: Instalação

1. Execute o instalador baixado
2. Aceite todas as configurações padrão:
   - ✅ Use WSL 2 instead of Hyper-V
   - ✅ Add shortcut to desktop
3. Clique em **"Ok"** → **"Install"**
4. **IMPORTANTE:** Reinicie o computador quando solicitado

### Passo 1.3: Primeira Execução

1. Após reiniciar, abra **Docker Desktop** (ícone na área de trabalho)
2. Pode pedir para criar conta (é gratuito, crie)
3. Aguarde até a barrinha no canto inferior esquerdo ficar **VERDE** com texto "Engine running"
4. Pode minimizar, mas **não feche** o Docker

✅ **Checkpoint:** Docker Desktop aberto com status verde

---

## 👂 FASE 2: Configuração da Evolution API

### Passo 2.1: Criar Estrutura de Pastas

1. Abra o **Explorador de Arquivos**
2. Navegue até: `C:\Users\marce\OneDrive\Documentos`
3. Crie uma nova pasta chamada: `whatsapp-server`
4. Entre na pasta `whatsapp-server`

### Passo 2.2: Criar Arquivo de Configuração

1. Dentro da pasta `whatsapp-server`, clique com botão direito
2. **Novo** → **Documento de Texto**
3. Renomeie para: `docker-compose.yml`
   - ⚠️ **IMPORTANTE:** Apague o `.txt` do final!
   - O arquivo deve ser `docker-compose.yml`, não `docker-compose.yml.txt`
4. Clique com botão direito no arquivo → **Abrir com** → **Bloco de Notas**

### Passo 2.3: Colar Configuração

Cole este código **EXATAMENTE** como está:

```yaml
version: '3.3'

services:
  evolution-api:
    container_name: evolution_api
    image: atendai/evolution-api:v2.1.1
    restart: always
    ports:
      - "8080:8080"
    environment:
      # Chave de autenticação (MUDE ISSO!)
      - AUTHENTICATION_API_KEY=DrMarceloSecretKey123456
      
      # URL do servidor (será atualizada depois)
      - SERVER_URL=http://localhost:8080
      
      # Configurações de persistência
      - DEL_INSTANCE=false
      - DATABASE_SAVE_DATA_INSTANCE=true
      - DATABASE_SAVE_DATA_NEW_MESSAGE=true
      - DATABASE_SAVE_MESSAGE_UPDATE=true
      - DATABASE_SAVE_DATA_CONTACTS=true
      - DATABASE_SAVE_DATA_CHATS=true
      
      # Desabilitar Redis e DB externo (usar SQLite interno)
      - REDIS_ENABLED=false
      - DATABASE_ENABLED=false
      
      # Configurações de log
      - LOG_LEVEL=ERROR
      - LOG_COLOR=true
      
    volumes:
      - ./evolution_store:/evolution/store
    
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/"]
      interval: 30s
      timeout: 10s
      retries: 3
```

**Salve e feche** o arquivo.

✅ **Checkpoint:** Arquivo `docker-compose.yml` criado na pasta `whatsapp-server`

---

## ▶️ FASE 3: Iniciar o Servidor

### Passo 3.1: Abrir Terminal

1. Pressione **Windows + R**
2. Digite: `powershell`
3. Pressione **Enter**

### Passo 3.2: Navegar até a Pasta

No PowerShell, digite:

```powershell
cd C:\Users\marce\OneDrive\Documentos\whatsapp-server
```

Pressione **Enter**.

### Passo 3.3: Iniciar Evolution API

Digite este comando:

```powershell
docker compose up -d
```

Pressione **Enter**.

**O que vai acontecer:**
- Vai aparecer "Pulling evolution-api..."
- Várias barras de progresso (download da imagem)
- Pode demorar 2-5 minutos dependendo da internet
- No final aparece: `✔ Container evolution_api  Started`

### Passo 3.4: Verificar se Funcionou

1. Abra seu navegador
2. Acesse: http://localhost:8080
3. Deve aparecer uma tela com:
   - "Evolution API Manager"
   - Campo para API Key
   - Botão "Connect"

✅ **Checkpoint:** Tela da Evolution API acessível em localhost:8080

---

## 🚇 FASE 4: Cloudflare Tunnel (Expor para Internet)

### Passo 4.1: Acessar Cloudflare Zero Trust

1. Acesse: https://dash.cloudflare.com
2. Faça login (ou crie conta gratuita)
3. No menu lateral esquerdo, clique em **"Zero Trust"**
4. Se pedir para configurar, escolha o plano **FREE** (gratuito)
   - Pode pedir cartão para cadastro, mas **nunca cobra**

### Passo 4.2: Criar Tunnel

1. No menu Zero Trust, vá em: **Networks** → **Tunnels**
2. Clique em **"Create a tunnel"**
3. Escolha: **Cloudflared**
4. Nome do tunnel: `whatsapp-clinicpro`
5. Clique em **"Save tunnel"**

### Passo 4.3: Instalar Cloudflared (Connector)

1. Na tela de instalação, selecione a aba **Windows**
2. Você verá um comando que começa com:
   ```
   cloudflared.exe service install eyJ...
   ```
3. **Copie** este comando completo

### Passo 4.4: Executar Instalação

1. Feche o PowerShell anterior
2. Pressione **Windows + X**
3. Escolha: **"Windows PowerShell (Admin)"** ou **"Terminal (Admin)"**
4. Clique em **"Sim"** na janela de permissão
5. **Cole** o comando copiado
6. Pressione **Enter**
7. Aguarde aparecer: "Service installed successfully"

### Passo 4.5: Configurar Public Hostname

1. Volte para o navegador (página do Cloudflare)
2. Clique em **"Next"** (após a instalação)
3. Na seção **Public Hostname**, configure:

   **Subdomain:** `api-whatsapp`  
   **Domain:** (selecione seu domínio)  
   **Path:** (deixe vazio)

4. Na seção **Service**, configure:

   **Type:** `HTTP`  
   **URL:** `localhost:8080`

5. Clique em **"Save tunnel"**

✅ **Checkpoint:** Tunnel criado e ativo (status verde)

---

## 🏁 FASE 5: Teste Final

### Passo 5.1: Acessar pela Internet

1. Copie a URL pública do seu tunnel:
   ```
   https://api-whatsapp.[seu-dominio].com
   ```

2. Abra em **outro dispositivo** (celular, outro PC)
3. Deve aparecer a mesma tela da Evolution API
4. Digite a API Key: `DrMarceloSecretKey123456`
5. Clique em **"Connect"**

### Passo 5.2: Criar Instância WhatsApp

1. Após conectar, clique em **"Create Instance"**
2. Preencha:
   - **Instance Name:** `clinicpro-bot`
   - **Token:** (deixe auto-gerar)
3. Clique em **"Create"**
4. Aparecerá um **QR Code**
5. Abra o WhatsApp no celular da clínica
6. Vá em: **Configurações** → **Aparelhos conectados** → **Conectar aparelho**
7. Escaneie o QR Code
8. Aguarde aparecer: ✅ **Connected**

✅ **SUCESSO!** Servidor WhatsApp profissional funcionando!

---

## 🔗 FASE 6: Conectar ao Supabase

### Passo 6.1: Salvar Credenciais no Supabase

Execute no SQL Editor:

```sql
-- URL da Evolution API
INSERT INTO system_settings (key, value, description)
VALUES ('whatsapp_api_url', 'https://api-whatsapp.[seu-dominio].com', 'URL da Evolution API')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- API Key
INSERT INTO system_settings (key, value, description)
VALUES ('whatsapp_api_key', 'DrMarceloSecretKey123456', 'Chave da Evolution API')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Nome da instância
INSERT INTO system_settings (key, value, description)
VALUES ('whatsapp_instance_name', 'clinicpro-bot', 'Nome da instância WhatsApp')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

### Passo 6.2: Atualizar Edge Function

A Edge Function já está preparada para usar essas configurações. Basta fazer deploy da versão atualizada que busca as credenciais de `system_settings`.

---

## 🛠️ Comandos Úteis

### Verificar Status do Container

```powershell
docker ps
```

### Ver Logs da Evolution API

```powershell
docker logs evolution_api --tail 50 -f
```

### Parar o Servidor

```powershell
cd C:\Users\marce\OneDrive\Documentos\whatsapp-server
docker compose down
```

### Reiniciar o Servidor

```powershell
cd C:\Users\marce\OneDrive\Documentos\whatsapp-server
docker compose restart
```

### Atualizar para Nova Versão

```powershell
cd C:\Users\marce\OneDrive\Documentos\whatsapp-server
docker compose pull
docker compose up -d
```

---

## ⚠️ Troubleshooting

### Erro: "Docker daemon is not running"
- Abra o Docker Desktop e aguarde ficar verde

### Erro: "Port 8080 is already in use"
- Mude a porta no `docker-compose.yml`: `"8081:8080"`

### QR Code não aparece
- Verifique se a instância foi criada corretamente
- Tente deletar e criar novamente

### Tunnel offline
- Verifique se o serviço cloudflared está rodando:
  ```powershell
  sc query cloudflared
  ```
- Se parado, inicie:
  ```powershell
  sc start cloudflared
  ```

---

## 📊 Arquitetura Final

```
[Lead entra] 
    ↓
[Trigger Sniper] 
    ↓
[Edge Function] 
    ↓
[Gemini AI gera mensagem] 
    ↓
[Evolution API no seu PC] 
    ↓
[WhatsApp envia mensagem]
```

---

## 🎯 Próximos Passos

Após concluir este guia:

1. ✅ Servidor WhatsApp rodando 24/7
2. ✅ Acessível pela internet via Cloudflare
3. ✅ Credenciais salvas no Supabase
4. 🔜 Atualizar Edge Function para enviar mensagens
5. 🔜 Testar fluxo completo: Lead → IA → WhatsApp

---

**Me avise quando conseguir ver a tela de login no link do Cloudflare!** 🚀
