
import { Lead, LeadStatus, Patient, Appointment, FinancialRecord, Expense, CashRegister, Procedure, Professional, PriceTable, InsurancePlan, ClinicConfig, AgendaConfig, DocumentTemplate, ClinicalDocument } from './types';

export const MOCK_LEADS: Lead[] = [
  {
    id: '1',
    name: 'Ana Silva',
    phone: '(11) 99999-1111',
    email: 'ana.silva@email.com',
    source: 'Instagram',
    status: LeadStatus.NEW,
    createdAt: '2023-10-25T10:00:00',
    lastInteraction: '2023-10-25T10:00:00',
    history: [
      { id: 'h1', type: 'System', content: 'Oportunidade criada via Instagram', date: '2023-10-25T10:00:00', user: 'System' }
    ],
    tasks: []
  },
  {
    id: '2',
    name: 'Carlos Oliveira',
    phone: '(11) 98888-2222',
    source: 'Google',
    status: LeadStatus.CONTACT,
    createdAt: '2023-10-24T14:30:00',
    lastInteraction: '2023-10-25T09:15:00',
    history: [
      { id: 'h2', type: 'System', content: 'Oportunidade criada via Google Ads', date: '2023-10-24T14:30:00', user: 'System' },
      { id: 'h3', type: 'WhatsApp', content: 'Enviada mensagem de boas-vindas. Aguardando retorno.', date: '2023-10-25T09:15:00', user: 'Dra. Sofia' }
    ],
    tasks: [
      { id: 't1', title: 'Ligar novamente à tarde', dueDate: '2023-10-26', completed: false }
    ]
  },
  {
    id: '3',
    name: 'Mariana Souza',
    phone: '(11) 97777-3333',
    source: 'Indicação',
    status: LeadStatus.SCHEDULED,
    createdAt: '2023-10-20T11:00:00',
    lastInteraction: '2023-10-25T16:00:00',
    value: 1500,
    history: [
      { id: 'h4', type: 'Call', content: 'Conversa inicial. Paciente quer lentes de contato.', date: '2023-10-20T11:15:00', user: 'Dr. Marcelo Vilas Boas' },
      { id: 'h5', type: 'System', content: 'Agendamento confirmado para 27/10', date: '2023-10-25T16:00:00', user: 'Recepção' }
    ],
    tasks: []
  },
  {
    id: '4',
    name: 'Roberto Santos',
    phone: '(11) 96666-4444',
    source: 'Facebook',
    status: LeadStatus.PROPOSAL,
    createdAt: '2023-10-15T09:00:00',
    lastInteraction: '2023-10-24T10:00:00',
    value: 3200,
    history: [
      { id: 'h6', type: 'WhatsApp', content: 'Orçamento enviado em PDF.', date: '2023-10-24T10:00:00', user: 'Dr. Marcelo Vilas Boas' }
    ],
    tasks: [
      { id: 't2', title: 'Cobrar retorno do orçamento', dueDate: '2023-10-27', completed: false }
    ]
  },
  {
    id: '5',
    name: 'Fernanda Lima',
    phone: '(11) 95555-5555',
    source: 'Instagram',
    status: LeadStatus.WON,
    createdAt: '2023-10-10T15:00:00',
    lastInteraction: '2023-10-22T14:00:00',
    value: 5000,
    history: [
      { id: 'h7', type: 'System', content: 'Venda realizada! Início do tratamento.', date: '2023-10-22T14:00:00', user: 'System' }
    ],
    tasks: []
  },
];

// Detailed Mock Data for Patient 101
const PATIENT_101_NOTES = [
  { id: 'n1', date: '2023-10-27', doctorName: 'Dr. Marcelo Vilas Boas', type: 'Evolução', content: 'Paciente compareceu para início do tratamento ortodôntico. Realizada colagem superior.' },
  { id: 'n2', date: '2023-10-15', doctorName: 'Dr. Marcelo Vilas Boas', type: 'Anamnese', content: 'Paciente queixa-se de dores na ATM e estética do sorriso.' },
  { id: 'n3', date: '2023-10-15', doctorName: 'Dra. Sofia', type: 'Exame', content: 'Solicitado Panorâmica e Telerradiografia.' },
];

const PATIENT_101_BUDGETS = [
  {
    id: 'b1', createdAt: '2023-10-15', doctorName: 'Dr. Marcelo Vilas Boas', status: 'Aprovado', totalValue: 2500, priceTableId: 'pt1',
    items: [
      { id: 'bi1', procedure: 'Aparelho Ortodôntico Safira', region: 'Arcada Sup/Inf', quantity: 1, unitValue: 2000, total: 2000 },
      { id: 'bi2', procedure: 'Documentação Ortodôntica', region: '-', quantity: 1, unitValue: 500, total: 500 },
    ]
  },
  {
    id: 'b2', createdAt: '2023-10-15', doctorName: 'Dr. Marcelo Vilas Boas', status: 'Em Análise', totalValue: 1200, priceTableId: 'pt1',
    items: [
      { id: 'bi3', procedure: 'Clareamento Caseiro', region: 'Arcada Sup/Inf', quantity: 1, unitValue: 1200, total: 1200 },
    ]
  }
];

const PATIENT_101_TREATMENTS = [
  { id: 't1', procedure: 'Aparelho Ortodôntico Safira', region: 'Arcada Sup', status: 'Em Andamento', doctorName: 'Dr. Marcelo Vilas Boas', executionDate: '2023-10-27', budgetId: 'b1' },
  { id: 't2', procedure: 'Aparelho Ortodôntico Safira', region: 'Arcada Inf', status: 'Não Iniciado', budgetId: 'b1' },
  { id: 't3', procedure: 'Documentação Ortodôntica', region: '-', status: 'Concluído', doctorName: 'Ext', executionDate: '2023-10-20', budgetId: 'b1' },
];

const PATIENT_101_FINANCIALS = [
  { id: 'fi1', description: 'Entrada Tratamento Orto', dueDate: '2023-10-15', amount: 500, status: 'Pago', paymentMethod: 'Pix' },
  { id: 'fi2', description: 'Parcela 1/4 Orto', dueDate: '2023-11-15', amount: 500, status: 'Pendente', paymentMethod: 'Boleto' },
  { id: 'fi3', description: 'Parcela 2/4 Orto', dueDate: '2023-12-15', amount: 500, status: 'Pendente', paymentMethod: 'Boleto' },
  { id: 'fi4', description: 'Parcela 3/4 Orto', dueDate: '2024-01-15', amount: 500, status: 'Pendente', paymentMethod: 'Boleto' },
  { id: 'fi5', description: 'Parcela 4/4 Orto', dueDate: '2024-02-15', amount: 500, status: 'Pendente', paymentMethod: 'Boleto' },
];

export const MOCK_PATIENTS: Patient[] = [
  {
    id: '101',
    name: 'João Pereira',
    email: 'joao@email.com',
    phone: '(11) 91111-1111',
    cpf: '123.456.789-00',
    birthDate: '1990-05-15',
    gender: 'Masculino',
    address: 'Rua das Flores, 123 - São Paulo, SP',
    status: 'Em Tratamento',
    lastVisit: '2023-10-27',
    responsibleDoctor: 'Dr. Marcelo Vilas Boas',

    totalSpent: 500,
    totalBudgeted: 3700,
    totalApproved: 2500,
    totalPaid: 500,
    balanceDue: 2000,

    notes: PATIENT_101_NOTES as any,
    budgets: PATIENT_101_BUDGETS as any,
    treatments: PATIENT_101_TREATMENTS as any,
    financials: PATIENT_101_FINANCIALS as any
  },
  {
    id: '102',
    name: 'Cláudia Mendes',
    email: 'claudia@email.com',
    phone: '(11) 92222-2222',
    cpf: '234.567.890-11',
    birthDate: '1985-08-20',
    gender: 'Feminino',
    address: 'Av. Paulista, 1000 - São Paulo, SP',
    status: 'Manutenção',
    lastVisit: '2023-09-20',
    nextVisit: '2023-11-05',
    responsibleDoctor: 'Dra. Sofia',
    totalSpent: 800,
    totalBudgeted: 800,
    totalApproved: 800,
    totalPaid: 800,
    balanceDue: 0
  },
  {
    id: '103',
    name: 'Ricardo Alves',
    email: 'ricardo@email.com',
    phone: '(11) 93333-3333',
    cpf: '345.678.901-22',
    birthDate: '1978-01-10',
    gender: 'Masculino',
    address: 'Rua Augusta, 500 - São Paulo, SP',
    status: 'Arquivo',
    lastVisit: '2023-01-10',
    responsibleDoctor: 'Dr. Marcelo Vilas Boas',
    totalSpent: 150,
    totalBudgeted: 150,
    totalApproved: 150,
    totalPaid: 150,
    balanceDue: 0
  },
];

export const MOCK_APPOINTMENTS: Appointment[] = [
  { id: 'a1', patientId: '101', patientName: 'João Pereira', doctorName: 'Dr. Marcelo Vilas Boas', date: '2023-10-27', time: '09:00', type: 'Procedimento', status: 'Confirmado' },
  { id: 'a2', patientId: 'lead3', patientName: 'Mariana Souza', doctorName: 'Dra. Sofia', date: '2023-10-27', time: '10:30', type: 'Avaliação', status: 'Pendente' },
  { id: 'a3', patientId: '102', patientName: 'Cláudia Mendes', doctorName: 'Dr. Marcelo Vilas Boas', date: '2023-10-27', time: '14:00', type: 'Retorno', status: 'Confirmado' },
];

export const MOCK_FINANCIALS: FinancialRecord[] = [
  { id: 'f1', description: 'Pagamento Tratamento Orto', amount: 500, type: 'income', date: '2023-10-26', category: 'Tratamentos', status: 'Pago', paymentMethod: 'Pix' },
  { id: 'f2', description: 'Compra Material Descartável', amount: 1200, type: 'expense', date: '2023-10-25', category: 'Materiais', status: 'Pago', paymentMethod: 'Boleto' },
  { id: 'f3', description: 'Consulta Avaliação', amount: 150, type: 'income', date: '2023-10-26', category: 'Consultas', status: 'Pendente', paymentMethod: 'Cartão' },
  { id: 'f4', description: 'Manutenção Equipamento', amount: 350, type: 'expense', date: '2023-10-24', category: 'Manutenção', status: 'Pago', paymentMethod: 'Pix' },
];

export const MOCK_EXPENSES: Expense[] = [
  { id: 'e1', description: 'Aluguel Clínica', category: 'Fixa', provider: 'Imobiliária Central', amount: 3500, dueDate: '2023-11-05', status: 'Pendente' },
  { id: 'e2', description: 'Laboratório Protese', category: 'Laboratório', provider: 'Lab. Sorriso', amount: 1200, dueDate: '2023-10-28', status: 'Pendente' },
  { id: 'e3', description: 'Energia Elétrica', category: 'Fixa', provider: 'Enel', amount: 450, dueDate: '2023-11-10', status: 'Pendente' },
  { id: 'e4', description: 'Compra Anestésico', category: 'Variável', provider: 'Dental Cremer', amount: 800, dueDate: '2023-10-20', status: 'Pago', paymentMethod: 'Boleto' },
];

export const MOCK_CASH_REGISTERS: CashRegister[] = [
  {
    id: 'cr1',
    openedAt: '2023-10-26T08:00:00',
    closedAt: '2023-10-26T18:30:00',
    responsibleName: 'Dr. Marcelo Vilas Boas',
    openingBalance: 200,
    closingBalance: 1450,
    calculatedBalance: 1450,
    status: 'Fechado',
    transactions: [MOCK_FINANCIALS[0], MOCK_FINANCIALS[3]] // Just generic link for mock
  }
];

export const LEAD_STATUS_LABELS: Record<string, string> = {
  [LeadStatus.NEW]: 'Novo',
  [LeadStatus.CONTACT]: 'Em Contato',
  [LeadStatus.SCHEDULED]: 'Agendado',
  [LeadStatus.PROPOSAL]: 'Orçamento',
  [LeadStatus.NEGOTIATION]: 'Negociação',
  [LeadStatus.WON]: 'Ganho',
  [LeadStatus.LOST]: 'Perdido',
};

export const KANBAN_COLUMNS = [
  { id: LeadStatus.NEW, title: 'Nova Oportunidade', color: 'border-blue-400', bg: 'bg-blue-50' },
  { id: LeadStatus.CONTACT, title: 'Em Contato', color: 'border-cyan-400', bg: 'bg-cyan-50' },
  { id: LeadStatus.SCHEDULED, title: 'Agendado', color: 'border-purple-400', bg: 'bg-purple-50' },
  { id: LeadStatus.PROPOSAL, title: 'Orçamento', color: 'border-yellow-400', bg: 'bg-yellow-50' },
  { id: LeadStatus.NEGOTIATION, title: 'Negociação', color: 'border-orange-400', bg: 'bg-orange-50' },
  { id: LeadStatus.WON, title: 'Aprovado', color: 'border-green-500', bg: 'bg-green-50' },
  { id: LeadStatus.LOST, title: 'Perdido', color: 'border-red-400', bg: 'bg-red-50' },
];

export const INITIAL_PROCEDURES: Procedure[] = [
  { id: 'p1', name: 'Limpeza (Profilaxia)', category: 'Prevenção', price: 200, duration: 30 },
  { id: 'p2', name: 'Restauração Resina', category: 'Dentística', price: 350, duration: 45 },
  { id: 'p3', name: 'Implante Unitário', category: 'Implantodontia', price: 2500, duration: 90 },
  { id: 'p4', name: 'Clareamento Caseiro', category: 'Estética', price: 800, duration: 15 },
  { id: 'p5', name: 'Clareamento Consultório', category: 'Estética', price: 1200, duration: 60 },
  { id: 'p6', name: 'Tratamento Canal (Molar)', category: 'Endodontia', price: 900, duration: 90 },
  { id: 'p7', name: 'Extração Simples', category: 'Cirurgia', price: 250, duration: 45 },
  { id: 'p8', name: 'Coroa Porcelana', category: 'Prótese', price: 1800, duration: 60 },
];

export const INITIAL_PROFESSIONALS: Professional[] = [
  { id: 'prof1', name: 'Dr. Marcelo Vilas Boas', role: 'Dentista', color: 'blue', active: true, email: 'marcelo.vilasboas@clinicpro.com' },
  { id: 'prof2', name: 'Dra. Sofia', role: 'Dentista', color: 'purple', active: true, email: 'sofia@clinic.com' },
  { id: 'prof3', name: 'Dr. Ricardo', role: 'Dentista', color: 'green', active: true, email: 'ricardo@clinic.com' },
];

// --- NEW CONFIG DATA ---

export const INITIAL_PRICE_TABLES: PriceTable[] = [
  {
    id: 'pt1',
    name: 'Particular (Padrão)',
    active: true,
    items: [] // Empty items implies using base price
  },
  {
    id: 'pt2',
    name: 'Unimed Dental',
    active: true,
    items: [
      { procedureId: 'p1', price: 120 }, // Discounted cleaning
      { procedureId: 'p7', price: 150 }, // Discounted extraction
    ]
  },
  {
    id: 'pt3',
    name: 'Amil Dental',
    active: true,
    items: [
      { procedureId: 'p1', price: 100 },
      { procedureId: 'p2', price: 200 },
    ]
  }
];

export const INITIAL_INSURANCE_PLANS: InsurancePlan[] = [
  { id: 'ins1', name: 'Particular', priceTableId: 'pt1', active: true },
  { id: 'ins2', name: 'Unimed Básico', code: 'UNI-01', priceTableId: 'pt2', active: true },
  { id: 'ins3', name: 'Unimed Premium', code: 'UNI-02', priceTableId: 'pt2', active: true }, // Reuses Unimed table
  { id: 'ins4', name: 'Amil Blue', code: 'AML-99', priceTableId: 'pt3', active: true },
];

export const INITIAL_CLINIC_CONFIG: ClinicConfig = {
  name: 'ClinicPro Odontologia',
  cnpj: '00.000.000/0001-00',
  address: 'Av. Paulista, 1000 - São Paulo, SP',
  phone: '(11) 99999-9999',
  email: 'contato@clinicpro.com'
};

export const INITIAL_AGENDA_CONFIG: AgendaConfig = {
  startHour: '08:00',
  endHour: '18:00',
  slotDuration: 30,
  daysOfWeek: [1, 2, 3, 4, 5] // Mon-Fri
};

// --- DOCUMENT MODULE CONSTANTS ---

export const INITIAL_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'tpl1',
    name: 'Anamnese Odontológica Geral',
    type: 'Anamnese',
    content: `FICHA DE ANAMNESE ODONTOLÓGICA\n\nNome: {{paciente}}\nCPF: {{cpf}} | Data de Nascimento: {{nascimento}}\nTelefone: {{telefone}} | E-mail: {{email}}\n\nQUEIXA PRINCIPAL:\n______________________________________________________________________\n\nHISTÓRICO MÉDICO:\n( ) Hipertensão  ( ) Diabetes  ( ) Cardiopatia  ( ) Problemas Renais\n( ) Problemas Gástricos  ( ) Problemas Respiratórios  ( ) Hepatite\n\nAlergias a medicamentos? ( ) Não ( ) Sim: __________________________\nFaz uso de algum medicamento? ( ) Não ( ) Sim: ______________________\nFumante? ( ) Sim ( ) Não\nGestante? ( ) Sim ( ) Não\n\nOBSERVAÇÕES CLÍNICAS:\n______________________________________________________________________\n______________________________________________________________________\n\nDeclaro que as informações acima são verdadeiras.\n\n{{data}}\n\n______________________________\nAssinatura do Paciente`,
    createdAt: '2023-01-10T10:00:00',
    updatedAt: '2023-01-10T10:00:00'
  },
  {
    id: 'tpl2',
    name: 'Anamnese Harmonização Facial',
    type: 'Anamnese',
    content: `ANAMNESE - HARMONIZAÇÃO OROFACIAL\n\nPaciente: {{paciente}}\nData de Nascimento: {{nascimento}}\n\nOBJETIVO DO TRATAMENTO:\n( ) Preenchimento Labial  ( ) Toxina Botulínica  ( ) Bioestimuladores\n( ) Rinomodelação  ( ) Fios de Sustentação  ( ) Outros: ____________\n\nHISTÓRICO ESTÉTICO:\nJá realizou procedimentos estéticos antes? ( ) Sim ( ) Não\nQual/Quando? _____________________________________________________\nTeve alguma intercorrência? ( ) Sim ( ) Não\n\nCONDIÇÕES DE SAÚDE:\nPossui doenças autoimunes? ( ) Sim ( ) Não\nEstá em tratamento dermatológico? ( ) Sim ( ) Não\nHistórico de Herpes Labial? ( ) Sim ( ) Não\n\nEXPECTATIVAS DO PACIENTE:\n______________________________________________________________________\n\nData: {{data}}\n\n______________________________\nAssinatura do Paciente`,
    createdAt: '2023-01-12T14:00:00',
    updatedAt: '2023-01-12T14:00:00'
  },
  {
    id: 'tpl3',
    name: 'Contrato de Prestação de Serviços',
    type: 'Contrato',
    content: `CONTRATO DE PRESTAÇÃO DE SERVIÇOS ODONTOLÓGICOS\n\nCONTRATANTE: {{paciente}}, CPF nº {{cpf}}, residente em {{endereco}}.\nCONTRATADO: {{clinica}}, CNPJ nº {{cnpj}}, localizado em {{endereco_clinica}}.\n\nCLÁUSULA 1ª - DO OBJETO\nO presente contrato tem como objeto a prestação de serviços odontológicos pelo CONTRATADO ao CONTRATANTE, conforme plano de tratamento aprovado anexo a este documento.\n\nCLÁUSULA 2ª - DAS OBRIGAÇÕES DO CONTRATADO\nO CONTRATADO compromete-se a utilizar técnicas adequadas e materiais de qualidade, respeitando as normas de biossegurança e ética profissional.\n\nCLÁUSULA 3ª - DAS OBRIGAÇÕES DO CONTRATANTE\nO CONTRATANTE compromete-se a comparecer às consultas agendadas, seguir as orientações pós-operatórias e efetuar os pagamentos conforme acordado.\n\nCLÁUSULA 4ª - DO PAGAMENTO\nPelos serviços prestados, o CONTRATANTE pagará o valor estipulado no orçamento aprovado, nas condições ali descritas.\n\nCLÁUSULA 5ª - DO CANCELAMENTO\nO não comparecimento sem aviso prévio de 24 horas poderá sujeitar o CONTRATANTE à cobrança de taxa de reserva de horário.\n\nE por estarem justos e contratados, assinam o presente em duas vias.\n\n{{clinica}}, {{data}}.\n\n______________________________\n{{paciente}}\n\n______________________________\n{{clinica}}`,
    createdAt: '2023-01-15T09:00:00',
    updatedAt: '2023-01-15T09:00:00'
  },
  {
    id: 'tpl4',
    name: 'TCLE - Harmonização Facial',
    type: 'TCLE',
    content: `TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO (TCLE)\n\nEu, {{paciente}}, CPF {{cpf}}, declaro ter sido informado(a) claramente pelo Dr(a). {{doutor}} sobre os procedimentos de HARMONIZAÇÃO FACIAL a serem realizados.\n\nDeclaro estar ciente de que:\n1. A Medicina/Odontologia não é uma ciência exata e os resultados dependem da resposta biológica individual.\n2. Podem ocorrer efeitos transitórios como edema (inchaço), hematomas (roxos), dor leve e assimetrias temporárias.\n3. Riscos raros incluem infecção, necrose tecidual e reações alérgicas, tendo sido explicados os protocolos de segurança.\n\nComprometo-me a seguir rigorosamente as orientações pós-procedimento, incluindo:\n- Não manipular ou massagear a área tratada (salvo orientação específica).\n- Evitar exposição solar intensa e atividade física vigorosa por 48h.\n- Utilizar as medicações prescritas, se houver.\n\nAutorizo o registro fotográfico para fins de acompanhamento clínico em prontuário.\n\nData: {{data}}\n\n______________________________\nAssinatura do Paciente`,
    createdAt: '2023-02-01T11:00:00',
    updatedAt: '2023-02-01T11:00:00'
  },
  {
    id: 'tpl5',
    name: 'Atestado de Comparecimento',
    type: 'Atestado',
    content: `ATESTADO DE COMPARECIMENTO\n\nAtesto para os devidos fins que o(a) Sr(a). {{paciente}}, inscrito(a) no CPF sob nº {{cpf}}, esteve sob meus cuidados profissionais nesta data, no período das _____ às _____ horas, para realização de procedimento odontológico.\n\nNão havendo necessidade de afastamento de suas atividades laborais, exceto pelo período de permanência na clínica.\n\n{{clinica}}, {{data}}.\n\n______________________________\n{{doutor}}\nCirurgião-Dentista`,
    createdAt: '2023-02-10T16:00:00',
    updatedAt: '2023-02-10T16:00:00'
  },
  {
    id: 'tpl6',
    name: 'Atestado Médico (Repouso)',
    type: 'Atestado',
    content: `ATESTADO ODONTOLÓGICO\n\nAtesto, para fins de abono de faltas, que o(a) Sr(a). {{paciente}} foi submetido(a) a procedimento odontológico cirúrgico/clínico nesta data, necessitando de repouso por _____ (__________) dia(s) a partir desta data.\n\nCID: _______\n\n{{clinica}}, {{data}}.\n\n______________________________\n{{doutor}}\nCirurgião-Dentista`,
    createdAt: '2023-02-10T16:05:00',
    updatedAt: '2023-02-10T16:05:00'
  }
];

export const MOCK_DOCUMENTS: ClinicalDocument[] = [
  {
    id: 'doc1',
    patientId: '101',
    patientName: 'João Pereira',
    type: 'Atestado',
    title: 'Atestado do dia 27/10',
    content: 'Atesto para os devidos fins que o(a) Sr(a). João Pereira esteve sob meus cuidados no dia 27/10/2023, devendo permanecer em repouso por 1 dias.\n\n__________________________\nDr. Marcelo Vilas Boas',
    status: 'Assinado',
    createdAt: '2023-10-27T10:00:00',
    signedAt: '2023-10-27T10:05:00',
    templateId: 'tpl6'
  }
];
