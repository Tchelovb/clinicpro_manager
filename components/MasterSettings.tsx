import React, { useState } from 'react';
import {
    Brain,
    Palette,
    DollarSign,
    Shield,
    Key,
    Upload,
    Save,
    AlertCircle,
    CheckCircle,
    Eye,
    EyeOff,
    Sparkles
} from 'lucide-react';

export function MasterSettings() {
    const [activeTab, setActiveTab] = useState<'ai' | 'branding' | 'monetization' | 'security'>('ai');
    const [showApiKey, setShowApiKey] = useState(false);
    const [saved, setSaved] = useState(false);

    // Estados para configurações
    const [aiSettings, setAiSettings] = useState({
        openaiKey: '',
        temperature: 0.7,
        bosEnabled: true
    });

    const [brandingSettings, setBrandingSettings] = useState({
        platformName: 'ClinicPro',
        primaryColor: '#6366f1',
        logo: null as File | null
    });

    const [monetizationSettings, setMonetizationSettings] = useState({
        stripeKey: '',
        basicPrice: 199,
        proPrice: 399,
        enterprisePrice: 799
    });

    const [securitySettings, setSecuritySettings] = useState({
        force2FA: false,
        sessionTimeout: 30
    });

    const handleSave = () => {
        // Aqui você salvaria no Supabase
        console.log('Salvando configurações globais...', {
            ai: aiSettings,
            branding: brandingSettings,
            monetization: monetizationSettings,
            security: securitySettings
        });

        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const tabs = [
        { id: 'ai' as const, label: 'Inteligência Artificial', icon: Brain, color: 'purple' },
        { id: 'branding' as const, label: 'White Label', icon: Palette, color: 'pink' },
        { id: 'monetization' as const, label: 'Monetização', icon: DollarSign, color: 'green' },
        { id: 'security' as const, label: 'Segurança', icon: Shield, color: 'red' }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-black text-gray-900 mb-2">
                        Painel de Controle da Plataforma
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Configurações globais que afetam toda a rede de clínicas
                    </p>
                </div>

                {/* Success Message */}
                {saved && (
                    <div className="mb-6 bg-green-50 border-2 border-green-500 rounded-lg p-4 flex items-center gap-3 animate-in fade-in">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                        <p className="text-green-800 font-bold">Configurações salvas com sucesso!</p>
                    </div>
                )}

                <div className="grid grid-cols-12 gap-6">
                    {/* Sidebar Tabs */}
                    <div className="col-span-3">
                        <div className="bg-white rounded-2xl shadow-lg p-4 space-y-2">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === tab.id
                                            ? `bg-${tab.color}-50 text-${tab.color}-700 font-bold shadow-md`
                                            : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    <tab.icon className="w-5 h-5" />
                                    <span className="text-sm">{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="col-span-9">
                        <div className="bg-white rounded-2xl shadow-lg p-8">

                            {/* AI Settings */}
                            {activeTab === 'ai' && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-3 bg-purple-100 rounded-lg">
                                            <Brain className="w-8 h-8 text-purple-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900">BOS Core - Inteligência Artificial</h2>
                                            <p className="text-gray-600">Configurações globais do cérebro do sistema</p>
                                        </div>
                                    </div>

                                    {/* OpenAI API Key */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            OpenAI API Key (Global)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showApiKey ? 'text' : 'password'}
                                                value={aiSettings.openaiKey}
                                                onChange={(e) => setAiSettings({ ...aiSettings, openaiKey: e.target.value })}
                                                placeholder="sk-..."
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all pr-12"
                                            />
                                            <button
                                                onClick={() => setShowApiKey(!showApiKey)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showApiKey ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Esta chave será usada por todas as clínicas da rede
                                        </p>
                                    </div>

                                    {/* Temperature Slider */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Nível de Criatividade (Temperature): {aiSettings.temperature}
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.1"
                                            value={aiSettings.temperature}
                                            onChange={(e) => setAiSettings({ ...aiSettings, temperature: parseFloat(e.target.value) })}
                                            className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                        />
                                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                                            <span>Preciso (0.0)</span>
                                            <span>Criativo (1.0)</span>
                                        </div>
                                    </div>

                                    {/* BOS Toggle */}
                                    <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                                        <div>
                                            <p className="font-bold text-gray-900">Ativar BOS para toda a rede</p>
                                            <p className="text-sm text-gray-600">Todas as clínicas terão acesso ao ChatBOS</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={aiSettings.bosEnabled}
                                                onChange={(e) => setAiSettings({ ...aiSettings, bosEnabled: e.target.checked })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-600"></div>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* Branding Settings */}
                            {activeTab === 'branding' && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-3 bg-pink-100 rounded-lg">
                                            <Palette className="w-8 h-8 text-pink-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900">White Label & Branding</h2>
                                            <p className="text-gray-600">Personalize a identidade visual da plataforma</p>
                                        </div>
                                    </div>

                                    {/* Platform Name */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Nome da Plataforma
                                        </label>
                                        <input
                                            type="text"
                                            value={brandingSettings.platformName}
                                            onChange={(e) => setBrandingSettings({ ...brandingSettings, platformName: e.target.value })}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all"
                                        />
                                    </div>

                                    {/* Primary Color */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Cor Primária do Sistema
                                        </label>
                                        <div className="flex gap-4 items-center">
                                            <input
                                                type="color"
                                                value={brandingSettings.primaryColor}
                                                onChange={(e) => setBrandingSettings({ ...brandingSettings, primaryColor: e.target.value })}
                                                className="w-20 h-12 rounded-lg cursor-pointer border-2 border-gray-200"
                                            />
                                            <input
                                                type="text"
                                                value={brandingSettings.primaryColor}
                                                onChange={(e) => setBrandingSettings({ ...brandingSettings, primaryColor: e.target.value })}
                                                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-500 outline-none font-mono"
                                            />
                                        </div>
                                    </div>

                                    {/* Logo Upload */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Logo Principal
                                        </label>
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-pink-500 transition-colors cursor-pointer">
                                            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                            <p className="text-gray-600 font-medium mb-1">Clique para fazer upload</p>
                                            <p className="text-xs text-gray-500">PNG, JPG ou SVG (máx. 2MB)</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Monetization Settings */}
                            {activeTab === 'monetization' && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-3 bg-green-100 rounded-lg">
                                            <DollarSign className="w-8 h-8 text-green-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900">Planos & Monetização</h2>
                                            <p className="text-gray-600">Configure preços e integrações de pagamento</p>
                                        </div>
                                    </div>

                                    {/* Stripe Key */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Stripe API Key
                                        </label>
                                        <input
                                            type="password"
                                            value={monetizationSettings.stripeKey}
                                            onChange={(e) => setMonetizationSettings({ ...monetizationSettings, stripeKey: e.target.value })}
                                            placeholder="sk_live_..."
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                                        />
                                    </div>

                                    {/* Pricing Table */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-3">
                                            Tabela de Preços (R$/mês)
                                        </label>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="border-2 border-gray-200 rounded-lg p-4">
                                                <p className="text-sm font-bold text-gray-600 mb-2">Basic</p>
                                                <input
                                                    type="number"
                                                    value={monetizationSettings.basicPrice}
                                                    onChange={(e) => setMonetizationSettings({ ...monetizationSettings, basicPrice: parseInt(e.target.value) })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 outline-none"
                                                />
                                            </div>
                                            <div className="border-2 border-green-500 rounded-lg p-4 bg-green-50">
                                                <p className="text-sm font-bold text-green-700 mb-2">Pro ⭐</p>
                                                <input
                                                    type="number"
                                                    value={monetizationSettings.proPrice}
                                                    onChange={(e) => setMonetizationSettings({ ...monetizationSettings, proPrice: parseInt(e.target.value) })}
                                                    className="w-full px-3 py-2 border border-green-300 rounded-lg focus:border-green-500 outline-none"
                                                />
                                            </div>
                                            <div className="border-2 border-gray-200 rounded-lg p-4">
                                                <p className="text-sm font-bold text-gray-600 mb-2">Enterprise</p>
                                                <input
                                                    type="number"
                                                    value={monetizationSettings.enterprisePrice}
                                                    onChange={(e) => setMonetizationSettings({ ...monetizationSettings, enterprisePrice: parseInt(e.target.value) })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Security Settings */}
                            {activeTab === 'security' && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-3 bg-red-100 rounded-lg">
                                            <Shield className="w-8 h-8 text-red-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900">Segurança & Auditoria</h2>
                                            <p className="text-gray-600">Políticas de segurança para toda a rede</p>
                                        </div>
                                    </div>

                                    {/* 2FA Toggle */}
                                    <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border-2 border-red-200">
                                        <div>
                                            <p className="font-bold text-gray-900">Forçar 2FA para Admins</p>
                                            <p className="text-sm text-gray-600">Todos os administradores precisarão configurar autenticação de 2 fatores</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={securitySettings.force2FA}
                                                onChange={(e) => setSecuritySettings({ ...securitySettings, force2FA: e.target.checked })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-600"></div>
                                        </label>
                                    </div>

                                    {/* Session Timeout */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Timeout de Sessão (minutos)
                                        </label>
                                        <input
                                            type="number"
                                            value={securitySettings.sessionTimeout}
                                            onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: parseInt(e.target.value) })}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all"
                                        />
                                    </div>

                                    {/* Audit Log */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-3">
                                            Últimas Ações Críticas
                                        </label>
                                        <div className="border-2 border-gray-200 rounded-lg divide-y">
                                            {[
                                                { action: 'Nova clínica criada', user: 'Dr. Marcelo', time: '2 min atrás' },
                                                { action: 'API Key atualizada', user: 'Sistema', time: '1 hora atrás' },
                                                { action: 'Usuário removido', user: 'Dr. Marcelo', time: '3 horas atrás' }
                                            ].map((log, i) => (
                                                <div key={i} className="p-3 hover:bg-gray-50 transition-colors">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-medium text-gray-900">{log.action}</p>
                                                            <p className="text-sm text-gray-500">por {log.user}</p>
                                                        </div>
                                                        <span className="text-xs text-gray-400">{log.time}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Save Button */}
                            <div className="mt-8 pt-6 border-t-2 border-gray-100">
                                <button
                                    onClick={handleSave}
                                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg"
                                >
                                    <Save className="w-5 h-5" />
                                    Salvar Configurações Globais
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
