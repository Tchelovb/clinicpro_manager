import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../src/lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import {
    Building2,
    Plus,
    Ban,
    CheckCircle,
    Users,
    AlertTriangle,
    LogOut,
    Eye
} from "lucide-react";

interface Clinic {
    id: string;
    name: string;
    code: string;
    cnpj: string;
    status: 'ACTIVE' | 'SUSPENDED';
    created_at: string;
    updated_at: string;
}

const MasterDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { signOut } = useAuth();
    const [clinics, setClinics] = useState<Clinic[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        suspended: 0,
        totalPatients: 0
    });

    useEffect(() => {
        loadClinics();
    }, []);

    const loadClinics = async () => {
        try {
            console.log('🔍 Carregando clínicas...');

            const { data, error } = await supabase
                .from('clinics')
                .select('*')
                .order('created_at', { ascending: false });

            console.log('📊 Resultado da query:', { data, error });

            if (error) {
                console.error('❌ Erro ao carregar clínicas:', error);
                throw error;
            }

            if (!data || data.length === 0) {
                console.warn('⚠️ Nenhuma clínica encontrada');
            }

            setClinics(data || []);

            // Calcular estatísticas
            const active = data?.filter(c => c.status === 'ACTIVE').length || 0;
            const suspended = data?.filter(c => c.status === 'SUSPENDED').length || 0;

            // Buscar total de pacientes
            const { count: totalPatients } = await supabase
                .from('patients')
                .select('*', { count: 'exact', head: true });

            setStats({
                total: data?.length || 0,
                active,
                suspended,
                totalPatients: totalPatients || 0
            });

            console.log('✅ Clínicas carregadas:', data?.length || 0);
        } catch (error: any) {
            console.error('💥 Erro ao carregar clínicas:', error);
            console.error('Detalhes:', error.message, error.code, error.details);

            // Mostrar erro mais detalhado
            const errorMsg = error.message || 'Erro desconhecido';
            const errorDetails = error.details ? `\nDetalhes: ${error.details}` : '';
            alert(`Erro ao carregar clínicas: ${errorMsg}${errorDetails}`);
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (clinicId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';

        if (!confirm(`Tem certeza que deseja ${newStatus === 'ACTIVE' ? 'ativar' : 'suspender'} esta clínica?`)) {
            return;
        }

        try {
            const { error } = await supabase
                .from('clinics')
                .update({ status: newStatus })
                .eq('id', clinicId);

            if (error) throw error;

            alert(`Clínica ${newStatus === 'ACTIVE' ? 'ativada' : 'suspensa'} com sucesso!`);
            loadClinics();
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            alert('Erro ao atualizar status da clínica');
        }
    };

    const handleLogout = async () => {
        try {
            await signOut();
            navigate('/');
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
            navigate('/');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Carregando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                <Building2 className="w-8 h-8 text-blue-600" />
                                Painel Master - ClinicPro SaaS
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Gestão centralizada de todas as clínicas
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => navigate('/master/clinics/new')}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                Nova Clínica
                            </button>
                            <button
                                onClick={handleLogout}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <LogOut className="w-5 h-5 mr-2" />
                                Sair
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <Building2 className="h-6 w-6 text-gray-400" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            Total de Clínicas
                                        </dt>
                                        <dd className="text-3xl font-semibold text-gray-900">
                                            {stats.total}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <CheckCircle className="h-6 w-6 text-green-400" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            Clínicas Ativas
                                        </dt>
                                        <dd className="text-3xl font-semibold text-green-600">
                                            {stats.active}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <AlertTriangle className="h-6 w-6 text-red-400" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            Clínicas Suspensas
                                        </dt>
                                        <dd className="text-3xl font-semibold text-red-600">
                                            {stats.suspended}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <Users className="h-6 w-6 text-purple-400" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            Total de Pacientes
                                        </dt>
                                        <dd className="text-3xl font-semibold text-purple-600">
                                            {stats.totalPatients}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabela de Clínicas */}
                <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                            Clínicas Cadastradas
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Lista completa de todas as clínicas no sistema
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Código
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Nome
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        CNPJ
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Criada em
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {clinics.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                                            Nenhuma clínica cadastrada
                                        </td>
                                    </tr>
                                ) : (
                                    clinics.map((clinic) => (
                                        <tr key={clinic.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {clinic.code}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {clinic.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {clinic.cnpj || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${clinic.status === 'ACTIVE'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                        }`}
                                                >
                                                    {clinic.status === 'ACTIVE' ? (
                                                        <>
                                                            <CheckCircle className="w-3 h-3 mr-1" />
                                                            Ativa
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Ban className="w-3 h-3 mr-1" />
                                                            Suspensa
                                                        </>
                                                    )}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(clinic.created_at).toLocaleDateString('pt-BR')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => toggleStatus(clinic.id, clinic.status)}
                                                        className={`inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md ${clinic.status === 'ACTIVE'
                                                            ? 'text-red-700 bg-red-100 hover:bg-red-200'
                                                            : 'text-green-700 bg-green-100 hover:bg-green-200'
                                                            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                                                    >
                                                        {clinic.status === 'ACTIVE' ? (
                                                            <>
                                                                <Ban className="w-4 h-4 mr-1" />
                                                                Suspender
                                                            </>
                                                        ) : (
                                                            <>
                                                                <CheckCircle className="w-4 h-4 mr-1" />
                                                                Ativar
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MasterDashboard;
