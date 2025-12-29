// ============================================
// TYPES - QUICK ADD CONFIGURATION
// Configurações para Cadastro On-the-Fly
// ============================================

export interface QuickAddField {
    name: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'textarea';
    required?: boolean;
    placeholder?: string;
    options?: { value: string; label: string }[];
    defaultValue?: string | number;
}

export interface QuickAddConfig {
    tableName: string;
    entityName: string;
    entityNamePlural: string;
    fields: QuickAddField[];
    successMessage?: string;
}

// Configurações pré-definidas para entidades comuns
export const QUICK_ADD_CONFIGS: Record<string, QuickAddConfig> = {
    procedure: {
        tableName: 'procedures',
        entityName: 'Procedimento',
        entityNamePlural: 'Procedimentos',
        fields: [
            {
                name: 'name',
                label: 'Nome do Procedimento',
                type: 'text',
                required: true,
                placeholder: 'Ex: Implante Unitário'
            },
            {
                name: 'category',
                label: 'Categoria',
                type: 'select',
                required: true,
                options: [
                    { value: 'CIRURGIA', label: 'Cirurgia' },
                    { value: 'HOF', label: 'Harmonização Orofacial' },
                    { value: 'IMPLANTE', label: 'Implantodontia' },
                    { value: 'ESTETICA', label: 'Estética Dental' },
                    { value: 'ORTODONTIA', label: 'Ortodontia' },
                    { value: 'PROTESE', label: 'Prótese' },
                    { value: 'GERAL', label: 'Clínica Geral' }
                ]
            },
            {
                name: 'base_price',
                label: 'Valor Base (R$)',
                type: 'number',
                required: true,
                placeholder: '0.00'
            },
            {
                name: 'estimated_duration',
                label: 'Duração Estimada (minutos)',
                type: 'number',
                required: false,
                placeholder: '60',
                defaultValue: 60
            }
        ],
        successMessage: 'Procedimento criado com sucesso!'
    },

    supplier: {
        tableName: 'suppliers',
        entityName: 'Fornecedor',
        entityNamePlural: 'Fornecedores',
        fields: [
            {
                name: 'name',
                label: 'Nome do Fornecedor',
                type: 'text',
                required: true,
                placeholder: 'Ex: Dental Cremer'
            },
            {
                name: 'phone',
                label: 'Telefone',
                type: 'text',
                required: false,
                placeholder: '(00) 00000-0000'
            },
            {
                name: 'email',
                label: 'Email',
                type: 'text',
                required: false,
                placeholder: 'contato@fornecedor.com.br'
            },
            {
                name: 'cnpj_cpf',
                label: 'CNPJ/CPF',
                type: 'text',
                required: false,
                placeholder: '00.000.000/0000-00'
            }
        ],
        successMessage: 'Fornecedor criado com sucesso!'
    },

    lead_source: {
        tableName: 'lead_sources',
        entityName: 'Origem de Lead',
        entityNamePlural: 'Origens de Lead',
        fields: [
            {
                name: 'name',
                label: 'Nome da Origem',
                type: 'text',
                required: true,
                placeholder: 'Ex: TikTok, YouTube, Rádio'
            }
        ],
        successMessage: 'Origem de lead criada com sucesso!'
    },

    expense_category: {
        tableName: 'expense_category',
        entityName: 'Categoria de Despesa',
        entityNamePlural: 'Categorias de Despesa',
        fields: [
            {
                name: 'name',
                label: 'Nome da Categoria',
                type: 'text',
                required: true,
                placeholder: 'Ex: Material Cirúrgico'
            },
            {
                name: 'is_variable_cost',
                label: 'Tipo de Custo',
                type: 'select',
                required: true,
                options: [
                    { value: 'true', label: 'Custo Variável' },
                    { value: 'false', label: 'Custo Fixo' }
                ],
                defaultValue: 'true'
            }
        ],
        successMessage: 'Categoria de despesa criada com sucesso!'
    },

    appointment_type: {
        tableName: 'appointment_types',
        entityName: 'Tipo de Agendamento',
        entityNamePlural: 'Tipos de Agendamento',
        fields: [
            {
                name: 'name',
                label: 'Nome do Tipo',
                type: 'text',
                required: true,
                placeholder: 'Ex: Consulta VIP'
            },
            {
                name: 'duration_minutes',
                label: 'Duração (minutos)',
                type: 'number',
                required: true,
                placeholder: '60',
                defaultValue: 60
            },
            {
                name: 'color',
                label: 'Cor (hex)',
                type: 'text',
                required: false,
                placeholder: '#3b82f6',
                defaultValue: '#3b82f6'
            }
        ],
        successMessage: 'Tipo de agendamento criado com sucesso!'
    },

    professional: {
        tableName: 'profiles',
        entityName: 'Profissional',
        entityNamePlural: 'Profissionais',
        fields: [
            { name: 'name', label: 'Nome Completo', type: 'text', required: true, placeholder: 'Ex: Dr. João Silva' },
            { name: 'specialty', label: 'Especialidade', type: 'text', required: false, placeholder: 'Ex: Ortodontia' },
            { name: 'calendar_color', label: 'Cor na Agenda', type: 'text', required: false, placeholder: '#3B82F6' }
        ],
        successMessage: 'Profissional criado com sucesso!'
    },

    revenue_category: {
        tableName: 'revenue_category',
        entityName: 'Categoria de Receita',
        entityNamePlural: 'Categorias de Receita',
        fields: [
            {
                name: 'name',
                label: 'Nome da Categoria',
                type: 'text',
                required: true,
                placeholder: 'Ex: Ortodontia Avançada'
            }
        ],
        successMessage: 'Categoria de receita criada com sucesso!'
    }
};

// Tipo para o retorno de criação de item
export interface QuickAddResult {
    id: string;
    name: string;
    [key: string]: any;
}
