# ClinicPro Manager - Business Operating System (BOS)

> **Versão**: 1.0.0 (Enterprise Alpha)
> **Status**: ✅ Totalmente Funcional
> **Stack**: React 19 + Supabase + Tailwind + Gemini AI

## 🧠 O Que é o ClinicPro BOS?

O **ClinicPro** não é apenas um software de gestão (ERP). É um **Business Operating System (BOS)** desenhado para clínicas odontológicas e de estética de alta performance. Ele atua como um "C-Level Digital", integrando operações clínicas, controle financeiro rígido e inteligência comercial em uma única plataforma.

Diferente de sistemas comuns que apenas registram dados, o ClinicPro **usa esses dados para gerar lucro**, prevenindo perdas financeiras (Fort Knox) e recuperando oportunidades perdidas (Closer AI).

---

## 🏗️ Os 4 Pilares do Sistema

### 1. 🛡️ Financeiro "Fort Knox"
Um sistema financeiro blindado contra erros e fraudes.
- **Fechamento Cego**: O operador informa quanto tem em caixa sem saber o valor que o sistema calculou. Qualquer diferença (> R$ 10,00) exige justificativa auditável.
- **Sessão Obrigatória**: Nenhuma transação pode ser feita sem um caixa aberto no nome do usuário.
- **Trava de Inadimplência**: Pacientes com débitos são bloqueados automaticamente de novos agendamentos (configurável).
- **DRE em Tempo Real**: Demonstração de Resultado do Exercício calculada instantaneamente.

### 2. 🤝 CRM & Central de Conversão
O paciente não começa na cadeira, começa no Lead.
- **Funil Kanban**: Gestão visual de leads (Novo, Contato, Agendado, Orçamento, Fechado).
- **Recuperação de Orçamentos**: Orçamentos não aprovados viram automaticamente oportunidades no CRM para serem trabalhados.
- **Smart Tags**: Classificação automática de origem e temperatura do lead.

### 3. 🧠 Closer AI (Inteligência Artificial)
O motor de inteligência que analisa a clínica enquanto você dorme.
- **Assistente de Scripts**: Cria scripts de venda personalizados para cada paciente (High Ticket, Reativação, LTV) com 1 clique.
- **Análise Estatística**: (Em Roadmap) Identifica tratamentos com maior margem e sugere campanhas.

### 4. 🏥 Clínico Avançado
Gestão clínica sem burocracia.
- **Prontuário Digital**: Timeline completa do paciente (evoluções, arquivos, fotos).
- **Orçamentos Flexíveis**: Criação rápida com tabelas de preço múltiplas e regras de desconto.
- **Documentos Dinâmicos**: Geração automática de contratos e termos com dados do paciente.

---

## 🛠️ Stack Tecnológica

### Frontend (Client-Side)
- **Framework**: React 19.2.3 (Vite 6.2.0)
- **Linguagem**: TypeScript 5.8.2
- **Estilização**: Tailwind CSS + Lucide Icons
- **Gestão de Estado**: React Query (TanStack) + Context API
- **Gráficos**: Recharts

### Backend (Serverless)
- **Plataforma**: Supabase
- **Banco de Dados**: PostgreSQL 15+
- **Segurança**: Row Level Security (RLS) para isolamento total de dados por clínica (Multi-tenancy).
- **Auth**: Autenticação JWT segura.
- **Storage**: Armazenamento de arquivos (logos, fotos, assinaturas).

---

## 🗄️ Estrutura do Banco de Dados

O banco de dados possui **31 tabelas** organizadas organicamente. Abaixo, as principais estruturas:

### Módulo Core (Multi-tenancy)
| Tabela | Descrição |
| :--- | :--- |
| `clinics` | Dados da clínica, branding e configurações globais. |
| `users` | Usuários do sistema vinculados a uma clínica. |
| `professionals` | Dentistas/Especialistas com seus CRCs e regras. |
| `user_permissions` | ACL granular (quem pode ver financeiro, quem pode dar desconto, etc). |

### Módulo Financeiro (Fort Knox)
| Tabela | Descrição |
| :--- | :--- |
| `cash_registers` | Sessões de caixa (abertura, fechamento cego, auditoria). |
| `transactions` | Todas as entradas e saídas financeiras. Trigger de segurança ativo. |
| `financial_installments` | Contas a receber (parcelas). |
| `expenses` | Contas a pagar (fixas/variáveis). |
| `clinic_financial_settings` | Regras do cofre (limites de desconto, fundo de troco). |

### Módulo Clínico & CRM
| Tabela | Descrição |
| :--- | :--- |
| `patients` | Base de pacientes. |
| `appointments` | Agenda e consultas. |
| `budgets` | Orçamentos (Status: DRAFT, SENT, APPROVED). |
| `leads` | Oportunidades de venda e funil. |
| `leads_interactions` | Histórico de conversas com o lead. |

---

## 🚀 Guia de Instalação e Execução

### Pré-requisitos
- Node.js 18+
- Conta no Supabase (Gratuita ou Pro)

### 1. Clonar e Instalar
```bash
git clone <url-repo>
cd ClinicPro
npm install
```

### 2. Configurar Ambiente
Crie um arquivo `.env.local` na raiz:
```env
VITE_SUPABASE_URL=https://sua-url.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

### 3. Configurar Banco de Dados
1. No dashboard do Supabase, vá em **SQL Editor**.
2. Copie o conteúdo de `sql/schema.sql`.
3. Execute para criar toda a estrutura (Tabelas, RLS, Enum Types).

### 4. Rodar a Aplicação
```bash
npm run dev
```
Acesse `http://localhost:3000`.

---

## ⚙️ Funcionalidades Chave para Testar

### 1. Login e Multi-tenancy
- O sistema exige `Clinic Code`. Isso permite que múltiplas clínicas usem o mesmo software sem misturar dados.

### 2. O Fluxo "Closer AI"
1. Crie um orçamento para um paciente.
2. Não aprove-o imediatamente. Deixe como `DRAFT` (Rascunho).
3. Vá no **Módulo Comercial (Maleta)**.
4. Veja o orçamento aparecer no funil "Conversão".
5. Clique na **Lâmpada Mágica** 🧞‍♂️ no card.
6. O **Closer AI** vai gerar um script de venda personalizado para você enviar no WhatsApp.

### 3. Abertura de Caixa (Fort Knox)
1. Tente receber um pagamento sem abrir o caixa.
2. O sistema bloqueará a ação.
3. Vá em Financeiro > Abrir Caixa.
4. Informe o fundo de troco.
5. Agora o recebimento é permitido e registrado na sua sessão.

---

## 🛣️ Roadmap Futuro

- [ ] **App Mobile Nativo** (React Native) para dentistas verem agenda.
- [ ] **Anamnese Dinâmica**: Construtor de formulários drag-and-drop (JSONB).
- [ ] **Assinatura Digital**: Integração com pads de assinatura ou DocuSign.
- [ ] **Integração WhatsAPP API**: Envio de mensagens automáticas sem abrir janela.

---

**ClinicPro BOS** - *Transformando Clínicas em Empresas.*
