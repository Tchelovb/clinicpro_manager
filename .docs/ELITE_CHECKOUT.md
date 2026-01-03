# 🏥 Elite Checkout de Impressão (Bundle System)

Este módulo transforma a antiga "geração de documento único" em um sistema de dossiê completo.

## 🚀 Funcionalidades
1.  **Dossiê Unificado**: Permite selecionar múltiplos documentos (Contrato, TCLE, Receita, etc.) e imprimí-los como um único PDF contínuo.
2.  **Seleção Automática (Inteligência Contextual)**:
        - Se o procedimento contém "IMPLANTE" ou "PROTOCOLO", o sistema auto-seleciona:
            - Contrato
            - TCLE
            - Pré-Operatório
            - Pós-Operatório
            - Receita
            - Orçamento
            - Recibo
            *(Total 7 Documentos)*
3.  **Bíblia Jurídica Blindada**:
        - Todo documento gerado recebe um Hash único e IP de origem no rodapé.
        - Cláusulas financeiras (Multa/Juros) são injetadas dinamicamente e protegidas contra edição manual.

## 🛠️ Como Usar
1.  Abra o `EliteDocumentEngine`.
2.  No menu lateral esquerdo ("Dossiê do Paciente"), use os checkboxes para selecionar os documentos desejados.
3.  Visualize o Live Preview sequencial na direita.
4.  Clique em "Imprimir Dossiê" para gerar a impressão unificada.

## ⚙️ Arquitetura
- **Componente**: `EliteDocumentEngine.tsx`
- **Serviço**: `TemplateService.ts` (Processamento de Variáveis)
- **Dados**: `TemplateRepository.ts` (Busca `elite_document_templates` do Supabase)
