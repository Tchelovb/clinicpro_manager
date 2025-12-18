import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { ArrowLeft, Building2, User, Mail, Lock, FileText } from "lucide-react";

const NewClinicForm: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        clinicName: '',
        clinicCnpj: '',
        clinicCode: '',
        adminName: '',
        adminEmail: '',
        adminPassword: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Validações básicas
            if (!formData.clinicName || !formData.clinicCode || !formData.adminName || !formData.adminEmail || !formData.adminPassword) {
                throw new Error('Preencha todos os campos obrigatórios');
            }

            if (formData.adminPassword.length < 6) {
                throw new Error('A senha deve ter pelo menos 6 caracteres');
            }

            // 1. Criar clínica
            const { data: clinic, error: clinicError } = await supabase
                .from('clinics')
                .insert({
                    name: formData.clinicName,
                    cnpj: formData.clinicCnpj,
                    code: formData.clinicCode.toUpperCase(),
                    status: 'ACTIVE'
                })
                .select()
                .single();

            if (clinicError) {
                if (clinicError.code === '23505') {
                    throw new Error('Código da clínica já existe');
                }
                throw clinicError;
            }

            // 2. Criar usuário Admin no Supabase Auth
            // IMPORTANTE: Isso requer Service Role Key
            // Por segurança, deve ser feito via Edge Function ou backend
            // Por enquanto, vamos criar apenas a clínica e instruir a criar o usuário manualmente

            alert(`
        ✅ Clínica criada com sucesso!
        
        Próximo passo: Criar usuário Admin
        
        1. Acesse o painel do Supabase
        2. Vá em Authentication > Users
        3. Clique em "Add User"
        4. Email: ${formData.adminEmail}
        5. Password: ${formData.adminPassword}
        6. Após criar, vá em SQL Editor e execute:
        
        INSERT INTO users (id, clinic_id, email, name, role, active)
        VALUES (
          '<ID_DO_USUARIO_CRIADO>',
          '${clinic.id}',
          '${formData.adminEmail}',
          '${formData.adminName}',
          'ADMIN',
          true
        );
      `);

            navigate('/master');

        } catch (error: any) {
            console.error('Erro ao criar clínica:', error);
            alert('Erro: ' + (error.message || 'Erro desconhecido'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/master')}
                        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Voltar
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Building2 className="w-8 h-8 text-blue-600" />
                        Nova Clínica
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Provisionar uma nova clínica no sistema
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-white shadow sm:rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        {/* Dados da Clínica */}
                        <div className="mb-8">
                            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4 flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-gray-400" />
                                Dados da Clínica
                            </h3>
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <label htmlFor="clinicName" className="block text-sm font-medium text-gray-700">
                                        Nome da Clínica *
                                    </label>
                                    <input
                                        type="text"
                                        id="clinicName"
                                        required
                                        value={formData.clinicName}
                                        onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        placeholder="Ex: Clínica Odontológica Exemplo"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="clinicCode" className="block text-sm font-medium text-gray-700">
                                        Código (Identificador Único) *
                                    </label>
                                    <input
                                        type="text"
                                        id="clinicCode"
                                        required
                                        value={formData.clinicCode}
                                        onChange={(e) => setFormData({ ...formData, clinicCode: e.target.value.toUpperCase() })}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm uppercase"
                                        placeholder="Ex: CLINIC01"
                                        maxLength={20}
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Usado para login. Apenas letras e números.
                                    </p>
                                </div>

                                <div>
                                    <label htmlFor="clinicCnpj" className="block text-sm font-medium text-gray-700">
                                        CNPJ (Opcional)
                                    </label>
                                    <input
                                        type="text"
                                        id="clinicCnpj"
                                        value={formData.clinicCnpj}
                                        onChange={(e) => setFormData({ ...formData, clinicCnpj: e.target.value })}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        placeholder="00.000.000/0000-00"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 my-6"></div>

                        {/* Dados do Administrador */}
                        <div>
                            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4 flex items-center gap-2">
                                <User className="w-5 h-5 text-gray-400" />
                                Administrador Inicial
                            </h3>
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <label htmlFor="adminName" className="block text-sm font-medium text-gray-700">
                                        Nome Completo *
                                    </label>
                                    <input
                                        type="text"
                                        id="adminName"
                                        required
                                        value={formData.adminName}
                                        onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        placeholder="Ex: Dr. João Silva"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700">
                                        Email *
                                    </label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Mail className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="email"
                                            id="adminEmail"
                                            required
                                            value={formData.adminEmail}
                                            onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                                            className="block w-full pl-10 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            placeholder="admin@clinica.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-700">
                                        Senha Inicial *
                                    </label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="password"
                                            id="adminPassword"
                                            required
                                            value={formData.adminPassword}
                                            onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                                            className="block w-full pl-10 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            placeholder="Mínimo 6 caracteres"
                                            minLength={6}
                                        />
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">
                                        O administrador poderá alterar após o primeiro login
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Aviso */}
                        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <FileText className="h-5 w-5 text-yellow-400" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-yellow-800">
                                        Atenção: Processo Manual Necessário
                                    </h3>
                                    <div className="mt-2 text-sm text-yellow-700">
                                        <p>
                                            Após criar a clínica, será necessário criar o usuário administrador manualmente no painel do Supabase.
                                            Instruções detalhadas serão exibidas após a criação.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 sm:rounded-b-lg">
                        <button
                            type="button"
                            onClick={() => navigate('/master')}
                            className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-3"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Criando...' : 'Criar Clínica'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewClinicForm;
