
import { useEffect, useState } from 'react'; // Added imports
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Calendar, MessageSquare, Bot, AlertCircle, CheckCircle2, Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { toast } from 'react-hot-toast';

export const AIIntegrationsSettings = () => {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [googleStatus, setGoogleStatus] = useState<'connected' | 'disconnected'>('disconnected');
    const [integrationData, setIntegrationData] = useState<any>(null);

    // Initial Load
    useEffect(() => {
        checkIntegrations();
        handleOAuthCallback();
    }, []);

    const checkIntegrations = async () => {
        try {
            const { data, error } = await supabase
                .from('user_integrations')
                .select('*')
                .eq('provider', 'GOOGLE')
                .maybeSingle();

            if (data) {
                setGoogleStatus('connected');
                setIntegrationData(data);
            } else {
                setGoogleStatus('disconnected');
            }
        } catch (error) {
            console.error("Error checking integrations:", error);
        }
    };

    const handleOAuthCallback = async () => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');

        if (code) {
            try {
                setLoading(true);
                toast.loading("Vinculando conta Google...", { id: 'auth-toast' });

                // Remove param from URL without refresh
                window.history.replaceState({}, document.title, window.location.pathname);

                const { data, error } = await supabase.functions.invoke('google-auth', {
                    body: { code, redirect_uri: window.location.origin }
                });

                if (error) throw error;

                toast.success("Google Calendar conectado!", { id: 'auth-toast' });
                setGoogleStatus('connected');
                checkIntegrations();
            } catch (error: any) {
                console.error("Auth error:", error);
                toast.error("Falha na conexão: " + (error.message || "Erro desconhecido"), { id: 'auth-toast' });
            } finally {
                setLoading(false);
            }
        }
    };

    const handleConnectGoogle = () => {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        if (!clientId) {
            toast.error("Erro: VITE_GOOGLE_CLIENT_ID não configurado.");
            return;
        }

        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: window.location.origin, // Dynamic: localhost or production
            response_type: 'code',
            scope: 'https://www.googleapis.com/auth/calendar',
            access_type: 'offline', // Critical for refresh_token
            prompt: 'consent'
        });

        window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    };

    const handleDisconnect = async () => {
        if (!confirm("Tem certeza? O assistente perderá acesso à sua agenda.")) return;

        try {
            setLoading(true);
            const { error } = await supabase
                .from('user_integrations')
                .delete()
                .eq('provider', 'GOOGLE')
                .eq('user_id', await supabase.auth.getUser().then(({ data }) => data.user?.id));

            if (error) throw error;

            setGoogleStatus('disconnected');
            setIntegrationData(null);
            toast.success("Desconectado com sucesso.");
        } catch (error) {
            toast.error("Erro ao desconectar.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Bot className="text-purple-600" />
                        Integrações & IA
                    </h2>
                    <p className="text-slate-500 text-sm">Conecte seus serviços externos para potenciar os agentes.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* GOOGLE CALENDAR CARD */}
                <Card className={`border-l-4 ${googleStatus === 'connected' ? 'border-l-green-500' : 'border-l-slate-300'}`}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="text-blue-600" /> Google Calendar
                        </CardTitle>
                        <CardDescription>
                            Permite que o Agente de Recepção agende e consulte seus horários.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {googleStatus === 'connected' ? (
                            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg text-sm font-medium">
                                <CheckCircle2 size={16} />
                                Conexão Ativa e Segura
                                {integrationData?.metadata?.email && <span className="text-slate-500 text-xs ml-auto">({integrationData.metadata.email})</span>}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-slate-500 bg-slate-50 p-3 rounded-lg text-sm">
                                <AlertCircle size={16} />
                                Não conectado
                            </div>
                        )}
                    </CardContent>
                    <CardFooter>
                        {googleStatus === 'connected' ? (
                            <Button variant="destructive" onClick={handleDisconnect} disabled={loading} className="w-full">
                                {loading ? <Loader2 className="animate-spin" /> : <><Trash2 size={16} className="mr-2" /> Desconectar Conta</>}
                            </Button>
                        ) : (
                            <Button onClick={handleConnectGoogle} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                {loading ? <Loader2 className="animate-spin" /> : "Conectar Google Calendar"}
                            </Button>
                        )}
                    </CardFooter>
                </Card>

                {/* WHATSAPP CARD (Placeholder for future) */}
                <Card className="opacity-75 relative overflow-hidden">
                    <div className="absolute inset-0 bg-slate-50/50 z-10 flex items-center justify-center font-bold text-slate-400">
                        EM BREVE
                    </div>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="text-green-600" /> WhatsApp Business
                        </CardTitle>
                        <CardDescription>
                            Automação de confirmações e respostas via IA.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-slate-500 bg-slate-50 p-3 rounded-lg text-sm">
                            <AlertCircle size={16} />
                            Aguardando Configuração
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button disabled variant="outline" className="w-full">
                            Configurar
                        </Button>
                    </CardFooter>
                </Card>

            </div>
        </div>
    );
};
