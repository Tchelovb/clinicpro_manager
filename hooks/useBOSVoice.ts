import { useState, useCallback, useEffect } from 'react';

interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
}

interface SpeechRecognitionType extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start: () => void;
    stop: () => void;
    abort: () => void;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
}

interface SpeechRecognitionConstructor {
    new(): SpeechRecognitionType;
}

declare global {
    interface Window {
        SpeechRecognition: SpeechRecognitionConstructor;
        webkitSpeechRecognition: SpeechRecognitionConstructor;
    }
}

export const useBOSVoice = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        // Verificar se o navegador suporta Speech Recognition
        const supported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
        setIsSupported(supported);
    }, []);

    const startListening = useCallback(() => {
        if (!isSupported) {
            setError('Reconhecimento de voz não suportado neste navegador');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'pt-BR';

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }

            setTranscript(finalTranscript || interimTranscript);
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('Speech recognition error:', event.error);
            setError(`Erro: ${event.error}`);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        try {
            recognition.start();
            setIsListening(true);
            setError(null);
            setTranscript('');
        } catch (err) {
            console.error('Error starting recognition:', err);
            setError('Erro ao iniciar reconhecimento');
        }
    }, [isSupported]);

    const stopListening = useCallback(() => {
        setIsListening(false);
    }, []);

    const speak = useCallback((text: string) => {
        if (!('speechSynthesis' in window)) {
            console.error('Text-to-speech não suportado');
            return;
        }

        // Cancelar qualquer fala anterior
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        utterance.rate = 0.9; // Velocidade natural
        utterance.pitch = 1.0; // Tom normal
        utterance.volume = 1.0; // Volume máximo

        // Aguardar vozes carregarem (necessário em alguns navegadores)
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            // Tentar encontrar voz em português do Brasil
            const ptBRVoice = voices.find(voice => voice.lang === 'pt-BR');
            if (ptBRVoice) {
                utterance.voice = ptBRVoice;
            }
        }

        window.speechSynthesis.speak(utterance);
    }, []);

    const stopSpeaking = useCallback(() => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    }, []);

    return {
        isListening,
        transcript,
        error,
        isSupported,
        startListening,
        stopListening,
        speak,
        stopSpeaking,
    };
};
