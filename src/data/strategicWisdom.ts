// Strategic Wisdom Principles - Biblical Management for Teams
export interface StrategicPrinciple {
    id: number;
    day: number;
    verse: string;
    verseReference: string;
    businessVision: string;
    practicalAction: string;
    // Role-specific adaptations
    adaptations: {
        admin: string;
        receptionist: string;
        salesperson: string;
        professional: string;
    };
}

export const STRATEGIC_PRINCIPLES: StrategicPrinciple[] = [
    {
        id: 1,
        day: 1,
        verse: "Viu um homem habilidoso em sua obra? Esse será posto perante reis.",
        verseReference: "Provérbios 22:29",
        businessVision: "A excelência e a agilidade no serviço abrem portas para o mercado High Ticket. Ser 'habilidoso' é o marketing mais barato.",
        practicalAction: "Hoje, execute sua tarefa mais difícil com 10% a mais de capricho.",
        adaptations: {
            admin: "Revise um relatório financeiro com atenção aos mínimos detalhes. A precisão gera confiança.",
            receptionist: "Atenda cada ligação como se fosse o paciente mais importante do dia. O tom de voz é marketing.",
            salesperson: "Apresente um orçamento com clareza cristalina. A habilidade de explicar bem fecha vendas.",
            professional: "Execute um procedimento com a técnica mais refinada possível. A excelência clínica é sua marca."
        }
    },
    {
        id: 2,
        day: 2,
        verse: "Quem é fiel no pouco, também é fiel no muito.",
        verseReference: "Lucas 16:10",
        businessVision: "Se não cuidarmos dos centavos no fluxo de caixa, não teremos sabedoria para gerir os grandes faturamentos.",
        practicalAction: "Verifique se cada lançamento financeiro de hoje está categorizado corretamente.",
        adaptations: {
            admin: "Confira se todos os recebimentos do dia foram registrados. Pequenos erros geram grandes prejuízos.",
            receptionist: "Cadastre cada lead com todos os campos preenchidos. Dados completos geram oportunidades futuras.",
            salesperson: "Registre cada follow-up prometido. A fidelidade nas pequenas promessas constrói grandes vendas.",
            professional: "Documente cada evolução clínica com detalhes. O prontuário perfeito protege você e o paciente."
        }
    },
    {
        id: 3,
        day: 3,
        verse: "A alma generosa prosperará; quem dá alívio aos outros, receberá alívio.",
        verseReference: "Provérbios 11:25",
        businessVision: "O crescimento da empresa está ligado à prosperidade de quem ela serve. Quem ajuda outros a brilhar, também brilha.",
        practicalAction: "Identifique um paciente que precise de um cuidado extra hoje e surpreenda-o.",
        adaptations: {
            admin: "Facilite um processo para um colega que esteja sobrecarregado. Equipes fortes geram lucros fortes.",
            receptionist: "Ofereça um café ou água para o paciente que está esperando. Pequenos gestos criam fidelização.",
            salesperson: "Ajude um paciente a encontrar a melhor forma de pagamento, mesmo que demore mais. A generosidade gera indicações.",
            professional: "Dedique 5 minutos extras para explicar o pós-operatório com calma. Pacientes bem cuidados voltam."
        }
    },
    {
        id: 4,
        day: 4,
        verse: "Qual de vocês, se quiser construir uma torre, primeiro não se assenta e calcula o preço?",
        verseReference: "Lucas 14:28",
        businessVision: "Nenhuma cirurgia ou investimento deve ser feito sem o cálculo real de custos. Gestão é medir para não desperdiçar.",
        practicalAction: "Revise os custos de um procedimento antes de enviar o próximo orçamento.",
        adaptations: {
            admin: "Calcule o ROI de cada investimento antes de aprovar. Planejamento evita surpresas desagradáveis.",
            receptionist: "Confirme a disponibilidade de sala e profissional antes de agendar. Planejamento evita cancelamentos.",
            salesperson: "Confira se todas as taxas e custos estão no orçamento. Descontos sem cálculo quebram empresas.",
            professional: "Planeje cada etapa do tratamento antes de iniciar. Cirurgias bem planejadas têm melhores resultados."
        }
    },
    {
        id: 5,
        day: 5,
        verse: "Seja o seu 'sim', sim, e o seu 'não', não.",
        verseReference: "Mateus 5:37",
        businessVision: "Empreender é cumprir o que se promete. 'Sim, sim; Não, não' é o que constrói uma reputação inabalável.",
        practicalAction: "Cumpra todos os retornos e promessas de prazos feitas aos pacientes hoje.",
        adaptations: {
            admin: "Se prometeu um relatório para hoje, entregue hoje. Sua palavra é seu maior ativo.",
            receptionist: "Se disse que ligaria às 14h, ligue às 14h. Pontualidade gera confiança.",
            salesperson: "Se prometeu enviar o orçamento em 24h, envie em 24h. Credibilidade fecha vendas.",
            professional: "Se marcou retorno para 7 dias, esteja disponível em 7 dias. Sua palavra é seu diferencial."
        }
    },
    {
        id: 6,
        day: 6,
        verse: "Tudo o que suas mãos encontrarem para fazer, façam-no com toda a sua força.",
        verseReference: "Eclesiastes 9:10",
        businessVision: "O que for feito na clínica (da limpeza ao bisturi) deve ser feito com toda a nossa força e dedicação.",
        practicalAction: "Elimine as distrações e foque 100% no paciente que estiver à sua frente.",
        adaptations: {
            admin: "Dedique-se totalmente à análise financeira do dia. Números exigem concentração total.",
            receptionist: "Desligue o celular pessoal durante o atendimento. Presença total gera encantamento.",
            salesperson: "Escute o paciente com atenção total, sem pensar na próxima venda. Foco gera fechamento.",
            professional: "Entre no consultório sem pressa. Cada paciente merece sua energia máxima."
        }
    },
    {
        id: 7,
        day: 7,
        verse: "Os planos fracassam por falta de conselho, mas são bem-sucedidos quando há muitos conselheiros.",
        verseReference: "Provérbios 15:22",
        businessVision: "Planos fracassam por falta de conselho. Uma equipe que ouve uns aos outros evita erros fatais.",
        practicalAction: "Peça uma sugestão de melhoria para um colega de outro setor hoje.",
        adaptations: {
            admin: "Consulte a equipe antes de implementar uma nova política. Decisões colaborativas são mais sólidas.",
            receptionist: "Pergunte ao financeiro como melhorar o processo de confirmação de pagamentos. Integração evita erros.",
            salesperson: "Peça feedback ao profissional sobre o orçamento antes de apresentar. Alinhamento gera credibilidade.",
            professional: "Discuta casos complexos com colegas. A sabedoria coletiva salva vidas e reputações."
        }
    }
];

// Get today's principle (cycles through 7 days)
export const getTodaysPrinciple = (): StrategicPrinciple => {
    const dayOfWeek = new Date().getDay(); // 0-6 (Sunday-Saturday)
    const principleIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust so Monday = 0
    return STRATEGIC_PRINCIPLES[principleIndex];
};

// Get role-specific action
export const getRoleSpecificAction = (principle: StrategicPrinciple, userRole: string): string => {
    const roleMap: { [key: string]: keyof typeof principle.adaptations } = {
        'ADMIN': 'admin',
        'MASTER': 'admin',
        'MANAGER': 'admin',
        'RECEPTIONIST': 'receptionist',
        'SECRETARY': 'receptionist',
        'CRC': 'salesperson',
        'SALESPERSON': 'salesperson',
        'PROFESSIONAL': 'professional',
        'DENTIST': 'professional'
    };

    const mappedRole = roleMap[userRole?.toUpperCase()] || 'professional';
    return principle.adaptations[mappedRole];
};
