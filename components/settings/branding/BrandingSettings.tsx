import React, { useState, useEffect } from 'react';
import { Upload, Palette, FileText, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

interface BrandingData {
    logo_light_url: string | null;
    logo_dark_url: string | null;
    favicon_url: string | null;
    primary_color: string;
    secondary_color: string;
    document_footer: string;
}

const BrandingSettings: React.FC = () => {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [branding, setBranding] = useState<BrandingData>({
        logo_light_url: null,
        logo_dark_url: null,
        favicon_url: null,
        primary_color: '#3B82F6',
        secondary_color: '#10B981',
        document_footer: `{{CLINIC_NAME}} - CNPJ: {{CNPJ}}
{{ADDRESS}} - Tel: {{PHONE}}
Responsável Técnico: {{RT_NAME}} - {{CRO}}`
    });

    const [logoLightFile, setLogoLightFile] = useState<File | null>(null);
    const [logoDarkFile, setLogoDarkFile] = useState<File | null>(null);
    const [faviconFile, setFaviconFile] = useState<File | null>(null);

    useEffect(() => {
        loadBrandingSettings();
    }, [profile]);

    const loadBrandingSettings = async () => {
        if (!profile?.clinic_id) return;

        try {
            const { data, error } = await supabase
                .from('clinics')
                .select('logo_light_url, logo_dark_url, favicon_url, primary_color, secondary_color, document_footer')
                .eq('id', profile.clinic_id)
                .single();

            if (error) throw error;

            if (data) {
                setBranding({
                    logo_light_url: data.logo_light_url,
                    logo_dark_url: data.logo_dark_url,
                    favicon_url: data.favicon_url,
                    primary_color: data.primary_color || '#3B82F6',
                    secondary_color: data.secondary_color || '#10B981',
                    document_footer: data.document_footer || branding.document_footer
                });
            }
        } catch (error) {
            console.error('Erro ao carregar configurações de branding:', error);
            showMessage('error', 'Erro ao carregar configurações');
        } finally {
            setLoading(false);
        }
    };

    const uploadFile = async (file: File, type: 'light' | 'dark' | 'favicon'): Promise<string | null> => {
        if (!profile?.clinic_id) return null;

        const fileExt = file.name.split('.').pop();
        const fileName = `${profile.clinic_id}/logo-${type}.${fileExt}`;

        try {
            // Upload para Supabase Storage
            const { data, error } = await supabase.storage
                .from('clinic-assets')
                .upload(fileName, file, {
                    upsert: true,
                    contentType: file.type
                });

            if (error) throw error;

            // Obter URL pública
            const { data: urlData } = supabase.storage
                .from('clinic-assets')
                .getPublicUrl(fileName);

            return urlData.publicUrl;
        } catch (error) {
            console.error(`Erro ao fazer upload do ${type}:`, error);
            throw error;
        }
    };

    const handleSave = async () => {
        if (!profile?.clinic_id) return;

        setSaving(true);
        setMessage(null);

        try {
            // Upload de arquivos se houver
            let logoLightUrl = branding.logo_light_url;
            let logoDarkUrl = branding.logo_dark_url;
            let faviconUrl = branding.favicon_url;

            if (logoLightFile) {
                logoLightUrl = await uploadFile(logoLightFile, 'light');
            }
            if (logoDarkFile) {
                logoDarkUrl = await uploadFile(logoDarkFile, 'dark');
            }
            if (faviconFile) {
                faviconUrl = await uploadFile(faviconFile, 'favicon');
            }

            // Atualizar banco de dados
            const { error } = await supabase
                .from('clinics')
                .update({
                    logo_light_url: logoLightUrl,
                    logo_dark_url: logoDarkUrl,
                    favicon_url: faviconUrl,
                    primary_color: branding.primary_color,
                    secondary_color: branding.secondary_color,
                    document_footer: branding.document_footer
                })
                .eq('id', profile.clinic_id);

            if (error) throw error;

            // Aplicar cores dinamicamente
            applyColors();

            showMessage('success', 'Configurações salvas com sucesso!');

            // Limpar arquivos selecionados
            setLogoLightFile(null);
            setLogoDarkFile(null);
            setFaviconFile(null);

            // Recarregar para atualizar URLs
            await loadBrandingSettings();
        } catch (error) {
            console.error('Erro ao salvar configurações:', error);
            showMessage('error', 'Erro ao salvar configurações');
        } finally {
            setSaving(false);
        }
    };

    const applyColors = () => {
        document.documentElement.style.setProperty('--clinic-primary', branding.primary_color);
        document.documentElement.style.setProperty('--clinic-secondary', branding.secondary_color);
    };

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 5000);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'light' | 'dark' | 'favicon') => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validar tamanho (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            showMessage('error', 'Arquivo muito grande. Máximo 2MB.');
            return;
        }

        // Validar tipo
        const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];
        if (!validTypes.includes(file.type)) {
            showMessage('error', 'Formato inválido. Use PNG, JPG ou SVG.');
            return;
        }

        if (type === 'light') setLogoLightFile(file);
        else if (type === 'dark') setLogoDarkFile(file);
        else setFaviconFile(file);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Palette className="text-blue-600" size={28} />
                    Identidade Visual da Clínica
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Personalize a aparência do sistema e dos documentos gerados
                </p>
            </div>

            {/* Message Alert */}
            {message && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                    {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    <span>{message.text}</span>
                </div>
            )}

            {/* Logos Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Upload size={20} />
                    Logotipos
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Logo Claro */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Logo Claro (Tema Light)
                        </label>
                        {branding.logo_light_url && !logoLightFile && (
                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white">
                                <img src={branding.logo_light_url} alt="Logo Claro" className="max-h-20 mx-auto" />
                            </div>
                        )}
                        <input
                            type="file"
                            accept="image/png,image/jpeg,image/svg+xml"
                            onChange={(e) => handleFileChange(e, 'light')}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {logoLightFile && (
                            <p className="text-xs text-green-600">✓ {logoLightFile.name}</p>
                        )}
                    </div>

                    {/* Logo Escuro */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Logo Escuro (Tema Dark)
                        </label>
                        {branding.logo_dark_url && !logoDarkFile && (
                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-900">
                                <img src={branding.logo_dark_url} alt="Logo Escuro" className="max-h-20 mx-auto" />
                            </div>
                        )}
                        <input
                            type="file"
                            accept="image/png,image/jpeg,image/svg+xml"
                            onChange={(e) => handleFileChange(e, 'dark')}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {logoDarkFile && (
                            <p className="text-xs text-green-600">✓ {logoDarkFile.name}</p>
                        )}
                    </div>

                    {/* Favicon */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Favicon (Ícone do Navegador)
                        </label>
                        {branding.favicon_url && !faviconFile && (
                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white">
                                <img src={branding.favicon_url} alt="Favicon" className="max-h-20 mx-auto" />
                            </div>
                        )}
                        <input
                            type="file"
                            accept="image/png,image/x-icon"
                            onChange={(e) => handleFileChange(e, 'favicon')}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {faviconFile && (
                            <p className="text-xs text-green-600">✓ {faviconFile.name}</p>
                        )}
                    </div>
                </div>

                <p className="text-xs text-gray-500">
                    Formatos aceitos: PNG, JPG, SVG. Tamanho máximo: 2MB
                </p>
            </div>

            {/* Colors Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Palette size={20} />
                    Cores da Clínica
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Cor Primária */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Cor Primária
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={branding.primary_color}
                                onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
                                className="h-12 w-20 rounded-lg border border-gray-300 cursor-pointer"
                            />
                            <input
                                type="text"
                                value={branding.primary_color}
                                onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder="#3B82F6"
                            />
                        </div>
                        <p className="text-xs text-gray-500">
                            Usada em botões, links e destaques
                        </p>
                    </div>

                    {/* Cor Secundária */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Cor Secundária
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={branding.secondary_color}
                                onChange={(e) => setBranding({ ...branding, secondary_color: e.target.value })}
                                className="h-12 w-20 rounded-lg border border-gray-300 cursor-pointer"
                            />
                            <input
                                type="text"
                                value={branding.secondary_color}
                                onChange={(e) => setBranding({ ...branding, secondary_color: e.target.value })}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder="#10B981"
                            />
                        </div>
                        <p className="text-xs text-gray-500">
                            Usada em gráficos e elementos complementares
                        </p>
                    </div>
                </div>

                {/* Preview */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Preview:</p>
                    <div className="flex gap-3">
                        <button
                            style={{ backgroundColor: branding.primary_color }}
                            className="px-4 py-2 rounded-lg text-white font-medium"
                        >
                            Botão Primário
                        </button>
                        <button
                            style={{ backgroundColor: branding.secondary_color }}
                            className="px-4 py-2 rounded-lg text-white font-medium"
                        >
                            Botão Secundário
                        </button>
                    </div>
                </div>
            </div>

            {/* Document Footer Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <FileText size={20} />
                    Rodapé de Documentos
                </h3>

                <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Texto do Rodapé (aparece em PDFs, receitas, atestados, etc.)
                    </label>
                    <textarea
                        value={branding.document_footer}
                        onChange={(e) => setBranding({ ...branding, document_footer: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                        placeholder="Digite o rodapé personalizado..."
                    />
                    <div className="text-xs text-gray-500 space-y-1">
                        <p className="font-semibold">Variáveis disponíveis:</p>
                        <p>
                            <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">{'{{CLINIC_NAME}}'}</code>{' '}
                            <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">{'{{CNPJ}}'}</code>{' '}
                            <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">{'{{ADDRESS}}'}</code>{' '}
                            <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">{'{{PHONE}}'}</code>{' '}
                            <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">{'{{EMAIL}}'}</code>{' '}
                            <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">{'{{RT_NAME}}'}</code>{' '}
                            <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">{'{{CRO}}'}</code>
                        </p>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {saving ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Salvando...
                        </>
                    ) : (
                        <>
                            <Save size={18} />
                            Salvar Configurações
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default BrandingSettings;
