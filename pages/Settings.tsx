import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    Building2,
    ShieldCheck,
    Wallet,
    Megaphone,
    Stethoscope,
    Package,
    Activity,
    Zap,
    ClipboardList
} from 'lucide-react';

// Configurações Gerais v1.1
const Settings = () => {
    const navigate = useNavigate();

    const menuItems = [
        {
            title: 'Fundação & Equipe',
            items: [
                {
                    icon: Building2,
                    title: 'Minha Clínica',
                    description: 'Dados cadastrais, endereço e logo da sua unidade.',
                    path: '/settings/clinic',
                    color: 'text-blue-600',
                    bgColor: 'bg-blue-50'
                },
                {
                    icon: Users,
                    title: 'Gestão de Equipe',
                    description: 'Adicione usuários, defina papéis (Dentista, Recepção) e gerencie acessos em um só lugar.',
                    path: '/settings/team',
                    color: 'text-purple-600',
                    bgColor: 'bg-purple-50'
                },
                {
                    icon: ShieldCheck,
                    title: 'Segurança & Auditoria',
                    description: 'PIN de segurança e configurações de acesso.',
                    path: '/settings/security',
                    color: 'text-slate-600',
                    bgColor: 'bg-slate-50'
                }
            ]
        },
        {
            title: 'Operacional',
            items: [
                {
                    icon: Stethoscope,
                    title: 'Procedimentos & Tabelas',
                    description: 'Catálogo de serviços, preços e convênios.',
                    path: '/settings/procedures', // Caminho unificado
                    color: 'text-teal-600',
                    bgColor: 'bg-teal-50'
                },
                {
                    icon: Wallet,
                    title: 'Configurações Financeiras',
                    description: 'Contas bancárias, maquininhas e centros de custo.',
                    path: '/settings/financial',
                    color: 'text-green-600',
                    bgColor: 'bg-green-50'
                },
                {
                    icon: ShieldCheck, // Reutilizando ícone, ou Building2 se preferir
                    title: 'Papelaria Jurídica',
                    description: 'Edite contratos, TCLEs e protocolos de documentos.',
                    path: '/settings/documents',
                    color: 'text-indigo-600',
                    bgColor: 'bg-indigo-50'
                },
                {
                    icon: ClipboardList,
                    title: 'Anamnese Elite (Lab)',
                    description: 'Teste os novos formulários inteligentes e análise de risco.',
                    path: '/anamnesis-lab',
                    color: 'text-rose-600',
                    bgColor: 'bg-rose-50'
                },
                {
                    icon: Package, // Usando Package ou Pill se disponível (Pill não importada acima, Activity serve ou trago Pill)
                    title: 'Farmacologia & Receitas',
                    description: 'Gerencie seu banco de dados de medicamentos e posologias padrão.',
                    path: '/settings/medications',
                    color: 'text-pink-600',
                    bgColor: 'bg-pink-50'
                }
            ]
        }
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Configurações do Sistema</h1>
                <p className="text-gray-500 mt-1">Painel de Controle • Gerencie todos os aspectos da sua clínica</p>
            </div>

            <div className="space-y-10">
                {menuItems.map((section, idx) => (
                    <div key={idx}>
                        <h2 className="text-lg font-semibold text-gray-800 mb-4 px-1 border-l-4 border-blue-500 pl-3">
                            {section.title}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {section.items.map((item, itemIdx) => (
                                <div
                                    key={itemIdx}
                                    onClick={() => navigate(item.path)}
                                    className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:border-blue-200"
                                >
                                    <div className={`w-12 h-12 rounded-xl ${item.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                        <item.icon className={`w-6 h-6 ${item.color}`} />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-700">
                                        {item.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 leading-relaxed">
                                        {item.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Settings;
