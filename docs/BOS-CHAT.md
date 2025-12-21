# 🎙️ BOS Chat - Assistente Interativo por Voz

## 📋 Visão Geral

O **BOS Chat** é um assistente estratégico interativo que permite ao Dr. Marcelo conversar com o sistema em **texto ou voz**, recebendo insights acionáveis baseados nos dados reais da clínica em tempo real.

---

## ✨ Funcionalidades

### 1. **Chat de Texto**
- Interface flutuante elegante
- Histórico de conversação
- Contexto mantido entre mensagens
- Respostas baseadas em dados reais

### 2. **Entrada por Voz (Speech-to-Text)**
- Clique no microfone para falar
- Reconhecimento em português (pt-BR)
- Transcrição automática para texto
- Feedback visual durante gravação

### 3. **Saída por Voz (Text-to-Speech)**
- Toggle para ativar/desativar voz do BOS
- Voz em português natural
- Lê automaticamente as respostas
- Controle de volume integrado

### 4. **Inteligência Contextual**
- Acesso em tempo real aos dados da clínica
- Conhece receita, despesas, leads, orçamentos
- Persona de "Arquiteto de Crescimento Exponencial"
- Respostas estratégicas e acionáveis

---

## 🎯 Como Usar

### Acessar o BOS Chat:

1. **Botão Flutuante**: Clique no botão roxo com ícone de mensagem no canto inferior direito
2. **Atalho de Teclado**: (Futuro) `ALT + B`

### Interagir por Texto:

1. Digite sua pergunta no campo de entrada
2. Pressione `Enter` ou clique no botão de enviar
3. Aguarde a resposta do BOS

### Interagir por Voz:

1. Clique no ícone de **microfone** 🎤
2. Fale sua pergunta claramente
3. O sistema transcreverá automaticamente
4. Clique novamente para parar a gravação
5. Envie a mensagem

### Ativar Respostas por Voz:

1. Clique no ícone de **alto-falante** 🔊 no header do chat
2. O BOS lerá as respostas em voz alta
3. Clique novamente para desativar

---

## 💬 Exemplos de Perguntas

### Financeiro:
- "Como está nossa receita este mês?"
- "Qual foi o lucro líquido?"
- "Mostre as despesas mais altas"

### Comercial:
- "Quantos leads temos ativos?"
- "Quais orçamentos estão parados?"
- "Qual o valor total em negociações?"

### Estratégico:
- "O que devo focar hoje?"
- "Identifique gargalos no funil"
- "Sugira ações para aumentar conversão"

### Específico:
- "Analise o orçamento da Maria Silva"
- "Como está a performance do Dr. João?"
- "Preciso aumentar vendas de Cervicoplastia"

---

## 🧠 Persona do BOS

O BOS responde como um **Sócio Estratégico**:

- ✅ Direto e objetivo
- ✅ Baseado em dados
- ✅ Focado em ações
- ✅ Linguagem profissional mas acessível
- ✅ Proativo em identificar oportunidades
- ❌ Não é simpático demais
- ❌ Não faz rodeios

**Exemplo de Resposta:**

> **Pergunta:** "Como estão as vendas?"
>
> **BOS:** "Dr. Marcelo, detectei que estamos 25% abaixo da meta. Identifico 3 orçamentos de Cervicoplastia (total R$ 42.000) parados há mais de 5 dias. Sugiro protocolo de recuperação imediato via Closer AI. Deseja que eu prepare os scripts?"

---

## ⚙️ Tecnologias Utilizadas

### Frontend:
- **React** + TypeScript
- **Web Speech API** (nativa do navegador)
  - `SpeechRecognition` - Voz para texto
  - `SpeechSynthesis` - Texto para voz

### IA:
- **Google Gemini 2.5 Flash**
- System Instruction com persona customizada
- Contexto em tempo real da clínica

### Hooks Customizados:
- `useBOSVoice.ts` - Gerenciamento de voz
- `useBOSChat.ts` - Gerenciamento de mensagens e IA

---

## 🛠️ Arquivos Criados

```
hooks/
├── useBOSVoice.ts       # Hook de voz (input/output)
└── useBOSChat.ts        # Hook de chat e IA

components/
├── BOSChat.tsx          # Interface do chat
├── BOSFloatingButton.tsx # Botão de acesso
└── AppLayout.tsx        # Integração global (modificado)
```

---

## 🔒 Segurança e Privacidade

- ✅ Reconhecimento de voz **local** (não envia áudio para servidor)
- ✅ Apenas **texto transcrito** é enviado ao Gemini
- ✅ Dados da clínica filtrados por `clinic_id` (multi-tenancy)
- ✅ Chave API protegida em variável de ambiente

---

## 📊 Dados Acessados pelo BOS

O BOS tem acesso em tempo real a:

- Receitas e despesas do mês atual
- Leads ativos e status
- Orçamentos pendentes e valores
- Total de pacientes
- Nome e especialização do doutor

**Não tem acesso a:**
- Dados de outras clínicas
- Informações sensíveis de pacientes (exceto quantidades)
- Histórico médico detalhado

---

## 🎨 Personalização

### Mudar Persona do BOS:

Edite `hooks/useBOSChat.ts`, linha ~35:

```typescript
const systemPrompt = `
    Você é o **BOS** da ClinicPro...
    
    PERSONA:
    - [PERSONALIZE AQUI]
`;
```

### Ajustar Voz:

Edite `hooks/useBOSVoice.ts`, linha ~90:

```typescript
utterance.rate = 0.9;  // Velocidade (0.1 - 10)
utterance.pitch = 1.0; // Tom (0 - 2)
utterance.volume = 1.0; // Volume (0 - 1)
```

---

## 🐛 Troubleshooting

### Microfone não funciona:

1. Verifique permissões do navegador
2. Acesse via HTTPS (localhost funciona)
3. Teste em Chrome/Edge (melhor suporte)

### Voz não sintetiza:

1. Verifique se há vozes em português instaladas:
```javascript
console.log(window.speechSynthesis.getVoices());
```

2. Aguarde alguns segundos após carregar a página

### BOS não responde:

1. Verifique `VITE_GEMINI_API_KEY` no `.env.local`
2. Veja console (F12) para erros
3. Teste a chave API manualmente

---

## 🚀 Próximas Evoluções

- [ ] Atalhos de teclado globais
- [ ] Comandos de voz diretos ("BOS, mostre insights")
- [ ] Histórico de conversas salvo
- [ ] Modo "sempre ouvindo" (wake word)
- [ ] Integração com Telegram/WhatsApp
- [ ] Resumos diários automáticos por voz

---

## 📞 Uso Recomendado

**Cenário Ideal:**

Dr. Marcelo está se preparando para um atendimento. Fala com o BOS:

> "BOS, como está minha agenda hoje?"
> 
> BOS responde em voz alta: "Bom dia, Dr. Marcelo. Você tem 7 consultas agendadas. Detectei que 2 pacientes têm orçamentos pendentes de alto valor. Sugiro aproveitar as consultas para mencionar as condições especiais deste mês."

**Resultado:** Gestão fluida, sem burocracia, enquanto se prepara.

---

**O BOS agora é um parceiro de conversa!** 🎙️🤖💼
