# 🏥 DIAGNÓSTICO TÉCNICO DE PERFORMANCE (AUDITORIA 2026)

**Data:** 03/01/2026
**Status:** Análise Concluída
**Responsável:** Antigravity AI

---

## 1. Gerenciamento de Estado e Cache 🧠
**Diagnóstico:** ⚠️ **Híbrido (Em Transição)**

*   **Situação Atual:** O sistema opera em um estado misto.
    *   **Pontos Fortes:** Recentemente migramos `Agenda`, `PatientsList` e `Budgets` para **React Query**. Isso garante cache e revalidação automática nessas áreas.
    *   **Pontos Críticos:** O "Coração" do sistema (`DataContext.tsx`) ainda utiliza um modelo legado de `useEffect` massivo que pode estar causando re-renderizações desnecessárias em toda a aplicação. A Busca Global (`GlobalSearch`) e componentes menores ainda fazem requisições manuais ao Supabase, ignorando o cache compartilhado.

## 2. Fluxo de Salvamento (Mutations) ⚡
**Diagnóstico:** 🔴 **Passivo (Bloqueante)**

*   **Comportamento:** O sistema pratica o método "Ver para Crer".
    *   Quando o Dr. Marcelo clica em salvar, a interface **bloqueia** ou aguarda a resposta do servidor (round-trip) para atualizar a tela.
    *   **Não existe Optimistic UI:** Se a internet oscilar, o usuário fica esperando o spinner girar. A interface não "assume" o sucesso imediato.

## 3. Pesquisa e Indexação 🔍
**Diagnóstico:** 🟠 **Server-Side Intensivo (Custo Alto)**

*   **Mecanismo:** A Busca Global (`SearchContent.tsx`) dispara uma requisição direta ao banco de dados (`supabase.from('patients')`) a cada 300ms (debounce) enquanto o usuário digita.
*   **Problema:**
    *   Não há indexação local. Se você buscar "Marcelo" duas vezes, o sistema vai ao banco duas vezes.
    *   Latência de rede é sentida a cada tecla.
    *   Não usa React Query para cachear resultados recentes.

## 4. Gargalos Identificados 🐢
**Top 3 Ofensores de Performance (LCP/TTI):**

1.  **Global Search (Busca Global):** Gera tráfego de rede desnecessário e tem delay perceptível entre digitar e ver resultados.
2.  **Agenda (Renderização):** O cálculo de datas e renderização do grid (`WeekViewDesktop`) é feito no cliente a cada render, somado ao fetch de dados.
3.  **Financial Dashboard:** Carrega múltiplas transações sem virtualização, pesando o DOM em listas longas.

## 5. Arquitetura de Utils 🛠️
**Diagnóstico:** ⚠️ **Descentralizado (Duplicação)**

*   **Estado:** A pasta `/src/lib/utils.ts` é subutilizada (contém apenas o `cn` para classes CSS).
*   **Problema:** Funções de formatação crítica (Moeda `BRL`, Datas `pt-BR`, Máscaras de CPF/Tel) estão sendo reescritas ou importadas inline em cada componente (`Intl.NumberFormat` espalhado). Isso aumenta o tamanho do bundle e dificulta a manutenção de padrões.

---

## 🎯 VEREDITO FINAL

O sistema tem uma **base sólida**, mas o motor está "amarrado".
Temos a tecnologia certa (React Query) instalada, mas estamos usando apenas 30% da potência.

**Próximos Passos Recomendados (Plano Apple):**
1.  **Ativar Optimistic UI** nos hooks de Agendamento (`useAppointments`).
2.  **Migrar Busca Global** para um índice local (Client-side Search) para pacientes frequentes ou usar cache agressivo.
3.  **Centralizar Formatadores** em `src/lib/formatters.ts` para padronização.
